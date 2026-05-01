import pytest

from src.chunking import Chunk
from src.pipeline import Embedder


@pytest.fixture(scope="module")
def embedder() -> Embedder:
    return Embedder()


def test_embed_chunks_adds_embedding_to_metadata(embedder: Embedder) -> None:
    chunks = [
        Chunk("First sample text.", {}, "fixed", 0, "doc.txt"),
        Chunk("Second sample text.", {}, "fixed", 1, "doc.txt"),
        Chunk("Third sample text.", {}, "fixed", 2, "doc.txt"),
    ]

    embedded_chunks = embedder.embed_chunks(chunks)

    for chunk in embedded_chunks:
        assert "embedding" in chunk.metadata
        assert isinstance(chunk.metadata["embedding"], list)
        assert all(isinstance(value, float) for value in chunk.metadata["embedding"])


def test_embed_texts_returns_list_of_vectors(embedder: Embedder) -> None:
    embeddings = embedder.embed_texts(["hello world", "another sentence"])

    assert isinstance(embeddings, list)
    assert len(embeddings) == 2
    assert all(isinstance(embedding, list) for embedding in embeddings)
    assert all(all(isinstance(value, float) for value in embedding) for embedding in embeddings)


def test_embed_chunks_returns_same_count(embedder: Embedder) -> None:
    chunks = [
        Chunk(f"Sample text {index}", {}, "fixed", index, "doc.txt")
        for index in range(5)
    ]

    embedded_chunks = embedder.embed_chunks(chunks)

    assert len(embedded_chunks) == 5

