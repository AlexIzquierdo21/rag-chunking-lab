
from src.chunking import Chunk, FixedChunking


def test_returns_list_of_chunks() -> None:
    strategy = FixedChunking()
    text = "a" * 2000

    chunks = strategy.chunk(text=text, source="test.txt")

    assert isinstance(chunks, list)
    assert len(chunks) > 1
    assert all(isinstance(chunk, Chunk) for chunk in chunks)


def test_chunk_fields() -> None:
    strategy = FixedChunking()
    text = "a" * 2000

    chunks = strategy.chunk(text=text, source="test.txt")
    first_chunk = chunks[0]

    assert first_chunk.strategy == "fixed"
    assert first_chunk.source_doc == "test.txt"
    assert first_chunk.chunk_index == 0
    assert "chunk_size" in first_chunk.metadata
    assert "overlap" in first_chunk.metadata


def test_chunk_index_is_sequential() -> None:
    strategy = FixedChunking()
    text = "a" * 2000

    chunks = strategy.chunk(text=text, source="test.txt")
    indices = [chunk.chunk_index for chunk in chunks]

    assert indices == list(range(len(chunks)))

