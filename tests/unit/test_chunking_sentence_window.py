import pytest

from src.chunking import Chunk, SentenceWindowChunking


def test_returns_one_chunk_per_sentence() -> None:
    strategy = SentenceWindowChunking(window_size=2)
    text = "One. Two. Three. Four. Five"

    chunks = strategy.chunk(text=text, source="test.txt")

    assert len(chunks) == pytest.approx(5)
    assert all(isinstance(chunk, Chunk) for chunk in chunks)


def test_chunk_fields() -> None:
    strategy = SentenceWindowChunking()
    text = "Alpha. Beta. Gamma"

    chunks = strategy.chunk(text=text, source="test.txt")
    first_chunk = chunks[0]

    assert first_chunk.strategy == "sentence_window"
    assert first_chunk.source_doc == "test.txt"
    assert first_chunk.chunk_index == 0
    assert "window_size" in first_chunk.metadata
    assert "center_sentence" in first_chunk.metadata


def test_window_context_includes_neighbors() -> None:
    strategy = SentenceWindowChunking(window_size=1)
    text = "Alpha. Beta. Gamma"

    chunks = strategy.chunk(text=text, source="test.txt")

    assert "Alpha" in chunks[1].text
    assert "Gamma" in chunks[1].text

