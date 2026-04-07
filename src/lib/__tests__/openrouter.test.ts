// src/lib/__tests__/openrouter.test.ts
import { describe, it, expect } from "vitest";
import { buildAnalysisPrompt, parseAnalysisResponse } from "../openrouter";
import type { StockQuote, FinancialsData, CompetitorSummary, NewsArticle } from "../types";

const mockQuote: StockQuote = {
  ticker: "AAPL", name: "Apple Inc.", sector: "Technology",
  industry: "Consumer Electronics", price: 178.72, change: 2.34,
  changePercent: 1.33, currency: "USD",
  description: "Apple designs and sells electronics.",
  revenueBreakdown: "Products (78%), Services (22%)",
  marketCap: 2800000000000, trailingPE: 28.5, forwardPE: 25.2,
  priceToBook: 45.2, evToEbitda: 22.1, dividendYield: 0.5,
};

const mockFinancials: FinancialsData = {
  balanceSheet: [{ year: "2024", totalAssets: 352600000000, totalLiabilities: 290400000000, shareholdersEquity: 62100000000, debtToEquity: 4.67 }],
  incomeStatement: [{ year: "2024", totalRevenue: 383300000000, netIncome: 97000000000, grossMargin: 0.462, netMargin: 0.253 }],
  cashFlow: [{ year: "2024", operatingCashFlow: 110500000000, capitalExpenditure: -11000000000, freeCashFlow: 99500000000 }],
  quarterly: [{ quarter: "2024 Q4", totalRevenue: 95000000000, netIncome: 24000000000, operatingCashFlow: 28000000000, freeCashFlow: 25000000000 }],
  revenueGrowth: [15.2], netIncomeGrowth: [12.5], fcfGrowth: [6.8],
};

const mockCompetitors: CompetitorSummary[] = [
  { ticker: "MSFT", name: "Microsoft", sector: "Technology", totalAssets: 411900000000, totalLiabilities: 205700000000, shareholdersEquity: 206200000000,
    marketCap: 3100000000000, trailingPE: 35.2, priceToBook: 12.1 },
];

const mockNews: NewsArticle[] = [
  { title: "Apple Reports Record Revenue", url: "https://example.com", source: "Reuters", publishedAt: "2024-01-15T10:00:00Z" },
];

describe("OpenRouter helpers", () => {
  it("buildAnalysisPrompt produces string with company name", () => {
    const prompt = buildAnalysisPrompt(mockQuote, mockFinancials, mockCompetitors, mockNews);
    expect(prompt).toContain("Apple Inc.");
    expect(prompt).toContain("Balance Sheet");
    expect(prompt).toContain("MSFT");
    expect(prompt).toContain("P/E");
    expect(prompt).toContain("Cash Flow");
    expect(prompt).toContain("Growth");
  });

  it("parseAnalysisResponse extracts valid JSON", () => {
    const raw = JSON.stringify({
      summary: "Apple is a leader.", strengths: ["Brand", "Ecosystem"],
      weaknesses: ["China risk"], competitor_comparison: "Stronger than peers.",
      recommendation: "BUY", recommendation_reason: "Strong financials.",
      risk_factors: ["Market slowdown"],
    });
    const result = parseAnalysisResponse(raw);
    expect(result.recommendation).toBe("BUY");
    expect(result.strengths).toHaveLength(2);
  });

  it("parseAnalysisResponse handles markdown code block", () => {
    const raw = '```json\n{"summary":"test","strengths":[],"weaknesses":[],"competitor_comparison":"","recommendation":"WATCH","recommendation_reason":"","risk_factors":[]}\n```';
    const result = parseAnalysisResponse(raw);
    expect(result.recommendation).toBe("WATCH");
  });
});
