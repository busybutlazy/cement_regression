# 桶槽進料係數估算工具：任務列表

## 一、專案目標

建立一個 Docker-based 的前後端分離網頁工具，用於上傳 `xlsx` 或 `csv` 檔案，根據桶槽變化量、使用量、各進料口開幅，估算各進料口的有效補料係數，並輸出每筆資料的誤差與基本資料分析結果。

本專案第一版不儲存使用者上傳檔案、不建立歷史紀錄、不建立資料庫，所有運算皆以單次上傳、單次回傳為主。

---

## 二、技術架構

### Backend

* Python
* FastAPI
* pandas
* numpy
* scipy / scikit-learn
* openpyxl
* pydantic

### Frontend

* React
* Vite
* TypeScript
* 可使用 Chart.js / Recharts / ECharts 擇一繪圖

### Deployment

* Docker
* docker-compose
* 前後端分離
* Backend container
* Frontend container

---

## 三、第一版輸入資料格式

### 必要欄位

第一版建議定義以下欄位：

| 欄位名稱           | 說明               |
| -------------- | ---------------- |
| record_id      | 資料列編號，可選         |
| tank_change_kg | 桶槽變化量，單位 kg，可正可負 |
| usage_kg       | 實際使用量，單位 kg      |
| B_open         | B 進料口開幅，例如 0.8   |
| C_open         | C 進料口開幅，例如 0.5   |
| D_open         | D 進料口開幅，例如 0.3   |
| R_open         | R 進料口開幅，例如 0.1   |

### 可選欄位

| 欄位名稱                | 說明                      |
| ------------------- | ----------------------- |
| tank_change_percent | 桶槽變化百分比，如果沒有 kg 可用百分比換算 |
| kg_per_percent      | 每 1% 對應公斤數，預設可為 1120    |
| start_time          | 開始時間，可選                 |
| end_time            | 結束時間，可選                 |
| duration_minutes    | 資料區間時間長度，可選             |
| note                | 備註，可選                   |

### 目標補充量計算

若使用 `tank_change_kg`：

```text
target_supply_kg = tank_change_kg + usage_kg
```

若使用 `tank_change_percent`：

```text
tank_change_kg = tank_change_percent * kg_per_percent
target_supply_kg = tank_change_kg + usage_kg
```

---

## 四、核心數學模型

假設每個進料口有一個平均有效補料係數：

```text
target_supply_kg ≈ B_open * B_coef
                 + C_open * C_coef
                 + D_open * D_coef
                 + R_open * R_coef
```

要估算的參數為：

```text
B_coef, C_coef, D_coef, R_coef
```

這些係數代表：

```text
進料口在開幅 1.0 時，該資料區間內的平均有效補料公斤數
```

第一版需支援兩種估算方法。

---

## 五、估算方法一：平方誤差法

### 目標

最小化所有資料列的平方誤差總和：

```text
minimize Σ(error_i ^ 2)
```

### 說明

此方法類似一般線性回歸，適合當 baseline。
優點是計算快速、容易理解。
缺點是容易受到少數異常資料影響。

### Backend 任務

* 實作 `least_squares_solver`
* 輸入 feature matrix X 與 target y
* 輸出：

  * B/C/D/R 係數
  * 每筆預測補充量
  * 每筆 residual
  * 每筆 absolute_error
  * MAE
  * RMSE
  * total_absolute_error
  * total_squared_error

---

## 六、估算方法二：絕對誤差法

### 目標

最小化所有資料列的絕對誤差總和：

```text
minimize Σ|error_i|
```

### 說明

此方法更符合原始需求，也較不容易被少數異常資料拉偏。
適合現場資料有波動、進料流速不穩、物料不是水的情境。

### Backend 任務

* 實作 `least_absolute_deviation_solver`
* 可使用 `scipy.optimize.linprog`
* 預設限制：

  * 係數不可為負
  * B_coef >= 0
  * C_coef >= 0
  * D_coef >= 0
  * R_coef >= 0
* 輸出：

  * B/C/D/R 係數
  * 每筆預測補充量
  * 每筆 residual
  * 每筆 absolute_error
  * MAE
  * RMSE
  * total_absolute_error
  * total_squared_error

---

## 七、資料分析功能

每次上傳後，除了估算係數，也要對資料做基本分析。

### 需要分析的欄位

至少包含：

* tank_change_kg
* usage_kg
* target_supply_kg
* B_open
* C_open
* D_open
* R_open

若有可選欄位，也可分析：

* tank_change_percent
* duration_minutes

### 每個欄位需輸出

| 指標            | 說明        |
| ------------- | --------- |
| count         | 有效資料筆數    |
| missing_count | 缺失值數量     |
| mean          | 平均數       |
| std           | 標準差       |
| min           | 最小值       |
| q25           | 第 25 百分位數 |
| median        | 中位數       |
| q75           | 第 75 百分位數 |
| max           | 最大值       |

### 圖表

Frontend 需要呈現：

* 各欄位直方圖
* 各欄位基本統計表
* target_supply_kg 分布圖
* residual 分布圖
* actual vs predicted 散佈圖
* 每筆資料誤差長條圖

---

## 八、Backend API 任務

### 1. 建立 FastAPI 專案

任務：

* 建立 backend 專案結構
* 建立 `/health` endpoint
* 建立 `/api/analyze` endpoint
* 支援上傳 `.xlsx` 與 `.csv`

驗收：

* `GET /health` 回傳正常狀態
* `POST /api/analyze` 可接收檔案並回傳 JSON

---

### 2. 檔案解析

任務：

* 支援 csv
* 支援 xlsx
* 自動判斷副檔名
* 使用 pandas 讀取
* 檢查必要欄位是否存在
* 回傳清楚的錯誤訊息

驗收：

* 缺少必要欄位時，回傳錯誤欄位列表
* 非 csv/xlsx 檔案需拒絕
* 空檔案需拒絕

---

### 3. 資料清理

任務：

* 將數值欄位轉成 numeric
* 無法轉換者標記為 invalid
* 移除無法運算的資料列
* 回傳：

  * 原始資料筆數
  * 有效資料筆數
  * 被排除資料筆數
  * 排除原因摘要

驗收：

* 可處理空值
* 可處理文字混入數值欄位
* 可回傳資料品質摘要

---

### 4. 目標值計算

任務：

* 若有 `tank_change_kg`，直接使用
* 若沒有 `tank_change_kg` 但有 `tank_change_percent`，用 `kg_per_percent` 換算
* 計算 `target_supply_kg`

驗收：

* 正確產生 `target_supply_kg`
* 可處理負值桶槽變化量

---

### 5. 係數估算

任務：

* 實作平方誤差法
* 實作絕對誤差法
* 兩種方法都要回傳完整結果

驗收：

* 回傳兩組係數
* 回傳每筆資料的預測值與誤差
* 回傳總誤差指標

---

### 6. 基本統計分析

任務：

* 對每個數值欄位計算 count、mean、std、min、q25、median、q75、max
* 為前端提供直方圖資料 bins

驗收：

* 每個欄位都有統計結果
* 每個欄位都有可繪製直方圖的資料

---

### 7. 回傳 JSON 結構

建議回傳格式：

```json
{
  "summary": {
    "total_rows": 0,
    "valid_rows": 0,
    "invalid_rows": 0
  },
  "data_quality": {
    "missing_columns": [],
    "excluded_rows": []
  },
  "statistics": {},
  "models": {
    "least_squares": {
      "coefficients": {},
      "metrics": {},
      "rows": []
    },
    "least_absolute_deviation": {
      "coefficients": {},
      "metrics": {},
      "rows": []
    }
  },
  "charts": {
    "histograms": {},
    "residuals": {},
    "actual_vs_predicted": {}
  }
}
```

---

## 九、Frontend 任務

### 1. 建立 React 專案

任務：

* 使用 Vite + React + TypeScript
* 建立基本頁面
* 建立 API client

驗收：

* 前端可以啟動
* 可呼叫 backend `/health`

---

### 2. 檔案上傳頁面

任務：

* 支援拖拉上傳
* 支援選擇檔案
* 限制副檔名 `.csv` / `.xlsx`
* 顯示目前選擇的檔名
* 按下「開始分析」後呼叫 backend

驗收：

* 可成功上傳檔案
* 上傳中顯示 loading
* 失敗時顯示錯誤訊息

---

### 3. 結果總覽區

任務：

* 顯示總資料筆數
* 顯示有效資料筆數
* 顯示排除資料筆數
* 顯示兩種方法的總誤差比較

驗收：

* 使用者可以快速看到資料是否可用
* 使用者可以快速比較兩種方法

---

### 4. 係數結果區

任務：

* 顯示平方誤差法的 B/C/D/R 係數
* 顯示絕對誤差法的 B/C/D/R 係數
* 顯示兩者差異

驗收：

* 使用者可以看出兩種方法估出的係數是否接近
* 若差異很大，前端顯示提示文字：可能代表資料存在異常值或流量狀態不穩

---

### 5. 誤差分析區

任務：

* 顯示每筆資料的 residual
* 顯示 absolute_error
* 顯示 predicted_supply_kg
* 顯示 target_supply_kg
* 可用表格呈現

驗收：

* 使用者可以找出誤差最大的資料列
* 表格可依誤差大小排序

---

### 6. 統計分析區

任務：

* 顯示每個欄位的平均數、標準差、最大值、最小值、中位數
* 顯示每個欄位的直方圖

驗收：

* 使用者可以了解每個欄位的分布狀態
* 使用者可以看出是否有極端值

---

### 7. 圖表區

任務：

* target_supply_kg 直方圖
* 各進料口開幅直方圖
* residual 直方圖
* actual vs predicted 散佈圖
* 每筆 absolute_error 長條圖

驗收：

* 圖表能正常顯示
* 圖表資料來自 backend 回傳 JSON
* 不需前端自行重新計算核心模型

---

## 十、Docker 任務

### 1. Backend Dockerfile

任務：

* 建立 backend Dockerfile
* 安裝 Python dependencies
* 使用 uvicorn 啟動 FastAPI

驗收：

* backend container 可正常啟動
* `/health` 可正常回應

---

### 2. Frontend Dockerfile

任務：

* 建立 frontend Dockerfile
* 使用 Node 建置 React
* 可用 nginx 或 vite preview 提供靜態頁面

驗收：

* frontend container 可正常啟動
* 可連接 backend API

---

### 3. docker-compose

任務：

* 建立 `docker-compose.yml`
* 包含 backend service
* 包含 frontend service
* 設定 network
* 設定環境變數

驗收：

* 執行 `docker compose up --build` 可啟動完整系統
* 瀏覽器可開啟前端頁面
* 前端可成功呼叫後端

---

## 十一、測試任務

### Backend 測試

至少測試：

* csv 上傳成功
* xlsx 上傳成功
* 缺少必要欄位
* 欄位有空值
* 欄位有非數字
* 平方誤差法可輸出結果
* 絕對誤差法可輸出結果
* B/C/D/R 係數不為負
* statistics 正確輸出

### Frontend 測試

至少測試：

* 頁面可載入
* 可選擇檔案
* 可上傳檔案
* loading 狀態正常
* 錯誤訊息正常
* 結果區正常渲染
* 圖表正常渲染

---

## 十二、不做事項

第一版明確不做：

* 不做登入
* 不做會員系統
* 不做資料庫
* 不保存上傳檔案
* 不保存分析歷史紀錄
* 不做權限管理
* 不做多使用者協作
* 不做雲端部署
* 不做排程任務
* 不做自動報表寄送
* 不做模型版本管理

---

## 十三、建議專案結構

```text
tank-flow-estimator/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   └── analyze.py
│   │   ├── services/
│   │   │   ├── file_parser.py
│   │   │   ├── data_cleaner.py
│   │   │   ├── feature_builder.py
│   │   │   ├── solvers.py
│   │   │   └── statistics.py
│   │   ├── schemas/
│   │   │   └── analysis.py
│   │   └── utils/
│   │       └── errors.py
│   └── tests/
│       ├── test_file_parser.py
│       ├── test_solvers.py
│       └── test_statistics.py
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/
│       │   └── client.ts
│       ├── components/
│       │   ├── FileUpload.tsx
│       │   ├── SummaryCards.tsx
│       │   ├── CoefficientTable.tsx
│       │   ├── ErrorTable.tsx
│       │   ├── StatisticsTable.tsx
│       │   └── Charts.tsx
│       └── types/
│           └── analysis.ts
└── sample_data/
    ├── sample_valid.csv
    └── sample_valid.xlsx
```

---

## 十四、開發階段建議

### Phase 1：Backend 核心運算

目標：

* 完成檔案讀取
* 完成資料清理
* 完成兩種估算法
* 完成統計分析
* 完成 API 回傳

完成標準：

* 可以用 Postman 或 curl 上傳 csv/xlsx
* 可以取得完整 JSON 結果

---

### Phase 2：Frontend 基本頁面

目標：

* 完成檔案上傳
* 完成結果總覽
* 完成係數表
* 完成誤差表

完成標準：

* 使用者可透過網頁完成一次完整分析

---

### Phase 3：圖表與資料分析

目標：

* 完成直方圖
* 完成 residual 分析圖
* 完成 actual vs predicted 圖
* 完成欄位統計表

完成標準：

* 使用者可以透過圖表了解資料分布與異常狀況

---

### Phase 4：Docker 整合與測試

目標：

* 完成 docker-compose
* 完成前後端整合
* 補基本測試
* 補 README

完成標準：

* 執行 `docker compose up --build` 後即可使用完整系統

---

## 十五、第一版完成標準

第一版完成後，使用者應該可以：

1. 開啟網頁。
2. 上傳 csv 或 xlsx。
3. 系統自動檢查欄位。
4. 系統計算目標補充量。
5. 系統用平方誤差法估算 B/C/D/R。
6. 系統用絕對誤差法估算 B/C/D/R。
7. 系統顯示兩種方法的係數比較。
8. 系統顯示每筆資料的預測補充量與誤差。
9. 系統顯示每個欄位的平均數、標準差、最大值、最小值與直方圖。
10. 系統不保存任何上傳檔案或分析歷史紀錄。
