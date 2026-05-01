"""This module handles document loading and text extraction from supported file types."""

import logging
from importlib import import_module
from pathlib import Path
from typing import Callable

from bs4 import BeautifulSoup
from pypdf import PdfReader
from pypdf.errors import PdfReadError

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = (".txt", ".md", ".pdf", ".docx", ".html")
DocumentLoader = Callable[[Path], str]


class IngestionError(Exception):
    """Raised when a document cannot be loaded or parsed."""


def _read_text_file(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except OSError as exc:
        raise IngestionError(f"Failed to read text document '{path.name}': {exc}") from exc


def _read_pdf_file(path: Path) -> str:
    try:
        reader = PdfReader(str(path))
    except (OSError, PdfReadError) as exc:
        raise IngestionError(f"Failed to read PDF document '{path.name}': {exc}") from exc
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def _read_docx_file(path: Path) -> str:
    try:
        docx_module = import_module("docx")
        exceptions_module = import_module("docx.opc.exceptions")
    except ModuleNotFoundError as exc:
        raise IngestionError("python-docx is required to read .docx documents") from exc

    package_not_found_error = getattr(exceptions_module, "PackageNotFoundError")
    try:
        document = docx_module.Document(str(path))
    except (OSError, package_not_found_error) as exc:
        raise IngestionError(f"Failed to read DOCX document '{path.name}': {exc}") from exc
    return "\n".join(paragraph.text for paragraph in document.paragraphs)


def _read_html_file(path: Path) -> str:
    try:
        content = path.read_text(encoding="utf-8")
    except OSError as exc:
        raise IngestionError(f"Failed to read HTML document '{path.name}': {exc}") from exc
    soup = BeautifulSoup(content, "html.parser")
    return soup.get_text()


def _get_loader(suffix: str) -> DocumentLoader:
    loaders: dict[str, DocumentLoader] = {
        ".txt": _read_text_file,
        ".md": _read_text_file,
        ".pdf": _read_pdf_file,
        ".docx": _read_docx_file,
        ".html": _read_html_file,
    }
    loader = loaders.get(suffix)
    if loader is None:
        supported = ", ".join(SUPPORTED_EXTENSIONS)
        raise IngestionError(f"Unsupported file extension '{suffix}'. Supported extensions: {supported}")
    return loader


def load_document(file_path: str) -> str:
    path = Path(file_path)
    if not path.exists():
        raise IngestionError(f"Document not found: {file_path}")

    text = _get_loader(path.suffix.lower())(path)
    logger.debug("Loaded document %s with %d characters", path.name, len(text))
    return text


def load_documents(file_paths: list[str]) -> dict[str, str]:
    documents: dict[str, str] = {}
    for file_path in file_paths:
        path = Path(file_path)
        try:
            documents[path.name] = load_document(file_path)
        except IngestionError as exc:
            logger.warning("Skipping document %s: %s", path.name, exc)
    return documents

