"""
Parse uploaded csv / xlsx into a cleaned DataFrame with internal column names.

Chinese → internal name mapping (ADR-006):
  項次         → record_id        (optional)
  B開幅(%)     → B_open_pct
  C開幅(%)     → C_open_pct
  D開幅(%)     → D_open_pct
  R開幅(%)     → R_open_pct
  槽增加量(%)   → tank_change_pct
  實際用量(kg)  → usage_kg
"""

import io
import pandas as pd

COLUMN_MAP: dict[str, str] = {
    "項次": "record_id",
    "B開幅(%)": "B_open_pct",
    "C開幅(%)": "C_open_pct",
    "D開幅(%)": "D_open_pct",
    "R開幅(%)": "R_open_pct",
    "槽增加量(%)": "tank_change_pct",
    "實際用量(kg)": "usage_kg",
}

REQUIRED_SOURCE_COLUMNS: list[str] = [
    "B開幅(%)",
    "C開幅(%)",
    "D開幅(%)",
    "R開幅(%)",
    "槽增加量(%)",
    "實際用量(kg)",
]


def parse_file(filename: str, content: bytes) -> pd.DataFrame:
    """Read file bytes into a DataFrame with internal column names.

    Raises ValueError with a clear message on any structural problem.
    """
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext == "csv":
        df = _read_csv(content)
    elif ext == "xlsx":
        df = _read_xlsx(content)
    else:
        raise ValueError(f"不支援的檔案格式：.{ext}。請上傳 .csv 或 .xlsx。")

    if df.empty:
        raise ValueError("檔案內容為空，無法分析。")

    _check_required_columns(df)
    df = df.rename(columns=COLUMN_MAP)

    # Drop rows where ALL required internal columns are NaN (truly empty rows)
    required_internal = [COLUMN_MAP[c] for c in REQUIRED_SOURCE_COLUMNS]
    df = df.dropna(how="all", subset=required_internal).reset_index(drop=True)

    if df.empty:
        raise ValueError("移除空列後無剩餘資料。")

    return df


def _read_csv(content: bytes) -> pd.DataFrame:
    try:
        return pd.read_csv(io.BytesIO(content))
    except Exception as exc:
        raise ValueError(f"CSV 讀取失敗：{exc}") from exc


def _read_xlsx(content: bytes) -> pd.DataFrame:
    try:
        return pd.read_excel(io.BytesIO(content), engine="openpyxl")
    except Exception as exc:
        raise ValueError(f"XLSX 讀取失敗：{exc}") from exc


def _check_required_columns(df: pd.DataFrame) -> None:
    missing = [c for c in REQUIRED_SOURCE_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"缺少必要欄位：{missing}")
