import YahooFinance from "yahoo-finance2";
import type {
  StockQuote,
  FinancialsData,
  BalanceSheetEntry,
  IncomeStatementEntry,
  NewsArticle,
  CompetitorSummary,
  PriceHistoryPoint,
} from "@/lib/types";

export type Period = "1mo" | "3mo" | "1y" | "5y";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

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

export async function fetchStockQuote(ticker: string): Promise<StockQuote> {
  const result = await yf.quoteSummary(ticker, {
    modules: ["price", "assetProfile"],
  });

  const price = result.price!;
  const profile = result.assetProfile!;

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
  };
}

export async function fetchFinancials(ticker: string): Promise<FinancialsData> {
  const data = await yf.fundamentalsTimeSeries(ticker, {
    period1: new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    period2: new Date().toISOString().split("T")[0],
    type: "annual",
    module: "all",
  });

  // Sort by date descending and take up to 3 years
  const sorted = [...data].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const years = sorted.slice(0, 3);

  const balanceSheet: BalanceSheetEntry[] = years.map((row) => {
    const totalAssets = (row as Record<string, unknown>).totalAssets as number ?? 0;
    const totalLiabilities =
      ((row as Record<string, unknown>).totalLiabilitiesNetMinorityInterest as number) ?? 0;
    const equity = ((row as Record<string, unknown>).stockholdersEquity as number) ??
      ((row as Record<string, unknown>).commonStockEquity as number) ??
      totalAssets - totalLiabilities;
    const debtToEquity = equity !== 0
      ? (((row as Record<string, unknown>).totalDebt as number) ?? totalLiabilities) / equity
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
    const totalRevenue = ((row as Record<string, unknown>).totalRevenue as number) ?? 0;
    const netIncome =
      ((row as Record<string, unknown>).netIncomeCommonStockholders as number) ??
      ((row as Record<string, unknown>).netIncome as number) ??
      0;
    const grossProfit = ((row as Record<string, unknown>).grossProfit as number) ?? 0;
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

  return { balanceSheet, incomeStatement };
}

export async function fetchNews(ticker: string): Promise<NewsArticle[]> {
  const result = await yf.search(ticker, { newsCount: 10 });

  return (result.news ?? []).slice(0, 10).map((item) => ({
    title: item.title ?? "",
    url: item.link ?? "",
    source: item.publisher ?? "",
    publishedAt: item.providerPublishTime
      ? new Date(item.providerPublishTime).toISOString()
      : "",
  }));
}

export async function fetchPriceHistory(
  ticker: string,
  period: Period
): Promise<PriceHistoryPoint[]> {
  const periodMs: Record<Period, number> = {
    "1mo": 30 * 24 * 60 * 60 * 1000,
    "3mo": 90 * 24 * 60 * 60 * 1000,
    "1y": 365 * 24 * 60 * 60 * 1000,
    "5y": 5 * 365 * 24 * 60 * 60 * 1000,
  };

  const intervalMap: Record<Period, string> = {
    "1mo": "1d",
    "3mo": "1d",
    "1y": "1wk",
    "5y": "1mo",
  };

  const now = new Date();
  const start = new Date(now.getTime() - periodMs[period]);

  const result = await yf.chart(ticker, {
    period1: start,
    period2: now,
    interval: intervalMap[period] as "1d" | "1wk" | "1mo",
  });

  return (result.quotes ?? []).map((q) => ({
    date: new Date(q.date).toISOString().split("T")[0],
    close: q.close ?? 0,
    volume: q.volume ?? 0,
  }));
}

export async function fetchCompetitors(
  ticker: string
): Promise<CompetitorSummary[]> {
  let competitorTickers: string[] = [];

  // Try recommendationsBySymbol first
  try {
    const rec = await yf.recommendationsBySymbol(ticker);
    if (rec.recommendedSymbols && rec.recommendedSymbols.length > 0) {
      competitorTickers = rec.recommendedSymbols
        .slice(0, 3)
        .map((s) => s.symbol);
    }
  } catch {
    // Fall through to sector peers
  }

  // Fallback to sector peers
  if (competitorTickers.length === 0) {
    try {
      const summary = await yf.quoteSummary(ticker, {
        modules: ["assetProfile"],
      });
      const sector = summary.assetProfile?.sector ?? "";
      const peers = SECTOR_PEERS[sector] ?? [];
      competitorTickers = peers
        .filter((t) => t !== ticker)
        .slice(0, 3);
    } catch {
      return [];
    }
  }

  // Fetch data for each competitor
  const competitors: CompetitorSummary[] = [];
  for (const compTicker of competitorTickers) {
    try {
      const [quote, fundamentals] = await Promise.all([
        yf.quoteSummary(compTicker, { modules: ["price", "assetProfile"] }),
        yf.fundamentalsTimeSeries(compTicker, {
          period1: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          period2: new Date().toISOString().split("T")[0],
          type: "annual",
          module: "all",
        }),
      ]);

      const latest = fundamentals.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];

      const row = latest as Record<string, unknown> | undefined;
      const totalAssets = (row?.totalAssets as number) ?? 0;
      const totalLiabilities =
        (row?.totalLiabilitiesNetMinorityInterest as number) ?? 0;
      const equity =
        (row?.stockholdersEquity as number) ??
        (row?.commonStockEquity as number) ??
        totalAssets - totalLiabilities;

      competitors.push({
        ticker: compTicker,
        name:
          quote.price?.longName ??
          quote.price?.shortName ??
          compTicker,
        sector: quote.assetProfile?.sector ?? "",
        totalAssets,
        totalLiabilities,
        shareholdersEquity: equity,
      });
    } catch {
      // Skip this competitor if data fetch fails
    }
  }

  return competitors;
}
