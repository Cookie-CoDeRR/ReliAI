import csv
import io
import re
import base64
import struct
from pathlib import Path
from typing import Dict, Any, Tuple, Optional


class IngestionService:
    ALLOWED_EXTENSIONS = {
        ".pdf": "PDF",
        ".csv": "CSV",
        ".txt": "TXT",
        ".log": "LOG",
        ".png": "IMAGE",
        ".jpg": "IMAGE",
        ".jpeg": "IMAGE"
    }

    ALLOWED_MIME_TYPES = {
        "application/pdf": "PDF",
        "text/csv": "CSV",
        "text/plain": "TXT",
        "text/x-log": "LOG",
        "image/png": "IMAGE",
        "image/jpeg": "IMAGE",
        "application/octet-stream": None  # Fallback to extension matching
    }

    @classmethod
    def determine_file_type(cls, filename: str, mime_type: str) -> str:
        """
        Determines and validates the normalized file type from filename and MIME header.
        Raises ValueError if unsupported.
        """
        ext = Path(filename).suffix.lower()
        
        # 1. Match extension
        file_type = cls.ALLOWED_EXTENSIONS.get(ext)
        if not file_type:
            # 2. Match MIME type
            file_type = cls.ALLOWED_MIME_TYPES.get(mime_type)

        if not file_type:
            raise ValueError(f"Unsupported file format '{ext}' (MIME: '{mime_type}'). Allowed formats: PDF, CSV, TXT, LOG, PNG, JPG.")

        return file_type

    @classmethod
    def parse_file(cls, file_path: Path, file_type: str) -> Tuple[str, Dict[str, Any]]:
        """
        Parses an uploaded file from disk and returns (extracted_text, metadata_json).
        Catches parsing errors cleanly.
        """
        if not file_path.exists():
            raise ValueError(f"Storage path {file_path.name} does not exist")

        try:
            if file_type == "PDF":
                return cls._parse_pdf(file_path)
            elif file_type == "CSV":
                return cls._parse_csv(file_path)
            elif file_type in ["TXT", "LOG"]:
                return cls._parse_text_log(file_path, file_type)
            elif file_type == "IMAGE":
                return cls._parse_image(file_path)
            else:
                raise ValueError(f"Unknown file type '{file_type}'")
        except Exception as e:
            raise ValueError(f"File parsing error: {str(e)}")

    @classmethod
    def _parse_pdf(cls, file_path: Path) -> Tuple[str, Dict[str, Any]]:
        """Parses PDF document using pypdf."""
        try:
            import pypdf
            reader = pypdf.PdfReader(str(file_path))
            pages_text = []
            for i, page in enumerate(reader.pages):
                txt = page.extract_text() or ""
                if txt.strip():
                    pages_text.append(f"--- Page {i+1} ---\n{txt.strip()}")

            full_text = "\n\n".join(pages_text)
            metadata = {
                "num_pages": len(reader.pages),
                "is_encrypted": reader.is_encrypted,
                "extracted_pages": len(pages_text)
            }
            return full_text, metadata
        except Exception as err:
            raise ValueError(f"PDF extraction failed: {str(err)}")

    @classmethod
    def _parse_csv(cls, file_path: Path) -> Tuple[str, Dict[str, Any]]:
        """Parses CSV file using standard library csv module."""
        content = file_path.read_text(encoding="utf-8", errors="replace")
        reader = csv.reader(io.StringIO(content))
        rows = list(reader)
        if not rows:
            return "", {"row_count": 0, "columns": []}

        headers = rows[0]
        data_rows = rows[1:]
        text_summary = f"CSV Header: {', '.join(headers)}\nTotal Rows: {len(data_rows)}\n"
        
        sample_rows = data_rows[:10]
        for idx, row in enumerate(sample_rows):
            text_summary += f"Row {idx+1}: {', '.join(row)}\n"

        metadata = {
            "columns": headers,
            "row_count": len(data_rows),
            "column_count": len(headers),
            "sample_rows": sample_rows
        }
        return text_summary, metadata

    @classmethod
    def _parse_text_log(cls, file_path: Path, file_type: str) -> Tuple[str, Dict[str, Any]]:
        """Parses TXT and LOG files safely and extracts basic log metadata."""
        content = file_path.read_text(encoding="utf-8", errors="replace")
        lines = content.splitlines()

        # Scan for log severity keywords
        errors = [l for l in lines if re.search(r"\b(ERROR|FAIL|CRITICAL|FATAL)\b", l, re.IGNORECASE)]
        warnings = [l for l in lines if re.search(r"\b(WARN|WARNING)\b", l, re.IGNORECASE)]

        metadata = {
            "line_count": len(lines),
            "error_line_count": len(errors),
            "warning_line_count": len(warnings),
            "sample_errors": errors[:5]
        }
        return content, metadata

    @classmethod
    def _parse_image(cls, file_path: Path) -> Tuple[str, Dict[str, Any]]:
        """Validates PNG/JPEG magic bytes and computes base64 data payload."""
        data = file_path.read_bytes()
        if len(data) < 8:
            raise ValueError("Image file corrupted or incomplete")

        # Validate Magic Bytes
        is_png = data.startswith(b"\x89PNG\r\n\x1a\n")
        is_jpeg = data.startswith(b"\xff\xd8\xff")
        if not (is_png or is_jpeg):
            raise ValueError("Invalid image file format. Only valid PNG and JPEG formats are supported.")

        fmt = "PNG" if is_png else "JPEG"
        b64_str = base64.b64encode(data).decode("utf-8")
        
        metadata = {
            "image_format": fmt,
            "size_bytes": len(data),
            "base64_length": len(b64_str),
            "base64_payload": b64_str[:100] + "..."  # Truncated preview
        }
        text_summary = f"[Machinery Image Asset - Format: {fmt}, Size: {len(data)} bytes]"
        return text_summary, metadata
