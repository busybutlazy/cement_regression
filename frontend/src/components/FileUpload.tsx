import { useRef, useState } from "react";
import type { DragEvent, ChangeEvent } from "react";

interface Props {
  onSubmit: (file: File, kgPerPercent: number) => void;
  loading: boolean;
}

export function FileUpload({ onSubmit, loading }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [kgPerPercent, setKgPerPercent] = useState(1120);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = [".csv", ".xlsx"];

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && isValidExt(dropped.name)) setFile(dropped);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (picked) setFile(picked);
  }

  function isValidExt(name: string) {
    return accept.some((ext) => name.toLowerCase().endsWith(ext));
  }

  function handleSubmit() {
    if (!file) return;
    onSubmit(file, kgPerPercent);
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>上傳資料檔案</h2>

      <div
        style={{ ...styles.dropzone, ...(dragging ? styles.dropzoneDragging : {}) }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx"
          style={{ display: "none" }}
          onChange={handleChange}
        />
        {file ? (
          <span style={styles.fileName}>📄 {file.name}</span>
        ) : (
          <span style={styles.placeholder}>拖拉或點擊上傳 .csv / .xlsx</span>
        )}
      </div>

      <div style={styles.paramRow}>
        <label style={styles.label}>
          每 1% 對應公斤數（kg_per_percent）
        </label>
        <input
          type="number"
          min={1}
          value={kgPerPercent}
          onChange={(e) => setKgPerPercent(Number(e.target.value))}
          style={styles.numInput}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!file || loading}
        style={{ ...styles.btn, ...(!file || loading ? styles.btnDisabled : {}) }}
      >
        {loading ? "分析中…" : "開始分析"}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: "32px 40px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    maxWidth: 560,
    margin: "0 auto",
  },
  title: {
    margin: "0 0 20px",
    fontSize: 18,
    fontWeight: 600,
    color: "#1a1a1a",
  },
  dropzone: {
    border: "2px dashed #c0c8d4",
    borderRadius: 8,
    padding: "32px 16px",
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color .15s, background .15s",
    background: "#f8fafc",
    marginBottom: 20,
  },
  dropzoneDragging: {
    borderColor: "#3b82f6",
    background: "#eff6ff",
  },
  placeholder: { color: "#6b7280", fontSize: 14 },
  fileName: { color: "#1d4ed8", fontWeight: 500 },
  paramRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  label: { fontSize: 13, color: "#374151", flex: 1 },
  numInput: {
    width: 100,
    padding: "6px 10px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 14,
    textAlign: "right",
  },
  btn: {
    width: "100%",
    padding: "12px 0",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnDisabled: {
    background: "#9ca3af",
    cursor: "not-allowed",
  },
};
