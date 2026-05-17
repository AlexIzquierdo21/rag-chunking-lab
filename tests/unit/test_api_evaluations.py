from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.api.routers.evaluations import _get_strategy_class, _runs, router


app = FastAPI()
app.include_router(router)
client = TestClient(app)


def setup_function() -> None:
    _runs.clear()


def test_get_strategy_class_maps_fixed() -> None:
    strategy_class = _get_strategy_class("fixed")
    assert strategy_class.__name__ == "FixedChunking"


def test_get_strategy_class_raises_for_unknown_strategy() -> None:
    try:
        _get_strategy_class("unknown")
    except ValueError as exc:
        assert "Unknown strategy" in str(exc)
    else:
        raise AssertionError("ValueError was not raised for unknown strategy")


def test_status_returns_404_for_missing_run() -> None:
    response = client.get("/api/evaluations/missing/status")
    assert response.status_code == 404


def test_results_returns_400_when_evaluation_is_not_complete() -> None:
    _runs["run12345"] = {
        "status": "running",
        "strategies": [],
        "started_at": 1.0,
        "completed_at": None,
        "error": None,
        "config": {},
    }
    response = client.get("/api/evaluations/run12345/results")
    assert response.status_code == 400
    assert response.json()["detail"] == "Evaluation not complete"


def test_results_returns_metrics_for_completed_run() -> None:
    _runs["done1234"] = {
        "status": "done",
        "strategies": [
            {
                "strategy": "fixed",
                "status": "done",
                "progress": 1.0,
                "results_count": 2,
                "metrics": {"rouge_l": 0.5},
                "results": [{"question_id": "q1"}],
            }
        ],
        "started_at": 1.0,
        "completed_at": 2.0,
        "error": None,
        "config": {"strategies": ["fixed"]},
    }
    response = client.get("/api/evaluations/done1234/results")
    assert response.status_code == 200
    payload = response.json()
    assert payload["run_id"] == "done1234"
    assert payload["strategies"][0]["metrics"]["rouge_l"] == 0.5

