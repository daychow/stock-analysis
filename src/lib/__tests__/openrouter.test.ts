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
};

const mockFinancials: FinancialsData = {
  balanceSheet: [{ year: "2024", totalAssets: 352600000000, totalLiabilities: 290400000000, shareholdersEquity: 62100000000, debtToEquity: 4.67 }],
  incomeStatement: [{ year: "2024", totalRevenue: 383300000000, netIncome: 97000000000, grossMargin: 0.462, netMargin: 0.253 }],
};

const mockCompetitors: CompetitorSummary[] = [
  { ticker: "MSFT", name: "Microsoft", sector: "Technology", totalAssets: 411900000000, totalLiabilities: 205700000000, shareholdersEquity: 206200000000 },
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
