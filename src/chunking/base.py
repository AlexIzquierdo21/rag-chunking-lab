"""Defines the contract all chunking strategies in the project must implement."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


@dataclass
class Chunk:
    text: str
    metadata: dict[str, Any]
    strategy: str
    chunk_index: int
    source_doc: str


class ChunkingStrategy(ABC):
    name: str

    @abstractmethod
    def chunk(self, text: str, source: str) -> list[Chunk]:
        """Split text into chunks. Must be implemented by each strategy."""

    def describe(self) -> dict:
        """Returns strategy name and parameters for reporting."""
        return {"name": self.name, "params": self.__dict__}
