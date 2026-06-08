import { useState } from "react";
import { analyzeFile } from "./api/client";
import { FileUpload } from "./components/FileUpload";
import { SummaryCards } from "./components/SummaryCards";
import { CoefficientTable } from "./components/CoefficientTable";
import { ErrorTable } from "./components/ErrorTable";
import type { AnalysisResponse } from "./types/analysis";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  async function handleSubmit(file: File, kgPerPercent: number) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzeFile(file, kgPerPercent);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知錯誤");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>桶槽進料係數估算工具</h1>
        <p style={styles.headerSub}>上傳量測資料，自動估算 B/C/D/R 各進料口補料係數</p>
      </header>

      <main style={styles.main}>
        <FileUpload onSubmit={handleSubmit} loading={loading} />

        {error && <div style={styles.errorBanner}>{error}</div>}

        {result && (
          <div style={styles.resultStack}>
            <SummaryCards data={result} />
            <CoefficientTable
              ols={result.models.least_squares.coefficients}
              lad={result.models.least_absolute_deviation.coefficients}
            />
            <ErrorTable
              olsRows={result.models.least_squares.rows}
              ladRows={result.models.least_absolute_deviation.rows}
            />
          </div>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "#f1f5f9",
    fontFamily: "'Inter', 'Noto Sans TC', sans-serif",
  },
  header: {
    background: "#1e3a5f",
    color: "#fff",
    padding: "28px 40px",
  },
  headerTitle: { margin: 0, fontSize: 22, fontWeight: 700 },
  headerSub: { margin: "6px 0 0", fontSize: 13, opacity: 0.75 },
  main: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "32px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 28,
  },
  errorBanner: {
    background: "#fef2f2",
    border: "1px solid #fca5a5",
    borderRadius: 8,
    padding: "14px 18px",
    color: "#991b1b",
    fontSize: 14,
  },
  resultStack: {
    display: "flex",
    flexDirection: "column",
    gap: 28,
  },
};
