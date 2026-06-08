import { useState } from "react";
import ReactECharts from "echarts-for-react";
import type { AnalysisResponse, HistogramData } from "../types/analysis";

const COL_LABELS: Record<string, string> = {
  B_open_pct: "B 開幅 (%)",
  C_open_pct: "C 開幅 (%)",
  D_open_pct: "D 開幅 (%)",
  R_open_pct: "R 開幅 (%)",
  tank_change_pct: "槽增加量 (%)",
  usage_kg: "實際用量 (kg)",
  target_supply_kg: "目標補充量 (kg)",
};

const HIST_COLS = [
  "target_supply_kg",
  "B_open_pct",
  "C_open_pct",
  "D_open_pct",
  "R_open_pct",
  "tank_change_pct",
  "usage_kg",
];

interface Props {
  data: AnalysisResponse;
}

export function Charts({ data }: Props) {
  const [scatterModel, setScatterModel] = useState<"ols" | "lad">("ols");
  const [errorModel, setErrorModel] = useState<"ols" | "lad">("ols");

  const charts = data.charts;
  const olsRows = data.models.least_squares.rows;
  const ladRows = data.models.least_absolute_deviation.rows;

  return (
    <section>
      <h2 style={styles.sectionTitle}>圖表分析</h2>

      {/* ── Histograms ── */}
      <h3 style={styles.subTitle}>欄位分布直方圖</h3>
      <div style={styles.histGrid}>
        {HIST_COLS.filter((c) => c in charts.histograms).map((col) => (
          <div key={col} style={styles.chartBox}>
            <ReactECharts
              option={histogramOption(charts.histograms[col], COL_LABELS[col] ?? col)}
              style={{ height: 220 }}
              opts={{ renderer: "svg" }}
            />
          </div>
        ))}
      </div>

      {/* ── Residual histograms ── */}
      <h3 style={styles.subTitle}>殘差分布</h3>
      <div style={styles.twoCol}>
        <div style={styles.chartBox}>
          <ReactECharts
            option={histogramOption(charts.residuals["least_squares"], "OLS 殘差 (kg)", "#3b82f6")}
            style={{ height: 260 }}
            opts={{ renderer: "svg" }}
          />
        </div>
        <div style={styles.chartBox}>
          <ReactECharts
            option={histogramOption(charts.residuals["least_absolute_deviation"], "LAD 殘差 (kg)", "#f59e0b")}
            style={{ height: 260 }}
            opts={{ renderer: "svg" }}
          />
        </div>
      </div>

      {/* ── Actual vs Predicted ── */}
      <div style={styles.headerRow}>
        <h3 style={{ ...styles.subTitle, margin: 0 }}>實際值 vs 預測值</h3>
        <ModelToggle value={scatterModel} onChange={setScatterModel} />
      </div>
      <div style={styles.chartBox}>
        <ReactECharts
          option={scatterOption(
            data.charts.actual_vs_predicted[
              scatterModel === "ols" ? "least_squares" : "least_absolute_deviation"
            ],
            scatterModel.toUpperCase()
          )}
          style={{ height: 320 }}
          opts={{ renderer: "svg" }}
        />
      </div>

      {/* ── Absolute Error Bar ── */}
      <div style={{ ...styles.headerRow, marginTop: 24 }}>
        <h3 style={{ ...styles.subTitle, margin: 0 }}>每筆絕對誤差</h3>
        <ModelToggle value={errorModel} onChange={setErrorModel} />
      </div>
      <div style={styles.chartBox}>
        <ReactECharts
          option={errorBarOption(
            errorModel === "ols" ? olsRows : ladRows,
            errorModel.toUpperCase()
          )}
          style={{ height: 280 }}
          opts={{ renderer: "svg" }}
        />
      </div>
    </section>
  );
}

// ── Model toggle ──────────────────────────────────────────────

function ModelToggle({
  value,
  onChange,
}: {
  value: "ols" | "lad";
  onChange: (v: "ols" | "lad") => void;
}) {
  return (
    <div style={styles.toggle}>
      {(["ols", "lad"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          style={{ ...styles.toggleBtn, ...(value === m ? styles.toggleActive : {}) }}
        >
          {m.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ── ECharts option builders ───────────────────────────────────

function histogramOption(hist: HistogramData, title: string, color = "#6366f1") {
  const edges = hist.bin_edges;
  const labels = edges.slice(0, -1).map(
    (v, i) => `${v.toFixed(1)}–${edges[i + 1].toFixed(1)}`
  );
  return {
    title: { text: title, textStyle: { fontSize: 13, fontWeight: 600 }, top: 4, left: 8 },
    grid: { top: 44, bottom: 40, left: 50, right: 16 },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { fontSize: 10, rotate: 30, interval: 0 },
    },
    yAxis: { type: "value", name: "筆數", nameTextStyle: { fontSize: 11 } },
    series: [
      {
        type: "bar",
        data: hist.counts,
        itemStyle: { color },
        barMaxWidth: 40,
      },
    ],
  };
}

function scatterOption(
  avp: { actual: number[]; predicted: number[] },
  modelName: string
) {
  const points = avp.actual.map((a, i) => [a, avp.predicted[i]]);
  const allVals = [...avp.actual, ...avp.predicted];
  const lo = Math.min(...allVals);
  const hi = Math.max(...allVals);

  return {
    title: {
      text: `${modelName}：實際值 vs 預測值`,
      textStyle: { fontSize: 13, fontWeight: 600 },
      top: 4,
      left: 8,
    },
    grid: { top: 44, bottom: 50, left: 70, right: 24 },
    tooltip: {
      trigger: "item",
      formatter: ([, val]: [unknown, number[]]) =>
        `實際：${val[0].toLocaleString()} kg<br/>預測：${val[1].toLocaleString()} kg`,
    },
    xAxis: {
      type: "value",
      name: "實際值 (kg)",
      nameLocation: "middle",
      nameGap: 30,
      nameTextStyle: { fontSize: 11 },
    },
    yAxis: {
      type: "value",
      name: "預測值 (kg)",
      nameLocation: "middle",
      nameGap: 50,
      nameTextStyle: { fontSize: 11 },
    },
    series: [
      {
        type: "scatter",
        data: points,
        symbolSize: 8,
        itemStyle: { color: "#3b82f6", opacity: 0.8 },
      },
      {
        // perfect prediction line
        type: "line",
        data: [[lo, lo], [hi, hi]],
        lineStyle: { color: "#ef4444", type: "dashed", width: 1.5 },
        symbol: "none",
        silent: true,
      },
    ],
  };
}

function errorBarOption(
  rows: AnalysisResponse["models"]["least_squares"]["rows"],
  modelName: string
) {
  const ids = rows.map((r) => String(r.record_id ?? ""));
  const errors = rows.map((r) => r.absolute_error);
  const maxErr = Math.max(...errors);

  return {
    title: {
      text: `${modelName}：每筆絕對誤差 (kg)`,
      textStyle: { fontSize: 13, fontWeight: 600 },
      top: 4,
      left: 8,
    },
    grid: { top: 44, bottom: 40, left: 70, right: 16 },
    tooltip: {
      trigger: "axis",
      formatter: (params: { name: string; value: number }[]) =>
        `項次 ${params[0].name}：${params[0].value.toLocaleString()} kg`,
    },
    xAxis: {
      type: "category",
      data: ids,
      name: "項次",
      nameLocation: "middle",
      nameGap: 26,
      nameTextStyle: { fontSize: 11 },
      axisLabel: { fontSize: 11 },
    },
    yAxis: {
      type: "value",
      name: "絕對誤差 (kg)",
      nameLocation: "middle",
      nameGap: 55,
      nameTextStyle: { fontSize: 11 },
    },
    series: [
      {
        type: "bar",
        data: errors.map((v) => ({
          value: v,
          itemStyle: {
            color: v > maxErr * 0.7 ? "#ef4444" : v > maxErr * 0.4 ? "#f59e0b" : "#22c55e",
          },
        })),
        barMaxWidth: 30,
      },
    ],
  };
}

const styles: Record<string, React.CSSProperties> = {
  sectionTitle: { fontSize: 18, fontWeight: 600, margin: "0 0 16px", color: "#1a1a1a" },
  subTitle: { fontSize: 15, fontWeight: 600, margin: "24px 0 12px", color: "#374151" },
  histGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16,
  },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  chartBox: {
    background: "#fff",
    borderRadius: 10,
    padding: "8px 8px 4px",
    boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    margin: "24px 0 12px",
  },
  toggle: { display: "flex", gap: 4 },
  toggleBtn: {
    padding: "5px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    background: "#fff",
    fontSize: 12,
    cursor: "pointer",
    color: "#374151",
  },
  toggleActive: { background: "#2563eb", color: "#fff", borderColor: "#2563eb" },
};
