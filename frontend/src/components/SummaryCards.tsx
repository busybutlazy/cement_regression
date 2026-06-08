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
        <StatCard
          label="自由度（有效筆數 − 4）"
          value={summary.degrees_of_freedom}
          unit=""
          color={summary.degrees_of_freedom < 10 ? "#d97706" : "#16a34a"}
          hint={summary.degrees_of_freedom < 10 ? "自由度偏低，係數估算可靠性有限" : undefined}
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
        <MetricCard
          label="OLS R²"
          value={ols.metrics.r_squared.toFixed(3)}
          unit=""
          rSquared={ols.metrics.r_squared}
        />
        <MetricCard
          label="LAD R²"
          value={lad.metrics.r_squared.toFixed(3)}
          unit=""
          rSquared={lad.metrics.r_squared}
        />
      </div>
      {(ols.metrics.r_squared < 0.5 || lad.metrics.r_squared < 0.5) && (
        <div style={styles.warning}>
          <strong>模型解釋力偏低（R² &lt; 0.5）：</strong>
          目前係數無法充分解釋桶槽補充量的變化，可能原因：
          <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
            <li>資料筆數不足（建議至少 30–50 筆）</li>
            <li>部分進料口從未單獨使用，無法分離其貢獻</li>
            <li>桶槽液位受其他因素影響（如人工補料、洩漏）</li>
          </ul>
        </div>
      )}

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
  hint,
}: {
  label: string;
  value: number;
  unit: string;
  color?: string;
  hint?: string;
}) {
  return (
    <div style={styles.card}>
      <div style={styles.cardLabel}>{label}</div>
      <div style={{ ...styles.cardValue, color }}>
        {value.toLocaleString()}
        <span style={styles.unit}> {unit}</span>
      </div>
      {hint && <div style={styles.cardHint}>{hint}</div>}
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  rSquared,
}: {
  label: string;
  value: string;
  unit: string;
  rSquared?: number;
}) {
  const r2Color =
    rSquared === undefined
      ? "#1a1a1a"
      : rSquared >= 0.7
      ? "#16a34a"
      : rSquared >= 0.5
      ? "#d97706"
      : "#dc2626";

  return (
    <div style={styles.card}>
      <div style={styles.cardLabel}>{label}</div>
      <div style={{ ...styles.cardValue, color: rSquared !== undefined ? r2Color : "#1a1a1a" }}>
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
  cardHint: { fontSize: 11, color: "#d97706", marginTop: 6 },
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
