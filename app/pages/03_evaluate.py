"""Streamlit page for running end-to-end evaluation across selected chunking strategies."""

import sys
from pathlib import Path
import time

import streamlit as st

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.evaluation import Evaluator, compute_ragas_metrics
from src.pipeline import Embedder, Generator, Retriever
from src.report import build_dataframe, summarize_by_strategy

st.set_page_config(page_title="Evaluate", page_icon="🧪", layout="wide")

st.title("🧪 Run Evaluation")

required_keys = ["corpus", "dataset", "selected_strategies"]
missing_keys = [key for key in required_keys if not st.session_state.get(key)]
if missing_keys:
    st.warning("Please upload documents and complete configuration first.")
    st.stop()

corpus: dict[str, str] = st.session_state["corpus"]
dataset = st.session_state["dataset"]
selected_strategies: list[type] = st.session_state["selected_strategies"]

st.info(
    f"Ready to run: {len(corpus)} documents, {len(dataset)} questions, "
    f"{len(selected_strategies)} strategies selected."
)

if st.button("▶ Run Evaluation", type="primary"):
    with st.spinner("Running evaluation..."):
        embedder = Embedder()
        generator = Generator()

        all_results = []
        metrics_by_strategy: dict[str, dict] = {}
        progress_bar = st.progress(0.0)
        start_time = time.time()

        for index, strategy_class in enumerate(selected_strategies, start=1):
            strategy = strategy_class()
            strategy_chunks = []

            for source_name, doc_text in corpus.items():
                strategy_chunks.extend(strategy.chunk(doc_text, source_name))

            retriever = Retriever(
                collection_name=f"ui_eval_{strategy.name}",
                embedder=embedder,
            )
            retriever.index_chunks(strategy_chunks)

            evaluator = Evaluator(
                retriever=retriever,
                generator=generator,
                strategy_name=strategy.name,
            )
            strategy_results = evaluator.evaluate_dataset(dataset)
            all_results.extend(strategy_results)
            metrics_by_strategy[strategy.name] = compute_ragas_metrics(strategy_results)

            progress_bar.progress(index / len(selected_strategies))

        eval_df = build_dataframe(all_results)
        summary_df = summarize_by_strategy(eval_df)
        elapsed_seconds = round(time.time() - start_time, 2)

        st.session_state["eval_results"] = all_results
        st.session_state["eval_df"] = eval_df
        st.session_state["summary_df"] = summary_df
        st.session_state["metrics_by_strategy"] = metrics_by_strategy

        st.success("Evaluation complete — proceed to Results")
        st.caption(f"Execution time: {elapsed_seconds}s")
        st.dataframe(summary_df, use_container_width=True)

