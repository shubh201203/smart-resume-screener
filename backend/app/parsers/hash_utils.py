import hashlib

def calculate_sha256(content: bytes) -> str:
    """Generate SHA-256 hex string digest for duplicate resume detection."""
    return hashlib.sha256(content).hexdigest()
