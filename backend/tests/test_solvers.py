import numpy as np
import pytest
from app.services.solvers import least_squares_solver, least_absolute_deviation_solver


def _simple_data():
    # Perfect signal: target = 100*B + 80*C + 60*D + 40*R
    rng = np.random.default_rng(42)
    n = 30
    X = rng.uniform(0.3, 1.2, size=(n, 4))
    true_coefs = np.array([100.0, 80.0, 60.0, 40.0])
    y = X @ true_coefs + rng.normal(0, 50, size=n)  # add small noise
    return X, y, true_coefs


def test_ols_coefs_nonnegative():
    X, y, _ = _simple_data()
    result = least_squares_solver(X, y)
    assert all(c >= 0 for c in result.coefs), f"Negative coefs: {result.coefs}"


def test_lad_coefs_nonnegative():
    X, y, _ = _simple_data()
    result = least_absolute_deviation_solver(X, y)
    assert all(c >= 0 for c in result.coefs), f"Negative coefs: {result.coefs}"


def test_ols_prediction_quality():
    # Solver should achieve low residuals on clean data
    X, y, _ = _simple_data()
    result = least_squares_solver(X, y)
    # MAE should be well below the scale of the signal (~150 kg range)
    assert result.mae < 100


def test_lad_prediction_quality():
    X, y, _ = _simple_data()
    result = least_absolute_deviation_solver(X, y)
    assert result.mae < 100


def test_ols_metrics_shape():
    X, y, _ = _simple_data()
    result = least_squares_solver(X, y)
    n = len(y)
    assert len(result.predicted) == n
    assert len(result.residuals) == n
    assert len(result.absolute_errors) == n
    assert result.mae >= 0
    assert result.rmse >= 0


def test_lad_metrics_shape():
    X, y, _ = _simple_data()
    result = least_absolute_deviation_solver(X, y)
    assert len(result.predicted) == len(y)
    assert result.mae >= 0


def test_ols_allows_open_gt_1():
    """Opening > 1.0 (>100%) must not crash the solver."""
    X = np.array([[1.15, 0.0, 0.0, 0.4],
                  [1.13, 0.0, 0.0, 0.0]])
    y = np.array([18000.0, 12000.0])
    result = least_squares_solver(X, y)
    assert all(c >= 0 for c in result.coefs)
