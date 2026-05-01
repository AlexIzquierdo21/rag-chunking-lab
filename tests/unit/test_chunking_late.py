import pytest

from src.chunking import Chunk, LateChunking


@pytest.fixture(scope="module")
def default_strategy() -> LateChunking:
    return LateChunking()


@pytest.fixture(scope="module")
def small_chunk_strategy() -> LateChunking:
    return LateChunking(chunk_size=100)


def test_returns_list_of_chunks(small_chunk_strategy: LateChunking) -> None:
    text = "a" * 500

    chunks = small_chunk_strategy.chunk(text=text, source="test.txt")

    assert isinstance(chunks, list)
    assert len(chunks) >= 1
    assert all(isinstance(chunk, Chunk) for chunk in chunks)


def test_chunk_fields(default_strategy: LateChunking) -> None:
    text = "b" * 500

    chunks = default_strategy.chunk(text=text, source="test.txt")
    first_chunk = chunks[0]

    assert first_chunk.strategy == "late_chunking"
    assert first_chunk.source_doc == "test.txt"
    assert first_chunk.chunk_index == 0
    assert "model" in first_chunk.metadata
    assert "chunk_size" in first_chunk.metadata
    assert "doc_similarity" in first_chunk.metadata


def test_doc_similarity_is_float_between_0_and_1(default_strategy: LateChunking) -> None:
    text = "c" * 500

    chunks = default_strategy.chunk(text=text, source="test.txt")

    for chunk in chunks:
        similarity = chunk.metadata["doc_similarity"]
        assert isinstance(similarity, float)
        assert -1.0 <= similarity <= 1.0

