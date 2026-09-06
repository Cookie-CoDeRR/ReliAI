import os
import uuid
import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from web_backend.models import UploadRecord, IncidentRecord
from web_backend.services.ingestion_service import IngestionService


class UploadService:
    MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB Maximum Edge Limit

    def __init__(self, uploads_dir: Optional[Path] = None):
        base_dir = Path(__file__).resolve().parent.parent.parent
        self.uploads_dir = uploads_dir or (base_dir / "uploads")
        self.uploads_dir.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """
        Sanitizes input filename to prevent path traversal or shell character injection.
        """
        base = Path(filename).name
        # Remove null bytes and path separators
        clean = base.replace("\0", "").replace("/", "").replace("\\", "")
        # Keep alphanumeric, dot, dash, underscore
        clean = "".join(c for c in clean if c.isalnum() or c in (".", "-", "_")).strip()
        return clean or "uploaded_file.bin"

    async def create_upload(
        self,
        db: AsyncSession,
        file_bytes: bytes,
        original_filename: str,
        mime_type: str,
        incident_id: Optional[str] = None
    ) -> UploadRecord:
        """
        Validates, stores, parses, and persists a new file upload.
        """
        # 1. Enforce file size limit
        if len(file_bytes) > self.MAX_FILE_SIZE_BYTES:
            raise ValueError(f"File size ({len(file_bytes)} bytes) exceeds the maximum allowed limit of 10 MB")

        # 2. Sanitize filename & validate format
        clean_filename = self.sanitize_filename(original_filename)
        file_type = IngestionService.determine_file_type(clean_filename, mime_type)

        # 3. Verify incident exists if incident_id provided
        if incident_id:
            res = await db.execute(select(IncidentRecord).where(IncidentRecord.id == incident_id))
            if not res.scalar_one_or_none():
                raise ValueError(f"Associated incident '{incident_id}' not found")

        # 4. Generate unique storage filename & save under project-relative uploads_dir
        upload_id = f"UPL-{uuid.uuid4().hex[:8].upper()}"
        unique_stored_name = f"{upload_id}_{clean_filename}"
        target_path = self.uploads_dir / unique_stored_name

        # Path Traversal Security Verification
        if not target_path.resolve().is_relative_to(self.uploads_dir.resolve()):
            raise ValueError("Path traversal security violation detected")

        target_path.write_bytes(file_bytes)
        relative_path_str = f"uploads/{unique_stored_name}"

        # 5. Parse file content via IngestionService
        extracted_text = None
        parsed_metadata = None
        ingestion_status = "PARSED"
        error_msg = None

        try:
            extracted_text, parsed_metadata = IngestionService.parse_file(target_path, file_type)
        except Exception as e:
            ingestion_status = "FAILED"
            error_msg = str(e)

        # 6. Create UploadRecord DB entry
        record = UploadRecord(
            id=upload_id,
            original_filename=clean_filename,
            stored_filename=unique_stored_name,
            relative_path=relative_path_str,
            mime_type=mime_type or "application/octet-stream",
            file_size_bytes=len(file_bytes),
            file_type=file_type,
            incident_id=incident_id,
            ingestion_status=ingestion_status,
            extracted_text=extracted_text,
            parsed_metadata_json=parsed_metadata,
            error_message=error_msg,
            created_at=datetime.datetime.now(datetime.timezone.utc)
        )

        db.add(record)
        await db.commit()
        await db.refresh(record)
        return record

    async def list_uploads(
        self,
        db: AsyncSession,
        incident_id: Optional[str] = None,
        file_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[UploadRecord]:
        """
        Lists stored uploads filtered by incident_id or file_type.
        """
        stmt = select(UploadRecord).order_by(desc(UploadRecord.created_at))
        if incident_id:
            stmt = stmt.where(UploadRecord.incident_id == incident_id)
        if file_type:
            stmt = stmt.where(UploadRecord.file_type == file_type.upper())

        stmt = stmt.offset(offset).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_upload_record(self, db: AsyncSession, upload_id: str) -> Optional[UploadRecord]:
        """Fetches UploadRecord by upload_id."""
        result = await db.execute(select(UploadRecord).where(UploadRecord.id == upload_id))
        return result.scalar_one_or_none()

    async def delete_upload(self, db: AsyncSession, upload_id: str) -> bool:
        """
        Deletes upload file from disk storage and removes record from DB.
        """
        record = await self.get_upload_record(db, upload_id)
        if not record:
            return False

        # Remove physical file safely
        stored_path = self.uploads_dir / record.stored_filename
        if stored_path.exists():
            try:
                stored_path.unlink()
            except Exception:
                pass

        await db.delete(record)
        await db.commit()
        return True

    def get_physical_file_path(self, record: UploadRecord) -> Path:
        """
        Returns safe Path to stored file, asserting containment within uploads_dir.
        """
        path = (self.uploads_dir / record.stored_filename).resolve()
        if not path.is_relative_to(self.uploads_dir.resolve()):
            raise ValueError("Security violation: Target file outside upload boundary")
        return path
