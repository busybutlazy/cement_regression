"""
Two coefficient estimation methods:

1. least_squares  — minimize Σ(error²), non-negative coefficients
                    uses scipy.optimize.lsq_linear with bounds=(0, inf)

2. least_absolute_deviation — minimize Σ|error|, non-negative coefficients
                    formulated as linear program via scipy.optimize.linprog
"""

from __future__ import annotations

import numpy as np
from scipy.optimize import lsq_linear, linprog
from dataclasses import dataclass


@dataclass
class SolverResult:
    coefs: np.ndarray           # [B, C, D, R]
    predicted: np.ndarray       # predicted_supply_kg per row
    residuals: np.ndarray       # predicted - actual
    absolute_errors: np.ndarray
    mae: float
    rmse: float
    total_absolute_error: float
    total_squared_error: float


def least_squares_solver(X: np.ndarray, y: np.ndarray) -> SolverResult:
    """OLS with non-negativity constraint via bounded lsq_linear."""
    result = lsq_linear(X, y, bounds=(0.0, np.inf), method="bvls")
    coefs = result.x
    return _build_result(coefs, X, y)


def least_absolute_deviation_solver(X: np.ndarray, y: np.ndarray) -> SolverResult:
    """LAD via linear programming.

    Variables: [B, C, D, R, t_0, ..., t_{n-1}]
    Minimize:  Σ t_i
    Subject to:
        X_i @ coef - t_i <=  y_i   (t_i >= X_i @ coef - y_i)
       -X_i @ coef - t_i <= -y_i   (t_i >= y_i - X_i @ coef)
    Bounds: coef >= 0, t >= 0
    """
    n, p = X.shape

    # Objective: minimize [0,0,0,0, 1,1,...,1]
    c = np.concatenate([np.zeros(p), np.ones(n)])

    # Inequality constraints (A_ub @ x <= b_ub)
    eye_n = np.eye(n)
    A1 = np.hstack([X, -eye_n])    # X @ coef - t <= y
    A2 = np.hstack([-X, -eye_n])   # -X @ coef - t <= -y
    A_ub = np.vstack([A1, A2])
    b_ub = np.concatenate([y, -y])

    bounds = [(0.0, None)] * p + [(0.0, None)] * n

    result = linprog(c, A_ub=A_ub, b_ub=b_ub, bounds=bounds, method="highs")

    if result.status != 0:
        raise RuntimeError(f"LAD 最佳化失敗：{result.message}")

    coefs = result.x[:p]
    return _build_result(coefs, X, y)


def _build_result(coefs: np.ndarray, X: np.ndarray, y: np.ndarray) -> SolverResult:
    predicted = X @ coefs
    residuals = predicted - y
    abs_err = np.abs(residuals)
    return SolverResult(
        coefs=coefs,
        predicted=predicted,
        residuals=residuals,
        absolute_errors=abs_err,
        mae=float(abs_err.mean()),
        rmse=float(np.sqrt((residuals**2).mean())),
        total_absolute_error=float(abs_err.sum()),
        total_squared_error=float((residuals**2).sum()),
    )
