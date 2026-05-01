from src.chunking import Chunk, RecursiveChunking


def test_returns_list_of_chunks() -> None:
    strategy = RecursiveChunking()
    text = "a" * 2000

    chunks = strategy.chunk(text=text, source="test.txt")

    assert isinstance(chunks, list)
    assert len(chunks) > 1
    assert all(isinstance(chunk, Chunk) for chunk in chunks)


def test_chunk_fields() -> None:
    strategy = RecursiveChunking()
    text = "a" * 2000

    chunks = strategy.chunk(text=text, source="test.txt")
    first_chunk = chunks[0]

    assert first_chunk.strategy == "recursive"
    assert first_chunk.source_doc == "test.txt"
    assert first_chunk.chunk_index == 0
    assert "chunk_size" in first_chunk.metadata
    assert "overlap" in first_chunk.metadata
    assert "separators" in first_chunk.metadata


def test_respects_paragraph_boundaries() -> None:
    strategy = RecursiveChunking(chunk_size=80, overlap=0)
    text = (
        "First paragraph has enough words to be split carefully by boundaries.\n\n"
        "Second paragraph also has enough words to force chunking behavior.\n\n"
        "Third paragraph keeps the same pattern for deterministic splitting."
    )

    chunks = strategy.chunk(text=text, source="test.txt")

    assert all("\n\n" not in chunk.text for chunk in chunks)

