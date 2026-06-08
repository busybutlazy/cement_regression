import type { ColumnStats } from "../types/analysis";

const COL_LABELS: Record<string, string> = {
  B_open_pct: "B 開幅 (%)",
  C_open_pct: "C 開幅 (%)",
  D_open_pct: "D 開幅 (%)",
  R_open_pct: "R 開幅 (%)",
  tank_change_pct: "槽增加量 (%)",
  usage_kg: "實際用量 (kg)",
  target_supply_kg: "目標補充量 (kg)",
};

const STAT_HEADERS: { key: keyof ColumnStats; label: string }[] = [
  { key: "count", label: "筆數" },
  { key: "missing_count", label: "缺失" },
  { key: "mean", label: "平均" },
  { key: "std", label: "標準差" },
  { key: "min", label: "最小" },
  { key: "q25", label: "Q25" },
  { key: "median", label: "中位數" },
  { key: "q75", label: "Q75" },
  { key: "max", label: "最大" },
];

interface Props {
  statistics: Record<string, ColumnStats>;
}

export function StatisticsTable({ statistics }: Props) {
  const cols = Object.keys(COL_LABELS).filter((k) => k in statistics);

  return (
    <section>
      <h2 style={styles.sectionTitle}>欄位統計分析</h2>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, textAlign: "left" }}>欄位</th>
              {STAT_HEADERS.map((h) => (
                <th key={h.key} style={styles.th}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cols.map((col) => {
              const s = statistics[col];
              return (
                <tr key={col} style={styles.row}>
                  <td style={styles.tdLabel}>{COL_LABELS[col] ?? col}</td>
                  {STAT_HEADERS.map((h) => (
                    <td key={h.key} style={styles.td}>
                      {fmt(s[h.key], h.key)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function fmt(v: number, key: string): string {
  if (key === "count" || key === "missing_count") return String(v);
  return v.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

const styles: Record<string, React.CSSProperties> = {
  sectionTitle: { fontSize: 18, fontWeight: 600, margin: "0 0 14px", color: "#1a1a1a" },
  tableWrap: { overflowX: "auto" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
    fontSize: 13,
  },
  th: {
    background: "#f1f5f9",
    padding: "10px 12px",
    textAlign: "right",
    fontSize: 12,
    fontWeight: 600,
    color: "#374151",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap" as const,
  },
  row: {},
  tdLabel: {
    padding: "9px 12px",
    borderBottom: "1px solid #f3f4f6",
    fontWeight: 600,
    color: "#1d4ed8",
    whiteSpace: "nowrap" as const,
  },
  td: {
    padding: "9px 12px",
    borderBottom: "1px solid #f3f4f6",
    textAlign: "right",
    color: "#1a1a1a",
  },
};
