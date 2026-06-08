import numpy as np
import pandas as pd
from app.services.statistics import (
    compute_statistics,
    compute_histograms,
    compute_residual_histogram,
)


def _sample_df():
    return pd.DataFrame({
        "B_open_pct": [78, 82, 60, 80, 55],
        "C_open_pct": [0, 0, 0, 0, 0],
        "D_open_pct": [50, 50, 80, 50, 80],
        "R_open_pct": [0, 10, 20, 10, 0],
        "tank_change_pct": [9, 1, -2, -9, 9],
        "usage_kg": [0, 9120, 7756, 12264, 0],
        "target_supply_kg": [10080, 10232, 5516, 1624, 10080],
    })


def test_statistics_all_columns():
    df = _sample_df()
    stats = compute_statistics(df)
    assert "B_open_pct" in stats
    assert "target_supply_kg" in stats


def test_statistics_values():
    df = _sample_df()
    stats = compute_statistics(df)
    s = stats["B_open_pct"]
    assert s.count == 5
    assert s.missing_count == 0
    assert s.min == 55.0
    assert s.max == 82.0


def test_statistics_missing_values():
    df = _sample_df()
    df.at[0, "B_open_pct"] = float("nan")
    stats = compute_statistics(df)
    assert stats["B_open_pct"].count == 4
    assert stats["B_open_pct"].missing_count == 1


def test_histograms_shape():
    df = _sample_df()
    hists = compute_histograms(df)
    h = hists["B_open_pct"]
    assert len(h.bin_edges) == len(h.counts) + 1


def test_residual_histogram():
    residuals = np.array([-200, -100, 0, 100, 200, 300, -50, 50])
    h = compute_residual_histogram(residuals)
    assert sum(h.counts) == len(residuals)
    assert len(h.bin_edges) == len(h.counts) + 1
