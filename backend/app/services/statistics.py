"""
Basic descriptive statistics and histogram bin data for frontend charts.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from app.schemas.analysis import ColumnStats, HistogramData

STAT_COLUMNS = [
    "B_open_pct",
    "C_open_pct",
    "D_open_pct",
    "R_open_pct",
    "tank_change_pct",
    "usage_kg",
    "target_supply_kg",
]

HISTOGRAM_BINS = 10


def compute_statistics(df: pd.DataFrame) -> dict[str, ColumnStats]:
    result: dict[str, ColumnStats] = {}
    for col in STAT_COLUMNS:
        if col not in df.columns:
            continue
        series = df[col]
        valid = series.dropna()
        if len(valid) == 0:
            continue
        desc = valid.describe(percentiles=[0.25, 0.5, 0.75])
        result[col] = ColumnStats(
            count=int(desc["count"]),
            missing_count=int(series.isna().sum()),
            mean=round(float(desc["mean"]), 4),
            std=round(float(desc["std"]) if len(valid) > 1 else 0.0, 4),
            min=round(float(desc["min"]), 4),
            q25=round(float(desc["25%"]), 4),
            median=round(float(desc["50%"]), 4),
            q75=round(float(desc["75%"]), 4),
            max=round(float(desc["max"]), 4),
        )
    return result


def compute_histograms(df: pd.DataFrame) -> dict[str, HistogramData]:
    result: dict[str, HistogramData] = {}
    for col in STAT_COLUMNS:
        if col not in df.columns:
            continue
        values = df[col].dropna().to_numpy(dtype=float)
        if len(values) < 2:
            continue
        counts, bin_edges = np.histogram(values, bins=HISTOGRAM_BINS)
        result[col] = HistogramData(
            bin_edges=[round(float(e), 4) for e in bin_edges],
            counts=[int(c) for c in counts],
        )
    return result


def compute_residual_histogram(residuals: np.ndarray) -> HistogramData:
    counts, bin_edges = np.histogram(residuals, bins=HISTOGRAM_BINS)
    return HistogramData(
        bin_edges=[round(float(e), 4) for e in bin_edges],
        counts=[int(c) for c in counts],
    )
