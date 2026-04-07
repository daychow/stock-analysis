# Enhanced Analysis Data — Design Spec

## Overview

提升 AI 分析準確度，增加估值指標（P/E, P/B, EV/EBITDA）、Cash Flow Statement、成長率到現有股票分析工具。所有新數據都由 `yahoo-finance2` 取得，唔需要新嘅數據來源。

## New Data

### 估值指標 (Valuation Metrics)

從 `quoteSummary` 嘅 `defaultKeyStatistics` + `summaryDetail` modules 取得：

| 指標 | 來源欄位 | 說明 |
|------|----------|------|
| Market Cap | `price.marketCap` | 市值 |
| Trailing P/E | `summaryDetail.trailingPE` | 過去 12 個月市盈率 |
| Forward P/E | `summaryDetail.forwardPE` | 預期市盈率 |
| P/B Ratio | `defaultKeyStatistics.priceToBook` | 市淨率 |
| EV/EBITDA | `defaultKeyStatistics.enterpriseToEbitda` | 企業價值倍數 |
| Dividend Yield | `summaryDetail.dividendYield` | 股息率 |

呢啲指標加入 `StockQuote` type，喺 `fetchStockQuote` 一次過攞。

### Cash Flow Statement (3 年)

從 `yahoo-finance2` 嘅 `fundamentalsTimeSeries` 取得（同現有 fetchFinancials 用同一個 API）：

| 指標 | 來源欄位 |
|------|----------|
| Operating Cash Flow | `annualOperatingCashFlow` |
| Capital Expenditure | `annualCapitalExpenditure` |
| Free Cash Flow | Operating CF - CapEx（計算得出）|

### 成長率 (Growth Rates)

由現有 + 新增數據計算：

| 指標 | 計算方法 |
|------|----------|
| Revenue YoY Growth | `(current - previous) / previous * 100` |
| Net Income YoY Growth | 同上 |
| FCF YoY Growth | 同上 |

成長率喺 `fetchFinancials` 入面計算，回傳時已經算好。

## Type Changes

### StockQuote — 新增欄位

```typescript
// 加入現有 StockQuote interface
marketCap: number;
trailingPE: number;
forwardPE: number;
priceToBook: number;
evToEbitda: number;
dividendYield: number;
```

### 新增 CashFlowEntry type

```typescript
export interface CashFlowEntry {
  year: string;
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;
}
```

### FinancialsData — 新增欄位

```typescript
// 加入現有 FinancialsData interface
cashFlow: CashFlowEntry[];
revenueGrowth: number[];   // YoY %, e.g. [15.2, 8.1] (newest first)
netIncomeGrowth: number[];
fcfGrowth: number[];
```

### CompetitorSummary — 新增估值指標

```typescript
// 加入現有 CompetitorSummary interface
marketCap: number;
trailingPE: number;
priceToBook: number;
```

## File Changes

### `src/lib/types.ts`

- `StockQuote`: 加 6 個估值欄位
- 新增 `CashFlowEntry` interface
- `FinancialsData`: 加 `cashFlow` + 3 個 growth arrays
- `CompetitorSummary`: 加 3 個估值欄位

### `src/lib/yahoo-finance.ts`

**fetchStockQuote:**
- `quoteSummary` modules 加入 `defaultKeyStatistics` 同 `summaryDetail`
- 從 response 提取估值指標，填入 StockQuote

**fetchFinancials:**
- `fundamentalsTimeSeries` 加入 `annualOperatingCashFlow`, `annualCapitalExpenditure`
- 計算 FCF = Operating CF - CapEx
- 計算 3 個 YoY growth rate arrays

**fetchCompetitors → fetchCompetitorDetails:**
- 內部 call fetchStockQuote 已經會有估值指標
- 加 marketCap, trailingPE, priceToBook 到 CompetitorSummary

### `src/lib/openrouter.ts`

**buildAnalysisPrompt — 新增 sections:**

```
## Valuation Metrics
Market Cap: $2.8T
Trailing P/E: 28.5 | Forward P/E: 25.2
P/B: 45.2 | EV/EBITDA: 22.1
Dividend Yield: 0.5%

## Cash Flow (last 3 years)
2024: Operating CF=$110.5B, CapEx=$-11.0B, FCF=$99.5B
2023: Operating CF=$104.0B, CapEx=$-10.8B, FCF=$93.2B

## Growth Rates (YoY)
Revenue: +15.2%, +8.1%
Net Income: +12.5%, +5.3%
FCF: +6.8%, +10.2%

## Competitor Valuations
MSFT: Market Cap=$3.1T, P/E=35.2, P/B=12.1
GOOGL: Market Cap=$2.0T, P/E=24.5, P/B=6.8
```

### `src/components/BalanceSheet.tsx`

改名為 `FinancialSummary.tsx`，擴展顯示：
- 原有 Balance Sheet 表格
- 新增 Cash Flow 表格
- 新增 Growth Rates（用正/負顏色標示）

### `src/components/CompetitorCard.tsx`

加顯示 Market Cap, P/E, P/B。

### `src/app/stock/[ticker]/page.tsx`

- 喺 header 區域加顯示估值指標（Market Cap, P/E, P/B, EV/EBITDA, Dividend Yield）
- `BalanceSheet` import 改為 `FinancialSummary`

### `src/app/stock/[ticker]/compare/page.tsx`

- 對比表格加入估值指標列

## Scope

**In scope:**
- 6 個估值指標
- Cash Flow Statement (3 年)
- 3 個 YoY 成長率
- 競爭對手估值比較
- AI prompt 包含所有新數據
- UI 展示新數據

**Out of scope:**
- 技術面指標 (MA, RSI)
- Insider/機構持倉
- 新嘅數據來源
- 新頁面
