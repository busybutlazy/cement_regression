import type { AnalysisResponse } from "../types/analysis";

interface Props {
  data: AnalysisResponse;
}

export function SummaryCards({ data }: Props) {
  const { summary, models } = data;
  const ols = models.least_squares;
  const lad = models.least_absolute_deviation;

  return (
    <section>
      <h2 style={styles.sectionTitle}>結果總覽</h2>
      <div style={styles.grid}>
        <StatCard label="總資料筆數" value={summary.total_rows} unit="筆" />
        <StatCard label="有效資料筆數" value={summary.valid_rows} unit="筆" color="#16a34a" />
        <StatCard
          label="排除筆數"
          value={summary.invalid_rows}
          unit="筆"
          color={summary.invalid_rows > 0 ? "#dc2626" : "#6b7280"}
        />
      </div>

      <h3 style={styles.subTitle}>兩種方法誤差比較</h3>
      <div style={styles.grid}>
        <MetricCard
          label="平方誤差法（OLS）MAE"
          value={ols.metrics.mae.toLocaleString()}
          unit="kg"
        />
        <MetricCard
          label="絕對誤差法（LAD）MAE"
          value={lad.metrics.mae.toLocaleString()}
          unit="kg"
        />
        <MetricCard
          label="OLS RMSE"
          value={ols.metrics.rmse.toLocaleString()}
          unit="kg"
        />
        <MetricCard
          label="LAD RMSE"
          value={lad.metrics.rmse.toLocaleString()}
          unit="kg"
        />
      </div>

      {data.data_quality.excluded_rows.length > 0 && (
        <div style={styles.warning}>
          <strong>排除列明細：</strong>
          <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
            {data.data_quality.excluded_rows.map((r) => (
              <li key={r.original_index} style={{ fontSize: 13 }}>
                第 {r.original_index} 列：{r.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function StatCard({
  label,
  value,
  unit,
  color = "#1a1a1a",
}: {
  label: string;
  value: number;
  unit: string;
  color?: string;
}) {
  return (
    <div style={styles.card}>
      <div style={styles.cardLabel}>{label}</div>
      <div style={{ ...styles.cardValue, color }}>
        {value.toLocaleString()}
        <span style={styles.unit}> {unit}</span>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div style={styles.card}>
      <div style={styles.cardLabel}>{label}</div>
      <div style={styles.cardValue}>
        {value}
        <span style={styles.unit}> {unit}</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sectionTitle: { fontSize: 18, fontWeight: 600, margin: "0 0 16px", color: "#1a1a1a" },
  subTitle: { fontSize: 15, fontWeight: 600, margin: "24px 0 12px", color: "#374151" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 },
  card: {
    background: "#fff",
    borderRadius: 10,
    padding: "18px 20px",
    boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
  },
  cardLabel: { fontSize: 12, color: "#6b7280", marginBottom: 8 },
  cardValue: { fontSize: 24, fontWeight: 700, color: "#1a1a1a" },
  unit: { fontSize: 13, fontWeight: 400, color: "#6b7280" },
  warning: {
    marginTop: 16,
    background: "#fef3c7",
    border: "1px solid #fbbf24",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: 13,
    color: "#92400e",
  },
};
