# Enhanced Analysis Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add valuation metrics (P/E, P/B, EV/EBITDA), cash flow statement, and YoY growth rates to improve AI analysis accuracy.

**Architecture:** Extend existing types, yahoo-finance fetchers, and AI prompt. Add new FinancialSummary component replacing BalanceSheet. All data from yahoo-finance2's existing APIs — no new data sources.

**Tech Stack:** yahoo-finance2 (quoteSummary + fundamentalsTimeSeries), existing Next.js + React stack

---

## File Map

**Modify:**
- `src/lib/types.ts` — add CashFlowEntry, extend StockQuote, FinancialsData, CompetitorSummary
- `src/lib/yahoo-finance.ts` — extend fetchStockQuote (valuation), fetchFinancials (cash flow + growth), fetchCompetitors (valuation)
- `src/lib/openrouter.ts` — extend buildAnalysisPrompt with new data sections
- `src/components/CompetitorCard.tsx` — show valuation metrics
- `src/app/stock/[ticker]/page.tsx` — show valuation metrics in header, use FinancialSummary
- `src/app/stock/[ticker]/compare/page.tsx` — add valuation columns

**Create:**
- `src/components/FinancialSummary.tsx` — replaces BalanceSheet, adds cash flow + growth

**Delete:**
- `src/components/BalanceSheet.tsx` — replaced by FinancialSummary

**Test:**
- `src/lib/__tests__/openrouter.test.ts` — update mock data for new fields

---

## Task 1: Extend Types

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add CashFlowEntry and extend existing types**

Replace the entire content of `src/lib/types.ts` with:

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
  marketCap: number;
  trailingPE: number;
  forwardPE: number;
  priceToBook: number;
  evToEbitda: number;
  dividendYield: number;
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

export interface CashFlowEntry {
  year: string;
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;
}

export interface FinancialsData {
  balanceSheet: BalanceSheetEntry[];
  incomeStatement: IncomeStatementEntry[];
  cashFlow: CashFlowEntry[];
  revenueGrowth: number[];
  netIncomeGrowth: number[];
  fcfGrowth: number[];
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
  marketCap: number;
  trailingPE: number;
  priceToBook: number;
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
git commit -m "feat: extend types with valuation metrics, cash flow, growth rates"
```

---

## Task 2: Extend fetchStockQuote with Valuation Metrics

**Files:**
- Modify: `src/lib/yahoo-finance.ts` (lines 30-52)

- [ ] **Step 1: Update fetchStockQuote to request valuation modules and return new fields**

Replace the `fetchStockQuote` function in `src/lib/yahoo-finance.ts`:

```typescript
export async function fetchStockQuote(ticker: string): Promise<StockQuote> {
  const result = await yf.quoteSummary(ticker, {
    modules: ["price", "assetProfile", "defaultKeyStatistics", "summaryDetail"],
  });

  const price = result.price!;
  const profile = result.assetProfile!;
  const keyStats = result.defaultKeyStatistics;
  const details = result.summaryDetail;

  return {
    ticker: price.symbol ?? ticker,
    name: price.longName ?? price.shortName ?? ticker,
    sector: profile.sector ?? "",
    industry: profile.industry ?? "",
    price: price.regularMarketPrice ?? 0,
    change: price.regularMarketChange ?? 0,
    changePercent: price.regularMarketChangePercent
      ? price.regularMarketChangePercent * 100
      : 0,
    currency: price.currency ?? "USD",
    description: profile.longBusinessSummary ?? "",
    revenueBreakdown: "",
    marketCap: price.marketCap ?? 0,
    trailingPE: details?.trailingPE ?? 0,
    forwardPE: details?.forwardPE ?? 0,
    priceToBook: keyStats?.priceToBook ?? 0,
    evToEbitda: keyStats?.enterpriseToEbitda ?? 0,
    dividendYield: details?.dividendYield ? details.dividendYield * 100 : 0,
  };
}
```

- [ ] **Step 2: Run existing yahoo-finance tests to check nothing broke**

```bash
npx vitest run src/lib/__tests__/yahoo-finance.test.ts
```

Expected: Tests pass (they check fields that still exist).

- [ ] **Step 3: Commit**

```bash
git add src/lib/yahoo-finance.ts
git commit -m "feat: add valuation metrics to fetchStockQuote"
```

---

## Task 3: Extend fetchFinancials with Cash Flow + Growth Rates

**Files:**
- Modify: `src/lib/yahoo-finance.ts` (lines 54-110)

- [ ] **Step 1: Update fetchFinancials to extract cash flow and compute growth rates**

Replace the `fetchFinancials` function:

```typescript
export async function fetchFinancials(ticker: string): Promise<FinancialsData> {
  const data = await yf.fundamentalsTimeSeries(ticker, {
    period1: new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    period2: new Date().toISOString().split("T")[0],
    type: "annual",
    module: "all",
  });

  const sorted = [...data].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const years = sorted.slice(0, 3);

  const balanceSheet: BalanceSheetEntry[] = years.map((row) => {
    const r = row as Record<string, unknown>;
    const totalAssets = (r.totalAssets as number) ?? 0;
    const totalLiabilities = (r.totalLiabilitiesNetMinorityInterest as number) ?? 0;
    const equity = (r.stockholdersEquity as number) ??
      (r.commonStockEquity as number) ?? totalAssets - totalLiabilities;
    const debtToEquity = equity !== 0
      ? (((r.totalDebt as number) ?? totalLiabilities) / equity)
      : 0;

    return {
      year: new Date(row.date).getFullYear().toString(),
      totalAssets,
      totalLiabilities,
      shareholdersEquity: equity,
      debtToEquity: Math.round(debtToEquity * 100) / 100,
    };
  });

  const incomeStatement: IncomeStatementEntry[] = years.map((row) => {
    const r = row as Record<string, unknown>;
    const totalRevenue = (r.totalRevenue as number) ?? 0;
    const netIncome = (r.netIncomeCommonStockholders as number) ??
      (r.netIncome as number) ?? 0;
    const grossProfit = (r.grossProfit as number) ?? 0;
    const grossMargin = totalRevenue !== 0 ? grossProfit / totalRevenue : 0;
    const netMargin = totalRevenue !== 0 ? netIncome / totalRevenue : 0;

    return {
      year: new Date(row.date).getFullYear().toString(),
      totalRevenue,
      netIncome,
      grossMargin: Math.round(grossMargin * 10000) / 100,
      netMargin: Math.round(netMargin * 10000) / 100,
    };
  });

  const cashFlow: CashFlowEntry[] = years.map((row) => {
    const r = row as Record<string, unknown>;
    const operatingCF = (r.operatingCashFlow as number) ?? 0;
    const capex = (r.capitalExpenditure as number) ?? 0;
    return {
      year: new Date(row.date).getFullYear().toString(),
      operatingCashFlow: operatingCF,
      capitalExpenditure: capex,
      freeCashFlow: operatingCF + capex, // capex is typically negative
    };
  });

  return {
    balanceSheet,
    incomeStatement,
    cashFlow,
    revenueGrowth: computeGrowth(incomeStatement.map((i) => i.totalRevenue)),
    netIncomeGrowth: computeGrowth(incomeStatement.map((i) => i.netIncome)),
    fcfGrowth: computeGrowth(cashFlow.map((c) => c.freeCashFlow)),
  };
}

function computeGrowth(values: number[]): number[] {
  // values are newest-first: [2024, 2023, 2022]
  // returns YoY growth: [2024vs2023, 2023vs2022]
  const growth: number[] = [];
  for (let i = 0; i < values.length - 1; i++) {
    const current = values[i];
    const previous = values[i + 1];
    if (previous !== 0) {
      growth.push(Math.round(((current - previous) / Math.abs(previous)) * 10000) / 100);
    } else {
      growth.push(0);
    }
  }
  return growth;
}
```

Also add `CashFlowEntry` to the import at the top of the file:

```typescript
import type {
  StockQuote,
  FinancialsData,
  BalanceSheetEntry,
  IncomeStatementEntry,
  CashFlowEntry,
  NewsArticle,
  CompetitorSummary,
  PriceHistoryPoint,
} from "@/lib/types";
```

- [ ] **Step 2: Run tests**

```bash
npx vitest run src/lib/__tests__/yahoo-finance.test.ts
```

Expected: Existing tests pass. The `fetchFinancials` test should still pass since balanceSheet and incomeStatement fields are unchanged.

- [ ] **Step 3: Commit**

```bash
git add src/lib/yahoo-finance.ts
git commit -m "feat: add cash flow and growth rates to fetchFinancials"
```

---

## Task 4: Extend fetchCompetitors with Valuation Metrics

**Files:**
- Modify: `src/lib/yahoo-finance.ts` (lines 159-238, the fetchCompetitors + competitor detail section)

- [ ] **Step 1: Update competitor data fetching to include valuation metrics**

In the `fetchCompetitors` function, find the section inside the `for` loop where `competitors.push(...)` is called (around line 221) and update it to also fetch valuation data. The `quoteSummary` call already returns `price` — just also request `defaultKeyStatistics` and `summaryDetail`:

Replace the line:
```typescript
const [quote, fundamentals] = await Promise.all([
  yf.quoteSummary(compTicker, { modules: ["price", "assetProfile"] }),
```
with:
```typescript
const [quote, fundamentals] = await Promise.all([
  yf.quoteSummary(compTicker, { modules: ["price", "assetProfile", "defaultKeyStatistics", "summaryDetail"] }),
```

Then update the `competitors.push(...)` block to include:
```typescript
competitors.push({
  ticker: compTicker,
  name: quote.price?.longName ?? quote.price?.shortName ?? compTicker,
  sector: quote.assetProfile?.sector ?? "",
  totalAssets,
  totalLiabilities,
  shareholdersEquity: equity,
  marketCap: quote.price?.marketCap ?? 0,
  trailingPE: quote.summaryDetail?.trailingPE ?? 0,
  priceToBook: quote.defaultKeyStatistics?.priceToBook ?? 0,
});
```

- [ ] **Step 2: Run tests**

```bash
npx vitest run src/lib/__tests__/yahoo-finance.test.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/yahoo-finance.ts
git commit -m "feat: add valuation metrics to competitor data"
```

---

## Task 5: Extend AI Prompt with New Data

**Files:**
- Modify: `src/lib/openrouter.ts`
- Modify: `src/lib/__tests__/openrouter.test.ts`

- [ ] **Step 1: Update test mock data to include new fields**

In `src/lib/__tests__/openrouter.test.ts`, update the mock objects:

Add to `mockQuote`:
```typescript
marketCap: 2800000000000,
trailingPE: 28.5,
forwardPE: 25.2,
priceToBook: 45.2,
evToEbitda: 22.1,
dividendYield: 0.5,
```

Add to `mockFinancials`:
```typescript
cashFlow: [{ year: "2024", operatingCashFlow: 110500000000, capitalExpenditure: -11000000000, freeCashFlow: 99500000000 }],
revenueGrowth: [15.2],
netIncomeGrowth: [12.5],
fcfGrowth: [6.8],
```

Add to `mockCompetitors[0]`:
```typescript
marketCap: 3100000000000,
trailingPE: 35.2,
priceToBook: 12.1,
```

Update the test assertion for `buildAnalysisPrompt` to also check:
```typescript
expect(prompt).toContain("P/E");
expect(prompt).toContain("Cash Flow");
expect(prompt).toContain("Growth");
```

- [ ] **Step 2: Run tests to see them fail**

```bash
npx vitest run src/lib/__tests__/openrouter.test.ts
```

Expected: FAIL — mock data missing new fields.

- [ ] **Step 3: Update buildAnalysisPrompt in openrouter.ts**

Replace the `buildAnalysisPrompt` function:

```typescript
export function buildAnalysisPrompt(
  quote: StockQuote, financials: FinancialsData,
  competitors: CompetitorSummary[], news: NewsArticle[]
): string {
  const bsRows = financials.balanceSheet
    .map(b => `${b.year}: Assets=$${fmt(b.totalAssets)}, Liabilities=$${fmt(b.totalLiabilities)}, Equity=$${fmt(b.shareholdersEquity)}, D/E=${b.debtToEquity.toFixed(2)}`)
    .join("\n");

  const isRows = financials.incomeStatement
    .map(i => `${i.year}: Revenue=$${fmt(i.totalRevenue)}, Net Income=$${fmt(i.netIncome)}, Gross Margin=${i.grossMargin.toFixed(1)}%, Net Margin=${i.netMargin.toFixed(1)}%`)
    .join("\n");

  const cfRows = financials.cashFlow
    .map(c => `${c.year}: Operating CF=$${fmt(c.operatingCashFlow)}, CapEx=$${fmt(c.capitalExpenditure)}, FCF=$${fmt(c.freeCashFlow)}`)
    .join("\n");

  const growthSection = [
    financials.revenueGrowth.length > 0 ? `Revenue: ${financials.revenueGrowth.map(g => `${g > 0 ? "+" : ""}${g}%`).join(", ")}` : null,
    financials.netIncomeGrowth.length > 0 ? `Net Income: ${financials.netIncomeGrowth.map(g => `${g > 0 ? "+" : ""}${g}%`).join(", ")}` : null,
    financials.fcfGrowth.length > 0 ? `FCF: ${financials.fcfGrowth.map(g => `${g > 0 ? "+" : ""}${g}%`).join(", ")}` : null,
  ].filter(Boolean).join("\n");

  const compRows = competitors
    .map(c => `${c.ticker} (${c.name}): Market Cap=$${fmt(c.marketCap)}, P/E=${c.trailingPE.toFixed(1)}, P/B=${c.priceToBook.toFixed(1)}, Assets=$${fmt(c.totalAssets)}, Liabilities=$${fmt(c.totalLiabilities)}`)
    .join("\n");

  const newsRows = news.slice(0, 5).map(n => `- ${n.title}`).join("\n");

  return `Analyze the following stock and provide an investment recommendation.

## Company: ${quote.name} (${quote.ticker})
- Sector: ${quote.sector}
- Industry: ${quote.industry}
- Current Price: ${quote.currency} ${quote.price}
- Business: ${quote.description}

## Valuation Metrics
Market Cap: $${fmt(quote.marketCap)}
Trailing P/E: ${quote.trailingPE.toFixed(1)} | Forward P/E: ${quote.forwardPE.toFixed(1)}
P/B: ${quote.priceToBook.toFixed(1)} | EV/EBITDA: ${quote.evToEbitda.toFixed(1)}
Dividend Yield: ${quote.dividendYield.toFixed(1)}%

## Balance Sheet (last 3 years)
${bsRows}

## Income Statement (last 3 years)
${isRows}

## Cash Flow (last 3 years)
${cfRows}

## Growth Rates (YoY)
${growthSection}

## Competitor Valuations
${compRows}

## Recent News
${newsRows}

請用繁體中文回覆。Respond with ONLY a JSON object (no markdown, no explanation) in this exact format:
{
  "summary": "2-3句公司概況（繁體中文）",
  "strengths": ["強項1", "強項2", "強項3"],
  "weaknesses": ["弱項1", "弱項2", "弱項3"],
  "competitor_comparison": "3-4句同競爭對手嘅比較分析（繁體中文）",
  "recommendation": "BUY or WATCH or SELL",
  "recommendation_reason": "2-3句建議原因（繁體中文）",
  "risk_factors": ["風險1", "風險2"]
}`;
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/lib/__tests__/openrouter.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/openrouter.ts src/lib/__tests__/openrouter.test.ts
git commit -m "feat: extend AI prompt with valuation, cash flow, and growth data"
```

---

## Task 6: Create FinancialSummary Component (replaces BalanceSheet)

**Files:**
- Create: `src/components/FinancialSummary.tsx`
- Delete: `src/components/BalanceSheet.tsx`

- [ ] **Step 1: Create FinancialSummary component**

```tsx
// src/components/FinancialSummary.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { FinancialsData } from "@/lib/types";

interface Props {
  data: FinancialsData;
}

function fmt(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

function GrowthBadge({ value }: { value: number }) {
  const color = value > 0 ? "text-green-600" : value < 0 ? "text-red-600" : "text-muted-foreground";
  const sign = value > 0 ? "+" : "";
  return <span className={`text-xs font-medium ${color}`}>{sign}{value.toFixed(1)}%</span>;
}

export function FinancialSummary({ data }: Props) {
  return (
    <div className="space-y-4">
      {/* Balance Sheet */}
      <Card>
        <CardHeader><CardTitle className="text-base">Balance Sheet</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Total Assets</TableHead>
                <TableHead className="text-right">Total Liabilities</TableHead>
                <TableHead className="text-right">Equity</TableHead>
                <TableHead className="text-right">D/E</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.balanceSheet.map((row) => (
                <TableRow key={row.year}>
                  <TableCell className="font-medium">{row.year}</TableCell>
                  <TableCell className="text-right">{fmt(row.totalAssets)}</TableCell>
                  <TableCell className="text-right">{fmt(row.totalLiabilities)}</TableCell>
                  <TableCell className="text-right">{fmt(row.shareholdersEquity)}</TableCell>
                  <TableCell className="text-right">{row.debtToEquity.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cash Flow */}
      {data.cashFlow.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Cash Flow</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-right">Operating CF</TableHead>
                  <TableHead className="text-right">CapEx</TableHead>
                  <TableHead className="text-right">Free CF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.cashFlow.map((row) => (
                  <TableRow key={row.year}>
                    <TableCell className="font-medium">{row.year}</TableCell>
                    <TableCell className="text-right">{fmt(row.operatingCashFlow)}</TableCell>
                    <TableCell className="text-right">{fmt(row.capitalExpenditure)}</TableCell>
                    <TableCell className="text-right">{fmt(row.freeCashFlow)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Growth Rates */}
      {(data.revenueGrowth.length > 0 || data.netIncomeGrowth.length > 0 || data.fcfGrowth.length > 0) && (
        <Card>
          <CardHeader><CardTitle className="text-base">成長率 (YoY)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              {data.revenueGrowth.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                  <GrowthBadge value={data.revenueGrowth[0]} />
                </div>
              )}
              {data.netIncomeGrowth.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Net Income</p>
                  <GrowthBadge value={data.netIncomeGrowth[0]} />
                </div>
              )}
              {data.fcfGrowth.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Free Cash Flow</p>
                  <GrowthBadge value={data.fcfGrowth[0]} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Delete BalanceSheet.tsx**

```bash
rm src/components/BalanceSheet.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/components/FinancialSummary.tsx
git rm src/components/BalanceSheet.tsx
git commit -m "feat: replace BalanceSheet with FinancialSummary (adds cash flow + growth)"
```

---

## Task 7: Update CompetitorCard with Valuation Metrics

**Files:**
- Modify: `src/components/CompetitorCard.tsx`

- [ ] **Step 1: Update CompetitorCard to show valuation metrics**

Replace the entire content of `src/components/CompetitorCard.tsx`:

```tsx
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { CompetitorSummary } from "@/lib/types";

interface Props { competitor: CompetitorSummary; mainTicker: string; }

function fmt(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

export function CompetitorCard({ competitor, mainTicker }: Props) {
  return (
    <Card className="hover:border-blue-300 transition-colors">
      <CardContent className="pt-4">
        <div className="font-semibold">{competitor.name} ({competitor.ticker})</div>
        <div className="text-xs text-muted-foreground mb-2">{competitor.sector}</div>
        <div className="text-sm space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">Market Cap</span><span>{fmt(competitor.marketCap)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">P/E</span><span>{competitor.trailingPE > 0 ? competitor.trailingPE.toFixed(1) : "N/A"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">P/B</span><span>{competitor.priceToBook > 0 ? competitor.priceToBook.toFixed(1) : "N/A"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Assets</span><span>{fmt(competitor.totalAssets)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Liabilities</span><span>{fmt(competitor.totalLiabilities)}</span></div>
        </div>
        <Link href={`/stock/${mainTicker}/compare`} className="text-xs text-blue-600 hover:underline mt-3 inline-block">查看對比 →</Link>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CompetitorCard.tsx
git commit -m "feat: add valuation metrics to CompetitorCard"
```

---

## Task 8: Update Stock Detail Page

**Files:**
- Modify: `src/app/stock/[ticker]/page.tsx`

- [ ] **Step 1: Update imports and add valuation display**

In `src/app/stock/[ticker]/page.tsx`:

Replace the import:
```typescript
import { BalanceSheet } from "@/components/BalanceSheet";
```
with:
```typescript
import { FinancialSummary } from "@/components/FinancialSummary";
```

Replace the `{/* Company Info + Balance Sheet */}` section (around line 119-123):
```tsx
      {/* Company Info + Balance Sheet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CompanyInfo description={quote.description} revenueBreakdown={quote.revenueBreakdown} />
        {financials && <BalanceSheet data={financials.balanceSheet} />}
      </div>
```
with:
```tsx
      {/* Valuation Metrics */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "Market Cap", value: fmtNum(quote.marketCap) },
          { label: "P/E (TTM)", value: quote.trailingPE > 0 ? quote.trailingPE.toFixed(1) : "N/A" },
          { label: "P/E (Fwd)", value: quote.forwardPE > 0 ? quote.forwardPE.toFixed(1) : "N/A" },
          { label: "P/B", value: quote.priceToBook > 0 ? quote.priceToBook.toFixed(1) : "N/A" },
          { label: "EV/EBITDA", value: quote.evToEbitda > 0 ? quote.evToEbitda.toFixed(1) : "N/A" },
          { label: "Div Yield", value: quote.dividendYield > 0 ? `${quote.dividendYield.toFixed(1)}%` : "N/A" },
        ].map((m) => (
          <div key={m.label} className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="text-sm font-semibold">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Company Info */}
      <CompanyInfo description={quote.description} revenueBreakdown={quote.revenueBreakdown} />

      {/* Financial Summary */}
      {financials && <FinancialSummary data={financials} />}
```

Add a helper function at the top of the component (after the state declarations):
```typescript
function fmtNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Navigate to http://localhost:3000/stock/AAPL. Expected: valuation metrics row visible below header, financial summary with BS + Cash Flow + Growth below company info.

- [ ] **Step 3: Commit**

```bash
git add src/app/stock/
git commit -m "feat: add valuation metrics and financial summary to stock detail page"
```

---

## Task 9: Update Comparison Page with Valuation Columns

**Files:**
- Modify: `src/app/stock/[ticker]/compare/page.tsx`

- [ ] **Step 1: Update CompanyData interface and comparison table**

In `src/app/stock/[ticker]/compare/page.tsx`, update the `CompanyData` interface:

```typescript
interface CompanyData {
  ticker: string; name: string;
  totalAssets: number; totalLiabilities: number;
  shareholdersEquity: number; debtToEquity: number;
  marketCap: number; trailingPE: number; priceToBook: number;
}
```

Update the `setMainCompany` call to include new fields:
```typescript
setMainCompany({
  ticker: quoteData.ticker, name: quoteData.name,
  totalAssets: bs?.totalAssets ?? 0, totalLiabilities: bs?.totalLiabilities ?? 0,
  shareholdersEquity: bs?.shareholdersEquity ?? 0,
  debtToEquity: bs?.debtToEquity ?? 0,
  marketCap: quoteData.marketCap ?? 0,
  trailingPE: quoteData.trailingPE ?? 0,
  priceToBook: quoteData.priceToBook ?? 0,
});
```

Update the `setCompetitors` mapping to include:
```typescript
marketCap: c.marketCap ?? 0,
trailingPE: c.trailingPE ?? 0,
priceToBook: c.priceToBook ?? 0,
```

Add a new Card between the existing Balance Sheet table and Assets vs Liabilities card:

```tsx
{/* Valuation Comparison */}
<Card>
  <CardHeader><CardTitle>估值指標對比</CardTitle></CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>公司</TableHead>
          <TableHead className="text-right">Market Cap</TableHead>
          <TableHead className="text-right">P/E</TableHead>
          <TableHead className="text-right">P/B</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {allCompanies.map((company) => (
          <TableRow key={company.ticker} className={company.ticker === ticker ? "bg-blue-50 font-semibold" : ""}>
            <TableCell>{company.name} ({company.ticker})</TableCell>
            <TableCell className="text-right">{fmt(company.marketCap)}</TableCell>
            <TableCell className="text-right">{company.trailingPE > 0 ? company.trailingPE.toFixed(1) : "N/A"}</TableCell>
            <TableCell className="text-right">{company.priceToBook > 0 ? company.priceToBook.toFixed(1) : "N/A"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

- [ ] **Step 2: Verify in browser**

Navigate to http://localhost:3000/stock/AAPL/compare. Expected: new valuation comparison table visible.

- [ ] **Step 3: Commit**

```bash
git add src/app/stock/
git commit -m "feat: add valuation comparison to competitor page"
```

---

## Task 10: Run All Tests + Smoke Test

- [ ] **Step 1: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 2: Manual smoke test**

```bash
npm run dev
```

1. http://localhost:3000/stock/AAPL — verify valuation metrics row, cash flow table, growth rates
2. http://localhost:3000/stock/AAPL/compare — verify valuation comparison table
3. Click "運行 AI 分析" — verify AI response references valuation/cash flow data

- [ ] **Step 3: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: enhanced analysis data - final cleanup"
```
