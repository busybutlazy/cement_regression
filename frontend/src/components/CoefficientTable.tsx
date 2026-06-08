import type { ModelCoefficients } from "../types/analysis";

interface Props {
  ols: ModelCoefficients;
  lad: ModelCoefficients;
}

const PORTS = ["B", "C", "D", "R"] as const;

// If relative difference exceeds this threshold, flag the port
const WARN_THRESHOLD = 0.2;

function relDiff(a: number, b: number): number {
  const avg = (Math.abs(a) + Math.abs(b)) / 2;
  return avg < 1 ? 0 : Math.abs(a - b) / avg;
}

export function CoefficientTable({ ols, lad }: Props) {
  const hasWarning = PORTS.some((p) => relDiff(ols[p], lad[p]) > WARN_THRESHOLD);

  return (
    <section>
      <h2 style={styles.sectionTitle}>係數估算結果</h2>
      <p style={styles.hint}>係數單位：kg / (開幅 100% × 小時)</p>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>進料口</th>
              <th style={styles.th}>平方誤差法（OLS）</th>
              <th style={styles.th}>絕對誤差法（LAD）</th>
              <th style={styles.th}>差異</th>
            </tr>
          </thead>
          <tbody>
            {PORTS.map((port) => {
              const o = ols[port];
              const l = lad[port];
              const diff = relDiff(o, l);
              const warn = diff > WARN_THRESHOLD;
              const bothZero = o === 0 && l === 0;
              return (
                <>
                  <tr key={port} style={bothZero ? styles.zeroRow : warn ? styles.warnRow : {}}>
                    <td style={styles.tdPort}>{port}</td>
                    <td style={styles.td}>{o.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td>
                    <td style={styles.td}>{l.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td>
                    <td style={{ ...styles.td, color: bothZero ? "#9ca3af" : warn ? "#dc2626" : "#6b7280" }}>
                      {bothZero ? "—" : warn ? `⚠ ${(diff * 100).toFixed(0)}%` : `${(diff * 100).toFixed(0)}%`}
                    </td>
                  </tr>
                  {bothZero && (
                    <tr key={`${port}-hint`}>
                      <td colSpan={4} style={styles.zeroHint}>
                        ⚠ {port} 進料口係數為 0：該進料口在資料中從未單獨使用，模型無法分離其獨立貢獻，係數無法可靠估算。
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasWarning && (
        <div style={styles.warning}>
          兩種方法的係數差異較大，可能代表資料存在異常值或進料流速狀態不穩定，
          建議檢視誤差最大的資料列。
        </div>
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sectionTitle: { fontSize: 18, fontWeight: 600, margin: "0 0 4px", color: "#1a1a1a" },
  hint: { fontSize: 12, color: "#6b7280", margin: "0 0 16px" },
  tableWrap: { overflowX: "auto" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
  },
  th: {
    background: "#f1f5f9",
    padding: "12px 16px",
    textAlign: "center" as const,
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    borderBottom: "1px solid #e5e7eb",
  },
  td: {
    padding: "12px 16px",
    fontSize: 14,
    borderBottom: "1px solid #f3f4f6",
    textAlign: "center" as const,
  },
  tdPort: {
    padding: "12px 16px",
    fontSize: 14,
    fontWeight: 700,
    borderBottom: "1px solid #f3f4f6",
    textAlign: "center" as const,
    color: "#1d4ed8",
  },
  warnRow: { background: "#fef9f0" },
  zeroRow: { background: "#f8f9fa", opacity: 0.7 },
  zeroHint: {
    padding: "6px 16px 10px",
    fontSize: 12,
    color: "#6b7280",
    background: "#f8f9fa",
    borderBottom: "1px solid #f3f4f6",
    fontStyle: "italic" as const,
  },
  warning: {
    marginTop: 12,
    background: "#fff7ed",
    border: "1px solid #fb923c",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    color: "#9a3412",
  },
};
