#!/usr/bin/env python3
"""
ReliAI — Domain Backfill Migration Script
Backfills the 'domain' column for historical incident records in reliai.db
by extracting 'incident_domain' from persisted TRIAGE_AGENT COMPLETED traces
or inferring from telemetry / root cause data.
"""

import json
import sqlite3
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "reliai.db"


def infer_domain_from_text(title: str, root_cause: str, telemetry: dict) -> str:
    combined = f"{title or ''} {root_cause or ''}".lower()
    if "thermal" in combined or "overheat" in combined or "harmonic" in combined or "bearing" in combined:
        return "THERMAL_OVERHEAT"
    if "pneumatic" in combined or "pressure" in combined or "valve" in combined or "air" in combined:
        return "PNEUMATIC_PRESSURE_DROP"
    if "contradict" in combined or "mismatch" in combined or "refusal" in combined:
        return "CONTRADICTORY_TELEMETRY"
    if "conveyor" in combined or "bead" in combined or "lube" in combined or "lubricat" in combined:
        return "QUALITY_BEAD_DEFECT"
    if "kinematic" in combined or "backlash" in combined or "gear" in combined:
        return "KINEMATICS_WEAR"

    # Check telemetry payload
    if telemetry:
        if telemetry.get("pneumatic_pressure_bar") is not None and telemetry.get("pneumatic_pressure_bar", 6.0) < 5.0:
            return "PNEUMATIC_PRESSURE_DROP"
        for hotspot in telemetry.get("thermal_hotspots", []):
            if hotspot.get("temp_c", 0) > 70.0:
                return "THERMAL_OVERHEAT"
        for j_name, j_data in telemetry.get("joints", {}).items():
            if j_data.get("temp_c", 0) > 70.0:
                return "THERMAL_OVERHEAT"

    return "GENERAL_FAULT"


def backfill_domains(db_path: Path = DB_PATH) -> int:
    if not db_path.exists():
        print(f"Database not found at {db_path}", file=sys.stderr)
        return 0

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("SELECT id, title, root_cause_title, telemetry_json FROM incidents WHERE domain IS NULL")
    incidents_to_update = cursor.fetchall()

    if not incidents_to_update:
        print("✓ All incident records already have a domain assigned. No backfill needed.")
        conn.close()
        return 0

    print(f"Found {len(incidents_to_update)} incident records with domain = NULL. Starting backfill...")

    updated_counts = {}
    from_traces_count = 0
    from_fallback_count = 0

    for inc_id, title, root_cause, telemetry_str in incidents_to_update:
        # 1. Attempt to fetch triage trace
        cursor.execute(
            "SELECT payload_json FROM agent_traces WHERE incident_id = ? AND agent_name = 'TRIAGE_AGENT' AND step_type = 'COMPLETED' LIMIT 1",
            (inc_id,)
        )
        row = cursor.fetchone()
        assigned_domain = None

        if row and row[0]:
            try:
                payload = json.loads(row[0]) if isinstance(row[0], str) else row[0]
                if isinstance(payload, dict) and payload.get("incident_domain"):
                    assigned_domain = payload["incident_domain"]
                    from_traces_count += 1
            except Exception:
                pass

        # 2. Fallback to heuristic inference
        if not assigned_domain:
            try:
                telemetry = json.loads(telemetry_str) if isinstance(telemetry_str, str) else (telemetry_str or {})
            except Exception:
                telemetry = {}
            assigned_domain = infer_domain_from_text(title, root_cause, telemetry)
            from_fallback_count += 1

        cursor.execute(
            "UPDATE incidents SET domain = ? WHERE id = ?",
            (assigned_domain, inc_id)
        )
        updated_counts[assigned_domain] = updated_counts.get(assigned_domain, 0) + 1

    conn.commit()
    conn.close()

    print("\n=== Backfill Summary ===")
    print(f"Total records updated: {len(incidents_to_update)}")
    print(f"  - Extracted from TRIAGE_AGENT traces: {from_traces_count}")
    print(f"  - Inferred from telemetry/text:       {from_fallback_count}")
    print("\nDomain distribution among backfilled records:")
    for dom, count in sorted(updated_counts.items(), key=lambda x: -x[1]):
        print(f"  {dom:<30}: {count}")
    print("✓ Backfill completed successfully.\n")

    return len(incidents_to_update)


if __name__ == "__main__":
    backfill_domains()
