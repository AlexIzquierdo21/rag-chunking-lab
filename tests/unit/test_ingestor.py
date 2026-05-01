import pytest
from pathlib import Path

from src.pipeline import IngestionError, load_document, load_documents


def test_load_txt_file(tmp_path) -> None:
    base_path = Path(str(tmp_path))
    file_path = base_path / "sample.txt"
    content = "Hello from a text file."
    file_path.write_text(content, encoding="utf-8")

    loaded_text = load_document(str(file_path))

    assert loaded_text == content


def test_load_md_file(tmp_path) -> None:
    base_path = Path(str(tmp_path))
    file_path = base_path / "sample.md"
    content = "# Title\n\nMarkdown content."
    file_path.write_text(content, encoding="utf-8")

    loaded_text = load_document(str(file_path))

    assert loaded_text == content


def test_file_not_found_raises_ingestion_error(tmp_path) -> None:
    base_path = Path(str(tmp_path))
    missing_file = base_path / "missing.txt"

    with pytest.raises(IngestionError):
        load_document(str(missing_file))


def test_unsupported_extension_raises_ingestion_error(tmp_path) -> None:
    base_path = Path(str(tmp_path))
    file_path = base_path / "unsupported.xyz"
    file_path.write_text("unsupported content", encoding="utf-8")

    with pytest.raises(IngestionError):
        load_document(str(file_path))


def test_load_documents_skips_failed_files(tmp_path) -> None:
    base_path = Path(str(tmp_path))
    valid_file = base_path / "valid.txt"
    valid_content = "valid content"
    valid_file.write_text(valid_content, encoding="utf-8")
    missing_file = base_path / "missing.txt"

    documents = load_documents([str(valid_file), str(missing_file)])

    assert documents == {valid_file.name: valid_content}

