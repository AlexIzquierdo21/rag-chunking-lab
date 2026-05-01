import pytest

from src.chunking import Chunk, ChunkingStrategy


def test_chunk_creation() -> None:
    chunk = Chunk(
        text="sample text",
        metadata={"page": 1},
        strategy="fixed",
        chunk_index=0,
        source_doc="doc.txt",
    )

    assert chunk.text == "sample text"
    assert chunk.metadata == {"page": 1}
    assert chunk.strategy == "fixed"
    assert chunk.chunk_index == 0
    assert chunk.source_doc == "doc.txt"


def test_chunking_strategy_is_abstract() -> None:
    with pytest.raises(TypeError):
        ChunkingStrategy()


def test_concrete_strategy_describe() -> None:
    class DummyStrategy(ChunkingStrategy):
        name = "dummy"

        def chunk(self, text: str, source: str) -> list[Chunk]:
            return []

    strategy = DummyStrategy()
    description = strategy.describe()

    assert "name" in description
    assert description["name"] == "dummy"

