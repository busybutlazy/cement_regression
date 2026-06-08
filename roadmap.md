# Roadmap — 桶槽進料係數估算工具

> 專案規格詳見 `target.md`。本文件管理實作路徑、決策紀錄、完成判準。

---

## Playbook Deviation Log

本專案對照 `personal-engineering-playbook/project-bootstrap.md` 判斷適用段落。以下段落**明確跳過**：

| Playbook 段落 | 跳過理由 |
|---|---|
| Week 1 Day 3–4 Schema audit | 第一版無資料庫，無 schema 需要盤點 |
| Week 1 Day 5–7 Contract freeze | 單 repo，無跨 repo API 契約需凍結 |
| Mirror sync 紀律 | 無鏡像 repo |
| Invariant ID 索引 | 單服務規模，用 ADR table 就夠 |
| Feature flag 紀律 | 第一版無 feature flag |

保留使用：

- Phase skeleton 模板（簡化版）
- 依賴圖 + 平行軸
- ADR 已決議事項表
- Per-phase 完成判準

---

## 需求對應表

| 需求 | 對應 Phase |
|---|---|
| 上傳 csv / xlsx | P1 |
| 資料清理與欄位檢查 | P1 |
| 平方誤差法（OLS）係數估算 | P1 |
| 絕對誤差法（LAD）係數估算 | P1 |
| 基本統計分析（count/mean/std/...） | P1 |
| 回傳完整 JSON 結果 | P1 |
| 檔案上傳前端頁面 | P2 |
| 結果總覽區（筆數 / 兩法誤差比較） | P2 |
| 係數結果區（B/C/D/R 對比） | P2 |
| 每筆資料誤差表格（可排序） | P2 |
| 直方圖 / residual 圖 / actual-vs-predicted 圖 | P3 |
| 欄位統計表 | P3 |
| Docker 前後端整合 | P4 |
| 基本測試（Backend + Frontend） | P4 |

---

## 設計原則

1. **純無狀態**：後端不儲存任何上傳檔案或分析結果，每次請求獨立。
2. **前端不重算**：所有模型運算、統計計算皆在後端完成，前端只渲染。
3. **錯誤優先回傳**：欄位缺失 / 格式錯誤要給清楚的錯誤訊息，不吃掉異常。
4. **係數非負**：B/C/D/R 係數在兩種方法下皆強制 ≥ 0。

---

## 依賴圖

```
BE 軸:  P1（核心運算 + API）──────────────────────────────> P4（Docker + 測試）
FE 軸:               P2（上傳 + 表格）── P3（圖表 + 統計）──> P4（Docker + 測試）
                      ↑
                   需 P1 完成後才能接真實 API
```

**匯流點**：P4 需要 P1 + P2 + P3 全部完成。

P2 開發初期可用 mock JSON 作業，不強制等 P1 完成。

---

## Phase 定義

---

### Phase 1：Backend 核心運算

**目標**：可以用 curl / Postman 上傳 csv 或 xlsx，拿到完整 JSON 分析結果。

**對應需求**：上傳解析、資料清理、OLS、LAD、統計分析、JSON 回傳

**前置**：無

**範圍**

```
backend/
├── Dockerfile
├── pyproject.toml
└── app/
    ├── main.py              # FastAPI 入口，/health, /api/analyze
    ├── api/analyze.py       # endpoint
    ├── services/
    │   ├── file_parser.py   # csv/xlsx 讀取、欄位檢查
    │   ├── data_cleaner.py  # 數值轉換、排除列、品質摘要
    │   ├── feature_builder.py  # target_supply_kg 計算
    │   ├── solvers.py       # least_squares + least_absolute_deviation
    │   └── statistics.py   # count/mean/std/q25/median/q75/max + histogram bins
    ├── schemas/analysis.py  # Pydantic 回傳模型
    └── utils/errors.py      # 統一錯誤格式
```

**完成判準**

- `GET /health` 回傳 `{"status": "ok"}`
- `POST /api/analyze` 接受 csv，回傳包含 `models.least_squares` 與 `models.least_absolute_deviation` 的完整 JSON
- `POST /api/analyze` 接受 xlsx，同上
- 缺少必要欄位時回傳 4xx + 明確欄位列表
- 非 csv/xlsx 時回傳 4xx
- OLS 與 LAD 的 B/C/D/R 係數皆 ≥ 0

**風險**

- LAD 使用 `scipy.optimize.linprog`，若數據矩陣病態（某進料口全為 0）可能無解
  - Mitigation：在 solver 外層加防呆，回傳 warning 而非 500

**規模**：M（樂觀 2 天 / 現實 3–4 天）

---

### Phase 2：Frontend 基本頁面

**目標**：使用者可透過網頁完成一次完整分析（上傳 → 看結果）。

**對應需求**：檔案上傳、結果總覽、係數表、誤差表

**前置**：P1（最終整合用；開發初期可用 mock）

**範圍**

```
frontend/
├── Dockerfile
├── package.json
├── vite.config.ts
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── api/client.ts          # POST /api/analyze
    ├── types/analysis.ts      # 對應 backend JSON 結構的 TypeScript types
    └── components/
        ├── FileUpload.tsx     # 拖拉 + 選擇，副檔名限制
        ├── SummaryCards.tsx   # 筆數摘要 + 兩法誤差比較
        ├── CoefficientTable.tsx  # B/C/D/R 兩法對比，差異警示
        └── ErrorTable.tsx     # 每筆 residual/absolute_error，可排序
```

**完成判準**

- 頁面可載入，呼叫 `/health` 有回應
- 可拖拉或選擇 csv / xlsx 上傳
- 上傳中顯示 loading，失敗顯示錯誤訊息
- 成功後顯示總覽卡片、係數表、誤差表
- 若兩法係數差異 > 閾值（TBD），顯示警示文字

**風險**

- CORS：backend 需要允許 frontend origin
  - Mitigation：FastAPI middleware 在 P1 就設定好

**規模**：M（樂觀 2 天 / 現實 3–4 天）

---

### Phase 3：圖表與統計分析

**目標**：使用者可透過圖表了解資料分布與異常狀況。

**對應需求**：直方圖、residual 圖、actual vs predicted、欄位統計表

**前置**：P1（histogram bins 來自 backend）、P2

**範圍**

```
frontend/src/components/
├── StatisticsTable.tsx   # 每欄位 count/mean/std/min/q25/median/q75/max
└── Charts.tsx            # ECharts 繪製以下圖表：
                          #   - target_supply_kg 直方圖
                          #   - B/C/D/R 開幅直方圖（各 1）
                          #   - residual 直方圖（兩法各 1）
                          #   - actual vs predicted 散佈圖（兩法各 1）
                          #   - absolute_error 長條圖（兩法各 1）
```

**完成判準**

- 所有圖表資料來自 backend JSON（前端不重算）
- 直方圖、散佈圖、長條圖可正常渲染
- StatisticsTable 顯示所有必要欄位統計

**風險**

- ECharts bundle size 大
  - Mitigation：按需引入，不 import 全包

**規模**：S–M（樂觀 1.5 天 / 現實 2–3 天）

---

### Phase 4：Docker 整合與測試

**目標**：`docker compose up --build` 啟動後即可完整使用，含基本測試。

**對應需求**：Docker 部署、前後端整合、測試

**前置**：P1 + P2 + P3

**範圍**

```
tank-flow-estimator/
├── docker-compose.yml
├── backend/Dockerfile
├── frontend/Dockerfile
├── backend/tests/
│   ├── test_file_parser.py
│   ├── test_solvers.py
│   └── test_statistics.py
└── sample_data/
    ├── sample_valid.csv
    └── sample_valid.xlsx
```

**完成判準**

- `docker compose up --build` 後，瀏覽器可開啟前端頁面
- 前端可成功呼叫後端 `/api/analyze`
- Backend 測試全過：csv/xlsx 上傳、欄位缺失、空值、非數字、OLS、LAD、係數非負、統計輸出
- sample_data 檔案可用來手動 smoke test

**風險**

- Frontend Docker 使用 nginx，需要正確設定 proxy 到 backend
  - Mitigation：docker-compose 內設定 `VITE_API_BASE_URL` 環境變數

**規模**：S（樂觀 1 天 / 現實 1.5–2 天）

---

## Timeline 估計

| 樂觀 | 現實 |
|---|---|
| 7–8 天 | 10–14 天 |

---

## 已決議事項（ADR Ledger）

| ID | 議題 | 決議 + 理由 + 放棄的方案 |
|---|---|---|
| ADR-001 | 圖表套件選擇 | 選 **ECharts**（echarts-for-react）。理由：互動性強、散佈圖和直方圖支援好。放棄 Chart.js（API 較囉嗦）、Recharts（散佈圖較弱）。 |
| ADR-002 | LAD solver 實作 | 選 **`scipy.optimize.linprog`**。理由：標準線性規劃 formulation，係數非負約束直接表達。放棄 CVXPY（額外依賴過重）、手寫 IRLS（實作複雜易出錯）。 |
| ADR-003 | Frontend Docker 靜態伺服器 | 選 **nginx**。理由：生產環境標準做法，可同時 proxy `/api` 到 backend。放棄 `vite preview`（非 production grade）。 |
| ADR-004 | 無資料庫 / 無狀態 | 第一版**不建資料庫**，每次請求獨立運算。理由：降低複雜度，符合 target.md 明確 non-goal。放棄 SQLite 暫存（需處理清理邏輯）。 |
| ADR-005 | 後端 Python 套件管理 | 選 **`pyproject.toml` + pip**（無 Poetry / uv）。理由：Dockerfile 內簡單 `pip install`，降低 CI 依賴。放棄 Poetry（Docker 層較難快取）。 |

---

## 目前狀態

| Phase | 狀態 | 備註 |
|---|---|---|
| P1 Backend 核心運算 | 🔲 未開始 | |
| P2 Frontend 基本頁面 | 🔲 未開始 | |
| P3 圖表與統計分析 | 🔲 未開始 | |
| P4 Docker 整合與測試 | 🔲 未開始 | |
