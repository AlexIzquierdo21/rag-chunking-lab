import pytest

from src.chunking import Chunk, SemanticChunking


@pytest.fixture(scope="module")
def strategy() -> SemanticChunking:
    return SemanticChunking()


def test_returns_list_of_chunks(strategy: SemanticChunking) -> None:
    text = (
        "The stock market opened lower today. "
        "A tropical storm formed in the Atlantic basin. "
        "Researchers published a new vaccine trial update. "
        "The local team won the championship final. "
        "A startup launched a quantum computing toolkit."
    )

    chunks = strategy.chunk(text=text, source="test.txt")

    assert isinstance(chunks, list)
    assert len(chunks) >= 1
    assert all(isinstance(chunk, Chunk) for chunk in chunks)


def test_chunk_fields(strategy: SemanticChunking) -> None:
    text = "Alpha sentence. Beta sentence. Gamma sentence. Delta sentence."

    chunks = strategy.chunk(text=text, source="test.txt")
    first_chunk = chunks[0]

    assert first_chunk.strategy == "semantic"
    assert first_chunk.source_doc == "test.txt"
    assert first_chunk.chunk_index == 0
    assert "model" in first_chunk.metadata
    assert "threshold" in first_chunk.metadata


def test_single_sentence_returns_one_chunk(strategy: SemanticChunking) -> None:
    chunks = strategy.chunk(text="This is a single sentence without separator", source="test.txt")

    assert len(chunks) == 1

