from unittest.mock import MagicMock, patch

import pytest

from src.pipeline import GenerationError, Generator


@patch("src.pipeline.generator.ollama.Client")
def test_generate_returns_string(mock_client_class: MagicMock) -> None:
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.message.content = "This is the answer"
    mock_client.chat.return_value = mock_response
    mock_client_class.return_value = mock_client

    generator = Generator()
    result = generator.generate(
        question="What is the main idea?",
        context_chunks=[
            {"text": "First context chunk."},
            {"text": "Second context chunk."},
        ],
    )

    assert isinstance(result, str)
    assert result == "This is the answer"


@patch("src.pipeline.generator.ollama.Client")
def test_generate_raises_generation_error_on_failure(mock_client_class: MagicMock) -> None:
    mock_client = MagicMock()
    mock_client.chat.side_effect = Exception("connection failed")
    mock_client_class.return_value = mock_client

    generator = Generator()

    with pytest.raises(GenerationError):
        generator.generate(
            question="What happened?",
            context_chunks=[{"text": "Some context."}],
        )


@patch("src.pipeline.generator.ollama.Client")
def test_generate_prompt_contains_question(mock_client_class: MagicMock) -> None:
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.message.content = "Mock answer"
    mock_client.chat.return_value = mock_response
    mock_client_class.return_value = mock_client

    generator = Generator()
    generator.generate(
        question="What is RAG?",
        context_chunks=[{"text": "RAG combines retrieval and generation."}],
    )

    messages = mock_client.chat.call_args.kwargs["messages"]
    prompt = messages[0]["content"]
    assert "What is RAG?" in prompt

