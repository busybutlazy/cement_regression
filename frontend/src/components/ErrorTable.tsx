import { useState } from "react";
import type { RowResult } from "../types/analysis";

interface Props {
  olsRows: RowResult[];
  ladRows: RowResult[];
}

type SortKey = "record_id" | "target_supply_kg" | "ols_predicted" | "ols_error" | "lad_predicted" | "lad_error";
type SortDir = "asc" | "desc";

export function ErrorTable({ olsRows, ladRows }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("ols_error");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [activeModel, setActiveModel] = useState<"ols" | "lad">("ols");

  const rows = olsRows.map((o, i) => ({
    record_id: o.record_id ?? i + 1,
    target_supply_kg: o.target_supply_kg,
    ols_predicted: o.predicted_supply_kg,
    ols_residual: o.residual,
    ols_error: o.absolute_error,
    lad_predicted: ladRows[i].predicted_supply_kg,
    lad_residual: ladRows[i].residual,
    lad_error: ladRows[i].absolute_error,
  }));

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortKey] as number;
    const bv = b[sortKey] as number;
    return sortDir === "asc" ? av - bv : bv - av;
  });

  function arrow(key: SortKey) {
    if (sortKey !== key) return " ↕";
    return sortDir === "asc" ? " ↑" : " ↓";
  }

  const isOls = activeModel === "ols";

  return (
    <section>
      <div style={styles.headerRow}>
        <h2 style={styles.sectionTitle}>每筆資料誤差</h2>
        <div style={styles.toggle}>
          <button
            onClick={() => setActiveModel("ols")}
            style={{ ...styles.toggleBtn, ...(isOls ? styles.toggleActive : {}) }}
          >
            OLS
          </button>
          <button
            onClick={() => setActiveModel("lad")}
            style={{ ...styles.toggleBtn, ...(!isOls ? styles.toggleActive : {}) }}
          >
            LAD
          </button>
        </div>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <Th label="項次" sortKey="record_id" current={sortKey} onSort={toggleSort} arrow={arrow} />
              <Th label="目標補充量 (kg)" sortKey="target_supply_kg" current={sortKey} onSort={toggleSort} arrow={arrow} />
              <Th
                label={`${isOls ? "OLS" : "LAD"} 預測值 (kg)`}
                sortKey={isOls ? "ols_predicted" : "lad_predicted"}
                current={sortKey}
                onSort={toggleSort}
                arrow={arrow}
              />
              <Th
                label="殘差 (kg)"
                sortKey={isOls ? "ols_predicted" : "lad_predicted"}
                current={sortKey}
                onSort={toggleSort}
                arrow={arrow}
              />
              <Th
                label="絕對誤差 (kg)"
                sortKey={isOls ? "ols_error" : "lad_error"}
                current={sortKey}
                onSort={toggleSort}
                arrow={arrow}
              />
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const predicted = isOls ? row.ols_predicted : row.lad_predicted;
              const residual = isOls ? row.ols_residual : row.lad_residual;
              const error = isOls ? row.ols_error : row.lad_error;
              const errorPct =
                row.target_supply_kg !== 0
                  ? Math.abs((error / row.target_supply_kg) * 100)
                  : null;
              return (
                <tr key={row.record_id} style={error > 5000 ? styles.highError : {}}>
                  <td style={styles.tdCenter}>{row.record_id}</td>
                  <td style={styles.td}>{row.target_supply_kg.toLocaleString()}</td>
                  <td style={styles.td}>{predicted.toLocaleString()}</td>
                  <td style={{ ...styles.td, color: residual >= 0 ? "#16a34a" : "#dc2626" }}>
                    {residual >= 0 ? "+" : ""}{residual.toLocaleString()}
                  </td>
                  <td style={styles.td}>
                    {error.toLocaleString()}
                    {errorPct !== null && (
                      <span style={styles.pct}> ({errorPct.toFixed(1)}%)</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Th({
  label,
  sortKey,
  onSort,
  arrow,
}: {
  label: string;
  sortKey: SortKey;
  current?: SortKey;
  onSort: (k: SortKey) => void;
  arrow: (k: SortKey) => string;
}) {
  return (
    <th
      style={{ ...styles.th, cursor: "pointer" }}
      onClick={() => onSort(sortKey)}
    >
      {label}
      <span style={{ color: "#9ca3af", fontSize: 11 }}>{arrow(sortKey)}</span>
    </th>
  );
}

const styles: Record<string, React.CSSProperties> = {
  headerRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 600, margin: 0, color: "#1a1a1a" },
  toggle: { display: "flex", gap: 4 },
  toggleBtn: {
    padding: "6px 16px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    background: "#fff",
    fontSize: 13,
    cursor: "pointer",
    color: "#374151",
  },
  toggleActive: { background: "#2563eb", color: "#fff", borderColor: "#2563eb" },
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
    padding: "11px 14px",
    textAlign: "right",
    fontSize: 12,
    fontWeight: 600,
    color: "#374151",
    borderBottom: "1px solid #e5e7eb",
    userSelect: "none",
  },
  td: {
    padding: "10px 14px",
    borderBottom: "1px solid #f3f4f6",
    textAlign: "right",
    color: "#1a1a1a",
  },
  tdCenter: {
    padding: "10px 14px",
    borderBottom: "1px solid #f3f4f6",
    textAlign: "center",
    color: "#6b7280",
  },
  pct: { fontSize: 11, color: "#9ca3af" },
  highError: { background: "#fef2f2" },
};
