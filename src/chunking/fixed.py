"""Chunking strategy that splits text into fixed-size chunks with overlap between adjacent chunks."""

from langchain_text_splitters import RecursiveCharacterTextSplitter

from src.chunking import Chunk, ChunkingStrategy


class FixedChunking(ChunkingStrategy):
    """Split text into fixed-size chunks with overlap between adjacent chunks."""

    name = "fixed"

    def __init__(self, chunk_size: int = 512, overlap: int = 50) -> None:
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk(self, text: str, source: str) -> list[Chunk]:
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.overlap,
        )
        split_texts = splitter.split_text(text)

        return [
            Chunk(
                text=chunk_text,
                metadata={"chunk_size": self.chunk_size, "overlap": self.overlap},
                strategy=self.name,
                chunk_index=index,
                source_doc=source,
            )
            for index, chunk_text in enumerate(split_texts)
        ]

