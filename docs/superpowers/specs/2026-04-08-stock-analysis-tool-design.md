# Stock Analysis Tool — Design Spec

## Overview

個人用股票研究工具。輸入股票代碼（美股 + 港股），自動拉取股價、財務數據、新聞、競爭對手資料，再用 AI 分析並畀出買入/觀察/賣出建議。

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI:** TailwindCSS + shadcn/ui
- **Charts:** Recharts
- **Data Source:** `yahoo-finance2` npm package
- **AI:** OpenRouter API（模型待定）
- **Cache:** Cloudflare KV
- **Deploy:** Cloudflare Pages (`@cloudflare/next-on-pages`)
- **Language:** TypeScript

## Pages

### 首頁 `/`

- 居中搜索欄，輸入股票代碼（e.g. AAPL, 0700.HK）
- 搜索欄下方顯示最近搜索記錄（localStorage）
- 提交後導航至 `/stock/[ticker]`

### 股票詳情頁 `/stock/[ticker]`

單頁展示所有分析，分以下 section：

1. **Header** — 公司名稱、代碼、行業、即時股價、漲跌幅
2. **AI 推薦標籤** — 買入(綠)、觀察(黃)、賣出(紅)，附一句簡短原因
3. **股價走勢圖** — 支援 1M / 3M / 1Y / 5Y 時間範圍切換
4. **公司業務** — 業務描述、盈利方式
5. **Balance Sheet 摘要** — Total Assets、Total Liabilities、Shareholders' Equity、Debt-to-Equity ratio，顯示最近 3 年數據
6. **最新新聞** — 5-10 條相關新聞標題 + 連結
7. **競爭對手卡片** — 3 個同行業公司，顯示名稱、行業、Assets、Liabilities，點擊進入對比頁
8. **AI 分析詳情** — 公司概況、強項、弱項、競爭對手比較、風險因素、建議原因

### 競爭對手對比頁 `/stock/[ticker]/compare`

- 主公司 vs 3 個競爭對手並排比較
- Balance Sheet 數據對比（表格形式）
- Assets & Liabilities 對比
- AI 綜合比較分析

## API Routes

### `GET /api/stock/[ticker]`

返回股價 + 公司基本資料。

**Response:**
```json
{
  "ticker": "AAPL",
  "name": "Apple Inc.",
  "sector": "Technology",
  "industry": "Consumer Electronics",
  "price": 178.72,
  "change": 2.34,
  "changePercent": 1.33,
  "currency": "USD",
  "description": "Apple Inc. designs, manufactures...",
  "revenueBreakdown": "Products (78%), Services (22%)"
}
```

### `GET /api/stock/[ticker]/financials`

返回最近 3 年 Balance Sheet + Income Statement。

**Response:**
```json
{
  "balanceSheet": [
    {
      "year": "2024",
      "totalAssets": 352600000000,
      "totalLiabilities": 290400000000,
      "shareholdersEquity": 62100000000,
      "debtToEquity": 4.67
    }
  ],
  "incomeStatement": [
    {
      "year": "2024",
      "totalRevenue": 383300000000,
      "netIncome": 97000000000,
      "grossMargin": 0.462,
      "netMargin": 0.253
    }
  ]
}
```

### `GET /api/stock/[ticker]/news`

返回 5-10 條相關新聞。

**Response:**
```json
{
  "news": [
    {
      "title": "Apple Reports Record Q4 Revenue",
      "url": "https://...",
      "source": "Reuters",
      "publishedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### `GET /api/stock/[ticker]/competitors`

返回 3 個競爭對手及其財務摘要。

**邏輯：** 用 `yahoo-finance2` 嘅 `recommendedSymbols` 取得相關公司。如果無結果，fallback 用 `screener` 搵同 sector 嘅公司，按市值排序取最接近嘅 3 間。如果 screener 都唔得，用預設嘅行業對照表（手動維護主要行業嘅代表公司）。

**Response:**
```json
{
  "competitors": [
    {
      "ticker": "MSFT",
      "name": "Microsoft Corp.",
      "sector": "Technology",
      "totalAssets": 411900000000,
      "totalLiabilities": 205700000000,
      "shareholdersEquity": 206200000000
    }
  ]
}
```

### `POST /api/stock/[ticker]/analysis`

Call OpenRouter API 做 AI 分析。

**Request body:** 無（後端自動收集所有數據再組裝 prompt）

**AI Prompt 包含：**
- 公司名稱、行業、業務描述
- 最近 3 年 Balance Sheet（Total Assets、Total Liabilities、Equity）
- 最近 3 年 Income Statement（Revenue、Net Income、Margins）
- 3 個競爭對手嘅同等財務數據
- 最近 5 條新聞標題

**AI 要求用 JSON 格式回覆：**
```json
{
  "summary": "一段公司概況（2-3句）",
  "strengths": ["強項1", "強項2", "強項3"],
  "weaknesses": ["弱項1", "弱項2", "弱項3"],
  "competitor_comparison": "同競爭對手比較嘅分析（3-4句）",
  "recommendation": "BUY | WATCH | SELL",
  "recommendation_reason": "建議原因（2-3句）",
  "risk_factors": ["風險1", "風險2"]
}
```

**推薦標籤顯示：**
- `BUY` → 買入（綠色）
- `WATCH` → 觀察（黃色）
- `SELL` → 賣出（紅色）

## Cache Strategy

使用 Cloudflare KV：

| 數據類型 | Cache TTL | Key 格式 |
|---------|-----------|----------|
| 股價 | 不 cache | — |
| 財務報表 | 24 小時 | `financials:{ticker}` |
| 新聞 | 1 小時 | `news:{ticker}` |
| 競爭對手列表 | 7 日 | `competitors:{ticker}` |
| AI 分析 | 24 小時 | `analysis:{ticker}` |

## Project Structure

```
stock_analysis/
├── src/
│   ├── app/
│   │   ├── page.tsx                     # 首頁（搜索）
│   │   ├── layout.tsx                   # Root layout
│   │   ├── stock/[ticker]/
│   │   │   ├── page.tsx                 # 股票詳情頁
│   │   │   └── compare/page.tsx         # 競爭對手對比頁
│   │   └── api/
│   │       └── stock/[ticker]/
│   │           ├── route.ts             # 股價 + 基本資料
│   │           ├── financials/route.ts  # Balance Sheet
│   │           ├── news/route.ts        # 新聞
│   │           ├── competitors/route.ts # 競爭對手
│   │           └── analysis/route.ts    # AI 分析
│   ├── components/
│   │   ├── SearchBar.tsx
│   │   ├── StockChart.tsx
│   │   ├── BalanceSheet.tsx
│   │   ├── CompanyInfo.tsx
│   │   ├── NewsList.tsx
│   │   ├── CompetitorCard.tsx
│   │   ├── AIAnalysis.tsx
│   │   └── RecommendationBadge.tsx
│   └── lib/
│       ├── yahoo-finance.ts             # Yahoo Finance API 封裝
│       ├── openrouter.ts                # OpenRouter API 封裝
│       └── cache.ts                     # Cloudflare KV 快取邏輯
├── tailwind.config.ts
├── next.config.mjs
├── wrangler.toml                        # Cloudflare config
└── package.json
```

## Environment Variables

```
OPENROUTER_API_KEY=     # OpenRouter API key
```

Cloudflare KV namespace 喺 `wrangler.toml` 配置。

## Scope Boundaries

**In scope:**
- 美股 + 港股股票搜索同分析
- 結構化財務數據（Balance Sheet、Income Statement）
- Yahoo Finance 作為唯一數據來源
- OpenRouter AI 分析
- Cloudflare Pages 部署

**Out of scope:**
- 用戶認證 / 多用戶
- 年報 PDF 下載同解析
- 即時串流股價
- Portfolio tracking
- 交易功能
- 其他市場（A股、日股等）
