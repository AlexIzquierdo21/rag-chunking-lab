"""Streamlit page for configuring chunking strategies and evaluation dataset."""

import sys
from pathlib import Path

import streamlit as st

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.chunking import (
    FixedChunking,
    LateChunking,
    RecursiveChunking,
    SemanticChunking,
    SentenceWindowChunking,
)
from src.evaluation import DatasetError, load_dataset

st.set_page_config(page_title="Configure Evaluation", page_icon="⚙️", layout="wide")

st.title("⚙️ Configure Evaluation")

if not st.session_state.get("corpus"):
    st.warning("Please upload documents first.")
    st.stop()

col_left, col_right = st.columns(2)

with col_left:
    st.subheader("Chunking Strategies")

    strategy_options: list[tuple[str, type]] = [
        ("Fixed-size", FixedChunking),
        ("Recursive", RecursiveChunking),
        ("Semantic", SemanticChunking),
        ("Sentence-window", SentenceWindowChunking),
        ("Late chunking", LateChunking),
    ]

    selected_strategies: list[type] = []
    for label, strategy_class in strategy_options:
        if st.checkbox(label, value=True):
            selected_strategies.append(strategy_class)

with col_right:
    st.subheader("Evaluation Dataset")
    dataset_path = st.text_input("Dataset path", value="eval/questions.json")

    if st.button("Load Dataset"):
        try:
            dataset = load_dataset(dataset_path)
            st.session_state["dataset"] = dataset

            factual_count = sum(1 for item in dataset if item.type == "factual")
            multi_hop_count = sum(1 for item in dataset if item.type == "multi-hop")
            adversarial_count = sum(1 for item in dataset if item.type == "adversarial")

            st.success(f"Loaded {len(dataset)} questions.")
            st.write(
                "Breakdown: "
                f"factual={factual_count}, "
                f"multi-hop={multi_hop_count}, "
                f"adversarial={adversarial_count}"
            )
        except DatasetError as error:
            st.error(str(error))

st.divider()
if st.session_state.get("corpus") and st.session_state.get("dataset"):
    st.session_state["selected_strategies"] = selected_strategies
    st.success("Configuration ready — proceed to Evaluate")
else:
    st.info("Load a dataset to complete configuration.")

