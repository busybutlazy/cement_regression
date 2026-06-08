export interface ColumnStats {
  count: number;
  missing_count: number;
  mean: number;
  std: number;
  min: number;
  q25: number;
  median: number;
  q75: number;
  max: number;
}

export interface HistogramData {
  bin_edges: number[];
  counts: number[];
}

export interface ActualVsPredicted {
  actual: number[];
  predicted: number[];
}

export interface RowResult {
  record_id: number | null;
  target_supply_kg: number;
  predicted_supply_kg: number;
  residual: number;
  absolute_error: number;
}

export interface ModelCoefficients {
  B: number;
  C: number;
  D: number;
  R: number;
}

export interface ModelMetrics {
  mae: number;
  rmse: number;
  total_absolute_error: number;
  total_squared_error: number;
}

export interface ModelResult {
  coefficients: ModelCoefficients;
  metrics: ModelMetrics;
  rows: RowResult[];
}

export interface ExcludedRow {
  original_index: number;
  reason: string;
}

export interface Summary {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
}

export interface DataQuality {
  excluded_rows: ExcludedRow[];
}

export interface ChartsData {
  histograms: Record<string, HistogramData>;
  residuals: Record<string, HistogramData>;
  actual_vs_predicted: Record<string, ActualVsPredicted>;
}

export interface AnalysisResponse {
  summary: Summary;
  data_quality: DataQuality;
  statistics: Record<string, ColumnStats>;
  models: {
    least_squares: ModelResult;
    least_absolute_deviation: ModelResult;
  };
  charts: ChartsData;
}
