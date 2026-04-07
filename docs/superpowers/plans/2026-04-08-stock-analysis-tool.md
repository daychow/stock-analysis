# Stock Analysis Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal stock research tool that fetches price, financials, news, competitors from Yahoo Finance, and provides AI-powered buy/watch/sell recommendations via OpenRouter.

**Architecture:** Next.js 14 App Router full-stack app deployed on Cloudflare Pages. API routes fetch data from Yahoo Finance (`yahoo-finance2`) and OpenRouter. Cloudflare KV for caching. All TypeScript.

**Tech Stack:** Next.js 14, TailwindCSS, shadcn/ui, Recharts, yahoo-finance2, OpenRouter API, Cloudflare Pages + KV

---

## File Map

### New files to create:

**Config & Setup:**
- `package.json` — dependencies and scripts
- `tsconfig.json` — TypeScript config
- `next.config.mjs` — Next.js config for Cloudflare
- `tailwind.config.ts` — Tailwind config
- `postcss.config.mjs` — PostCSS for Tailwind
- `wrangler.toml` — Cloudflare Pages + KV config
- `.env.local` — local env vars (OPENROUTER_API_KEY)
- `.gitignore` — ignore node_modules, .next, .env.local

**Types:**
- `src/lib/types.ts` — all shared TypeScript types

**Library layer:**
- `src/lib/yahoo-finance.ts` — Yahoo Finance API wrapper
- `src/lib/openrouter.ts` — OpenRouter API wrapper
- `src/lib/cache.ts` — Cloudflare KV cache helper (with in-memory fallback for dev)

**API Routes:**
- `src/app/api/stock/[ticker]/route.ts` — stock quote + company info
- `src/app/api/stock/[ticker]/financials/route.ts` — balance sheet + income statement
- `src/app/api/stock/[ticker]/news/route.ts` — news articles
- `src/app/api/stock/[ticker]/competitors/route.ts` — competitor discovery + financials
- `src/app/api/stock/[ticker]/analysis/route.ts` — AI analysis

**Components:**
- `src/components/SearchBar.tsx` — search input with autocomplete
- `src/components/StockChart.tsx` — Recharts price chart with time range toggle
- `src/components/BalanceSheet.tsx` — financial data table (3-year)
- `src/components/CompanyInfo.tsx` — business description + revenue breakdown
- `src/components/NewsList.tsx` — news articles list
- `src/components/CompetitorCard.tsx` — competitor summary card
- `src/components/AIAnalysis.tsx` — AI analysis display
- `src/components/RecommendationBadge.tsx` — BUY/WATCH/SELL badge

**Pages:**
- `src/app/layout.tsx` — root layout with fonts + Tailwind
- `src/app/page.tsx` — home page (search)
- `src/app/stock/[ticker]/page.tsx` — stock detail page
- `src/app/stock/[ticker]/compare/page.tsx` — competitor comparison page

**Tests:**
- `src/lib/__tests__/yahoo-finance.test.ts`
- `src/lib/__tests__/openrouter.test.ts`
- `src/lib/__tests__/cache.test.ts`

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `wrangler.toml`, `.env.local`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd C:/Users/kyrch/developing/kimi_tutorial/stock_analysis
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Expected: Project scaffolded with Next.js 14, TypeScript, Tailwind, App Router, src directory.

- [ ] **Step 2: Install dependencies**

```bash
npm install yahoo-finance2 recharts
npm install -D @cloudflare/next-on-pages wrangler vitest @vitejs/plugin-react
```

- [ ] **Step 3: Install shadcn/ui**

```bash
npx shadcn@latest init -d
```

Select: New York style, Zinc color, CSS variables yes.

- [ ] **Step 4: Add shadcn components we need**

```bash
npx shadcn@latest add button input card badge table tabs skeleton
```

- [ ] **Step 5: Create wrangler.toml**

```toml
name = "stock-analysis"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".vercel/output/static"

[[kv_namespaces]]
binding = "STOCK_CACHE"
id = "placeholder-will-be-created-on-deploy"
```

- [ ] **Step 6: Create .env.local**

```
OPENROUTER_API_KEY=your-key-here
```

- [ ] **Step 7: Update .gitignore — add .env.local if not present**

Verify `.env.local` is in `.gitignore`. If not, append it.

- [ ] **Step 8: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 9: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts on http://localhost:3000 with no errors.

- [ ] **Step 10: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js 14 project with Tailwind, shadcn/ui, yahoo-finance2"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: Define all shared types**

```typescript
// src/lib/types.ts

export interface StockQuote {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  description: string;
  revenueBreakdown: string;
}

export interface BalanceSheetEntry {
  year: string;
  totalAssets: number;
  totalLiabilities: number;
  shareholdersEquity: number;
  debtToEquity: number;
}

export interface IncomeStatementEntry {
  year: string;
  totalRevenue: number;
  netIncome: number;
  grossMargin: number;
  netMargin: number;
}

export interface FinancialsData {
  balanceSheet: BalanceSheetEntry[];
  incomeStatement: IncomeStatementEntry[];
}

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}

export interface CompetitorSummary {
  ticker: string;
  name: string;
  sector: string;
  totalAssets: number;
  totalLiabilities: number;
  shareholdersEquity: number;
}

export type Recommendation = "BUY" | "WATCH" | "SELL";

export interface AIAnalysisResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  competitor_comparison: string;
  recommendation: Recommendation;
  recommendation_reason: string;
  risk_factors: string[];
}

export interface PriceHistoryPoint {
  date: string;
  close: number;
  volume: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: Cache Helper

**Files:**
- Create: `src/lib/cache.ts`, `src/lib/__tests__/cache.test.ts`

- [ ] **Step 1: Write failing test for cache**

```typescript
// src/lib/__tests__/cache.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { CacheHelper } from "../cache";

describe("CacheHelper (in-memory fallback)", () => {
  let cache: CacheHelper;

  beforeEach(() => {
    cache = new CacheHelper(null);
  });

  it("returns null for missing key", async () => {
    const result = await cache.get("missing");
    expect(result).toBeNull();
  });

  it("stores and retrieves a value", async () => {
    await cache.set("key1", { data: "hello" }, 3600);
    const result = await cache.get("key1");
    expect(result).toEqual({ data: "hello" });
  });

  it("returns null for expired key", async () => {
    await cache.set("key2", { data: "old" }, -1);
    const result = await cache.get("key2");
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/__tests__/cache.test.ts
```

Expected: FAIL — CacheHelper not found.

- [ ] **Step 3: Implement cache helper**

```typescript
// src/lib/cache.ts

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

export class CacheHelper {
  private kv: KVNamespace | null;
  private memory: Map<string, CacheEntry> = new Map();

  constructor(kv: KVNamespace | null) {
    this.kv = kv;
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.kv) {
      const raw = await this.kv.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    }

    const entry = this.memory.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memory.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (this.kv) {
      await this.kv.put(key, JSON.stringify(value), {
        expirationTtl: ttlSeconds,
      });
      return;
    }

    this.memory.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/__tests__/cache.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cache.ts src/lib/__tests__/cache.test.ts
git commit -m "feat: add cache helper with Cloudflare KV + in-memory fallback"
```

---

## Task 4: Yahoo Finance Library

**Files:**
- Create: `src/lib/yahoo-finance.ts`, `src/lib/__tests__/yahoo-finance.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/__tests__/yahoo-finance.test.ts
import { describe, it, expect, vi } from "vitest";
import {
  fetchStockQuote,
  fetchFinancials,
  fetchNews,
  fetchCompetitors,
  fetchPriceHistory,
} from "../yahoo-finance";

// These are integration tests that hit Yahoo Finance.
// Skip in CI, run locally to verify.
describe("Yahoo Finance", () => {
  it("fetchStockQuote returns valid data for AAPL", async () => {
    const quote = await fetchStockQuote("AAPL");
    expect(quote.ticker).toBe("AAPL");
    expect(quote.name).toBeTruthy();
    expect(quote.price).toBeGreaterThan(0);
    expect(quote.sector).toBeTruthy();
  });

  it("fetchFinancials returns balance sheet and income statement", async () => {
    const data = await fetchFinancials("AAPL");
    expect(data.balanceSheet.length).toBeGreaterThan(0);
    expect(data.balanceSheet[0].totalAssets).toBeGreaterThan(0);
    expect(data.incomeStatement.length).toBeGreaterThan(0);
    expect(data.incomeStatement[0].totalRevenue).toBeGreaterThan(0);
  });

  it("fetchNews returns articles", async () => {
    const news = await fetchNews("AAPL");
    expect(news.length).toBeGreaterThan(0);
    expect(news[0].title).toBeTruthy();
  });

  it("fetchPriceHistory returns price points", async () => {
    const history = await fetchPriceHistory("AAPL", "1mo");
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].close).toBeGreaterThan(0);
    expect(history[0].date).toBeTruthy();
  });

  it("fetchCompetitors returns 3 competitors", async () => {
    const competitors = await fetchCompetitors("AAPL");
    expect(competitors.length).toBeLessThanOrEqual(3);
    expect(competitors.length).toBeGreaterThan(0);
    expect(competitors[0].ticker).toBeTruthy();
    expect(competitors[0].name).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/__tests__/yahoo-finance.test.ts
```

Expected: FAIL — functions not found.

- [ ] **Step 3: Implement fetchStockQuote**

```typescript
// src/lib/yahoo-finance.ts
import yahooFinance from "yahoo-finance2";
import type {
  StockQuote,
  FinancialsData,
  BalanceSheetEntry,
  IncomeStatementEntry,
  NewsArticle,
  CompetitorSummary,
  PriceHistoryPoint,
} from "./types";

export async function fetchStockQuote(ticker: string): Promise<StockQuote> {
  const result = await yahooFinance.quoteSummary(ticker, {
    modules: ["price", "summaryProfile", "assetProfile"],
  });

  const price = result.price!;
  const profile = result.summaryProfile ?? result.assetProfile;

  return {
    ticker: ticker.toUpperCase(),
    name: price.longName ?? price.shortName ?? ticker,
    sector: profile?.sector ?? "Unknown",
    industry: profile?.industry ?? "Unknown",
    price: price.regularMarketPrice ?? 0,
    change: price.regularMarketChange ?? 0,
    changePercent: price.regularMarketChangePercent
      ? price.regularMarketChangePercent * 100
      : 0,
    currency: price.currency ?? "USD",
    description: profile?.longBusinessSummary ?? "No description available.",
    revenueBreakdown: "",
  };
}
```

- [ ] **Step 4: Implement fetchFinancials**

```typescript
// Append to src/lib/yahoo-finance.ts

export async function fetchFinancials(ticker: string): Promise<FinancialsData> {
  const result = await yahooFinance.quoteSummary(ticker, {
    modules: ["balanceSheetHistory", "incomeStatementHistory"],
  });

  const bsStatements = result.balanceSheetHistory?.balanceSheetStatements ?? [];
  const isStatements =
    result.incomeStatementHistory?.incomeStatementHistory ?? [];

  const balanceSheet: BalanceSheetEntry[] = bsStatements
    .slice(0, 3)
    .map((bs) => {
      const totalAssets = bs.totalAssets ?? 0;
      const totalLiab = bs.totalLiab ?? 0;
      const equity = bs.totalStockholderEquity ?? 0;
      return {
        year: new Date(bs.endDate).getFullYear().toString(),
        totalAssets: totalAssets,
        totalLiabilities: totalLiab,
        shareholdersEquity: equity,
        debtToEquity: equity !== 0 ? totalLiab / equity : 0,
      };
    });

  const incomeStatement: IncomeStatementEntry[] = isStatements
    .slice(0, 3)
    .map((is) => {
      const revenue = is.totalRevenue ?? 0;
      const netIncome = is.netIncome ?? 0;
      const grossProfit = is.grossProfit ?? 0;
      return {
        year: new Date(is.endDate).getFullYear().toString(),
        totalRevenue: revenue,
        netIncome: netIncome,
        grossMargin: revenue !== 0 ? grossProfit / revenue : 0,
        netMargin: revenue !== 0 ? netIncome / revenue : 0,
      };
    });

  return { balanceSheet, incomeStatement };
}
```

- [ ] **Step 5: Implement fetchNews**

```typescript
// Append to src/lib/yahoo-finance.ts

export async function fetchNews(ticker: string): Promise<NewsArticle[]> {
  const result = await yahooFinance.search(ticker, { newsCount: 10 });
  const news = result.news ?? [];

  return news.slice(0, 10).map((article) => ({
    title: article.title,
    url: article.link,
    source: article.publisher ?? "Unknown",
    publishedAt: article.providerPublishTime
      ? new Date(article.providerPublishTime).toISOString()
      : "",
  }));
}
```

- [ ] **Step 6: Implement fetchPriceHistory**

```typescript
// Append to src/lib/yahoo-finance.ts

type Period = "1mo" | "3mo" | "1y" | "5y";

export async function fetchPriceHistory(
  ticker: string,
  period: Period
): Promise<PriceHistoryPoint[]> {
  const periodMap: Record<Period, string> = {
    "1mo": "1mo",
    "3mo": "3mo",
    "1y": "1y",
    "5y": "5y",
  };

  const result = await yahooFinance.chart(ticker, {
    period1: getStartDate(period),
    interval: period === "1mo" ? "1d" : period === "3mo" ? "1d" : "1wk",
  });

  return (result.quotes ?? []).map((q) => ({
    date: new Date(q.date).toISOString().split("T")[0],
    close: q.close ?? 0,
    volume: q.volume ?? 0,
  }));
}

function getStartDate(period: Period): Date {
  const now = new Date();
  switch (period) {
    case "1mo":
      return new Date(now.setMonth(now.getMonth() - 1));
    case "3mo":
      return new Date(now.setMonth(now.getMonth() - 3));
    case "1y":
      return new Date(now.setFullYear(now.getFullYear() - 1));
    case "5y":
      return new Date(now.setFullYear(now.getFullYear() - 5));
  }
}
```

- [ ] **Step 7: Implement fetchCompetitors**

```typescript
// Append to src/lib/yahoo-finance.ts

export async function fetchCompetitors(
  ticker: string
): Promise<CompetitorSummary[]> {
  // Strategy 1: recommendedSymbols
  try {
    const rec = await yahooFinance.recommendationsBySymbol(ticker);
    const symbols = (rec.recommendedSymbols ?? [])
      .slice(0, 3)
      .map((s) => s.symbol);

    if (symbols.length > 0) {
      return await fetchCompetitorDetails(symbols);
    }
  } catch {
    // Fall through to strategy 2
  }

  // Strategy 2: Same sector via quote lookup of known large-caps
  try {
    const quote = await fetchStockQuote(ticker);
    const sectorPeers = SECTOR_PEERS[quote.sector] ?? [];
    const filtered = sectorPeers
      .filter((s) => s.toUpperCase() !== ticker.toUpperCase())
      .slice(0, 3);

    if (filtered.length > 0) {
      return await fetchCompetitorDetails(filtered);
    }
  } catch {
    // Fall through
  }

  return [];
}

async function fetchCompetitorDetails(
  tickers: string[]
): Promise<CompetitorSummary[]> {
  const results = await Promise.all(
    tickers.map(async (t) => {
      try {
        const [quote, financials] = await Promise.all([
          fetchStockQuote(t),
          fetchFinancials(t),
        ]);
        const latest = financials.balanceSheet[0];
        return {
          ticker: t,
          name: quote.name,
          sector: quote.sector,
          totalAssets: latest?.totalAssets ?? 0,
          totalLiabilities: latest?.totalLiabilities ?? 0,
          shareholdersEquity: latest?.shareholdersEquity ?? 0,
        };
      } catch {
        return null;
      }
    })
  );

  return results.filter((r): r is CompetitorSummary => r !== null);
}

const SECTOR_PEERS: Record<string, string[]> = {
  Technology: ["AAPL", "MSFT", "GOOGL", "META", "NVDA", "TSM"],
  "Financial Services": ["JPM", "BAC", "GS", "MS", "V", "MA"],
  Healthcare: ["JNJ", "UNH", "PFE", "ABBV", "MRK", "LLY"],
  "Consumer Cyclical": ["AMZN", "TSLA", "HD", "NKE", "MCD", "SBUX"],
  "Communication Services": ["GOOGL", "META", "DIS", "NFLX", "CMCSA"],
  Energy: ["XOM", "CVX", "COP", "SLB", "EOG"],
  Industrials: ["CAT", "BA", "HON", "UPS", "GE", "RTX"],
  "Consumer Defensive": ["PG", "KO", "PEP", "WMT", "COST"],
  "Real Estate": ["PLD", "AMT", "CCI", "SPG", "EQIX"],
  Utilities: ["NEE", "DUK", "SO", "D", "AEP"],
  "Basic Materials": ["LIN", "APD", "ECL", "SHW", "FCX"],
};
```

- [ ] **Step 8: Run all tests**

```bash
npx vitest run src/lib/__tests__/yahoo-finance.test.ts
```

Expected: All 5 tests PASS (requires internet connection).

- [ ] **Step 9: Commit**

```bash
git add src/lib/yahoo-finance.ts src/lib/__tests__/yahoo-finance.test.ts src/lib/types.ts
git commit -m "feat: add Yahoo Finance data fetching library"
```

---

## Task 5: OpenRouter Library

**Files:**
- Create: `src/lib/openrouter.ts`, `src/lib/__tests__/openrouter.test.ts`

- [ ] **Step 1: Write failing test (mocked)**

```typescript
// src/lib/__tests__/openrouter.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildAnalysisPrompt, parseAnalysisResponse } from "../openrouter";
import type {
  StockQuote,
  FinancialsData,
  CompetitorSummary,
  NewsArticle,
  AIAnalysisResult,
} from "../types";

const mockQuote: StockQuote = {
  ticker: "AAPL",
  name: "Apple Inc.",
  sector: "Technology",
  industry: "Consumer Electronics",
  price: 178.72,
  change: 2.34,
  changePercent: 1.33,
  currency: "USD",
  description: "Apple designs and sells electronics.",
  revenueBreakdown: "Products (78%), Services (22%)",
};

const mockFinancials: FinancialsData = {
  balanceSheet: [
    {
      year: "2024",
      totalAssets: 352600000000,
      totalLiabilities: 290400000000,
      shareholdersEquity: 62100000000,
      debtToEquity: 4.67,
    },
  ],
  incomeStatement: [
    {
      year: "2024",
      totalRevenue: 383300000000,
      netIncome: 97000000000,
      grossMargin: 0.462,
      netMargin: 0.253,
    },
  ],
};

const mockCompetitors: CompetitorSummary[] = [
  {
    ticker: "MSFT",
    name: "Microsoft",
    sector: "Technology",
    totalAssets: 411900000000,
    totalLiabilities: 205700000000,
    shareholdersEquity: 206200000000,
  },
];

const mockNews: NewsArticle[] = [
  {
    title: "Apple Reports Record Revenue",
    url: "https://example.com",
    source: "Reuters",
    publishedAt: "2024-01-15T10:00:00Z",
  },
];

describe("OpenRouter helpers", () => {
  it("buildAnalysisPrompt produces a non-empty string with company name", () => {
    const prompt = buildAnalysisPrompt(
      mockQuote,
      mockFinancials,
      mockCompetitors,
      mockNews
    );
    expect(prompt).toContain("Apple Inc.");
    expect(prompt).toContain("Balance Sheet");
    expect(prompt).toContain("MSFT");
  });

  it("parseAnalysisResponse extracts valid JSON from AI response", () => {
    const raw = JSON.stringify({
      summary: "Apple is a leader.",
      strengths: ["Brand", "Ecosystem"],
      weaknesses: ["China risk"],
      competitor_comparison: "Stronger than peers.",
      recommendation: "BUY",
      recommendation_reason: "Strong financials.",
      risk_factors: ["Market slowdown"],
    });

    const result = parseAnalysisResponse(raw);
    expect(result.recommendation).toBe("BUY");
    expect(result.strengths).toHaveLength(2);
  });

  it("parseAnalysisResponse handles JSON wrapped in markdown code block", () => {
    const raw =
      '```json\n{"summary":"test","strengths":[],"weaknesses":[],"competitor_comparison":"","recommendation":"WATCH","recommendation_reason":"","risk_factors":[]}\n```';

    const result = parseAnalysisResponse(raw);
    expect(result.recommendation).toBe("WATCH");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/__tests__/openrouter.test.ts
```

Expected: FAIL — functions not found.

- [ ] **Step 3: Implement openrouter.ts**

```typescript
// src/lib/openrouter.ts
import type {
  StockQuote,
  FinancialsData,
  CompetitorSummary,
  NewsArticle,
  AIAnalysisResult,
} from "./types";

export function buildAnalysisPrompt(
  quote: StockQuote,
  financials: FinancialsData,
  competitors: CompetitorSummary[],
  news: NewsArticle[]
): string {
  const bsRows = financials.balanceSheet
    .map(
      (b) =>
        `${b.year}: Assets=$${fmt(b.totalAssets)}, Liabilities=$${fmt(b.totalLiabilities)}, Equity=$${fmt(b.shareholdersEquity)}, D/E=${b.debtToEquity.toFixed(2)}`
    )
    .join("\n");

  const isRows = financials.incomeStatement
    .map(
      (i) =>
        `${i.year}: Revenue=$${fmt(i.totalRevenue)}, Net Income=$${fmt(i.netIncome)}, Gross Margin=${(i.grossMargin * 100).toFixed(1)}%, Net Margin=${(i.netMargin * 100).toFixed(1)}%`
    )
    .join("\n");

  const compRows = competitors
    .map(
      (c) =>
        `${c.ticker} (${c.name}): Assets=$${fmt(c.totalAssets)}, Liabilities=$${fmt(c.totalLiabilities)}, Equity=$${fmt(c.shareholdersEquity)}`
    )
    .join("\n");

  const newsRows = news
    .slice(0, 5)
    .map((n) => `- ${n.title}`)
    .join("\n");

  return `Analyze the following stock and provide an investment recommendation.

## Company: ${quote.name} (${quote.ticker})
- Sector: ${quote.sector}
- Industry: ${quote.industry}
- Current Price: ${quote.currency} ${quote.price}
- Business: ${quote.description}

## Balance Sheet (last 3 years)
${bsRows}

## Income Statement (last 3 years)
${isRows}

## Competitors
${compRows}

## Recent News
${newsRows}

Respond with ONLY a JSON object (no markdown, no explanation) in this exact format:
{
  "summary": "2-3 sentence company overview",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "competitor_comparison": "3-4 sentence comparison with competitors",
  "recommendation": "BUY or WATCH or SELL",
  "recommendation_reason": "2-3 sentence reasoning",
  "risk_factors": ["risk1", "risk2"]
}`;
}

function fmt(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  return n.toFixed(0);
}

export function parseAnalysisResponse(raw: string): AIAnalysisResult {
  let cleaned = raw.trim();
  // Strip markdown code fences if present
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }
  return JSON.parse(cleaned) as AIAnalysisResult;
}

export async function analyzeStock(
  quote: StockQuote,
  financials: FinancialsData,
  competitors: CompetitorSummary[],
  news: NewsArticle[],
  apiKey: string,
  model: string = "openai/gpt-4o-mini"
): Promise<AIAnalysisResult> {
  const prompt = buildAnalysisPrompt(quote, financials, competitors, news);

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a financial analyst. Respond only with the requested JSON format.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  return parseAnalysisResponse(content);
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/lib/__tests__/openrouter.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/openrouter.ts src/lib/__tests__/openrouter.test.ts
git commit -m "feat: add OpenRouter AI analysis library"
```

---

## Task 6: API Routes — Stock Quote + Financials + News

**Files:**
- Create: `src/app/api/stock/[ticker]/route.ts`, `src/app/api/stock/[ticker]/financials/route.ts`, `src/app/api/stock/[ticker]/news/route.ts`

- [ ] **Step 1: Create stock quote API route**

```typescript
// src/app/api/stock/[ticker]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchStockQuote } from "@/lib/yahoo-finance";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  try {
    const quote = await fetchStockQuote(ticker);
    return NextResponse.json(quote);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch stock data for ${ticker}` },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create financials API route**

```typescript
// src/app/api/stock/[ticker]/financials/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchFinancials } from "@/lib/yahoo-finance";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  try {
    const financials = await fetchFinancials(ticker);
    return NextResponse.json(financials);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch financials for ${ticker}` },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Create news API route**

```typescript
// src/app/api/stock/[ticker]/news/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchNews } from "@/lib/yahoo-finance";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  try {
    const news = await fetchNews(ticker);
    return NextResponse.json({ news });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch news for ${ticker}` },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Test API routes manually**

```bash
npm run dev
# In another terminal:
curl http://localhost:3000/api/stock/AAPL
curl http://localhost:3000/api/stock/AAPL/financials
curl http://localhost:3000/api/stock/AAPL/news
```

Expected: JSON responses with valid data for each endpoint.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/
git commit -m "feat: add stock quote, financials, and news API routes"
```

---

## Task 7: API Routes — Competitors + Analysis

**Files:**
- Create: `src/app/api/stock/[ticker]/competitors/route.ts`, `src/app/api/stock/[ticker]/analysis/route.ts`

- [ ] **Step 1: Create competitors API route**

```typescript
// src/app/api/stock/[ticker]/competitors/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchCompetitors } from "@/lib/yahoo-finance";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  try {
    const competitors = await fetchCompetitors(ticker);
    return NextResponse.json({ competitors });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch competitors for ${ticker}` },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create analysis API route**

```typescript
// src/app/api/stock/[ticker]/analysis/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchStockQuote, fetchFinancials, fetchNews, fetchCompetitors } from "@/lib/yahoo-finance";
import { analyzeStock } from "@/lib/openrouter";

export const runtime = "edge";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const [quote, financials, news, competitors] = await Promise.all([
      fetchStockQuote(ticker),
      fetchFinancials(ticker),
      fetchNews(ticker),
      fetchCompetitors(ticker),
    ]);

    const analysis = await analyzeStock(
      quote,
      financials,
      competitors,
      news,
      apiKey
    );

    return NextResponse.json(analysis);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to analyze ${ticker}` },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Test manually**

```bash
curl http://localhost:3000/api/stock/AAPL/competitors
curl -X POST http://localhost:3000/api/stock/AAPL/analysis
```

Expected: JSON responses. Analysis requires valid OPENROUTER_API_KEY in .env.local.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/stock/
git commit -m "feat: add competitors and AI analysis API routes"
```

---

## Task 8: Components — RecommendationBadge + CompanyInfo + BalanceSheet

**Files:**
- Create: `src/components/RecommendationBadge.tsx`, `src/components/CompanyInfo.tsx`, `src/components/BalanceSheet.tsx`

- [ ] **Step 1: Create RecommendationBadge**

```tsx
// src/components/RecommendationBadge.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import type { Recommendation } from "@/lib/types";

const config: Record<
  Recommendation,
  { label: string; className: string }
> = {
  BUY: {
    label: "買入 BUY",
    className: "bg-green-500 hover:bg-green-600 text-white",
  },
  WATCH: {
    label: "觀察 WATCH",
    className: "bg-yellow-500 hover:bg-yellow-600 text-white",
  },
  SELL: {
    label: "賣出 SELL",
    className: "bg-red-500 hover:bg-red-600 text-white",
  },
};

interface Props {
  recommendation: Recommendation;
  reason: string;
}

export function RecommendationBadge({ recommendation, reason }: Props) {
  const { label, className } = config[recommendation];

  const bgMap: Record<Recommendation, string> = {
    BUY: "bg-green-50 border-green-200",
    WATCH: "bg-yellow-50 border-yellow-200",
    SELL: "bg-red-50 border-red-200",
  };

  const textMap: Record<Recommendation, string> = {
    BUY: "text-green-800",
    WATCH: "text-yellow-800",
    SELL: "text-red-800",
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 ${bgMap[recommendation]}`}
    >
      <Badge className={className}>{label}</Badge>
      <span className={`text-sm ${textMap[recommendation]}`}>{reason}</span>
    </div>
  );
}
```

- [ ] **Step 2: Create CompanyInfo**

```tsx
// src/components/CompanyInfo.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  description: string;
  revenueBreakdown: string;
}

export function CompanyInfo({ description, revenueBreakdown }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">公司業務</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
        {revenueBreakdown && (
          <div>
            <p className="text-sm font-semibold mb-1">盈利方式</p>
            <p className="text-sm text-muted-foreground">{revenueBreakdown}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create BalanceSheet**

```tsx
// src/components/BalanceSheet.tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BalanceSheetEntry } from "@/lib/types";

interface Props {
  data: BalanceSheetEntry[];
}

function formatNumber(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

export function BalanceSheet({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Balance Sheet 摘要</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Year</TableHead>
              <TableHead className="text-right">Total Assets</TableHead>
              <TableHead className="text-right">Total Liabilities</TableHead>
              <TableHead className="text-right">Equity</TableHead>
              <TableHead className="text-right">D/E Ratio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.year}>
                <TableCell className="font-medium">{row.year}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(row.totalAssets)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(row.totalLiabilities)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(row.shareholdersEquity)}
                </TableCell>
                <TableCell className="text-right">
                  {row.debtToEquity.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/RecommendationBadge.tsx src/components/CompanyInfo.tsx src/components/BalanceSheet.tsx
git commit -m "feat: add RecommendationBadge, CompanyInfo, and BalanceSheet components"
```

---

## Task 9: Components — StockChart + NewsList + CompetitorCard

**Files:**
- Create: `src/components/StockChart.tsx`, `src/components/NewsList.tsx`, `src/components/CompetitorCard.tsx`

- [ ] **Step 1: Create StockChart**

```tsx
// src/components/StockChart.tsx
"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PriceHistoryPoint } from "@/lib/types";

type Period = "1mo" | "3mo" | "1y" | "5y";

const periods: { value: Period; label: string }[] = [
  { value: "1mo", label: "1M" },
  { value: "3mo", label: "3M" },
  { value: "1y", label: "1Y" },
  { value: "5y", label: "5Y" },
];

interface Props {
  ticker: string;
}

export function StockChart({ ticker }: Props) {
  const [period, setPeriod] = useState<Period>("1mo");
  const [data, setData] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stock/${ticker}?period=${period}`)
      .then((r) => r.json())
      .then((json) => {
        setData(json.history ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ticker, period]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">股價走勢</CardTitle>
        <div className="flex gap-1">
          {periods.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => {
                  const d = new Date(v);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
              />
              <YAxis tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="close"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create NewsList**

```tsx
// src/components/NewsList.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NewsArticle } from "@/lib/types";

interface Props {
  articles: NewsArticle[];
}

export function NewsList({ articles }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">最新新聞</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {articles.map((article, i) => (
            <li key={i}>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                {article.title}
              </a>
              <div className="text-xs text-muted-foreground mt-0.5">
                {article.source}
                {article.publishedAt &&
                  ` · ${new Date(article.publishedAt).toLocaleDateString()}`}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create CompetitorCard**

```tsx
// src/components/CompetitorCard.tsx
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { CompetitorSummary } from "@/lib/types";

interface Props {
  competitor: CompetitorSummary;
  mainTicker: string;
}

function formatNumber(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

export function CompetitorCard({ competitor, mainTicker }: Props) {
  return (
    <Card className="hover:border-blue-300 transition-colors">
      <CardContent className="pt-4">
        <div className="font-semibold">
          {competitor.name} ({competitor.ticker})
        </div>
        <div className="text-xs text-muted-foreground mb-2">
          {competitor.sector}
        </div>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Assets</span>
            <span>{formatNumber(competitor.totalAssets)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Liabilities</span>
            <span>{formatNumber(competitor.totalLiabilities)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Equity</span>
            <span>{formatNumber(competitor.shareholdersEquity)}</span>
          </div>
        </div>
        <Link
          href={`/stock/${mainTicker}/compare`}
          className="text-xs text-blue-600 hover:underline mt-3 inline-block"
        >
          查看對比 →
        </Link>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/StockChart.tsx src/components/NewsList.tsx src/components/CompetitorCard.tsx
git commit -m "feat: add StockChart, NewsList, and CompetitorCard components"
```

---

## Task 10: Components — SearchBar + AIAnalysis

**Files:**
- Create: `src/components/SearchBar.tsx`, `src/components/AIAnalysis.tsx`

- [ ] **Step 1: Create SearchBar**

```tsx
// src/components/SearchBar.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  className?: string;
}

export function SearchBar({ className }: Props) {
  const [ticker, setTicker] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = ticker.trim().toUpperCase();
    if (!cleaned) return;

    // Save to recent searches
    const recent = getRecentSearches();
    const updated = [cleaned, ...recent.filter((s) => s !== cleaned)].slice(
      0,
      10
    );
    localStorage.setItem("recentSearches", JSON.stringify(updated));

    router.push(`/stock/${encodeURIComponent(cleaned)}`);
  }

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className ?? ""}`}>
      <Input
        placeholder="輸入股票代碼 e.g. AAPL, 0700.HK"
        value={ticker}
        onChange={(e) => setTicker(e.target.value)}
        className="text-base"
      />
      <Button type="submit">搜索</Button>
    </form>
  );
}

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("recentSearches") ?? "[]");
  } catch {
    return [];
  }
}
```

- [ ] **Step 2: Create AIAnalysis**

```tsx
// src/components/AIAnalysis.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AIAnalysisResult } from "@/lib/types";

interface Props {
  analysis: AIAnalysisResult;
}

export function AIAnalysis({ analysis }: Props) {
  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="text-base">AI 分析</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed">{analysis.summary}</p>

        <div>
          <p className="text-sm font-semibold text-green-700 mb-1">強項</p>
          <ul className="text-sm space-y-1 pl-4">
            {analysis.strengths.map((s, i) => (
              <li key={i} className="list-disc text-muted-foreground">
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-red-700 mb-1">弱項</p>
          <ul className="text-sm space-y-1 pl-4">
            {analysis.weaknesses.map((w, i) => (
              <li key={i} className="list-disc text-muted-foreground">
                {w}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold mb-1">競爭對手比較</p>
          <p className="text-sm text-muted-foreground">
            {analysis.competitor_comparison}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold mb-1">風險因素</p>
          <ul className="text-sm space-y-1 pl-4">
            {analysis.risk_factors.map((r, i) => (
              <li key={i} className="list-disc text-muted-foreground">
                {r}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SearchBar.tsx src/components/AIAnalysis.tsx
git commit -m "feat: add SearchBar and AIAnalysis components"
```

---

## Task 11: Home Page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update root layout**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stock Analysis",
  description: "AI-powered stock research tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-HK">
      <body className={inter.className}>
        <main className="min-h-screen bg-background">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create home page**

```tsx
// src/app/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SearchBar, getRecentSearches } from "@/components/SearchBar";

export default function HomePage() {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(getRecentSearches());
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-3xl font-bold mb-2">Stock Analysis</h1>
      <p className="text-muted-foreground mb-8">輸入股票代碼開始分析</p>
      <SearchBar className="w-full max-w-lg" />
      {recent.length > 0 && (
        <div className="mt-6 text-sm text-muted-foreground">
          <span>最近搜索：</span>
          {recent.map((ticker) => (
            <Link
              key={ticker}
              href={`/stock/${ticker}`}
              className="inline-block mx-1 px-3 py-1 bg-muted rounded-full hover:bg-muted-foreground/10 transition"
            >
              {ticker}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Open http://localhost:3000. Expected: centered search bar with title, recent searches (empty initially).

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/app/layout.tsx
git commit -m "feat: add home page with search bar and recent searches"
```

---

## Task 12: Stock Detail Page

**Files:**
- Create: `src/app/stock/[ticker]/page.tsx`

- [ ] **Step 1: Update stock quote API to include price history**

Add price history support to the stock quote route:

```typescript
// src/app/api/stock/[ticker]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchStockQuote, fetchPriceHistory } from "@/lib/yahoo-finance";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") as "1mo" | "3mo" | "1y" | "5y") ?? "1mo";

  try {
    const [quote, history] = await Promise.all([
      fetchStockQuote(ticker),
      fetchPriceHistory(ticker, period),
    ]);
    return NextResponse.json({ ...quote, history });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch stock data for ${ticker}` },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create stock detail page**

```tsx
// src/app/stock/[ticker]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { StockChart } from "@/components/StockChart";
import { CompanyInfo } from "@/components/CompanyInfo";
import { BalanceSheet } from "@/components/BalanceSheet";
import { NewsList } from "@/components/NewsList";
import { CompetitorCard } from "@/components/CompetitorCard";
import { AIAnalysis } from "@/components/AIAnalysis";
import { RecommendationBadge } from "@/components/RecommendationBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type {
  StockQuote,
  FinancialsData,
  NewsArticle,
  CompetitorSummary,
  AIAnalysisResult,
} from "@/lib/types";

export default function StockDetailPage() {
  const params = useParams<{ ticker: string }>();
  const ticker = params.ticker;

  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [financials, setFinancials] = useState<FinancialsData | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorSummary[]>([]);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;

    setError(null);

    // Fetch all data in parallel
    Promise.all([
      fetch(`/api/stock/${ticker}`).then((r) => r.json()),
      fetch(`/api/stock/${ticker}/financials`).then((r) => r.json()),
      fetch(`/api/stock/${ticker}/news`).then((r) => r.json()),
      fetch(`/api/stock/${ticker}/competitors`).then((r) => r.json()),
    ])
      .then(([quoteData, financialsData, newsData, competitorsData]) => {
        if (quoteData.error) {
          setError(quoteData.error);
          return;
        }
        setQuote(quoteData);
        setFinancials(financialsData);
        setNews(newsData.news ?? []);
        setCompetitors(competitorsData.competitors ?? []);
      })
      .catch(() => setError("Failed to load stock data"));
  }, [ticker]);

  function runAnalysis() {
    setLoadingAnalysis(true);
    fetch(`/api/stock/${ticker}/analysis`, { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setAnalysis(data);
        }
        setLoadingAnalysis(false);
      })
      .catch(() => {
        setError("AI analysis failed");
        setLoadingAnalysis(false);
      });
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <SearchBar className="mb-6" />
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            返回首頁
          </Link>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <SearchBar className="mb-6" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-[300px] w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  const changeColor =
    quote.change >= 0 ? "text-green-600" : "text-red-600";
  const changeSign = quote.change >= 0 ? "+" : "";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <SearchBar />

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">
            {quote.name} ({quote.ticker})
          </h1>
          <p className="text-muted-foreground text-sm">
            {quote.sector} · {quote.industry}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            {quote.currency} {quote.price.toFixed(2)}
          </div>
          <div className={`font-semibold ${changeColor}`}>
            {changeSign}
            {quote.change.toFixed(2)} ({changeSign}
            {quote.changePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* AI Recommendation */}
      {analysis && (
        <RecommendationBadge
          recommendation={analysis.recommendation}
          reason={analysis.recommendation_reason}
        />
      )}

      {!analysis && !loadingAnalysis && (
        <Button onClick={runAnalysis} className="w-full">
          運行 AI 分析
        </Button>
      )}

      {loadingAnalysis && (
        <Skeleton className="h-12 w-full" />
      )}

      {/* Price Chart */}
      <StockChart ticker={ticker} />

      {/* Company Info + Balance Sheet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CompanyInfo
          description={quote.description}
          revenueBreakdown={quote.revenueBreakdown}
        />
        {financials && <BalanceSheet data={financials.balanceSheet} />}
      </div>

      {/* News */}
      {news.length > 0 && <NewsList articles={news} />}

      {/* Competitors */}
      {competitors.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">競爭對手</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {competitors.map((c) => (
              <CompetitorCard
                key={c.ticker}
                competitor={c}
                mainTicker={ticker}
              />
            ))}
          </div>
        </div>
      )}

      {/* AI Analysis Details */}
      {analysis && <AIAnalysis analysis={analysis} />}
    </div>
  );
}
```

- [ ] **Step 3: Verify in browser**

Navigate to http://localhost:3000, search "AAPL". Expected: stock detail page loads with all sections (chart, company info, balance sheet, news, competitors). AI analysis button triggers analysis.

- [ ] **Step 4: Commit**

```bash
git add src/app/stock/ src/app/api/stock/
git commit -m "feat: add stock detail page with all data sections"
```

---

## Task 13: Competitor Comparison Page

**Files:**
- Create: `src/app/stock/[ticker]/compare/page.tsx`

- [ ] **Step 1: Create comparison page**

```tsx
// src/app/stock/[ticker]/compare/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  StockQuote,
  FinancialsData,
  CompetitorSummary,
} from "@/lib/types";

function fmt(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

interface CompanyData {
  ticker: string;
  name: string;
  totalAssets: number;
  totalLiabilities: number;
  shareholdersEquity: number;
  debtToEquity: number;
}

export default function ComparePage() {
  const params = useParams<{ ticker: string }>();
  const ticker = params.ticker;

  const [mainCompany, setMainCompany] = useState<CompanyData | null>(null);
  const [competitors, setCompetitors] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ticker) return;

    Promise.all([
      fetch(`/api/stock/${ticker}`).then((r) => r.json()),
      fetch(`/api/stock/${ticker}/financials`).then((r) => r.json()),
      fetch(`/api/stock/${ticker}/competitors`).then((r) => r.json()),
    ])
      .then(
        ([
          quoteData,
          financialsData,
          competitorsData,
        ]: [StockQuote, FinancialsData, { competitors: CompetitorSummary[] }]) => {
          const bs = financialsData.balanceSheet[0];
          setMainCompany({
            ticker: quoteData.ticker,
            name: quoteData.name,
            totalAssets: bs?.totalAssets ?? 0,
            totalLiabilities: bs?.totalLiabilities ?? 0,
            shareholdersEquity: bs?.shareholdersEquity ?? 0,
            debtToEquity: bs?.debtToEquity ?? 0,
          });

          setCompetitors(
            (competitorsData.competitors ?? []).map((c) => ({
              ticker: c.ticker,
              name: c.name,
              totalAssets: c.totalAssets,
              totalLiabilities: c.totalLiabilities,
              shareholdersEquity: c.shareholdersEquity,
              debtToEquity:
                c.shareholdersEquity !== 0
                  ? c.totalLiabilities / c.shareholdersEquity
                  : 0,
            }))
          );

          setLoading(false);
        }
      )
      .catch(() => setLoading(false));
  }, [ticker]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const allCompanies = mainCompany
    ? [mainCompany, ...competitors]
    : competitors;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/stock/${ticker}`}
          className="text-blue-600 hover:underline text-sm"
        >
          ← 返回 {ticker}
        </Link>
        <h1 className="text-2xl font-bold">競爭對手對比</h1>
      </div>

      {/* Balance Sheet Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Balance Sheet 對比</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>公司</TableHead>
                <TableHead className="text-right">Total Assets</TableHead>
                <TableHead className="text-right">Total Liabilities</TableHead>
                <TableHead className="text-right">Equity</TableHead>
                <TableHead className="text-right">D/E Ratio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allCompanies.map((company) => (
                <TableRow
                  key={company.ticker}
                  className={
                    company.ticker === ticker ? "bg-blue-50 font-semibold" : ""
                  }
                >
                  <TableCell>
                    {company.name} ({company.ticker})
                  </TableCell>
                  <TableCell className="text-right">
                    {fmt(company.totalAssets)}
                  </TableCell>
                  <TableCell className="text-right">
                    {fmt(company.totalLiabilities)}
                  </TableCell>
                  <TableCell className="text-right">
                    {fmt(company.shareholdersEquity)}
                  </TableCell>
                  <TableCell className="text-right">
                    {company.debtToEquity.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assets vs Liabilities visual comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Assets vs Liabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allCompanies.map((company) => {
              const total = company.totalAssets || 1;
              const assetPct = 100;
              const liabPct = (company.totalLiabilities / total) * 100;

              return (
                <div key={company.ticker}>
                  <div className="flex justify-between text-sm mb-1">
                    <span
                      className={
                        company.ticker === ticker ? "font-semibold" : ""
                      }
                    >
                      {company.ticker}
                    </span>
                    <span className="text-muted-foreground">
                      Assets: {fmt(company.totalAssets)} | Liabilities:{" "}
                      {fmt(company.totalLiabilities)}
                    </span>
                  </div>
                  <div className="relative h-6 bg-green-100 rounded overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-red-400 rounded-r"
                      style={{ width: `${liabPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                    <span>Liabilities {liabPct.toFixed(0)}%</span>
                    <span>Equity {(100 - liabPct).toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Navigate to http://localhost:3000/stock/AAPL/compare. Expected: comparison table with AAPL highlighted, plus visual bar chart of assets vs liabilities.

- [ ] **Step 3: Commit**

```bash
git add src/app/stock/
git commit -m "feat: add competitor comparison page with balance sheet and visual bars"
```

---

## Task 14: Integrate Cache into API Routes

**Files:**
- Modify: `src/app/api/stock/[ticker]/financials/route.ts`
- Modify: `src/app/api/stock/[ticker]/news/route.ts`
- Modify: `src/app/api/stock/[ticker]/competitors/route.ts`
- Modify: `src/app/api/stock/[ticker]/analysis/route.ts`

- [ ] **Step 1: Update financials route with cache**

```typescript
// src/app/api/stock/[ticker]/financials/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchFinancials } from "@/lib/yahoo-finance";
import { CacheHelper } from "@/lib/cache";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const cache = new CacheHelper(null); // Replace null with env.STOCK_CACHE on Cloudflare

  try {
    const cached = await cache.get(`financials:${ticker}`);
    if (cached) return NextResponse.json(cached);

    const financials = await fetchFinancials(ticker);
    await cache.set(`financials:${ticker}`, financials, 86400); // 24h
    return NextResponse.json(financials);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch financials for ${ticker}` },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Update news route with cache (TTL 1h)**

Apply same pattern to news route with `news:${ticker}` key and TTL 3600.

- [ ] **Step 3: Update competitors route with cache (TTL 7d)**

Apply same pattern to competitors route with `competitors:${ticker}` key and TTL 604800.

- [ ] **Step 4: Update analysis route with cache (TTL 24h)**

Apply same pattern to analysis route with `analysis:${ticker}` key and TTL 86400. Cache after successful AI response.

- [ ] **Step 5: Verify all routes still work**

```bash
npm run dev
curl http://localhost:3000/api/stock/AAPL/financials
curl http://localhost:3000/api/stock/AAPL/financials  # Should be faster (cached)
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/
git commit -m "feat: add caching to API routes (in-memory for dev, KV for prod)"
```

---

## Task 15: Cloudflare Deployment Config

**Files:**
- Modify: `next.config.mjs`, `wrangler.toml`, `package.json`

- [ ] **Step 1: Update next.config.mjs for Cloudflare**

```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
```

Note: `@cloudflare/next-on-pages` handles the build transformation. No special Next.js config changes needed for basic setup.

- [ ] **Step 2: Add build script to package.json**

Add to `package.json` scripts:

```json
"pages:build": "npx @cloudflare/next-on-pages",
"pages:dev": "npx wrangler pages dev .vercel/output/static --compatibility-flag=nodejs_compat",
"pages:deploy": "npm run pages:build && npx wrangler pages deploy .vercel/output/static"
```

- [ ] **Step 3: Add .gitignore entries**

Append to `.gitignore`:

```
.vercel/
.wrangler/
.superpowers/
```

- [ ] **Step 4: Verify local build**

```bash
npm run pages:build
```

Expected: Build succeeds, output in `.vercel/output/static`.

- [ ] **Step 5: Commit**

```bash
git add next.config.mjs wrangler.toml package.json .gitignore
git commit -m "feat: add Cloudflare Pages deployment config"
```

---

## Task 16: End-to-End Smoke Test

- [ ] **Step 1: Start dev server and verify full flow**

```bash
npm run dev
```

1. Open http://localhost:3000 — verify home page renders with search bar
2. Search "AAPL" — verify redirect to /stock/AAPL
3. Verify stock detail page shows: header with price, chart, company info, balance sheet, news, competitors
4. Click "運行 AI 分析" — verify analysis appears (requires OPENROUTER_API_KEY)
5. Click "查看對比 →" on a competitor — verify comparison page loads
6. Go back, search "0700.HK" — verify Hong Kong stock works

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: All unit tests pass.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup and smoke test verification"
```
