"""
Build model features from cleaned DataFrame:
  - Convert opening % → decimal (÷100), values may exceed 1.0 (ADR-007)
  - Compute tank_change_kg from tank_change_pct × kg_per_percent
  - Compute target_supply_kg = tank_change_kg + usage_kg
"""

import numpy as np
import pandas as pd

OPEN_PCT_COLS = ["B_open_pct", "C_open_pct", "D_open_pct", "R_open_pct"]
OPEN_COLS = ["B_open", "C_open", "D_open", "R_open"]


def build_features(df: pd.DataFrame, kg_per_percent: float) -> pd.DataFrame:
    df = df.copy()

    for pct_col, open_col in zip(OPEN_PCT_COLS, OPEN_COLS):
        df[open_col] = df[pct_col] / 100.0

    df["tank_change_kg"] = df["tank_change_pct"] * kg_per_percent
    df["target_supply_kg"] = df["tank_change_kg"] + df["usage_kg"]

    return df


def build_matrices(df: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
    """Return feature matrix X (n×4) and target vector y (n,)."""
    X = df[OPEN_COLS].to_numpy(dtype=float)
    y = df["target_supply_kg"].to_numpy(dtype=float)
    return X, y
