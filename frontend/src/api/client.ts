import type { AnalysisResponse } from "../types/analysis";

// In Docker: nginx proxies /api and /health → backend container.
// In local dev: point to localhost:8000 (or override via .env.local).
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export async function analyzeFile(
  file: File,
  kgPerPercent: number
): Promise<AnalysisResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("kg_per_percent", String(kgPerPercent));

  const res = await fetch(`${BASE_URL}/api/analyze`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "分析失敗，請確認檔案格式與欄位是否正確。");
  }

  return res.json() as Promise<AnalysisResponse>;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
