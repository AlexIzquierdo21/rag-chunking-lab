from pathlib import Path
from uuid import uuid4

import pytest

from src.chunking import Chunk
from src.pipeline import Embedder, Retriever


@pytest.fixture(scope="module")
def embedder() -> Embedder:
    return Embedder()


def _build_retriever(tmp_path, embedder: Embedder) -> Retriever:
    base_path = Path(str(tmp_path))
    collection_name = f"test_collection_{uuid4().hex}"
    return Retriever(
        collection_name=collection_name,
        embedder=embedder,
        persist_dir=str(base_path),
    )


def test_index_and_retrieve_returns_results(tmp_path, embedder: Embedder) -> None:
    retriever = _build_retriever(tmp_path, embedder)
    chunks = [
        Chunk("This chunk talks about machine learning models.", {}, "fixed", 0, "doc.txt"),
        Chunk("This chunk explains cooking recipes and ingredients.", {}, "fixed", 1, "doc.txt"),
        Chunk("This chunk discusses football tactics and matches.", {}, "fixed", 2, "doc.txt"),
    ]

    retriever.index_chunks(chunks)
    results = retriever.retrieve("Information about machine learning")

    assert isinstance(results, list)
    assert len(results) >= 1
    for result in results:
        assert "text" in result
        assert "metadata" in result
        assert "distance" in result


def test_retrieve_respects_top_k(tmp_path, embedder: Embedder) -> None:
    retriever = _build_retriever(tmp_path, embedder)
    chunks = [
        Chunk(f"Document chunk number {index} about retrieval systems.", {}, "fixed", index, "doc.txt")
        for index in range(5)
    ]

    retriever.index_chunks(chunks)
    results = retriever.retrieve("retrieval systems", top_k=2)

    assert len(results) == 2


def test_indexed_chunks_text_appears_in_results(tmp_path, embedder: Embedder) -> None:
    retriever = _build_retriever(tmp_path, embedder)
    distinctive_text = "ZXQ-991 distinctive retrieval sentinel phrase"
    chunks = [Chunk(distinctive_text, {}, "fixed", 0, "doc.txt")]

    retriever.index_chunks(chunks)
    results = retriever.retrieve("ZXQ-991 distinctive retrieval sentinel phrase")

    assert any(distinctive_text in result["text"] for result in results)

