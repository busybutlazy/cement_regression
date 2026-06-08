"""
Convert columns to numeric, exclude rows that cannot be computed,
and return a data-quality summary.
"""

from __future__ import annotations

import pandas as pd
from dataclasses import dataclass, field

NUMERIC_COLUMNS = [
    "B_open_pct",
    "C_open_pct",
    "D_open_pct",
    "R_open_pct",
    "tank_change_pct",
    "usage_kg",
]


@dataclass
class CleanResult:
    df: pd.DataFrame
    total_rows: int
    valid_rows: int
    excluded: list[dict]  # [{"original_index": int, "reason": str}]


def clean(df: pd.DataFrame) -> CleanResult:
    total_rows = len(df)
    excluded: list[dict] = []

    # Force numeric conversion; non-numeric → NaN
    for col in NUMERIC_COLUMNS:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Identify rows with any NaN in required numeric columns
    bad_mask = df[NUMERIC_COLUMNS].isna().any(axis=1)
    bad_rows = df[bad_mask]
    for idx in bad_rows.index:
        nan_cols = [c for c in NUMERIC_COLUMNS if pd.isna(df.at[idx, c])]
        excluded.append(
            {
                "original_index": int(idx) + 1,  # 1-based for display
                "reason": f"欄位無法轉換為數值：{nan_cols}",
            }
        )

    df_clean = df[~bad_mask].reset_index(drop=True)

    return CleanResult(
        df=df_clean,
        total_rows=total_rows,
        valid_rows=len(df_clean),
        excluded=excluded,
    )
