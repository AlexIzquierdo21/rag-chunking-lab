"""Streamlit page for displaying evaluation results and comparative analysis."""

import sys
from pathlib import Path

import pandas as pd
import plotly.express as px
import streamlit as st

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

st.set_page_config(page_title="Results", page_icon="📊", layout="wide")

st.title("📊 Results")

required_keys = ["eval_results", "summary_df", "metrics_by_strategy"]


def _is_missing(val):
    if val is None:
        return True
    if hasattr(val, "empty"):  # DataFrame
        return val.empty
    return False


missing_keys = [key for key in required_keys if _is_missing(st.session_state.get(key))]
if missing_keys:
    st.warning("No evaluation results available. Please run the evaluation first.")
    st.stop()

eval_results = st.session_state["eval_results"]
summary_df: pd.DataFrame = st.session_state["summary_df"]
metrics_by_strategy: dict = st.session_state["metrics_by_strategy"]

st.subheader("Latency by Strategy")
col_left, col_right = st.columns(2)

with col_left:
    latency_data = summary_df[["strategy", "retrieval_latency_ms"]].copy()
    fig_retrieval = px.bar(
        latency_data,
        x="strategy",
        y="retrieval_latency_ms",
        title="Retrieval Latency (ms)",
        labels={"retrieval_latency_ms": "Latency (ms)"},
    )
    st.plotly_chart(fig_retrieval, use_container_width=True)

with col_right:
    latency_data = summary_df[["strategy", "generation_latency_ms"]].copy()
    fig_generation = px.bar(
        latency_data,
        x="strategy",
        y="generation_latency_ms",
        title="Generation Latency (ms)",
        labels={"generation_latency_ms": "Latency (ms)"},
    )
    st.plotly_chart(fig_generation, use_container_width=True)

st.subheader("Quality Metrics by Strategy")
metrics_rows = []
for strategy, metrics_dict in metrics_by_strategy.items():
    row = {"strategy": strategy}
    row.update(metrics_dict)
    metrics_rows.append(row)

if metrics_rows:
    metrics_df = pd.DataFrame(metrics_rows)
    metric_cols = [col for col in metrics_df.columns if col != "strategy"]
    if metric_cols:
        fig_quality = px.bar(
            metrics_df,
            x="strategy",
            y=metric_cols,
            title="Quality Metrics by Strategy",
            barmode="group",
        )
        st.plotly_chart(fig_quality, use_container_width=True)

st.subheader("Detailed Results")
eval_df = st.session_state.get("eval_df", pd.DataFrame())
st.dataframe(eval_df, use_container_width=True)

csv_data = eval_df.to_csv(index=False)
st.download_button(
    label="⬇ Download CSV",
    data=csv_data,
    file_name="evaluation_results.csv",
    mime="text/csv",
)

st.subheader("Question Explorer")
if eval_results:
    questions = list(dict.fromkeys([r.question for r in eval_results]))
    selected_question_text = st.selectbox("Select a question", questions)

    matching_results = [r for r in eval_results if r.question == selected_question_text]
    if matching_results:
        first_result = matching_results[0]

        st.write(f"**Question:** {first_result.question}")
        st.write(f"**Expected answer:** {first_result.expected_answer}")

        strategies = list(dict.fromkeys([r.strategy for r in matching_results]))
        tabs = st.tabs([f"🔧 {s}" for s in strategies])

        for tab, strategy in zip(tabs, strategies):
            strategy_result = next(
                (r for r in matching_results if r.strategy == strategy), None
            )
            if strategy_result:
                with tab:
                    st.write(f"**Generated answer:**")
                    st.write(strategy_result.generated_answer)
                    st.caption(
                        f"Retrieved {len(strategy_result.retrieved_chunks)} chunks"
                    )

st.subheader("🏆 Strategy Recommendation")

scores_data = []
for strategy, metrics_dict in metrics_by_strategy.items():
    rouge_l = metrics_dict.get("rouge_l", 0.0)
    context_hit_rate = metrics_dict.get("context_hit_rate", 0.0)
    adversarial_score = metrics_dict.get("adversarial_score", 0.0)

    score = (rouge_l * 0.4) + (context_hit_rate * 0.4) + (adversarial_score * 0.2)
    scores_data.append({"Strategy": strategy, "Score": score})

scores_df = pd.DataFrame(scores_data).sort_values("Score", ascending=False).reset_index(drop=True)

if not scores_df.empty:
    winner = scores_df.iloc[0]
    st.success(f"✅ Recommended strategy: {winner['Strategy']} (score: {winner['Score']:.3f})")

    st.dataframe(scores_df, use_container_width=True)

st.caption("Score = rouge_l × 0.4 + context_hit_rate × 0.4 + adversarial_score × 0.2")
st.info(
    "These are relative scores for this specific corpus and dataset. "
    "Results may differ with different documents or evaluation questions."
)
