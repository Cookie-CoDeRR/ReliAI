import os
import pytest
import pytest_asyncio
from pathlib import Path
from httpx import AsyncClient, ASGITransport
from main import app
from web_backend.database import init_db, AsyncSessionLocal
from web_backend.services.upload_service import UploadService
from web_backend.services.evidence_service import EvidenceService
from web_backend.services.tool_service import ToolAccessService


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()


@pytest.fixture
def temp_upload_service(tmp_path):
    """Provides an UploadService configured to use a temporary isolated directory."""
    test_dir = tmp_path / "test_uploads"
    test_dir.mkdir(parents=True, exist_ok=True)
    return UploadService(uploads_dir=test_dir)


@pytest.mark.asyncio
async def test_upload_valid_csv(temp_upload_service):
    csv_bytes = b"joint_id,temp_c,torque_nm\nJoint_1,45.2,120.0\nJoint_2,55.0,210.0\nJoint_3,88.5,345.0\n"
    async with AsyncSessionLocal() as db:
        record = await temp_upload_service.create_upload(
            db=db,
            file_bytes=csv_bytes,
            original_filename="telemetry_log.csv",
            mime_type="text/csv"
        )
        assert record.file_type == "CSV"
        assert record.ingestion_status == "PARSED"
        assert record.parsed_metadata_json["row_count"] == 3
        assert "Joint_3" in record.extracted_text

        # Cleanup
        await temp_upload_service.delete_upload(db, record.id)


@pytest.mark.asyncio
async def test_upload_valid_txt_and_log(temp_upload_service):
    log_bytes = b"2026-09-06 10:00:00 [INFO] Station initialized\n2026-09-06 10:01:00 [ERROR] Joint 3 thermal runaway detected (88.5 C)\n2026-09-06 10:02:00 [WARN] Line pressure voltage drop\n"
    async with AsyncSessionLocal() as db:
        record = await temp_upload_service.create_upload(
            db=db,
            file_bytes=log_bytes,
            original_filename="plc_diagnostics.log",
            mime_type="text/x-log"
        )
        assert record.file_type == "LOG"
        assert record.ingestion_status == "PARSED"
        assert record.parsed_metadata_json["error_line_count"] == 1
        assert record.parsed_metadata_json["warning_line_count"] == 1

        # Cleanup
        await temp_upload_service.delete_upload(db, record.id)


@pytest.mark.asyncio
async def test_upload_valid_image(temp_upload_service):
    # Minimal 1x1 valid PNG binary
    png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc` \x05\x00\x00\x04\x00\x01\x8d\x0a\xec\x18\x00\x00\x00\x00IEND\xaeB`\x82"
    async with AsyncSessionLocal() as db:
        record = await temp_upload_service.create_upload(
            db=db,
            file_bytes=png_bytes,
            original_filename="flir_thermal_inspection.png",
            mime_type="image/png"
        )
        assert record.file_type == "IMAGE"
        assert record.ingestion_status == "PARSED"
        assert record.parsed_metadata_json["image_format"] == "PNG"
        assert "base64_payload" in record.parsed_metadata_json

        # Cleanup
        await temp_upload_service.delete_upload(db, record.id)


@pytest.mark.asyncio
async def test_unsupported_file_type_rejection(temp_upload_service):
    exe_bytes = b"MZ\x90\x00\x03\x00\x00\x00"
    async with AsyncSessionLocal() as db:
        with pytest.raises(ValueError, match="Unsupported file format"):
            await temp_upload_service.create_upload(
                db=db,
                file_bytes=exe_bytes,
                original_filename="malicious_payload.exe",
                mime_type="application/x-msdownload"
            )


@pytest.mark.asyncio
async def test_oversized_file_rejection(temp_upload_service):
    huge_bytes = b"A" * (10 * 1024 * 1024 + 1024)  # > 10 MB
    async with AsyncSessionLocal() as db:
        with pytest.raises(ValueError, match="exceeds the maximum allowed limit"):
            await temp_upload_service.create_upload(
                db=db,
                file_bytes=huge_bytes,
                original_filename="huge_file.txt",
                mime_type="text/plain"
            )


@pytest.mark.asyncio
async def test_malformed_pdf_handling(temp_upload_service):
    bad_pdf_bytes = b"%PDF-1.4 Malformed bytes that are not valid PDF stream"
    async with AsyncSessionLocal() as db:
        record = await temp_upload_service.create_upload(
            db=db,
            file_bytes=bad_pdf_bytes,
            original_filename="corrupted.pdf",
            mime_type="application/pdf"
        )
        assert record.file_type == "PDF"
        assert record.ingestion_status == "FAILED"
        assert record.error_message is not None
        assert "PDF extraction failed" in record.error_message or "parsing" in record.error_message.lower()

        # Cleanup
        await temp_upload_service.delete_upload(db, record.id)


@pytest.mark.asyncio
async def test_filename_path_traversal_protection(temp_upload_service):
    dangerous_filename = "../../../etc/passwd"
    txt_bytes = b"Log line 1\n"
    async with AsyncSessionLocal() as db:
        record = await temp_upload_service.create_upload(
            db=db,
            file_bytes=txt_bytes,
            original_filename=dangerous_filename,
            mime_type="text/plain"
        )
        assert "/" not in record.original_filename
        assert ".." not in record.original_filename
        assert record.original_filename == "passwd"

        # Cleanup
        await temp_upload_service.delete_upload(db, record.id)


@pytest.mark.asyncio
async def test_upload_api_full_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Trigger Scenario 1 to obtain a valid incident_id
        trigger_res = await client.post("/api/v1/scenarios/SCENARIO-01-THERMAL-OVERHEAT/trigger")
        assert trigger_res.status_code == 200
        incident_id = trigger_res.json()["incident_id"]

        # 2. Upload file via POST /api/v1/uploads
        file_payload = ("maintenance_notes.txt", b"Inspected Joint 3 harmonic gearbox. Replaced grease per SOP.", "text/plain")
        upload_res = await client.post(
            "/api/v1/uploads",
            files={"file": file_payload},
            data={"incident_id": incident_id}
        )
        assert upload_res.status_code == 200
        upl_data = upload_res.json()
        upload_id = upl_data["upload_id"]
        assert upl_data["status"] == "UPLOADED"
        assert upl_data["incident_id"] == incident_id

        # 3. List uploads via GET /api/v1/uploads
        list_res = await client.get(f"/api/v1/uploads?incident_id={incident_id}")
        assert list_res.status_code == 200
        list_data = list_res.json()
        assert any(item["id"] == upload_id for item in list_data)

        # 4. Query upload metadata dossier via GET /api/v1/uploads/{upload_id}
        meta_res = await client.get(f"/api/v1/uploads/{upload_id}")
        assert meta_res.status_code == 200
        meta_data = meta_res.json()
        assert meta_data["id"] == upload_id
        assert "Replaced grease" in meta_data["extracted_text"]

        # 5. Download raw physical file via GET /api/v1/uploads/{upload_id}/file
        file_res = await client.get(f"/api/v1/uploads/{upload_id}/file")
        assert file_res.status_code == 200
        assert b"Replaced grease" in file_res.content

        # 6. Verify EvidenceService consumes uploaded file evidence
        evidence_service = EvidenceService()
        async with AsyncSessionLocal() as db:
            evd_dossier = await evidence_service.get_all_evidence(db=db, incident_id=incident_id)
            assert evd_dossier["incident_id"] == incident_id
            assert "uploaded_file_evidence" in evd_dossier
            assert any(item["evidence_id"] == f"EVD-UPL-{upload_id}" for item in evd_dossier["uploaded_file_evidence"])

        # 7. Verify ToolAccessService searches uploaded documents
        tool_service = ToolAccessService()
        async with AsyncSessionLocal() as db:
            docs_data = await tool_service.search_documents(query="gearbox", db=db)
            assert docs_data["status"] == "SUCCESS"
            assert any(doc["id"] == upload_id for doc in docs_data["documents"])

        # 8. Delete upload via DELETE /api/v1/uploads/{upload_id}
        del_res = await client.delete(f"/api/v1/uploads/{upload_id}")
        assert del_res.status_code == 200
        assert del_res.json()["status"] == "DELETED"

        # 9. Verify 404 after deletion
        get_deleted_res = await client.get(f"/api/v1/uploads/{upload_id}")
        assert get_deleted_res.status_code == 404


@pytest.mark.asyncio
async def test_missing_upload_returns_404():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/uploads/UPL-NON-EXISTENT-999")
        assert res.status_code == 404
        assert "not found" in res.json()["detail"].lower()

        del_res = await client.delete("/api/v1/uploads/UPL-NON-EXISTENT-999")
        assert del_res.status_code == 404


@pytest.mark.asyncio
async def test_regression_phase1_and_phase2_apis():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Phase 1 System Status check
        sys_res = await client.get("/api/v1/system/status")
        assert sys_res.status_code == 200
        assert sys_res.json()["status"] in ["HEALTHY", "DEGRADED"]

        # Phase 1 Tools check
        tools_res = await client.get("/api/v1/tools/available")
        assert tools_res.status_code == 200
        assert "search_logs" in tools_res.json()

        # Trigger scenario for Phase 2 check
        trigger_res = await client.post("/api/v1/scenarios/SCENARIO-01-THERMAL-OVERHEAT/trigger")
        incident_id = trigger_res.json()["incident_id"]

        # Phase 2 Evidence check
        evd_res = await client.get(f"/api/v1/incidents/{incident_id}/evidence")
        assert evd_res.status_code == 200
        assert evd_res.json()["count"] >= 1

        # Phase 2 Report check
        rpt_res = await client.get(f"/api/v1/incidents/{incident_id}/report")
        assert rpt_res.status_code == 200
        assert rpt_res.json()["report_id"] == f"RPT-{incident_id}"
