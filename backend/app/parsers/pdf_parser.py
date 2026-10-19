import io
import re
from pypdf import PdfReader
from typing import Tuple

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract plain text from PDF byte content with error handling."""
    if not file_bytes or len(file_bytes.strip()) == 0:
        raise ValueError("Uploaded PDF file is completely empty (0 bytes).")

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise ValueError(f"Uploaded file exceeds maximum allowed size limit of 10 MB.")

    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        if not reader.pages:
            raise ValueError("Uploaded PDF document contains no readable pages.")

        extracted_text = []
        for page in reader.pages:
            text = page.extract_text()
            if text and text.strip():
                extracted_text.append(text)

        full_text = "\n\n".join(extracted_text)
        sanitized = sanitize_extracted_text(full_text)

        if not sanitized or len(sanitized.strip()) < 20:
            return "[NOTICE: Scanned Image or Low-Text PDF detected. Text extraction returned minimal contents.]"

        return sanitized
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"Unable to extract text from PDF document: {str(e)}")

def extract_text_from_txt(file_bytes: bytes) -> str:
    """Extract text from TXT file byte content with encoding fallbacks."""
    if not file_bytes or len(file_bytes.strip()) == 0:
        raise ValueError("Uploaded TXT file is completely empty (0 bytes).")

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise ValueError(f"Uploaded file exceeds maximum allowed size limit of 10 MB.")

    try:
        text = file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        text = file_bytes.decode("latin-1", errors="ignore")

    sanitized = sanitize_extracted_text(text)
    if not sanitized or len(sanitized.strip()) < 5:
        raise ValueError("Uploaded text file contains no extractable word content.")

    return sanitized

def sanitize_extracted_text(text: str) -> str:
    """Sanitize and normalize extracted resume text."""
    if not text:
        return ""
    text = re.sub(r'\r\n|\r', '\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def sanitize_filename(filename: str) -> str:
    """
    Sanitizes user-provided filename to prevent directory traversal and filesystem attacks.
    Extracts basename, strips path separators, and replaces unsafe characters.
    """
    if not filename or not filename.strip():
        return "resume.pdf"
    # Take only the base filename (strips any path components)
    clean_name = re.sub(r'[\r\n\t]', '', filename.strip())
    clean_name = clean_name.replace('\\', '/').split('/')[-1]
    # Replace anything other than alphanumeric, underscore, dot, hyphen
    clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', clean_name)
    # Prevent leading dot / hidden file or empty name
    clean_name = clean_name.lstrip('.')
    return clean_name or "uploaded_resume.pdf"

def parse_resume_file(filename: str, file_bytes: bytes) -> str:
    """Extract plain text based on file extension with type validation."""
    if not filename or not filename.strip():
        raise ValueError("Filename cannot be empty.")

    clean_name = sanitize_filename(filename)
    if '.' not in clean_name:
        raise ValueError("Filename missing valid extension. Supported formats are .pdf and .txt.")

    ext = clean_name.lower().split('.')[-1]
    if ext == 'pdf':
        return extract_text_from_pdf(file_bytes)
    elif ext in ['txt', 'md']:
        return extract_text_from_txt(file_bytes)
    else:
        raise ValueError(f"Unsupported file format '.{ext}'. Supported file formats are .pdf and .txt.")
