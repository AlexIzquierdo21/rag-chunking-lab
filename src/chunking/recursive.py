"""Recursive chunking strategy that splits text based on natural boundaries like paragraphs and sentences."""

from langchain_text_splitters import RecursiveCharacterTextSplitter

from src.chunking import Chunk, ChunkingStrategy


class RecursiveChunking(ChunkingStrategy):
    """Split text with recursive boundaries to preserve natural structure unlike fixed-size splitting."""

    name = "recursive"

    def __init__(self, chunk_size: int = 512, overlap: int = 50) -> None:
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk(self, text: str, source: str) -> list[Chunk]:
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.overlap,
            separators=["\n\n", "\n", ".", " ", ""],
        )
        split_texts = splitter.split_text(text)

        return [
            Chunk(
                text=chunk_text,
                metadata={
                    "chunk_size": self.chunk_size,
                    "overlap": self.overlap,
                    "separators": "paragraph>sentence>word",
                },
                strategy=self.name,
                chunk_index=index,
                source_doc=source,
            )
            for index, chunk_text in enumerate(split_texts)
        ]

