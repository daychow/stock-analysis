import { describe, it, expect } from "vitest";
import {
  fetchStockQuote,
  fetchFinancials,
  fetchNews,
  fetchPriceHistory,
  fetchCompetitors,
} from "@/lib/yahoo-finance";

describe("Yahoo Finance Library", () => {
  it("fetchStockQuote returns valid data for AAPL", async () => {
    const quote = await fetchStockQuote("AAPL");
    expect(quote.ticker).toBe("AAPL");
    expect(quote.name).toBeTruthy();
    expect(quote.price).toBeGreaterThan(0);
    expect(quote.sector).toBeTruthy();
    expect(quote.industry).toBeTruthy();
    expect(quote.currency).toBeTruthy();
  }, 30000);

  it("fetchFinancials returns non-empty balance sheet and income statement", async () => {
    const data = await fetchFinancials("AAPL");
    expect(data.balanceSheet.length).toBeGreaterThan(0);
    expect(data.incomeStatement.length).toBeGreaterThan(0);
    expect(data.balanceSheet[0].totalAssets).toBeGreaterThan(0);
    expect(data.incomeStatement[0].totalRevenue).toBeGreaterThan(0);
  }, 30000);

  it("fetchNews returns articles with titles", async () => {
    const articles = await fetchNews("AAPL");
    expect(articles.length).toBeGreaterThan(0);
    expect(articles.length).toBeLessThanOrEqual(10);
    expect(articles[0].title).toBeTruthy();
    expect(articles[0].url).toBeTruthy();
  }, 30000);

  it("fetchPriceHistory returns price points for 1mo", async () => {
    const points = await fetchPriceHistory("AAPL", "1mo");
    expect(points.length).toBeGreaterThan(0);
    expect(points[0].close).toBeGreaterThan(0);
    expect(points[0].date).toBeTruthy();
    expect(points[0].volume).toBeGreaterThanOrEqual(0);
  }, 30000);

  it("fetchCompetitors returns 1-3 competitors", async () => {
    const competitors = await fetchCompetitors("AAPL");
    expect(competitors.length).toBeGreaterThanOrEqual(1);
    expect(competitors.length).toBeLessThanOrEqual(3);
    expect(competitors[0].ticker).toBeTruthy();
    expect(competitors[0].name).toBeTruthy();
  }, 30000);
});
