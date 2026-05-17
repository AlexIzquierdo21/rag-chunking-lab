"""
Documents API router for file upload, listing, and deletion.

Handles document ingestion into the corpus directory and provides
endpoints for managing uploaded files.
"""

import logging
from pathlib import Path
from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from src.pipeline import IngestionError, load_documents

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["documents"])

# Response model
class DocumentInfo(BaseModel):
    """Document metadata response."""
    filename: str
    characters: int
    status: str


@router.post("/upload", response_model=List[DocumentInfo])
async def upload_documents(files: List[UploadFile] = File(...)) -> List[DocumentInfo]:
    """
    Upload multiple documents to the corpus.

    Args:
        files: List of files to upload.

    Returns:
        List of DocumentInfo with upload status for each file.

    Raises:
        HTTPException: If a non-ingestion error occurs during upload.
    """
    corpus_dir = Path("corpus")
    corpus_dir.mkdir(exist_ok=True)

    saved_paths = []
    results = []

    # Step 1: Save all files to disk
    for file in files:
        try:
            file_path = corpus_dir / file.filename
            content = await file.read()
            file_path.write_bytes(content)
            saved_paths.append(str(file_path))
            logger.debug(f"Saved file: {file.filename}")
        except Exception as e:
            logger.error(f"Failed to save file {file.filename}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to save file: {file.filename}")

    # Step 2: Load documents and get character counts
    if saved_paths:
        loaded_docs = load_documents(saved_paths)

        # Step 3: Build response
        for file in files:
            if file.filename in loaded_docs:
                doc_text = loaded_docs[file.filename]
                char_count = len(doc_text)
                status = "loaded"
                logger.debug(f"Loaded {file.filename}: {char_count} characters")
            else:
                char_count = 0
                status = "failed"
                logger.warning(f"Failed to load {file.filename}")

            results.append(
                DocumentInfo(
                    filename=file.filename,
                    characters=char_count,
                    status=status,
                )
            )
    else:
        # No files were successfully saved
        raise HTTPException(status_code=500, detail="No files were saved successfully")

    return results


@router.get("", response_model=List[DocumentInfo])
def list_documents() -> List[DocumentInfo]:
    """
    List all documents in the corpus directory.

    Returns:
        List of DocumentInfo for all files in corpus/.
    """
    corpus_dir = Path("corpus")

    # If corpus directory doesn't exist, return empty list
    if not corpus_dir.exists():
        logger.debug("Corpus directory does not exist")
        return []

    # Supported file extensions
    supported_extensions = {".pdf", ".txt", ".md", ".html", ".docx"}

    results = []
    for file_path in corpus_dir.iterdir():
        if file_path.is_file() and file_path.suffix.lower() in supported_extensions:
            file_size = file_path.stat().st_size
            # Approximate characters as file size in bytes (rough estimate)
            char_count = file_size
            results.append(
                DocumentInfo(
                    filename=file_path.name,
                    characters=char_count,
                    status="ready",
                )
            )
            logger.debug(f"Found document: {file_path.name}")

    return results


@router.delete("/{filename}", response_model=dict)
def delete_document(filename: str) -> dict:
    """
    Delete a document from the corpus.

    Args:
        filename: Name of the file to delete.

    Returns:
        Dict with deleted filename.

    Raises:
        HTTPException: If file not found.
    """
    corpus_dir = Path("corpus")
    file_path = corpus_dir / filename

    if not file_path.exists():
        logger.warning(f"File not found: {filename}")
        raise HTTPException(status_code=404, detail=f"File not found: {filename}")

    try:
        file_path.unlink()
        logger.info(f"Deleted file: {filename}")
        return {"deleted": filename}
    except Exception as e:
        logger.error(f"Failed to delete file {filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {filename}")

