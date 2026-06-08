from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class ColumnStats(BaseModel):
    count: int
    missing_count: int
    mean: float
    std: float
    min: float
    q25: float
    median: float
    q75: float
    max: float


class HistogramData(BaseModel):
    bin_edges: list[float]
    counts: list[int]


class ActualVsPredicted(BaseModel):
    actual: list[float]
    predicted: list[float]


class RowResult(BaseModel):
    record_id: Optional[int]
    target_supply_kg: float
    predicted_supply_kg: float
    residual: float
    absolute_error: float


class ModelCoefficients(BaseModel):
    B: float
    C: float
    D: float
    R: float


class ModelMetrics(BaseModel):
    mae: float
    rmse: float
    total_absolute_error: float
    total_squared_error: float


class ModelResult(BaseModel):
    coefficients: ModelCoefficients
    metrics: ModelMetrics
    rows: list[RowResult]


class ExcludedRow(BaseModel):
    original_index: int
    reason: str


class Summary(BaseModel):
    total_rows: int
    valid_rows: int
    invalid_rows: int


class DataQuality(BaseModel):
    excluded_rows: list[ExcludedRow]


class ChartsData(BaseModel):
    histograms: dict[str, HistogramData]
    residuals: dict[str, HistogramData]
    actual_vs_predicted: dict[str, ActualVsPredicted]


class AnalysisResponse(BaseModel):
    summary: Summary
    data_quality: DataQuality
    statistics: dict[str, ColumnStats]
    models: dict[str, ModelResult]
    charts: ChartsData
