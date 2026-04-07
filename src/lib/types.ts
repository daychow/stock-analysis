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
