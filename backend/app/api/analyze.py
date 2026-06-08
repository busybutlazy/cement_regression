from __future__ import annotations

import numpy as np
import pandas as pd
from fastapi import APIRouter, File, Form, UploadFile

from app.schemas.analysis import (
    ActualVsPredicted,
    AnalysisResponse,
    ChartsData,
    DataQuality,
    ExcludedRow,
    ModelCoefficients,
    ModelMetrics,
    ModelResult,
    RowResult,
    Summary,
)
from app.services import (
    data_cleaner,
    feature_builder,
    file_parser,
    solvers,
    statistics,
)
from app.utils.errors import bad_request, unprocessable

router = APIRouter()


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    file: UploadFile = File(...),
    kg_per_percent: float = Form(default=1120.0),
) -> AnalysisResponse:
    # --- 1. Parse file ---
    content = await file.read()
    if not content:
        raise bad_request("上傳的檔案為空。")

    try:
        df_raw = file_parser.parse_file(file.filename or "", content)
    except ValueError as exc:
        raise bad_request(str(exc))

    # --- 2. Clean data ---
    clean = data_cleaner.clean(df_raw)
    if clean.valid_rows == 0:
        raise unprocessable("有效資料列為 0，無法進行估算。請確認檔案內容。")

    df = clean.df

    # --- 3. Build features ---
    df = feature_builder.build_features(df, kg_per_percent)
    X, y = feature_builder.build_matrices(df)

    # --- 4. Run solvers ---
    try:
        ols = solvers.least_squares_solver(X, y)
    except Exception as exc:
        raise unprocessable(f"平方誤差法估算失敗：{exc}")

    try:
        lad = solvers.least_absolute_deviation_solver(X, y)
    except Exception as exc:
        raise unprocessable(f"絕對誤差法估算失敗：{exc}")

    # --- 5. Statistics ---
    stats = statistics.compute_statistics(df)
    histograms = statistics.compute_histograms(df)

    # --- 6. Assemble response ---
    record_ids = _get_record_ids(df, clean.valid_rows)

    ols_rows = _build_rows(record_ids, y, ols)
    lad_rows = _build_rows(record_ids, y, lad)

    return AnalysisResponse(
        summary=Summary(
            total_rows=clean.total_rows,
            valid_rows=clean.valid_rows,
            invalid_rows=len(clean.excluded),
        ),
        data_quality=DataQuality(
            excluded_rows=[ExcludedRow(**e) for e in clean.excluded]
        ),
        statistics=stats,
        models={
            "least_squares": ModelResult(
                coefficients=_coefs(ols),
                metrics=_metrics(ols),
                rows=ols_rows,
            ),
            "least_absolute_deviation": ModelResult(
                coefficients=_coefs(lad),
                metrics=_metrics(lad),
                rows=lad_rows,
            ),
        },
        charts=ChartsData(
            histograms=histograms,
            residuals={
                "least_squares": statistics.compute_residual_histogram(ols.residuals),
                "least_absolute_deviation": statistics.compute_residual_histogram(lad.residuals),
            },
            actual_vs_predicted={
                "least_squares": ActualVsPredicted(
                    actual=[round(float(v), 2) for v in y],
                    predicted=[round(float(v), 2) for v in ols.predicted],
                ),
                "least_absolute_deviation": ActualVsPredicted(
                    actual=[round(float(v), 2) for v in y],
                    predicted=[round(float(v), 2) for v in lad.predicted],
                ),
            },
        ),
    )


# --- Helpers ---

def _get_record_ids(df: pd.DataFrame, n: int) -> list[int | None]:
    if "record_id" in df.columns:
        return [
            int(v) if pd.notna(v) else None
            for v in df["record_id"]
        ]
    return [None] * n


def _build_rows(
    record_ids: list[int | None],
    y: "np.ndarray",
    result: solvers.SolverResult,
) -> list[RowResult]:
    return [
        RowResult(
            record_id=record_ids[i],
            target_supply_kg=round(float(y[i]), 2),
            predicted_supply_kg=round(float(result.predicted[i]), 2),
            residual=round(float(result.residuals[i]), 2),
            absolute_error=round(float(result.absolute_errors[i]), 2),
        )
        for i in range(len(y))
    ]


def _coefs(result: solvers.SolverResult) -> ModelCoefficients:
    c = result.coefs
    return ModelCoefficients(
        B=round(float(c[0]), 4),
        C=round(float(c[1]), 4),
        D=round(float(c[2]), 4),
        R=round(float(c[3]), 4),
    )


def _metrics(result: solvers.SolverResult) -> ModelMetrics:
    return ModelMetrics(
        mae=round(result.mae, 2),
        rmse=round(result.rmse, 2),
        total_absolute_error=round(result.total_absolute_error, 2),
        total_squared_error=round(result.total_squared_error, 2),
    )
