"""Chunking strategy that centers each chunk on one sentence while preserving nearby context."""

from src.chunking import Chunk, ChunkingStrategy


class SentenceWindowChunking(ChunkingStrategy):
    """Center each chunk on one sentence while including surrounding context for better retrieval."""

    name = "sentence_window"

    def __init__(self, window_size: int = 3) -> None:
        self.window_size = window_size

    def chunk(self, text: str, source: str) -> list[Chunk]:
        sentences = [sentence.strip() for sentence in text.split(". ") if sentence.strip()]
        return [
            self._build_chunk(sentences, index, source)
            for index in range(len(sentences))
        ]

    def _build_chunk(self, sentences: list[str], index: int, source: str) -> Chunk:
        start = max(0, index - self.window_size)
        end = index + self.window_size + 1
        context = ". ".join(sentences[start:end])
        return Chunk(
            text=context,
            metadata={
                "window_size": self.window_size,
                "center_sentence": sentences[index],
            },
            strategy=self.name,
            chunk_index=index,
            source_doc=source,
        )

