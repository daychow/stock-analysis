import type {
  StockQuote,
  FinancialsData,
  BalanceSheetEntry,
  IncomeStatementEntry,
  CashFlowEntry,
  QuarterlyEntry,
  NewsArticle,
  CompetitorSummary,
  PriceHistoryPoint,
} from "@/lib/types";

export type Period = "1mo" | "3mo" | "1y" | "5y";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

// ── Crumb / cookie cache ────────────────────────────────────────────
let _crumb: string | null = null;
let _cookie: string | null = null;

async function getCrumbAndCookie(): Promise<{ crumb: string; cookie: string }> {
  if (_crumb && _cookie) return { crumb: _crumb, cookie: _cookie };

  // Step 1: hit fc.yahoo.com to get a cookie
  const initRes = await fetch("https://fc.yahoo.com/", {
    headers: { "User-Agent": USER_AGENT },
    redirect: "manual",
  });
  // Collect Set-Cookie header(s)
  const setCookie = initRes.headers.get("set-cookie") ?? "";
  // We only need the cookie value (first part before ';')
  const cookie = setCookie
    .split(",")
    .map((c) => c.split(";")[0].trim())
    .filter(Boolean)
    .join("; ");

  // Step 2: fetch the crumb using that cookie
  const crumbRes = await fetch(
    "https://query2.finance.yahoo.com/v1/test/getcrumb",
    {
      headers: {
        "User-Agent": USER_AGENT,
        Cookie: cookie,
      },
    }
  );
  const crumb = await crumbRes.text();

  _crumb = crumb;
  _cookie = cookie;
  return { crumb, cookie };
}

/** Authenticated fetch helper for endpoints that need crumb+cookie */
async function yahooFetch(url: string): Promise<Response> {
  const { crumb, cookie } = await getCrumbAndCookie();
  const separator = url.includes("?") ? "&" : "?";
  return fetch(`${url}${separator}crumb=${encodeURIComponent(crumb)}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Cookie: cookie,
    },
  });
}

/** Unauthenticated fetch helper (for chart, search endpoints) */
async function yahooFetchPublic(url: string): Promise<Response> {
  return fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });
}

// ── Sector peers fallback ────────────────────────────────────────────
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

// ── Helpers ──────────────────────────────────────────────────────────

function computeGrowth(values: number[]): number[] {
  const growth: number[] = [];
  for (let i = 0; i < values.length - 1; i++) {
    const current = values[i];
    const previous = values[i + 1];
    if (previous !== 0) {
      growth.push(
        Math.round(((current - previous) / Math.abs(previous)) * 10000) / 100
      );
    } else {
      growth.push(0);
    }
  }
  return growth;
}

// ── fetchStockQuote ──────────────────────────────────────────────────

export async function fetchStockQuote(ticker: string): Promise<StockQuote> {
  const modules = "price,assetProfile,defaultKeyStatistics,summaryDetail";
  const res = await yahooFetch(
    `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules}`
  );
  const json = await res.json();
  const result = json?.quoteSummary?.result?.[0] ?? {};

  const price = result.price ?? {};
  const profile = result.assetProfile ?? {};
  const keyStats = result.defaultKeyStatistics ?? {};
  const details = result.summaryDetail ?? {};

  return {
    ticker: price.symbol ?? ticker,
    name: price.longName ?? price.shortName ?? ticker,
    sector: profile.sector ?? "",
    industry: profile.industry ?? "",
    price: price.regularMarketPrice?.raw ?? 0,
    change: price.regularMarketChange?.raw ?? 0,
    changePercent: price.regularMarketChangePercent?.raw
      ? price.regularMarketChangePercent.raw * 100
      : 0,
    currency: price.currency ?? "USD",
    description: profile.longBusinessSummary ?? "",
    revenueBreakdown: "",
    marketCap: price.marketCap?.raw ?? 0,
    trailingPE: details.trailingPE?.raw ?? 0,
    forwardPE: details.forwardPE?.raw ?? 0,
    priceToBook: keyStats.priceToBook?.raw ?? 0,
    evToEbitda: keyStats.enterpriseToEbitda?.raw ?? 0,
    dividendYield: details.dividendYield?.raw
      ? details.dividendYield.raw * 100
      : 0,
  };
}

// ── Fundamentals timeseries helper ──────────────────────────────────

const TIMESERIES_TYPES = [
  "totalAssets",
  "totalLiabilitiesNetMinorityInterest",
  "stockholdersEquity",
  "totalDebt",
  "totalRevenue",
  "netIncomeCommonStockholders",
  "grossProfit",
  "operatingCashFlow",
  "capitalExpenditure",
];

interface FundamentalsRow {
  date: string;
  [key: string]: number | string;
}

async function fetchTimeseries(
  ticker: string,
  frequency: "annual" | "quarterly",
  periodMs: number
): Promise<FundamentalsRow[]> {
  const now = Math.floor(Date.now() / 1000);
  const period1 = Math.floor((Date.now() - periodMs) / 1000);

  const prefix = frequency === "annual" ? "annual" : "quarterly";
  const types = TIMESERIES_TYPES.map(
    (t) => `${prefix}${t[0].toUpperCase()}${t.slice(1)}`
  ).join(",");

  const url =
    `https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(ticker)}` +
    `?type=${types}&period1=${period1}&period2=${now}&frequency=${frequency}`;

  const res = await yahooFetchPublic(url);
  const json = await res.json();

  const resultArr: Array<{
    meta: { type: string[] };
    timestamp?: number[];
    [key: string]: unknown;
  }> = json?.timeseries?.result ?? [];

  // Build a map: date -> row
  const rowMap = new Map<string, FundamentalsRow>();

  for (const series of resultArr) {
    const typeName = series.meta?.type?.[0]; // e.g. "annualTotalRevenue"
    if (!typeName) continue;

    // Strip the prefix ("annual" or "quarterly") to get the camelCase field name
    const fieldName =
      typeName.startsWith("annual")
        ? typeName.slice(6, 7).toLowerCase() + typeName.slice(7)
        : typeName.slice(9, 10).toLowerCase() + typeName.slice(10);

    const dataArr = (series[typeName] as Array<{
      asOfDate: string;
      reportedValue?: { raw: number };
    }>) ?? [];

    for (const entry of dataArr) {
      const date = entry.asOfDate;
      if (!date) continue;
      if (!rowMap.has(date)) {
        rowMap.set(date, { date });
      }
      const row = rowMap.get(date)!;
      row[fieldName] = entry.reportedValue?.raw ?? 0;
    }
  }

  // Sort descending by date
  return Array.from(rowMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// ── fetchFinancials ──────────────────────────────────────────────────

export async function fetchFinancials(
  ticker: string
): Promise<FinancialsData> {
  const annualRows = await fetchTimeseries(
    ticker,
    "annual",
    4 * 365 * 24 * 60 * 60 * 1000
  );
  const years = annualRows.slice(0, 3);

  const balanceSheet: BalanceSheetEntry[] = years.map((row) => {
    const totalAssets = (row.totalAssets as number) ?? 0;
    const totalLiabilities =
      (row.totalLiabilitiesNetMinorityInterest as number) ?? 0;
    const equity =
      (row.stockholdersEquity as number) ?? totalAssets - totalLiabilities;
    const debtToEquity =
      equity !== 0
        ? ((row.totalDebt as number) ?? totalLiabilities) / equity
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
    const totalRevenue = (row.totalRevenue as number) ?? 0;
    const netIncome = (row.netIncomeCommonStockholders as number) ?? 0;
    const grossProfit = (row.grossProfit as number) ?? 0;
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
    const operatingCF = (row.operatingCashFlow as number) ?? 0;
    const capex = (row.capitalExpenditure as number) ?? 0;
    return {
      year: new Date(row.date).getFullYear().toString(),
      operatingCashFlow: operatingCF,
      capitalExpenditure: capex,
      freeCashFlow: operatingCF + capex,
    };
  });

  // Quarterly data
  const qRows = await fetchTimeseries(
    ticker,
    "quarterly",
    2 * 365 * 24 * 60 * 60 * 1000
  );
  const quarters = qRows.slice(0, 4);

  const quarterly: QuarterlyEntry[] = quarters.map((row) => {
    const d = new Date(row.date);
    const q = Math.ceil((d.getMonth() + 1) / 3);
    const operatingCF = (row.operatingCashFlow as number) ?? 0;
    const capex = (row.capitalExpenditure as number) ?? 0;
    return {
      quarter: `${d.getFullYear()} Q${q}`,
      totalRevenue: (row.totalRevenue as number) ?? 0,
      netIncome: (row.netIncomeCommonStockholders as number) ?? 0,
      operatingCashFlow: operatingCF,
      freeCashFlow: operatingCF + capex,
    };
  });

  return {
    balanceSheet,
    incomeStatement,
    cashFlow,
    quarterly,
    revenueGrowth: computeGrowth(incomeStatement.map((i) => i.totalRevenue)),
    netIncomeGrowth: computeGrowth(incomeStatement.map((i) => i.netIncome)),
    fcfGrowth: computeGrowth(cashFlow.map((c) => c.freeCashFlow)),
  };
}

// ── fetchNews ────────────────────────────────────────────────────────

export async function fetchNews(ticker: string): Promise<NewsArticle[]> {
  try {
    const res = await yahooFetchPublic(
      `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&newsCount=10`
    );
    const json = await res.json();
    const news: Array<{
      title?: string;
      link?: string;
      publisher?: string;
      providerPublishTime?: number;
    }> = json?.news ?? [];

    return news.slice(0, 10).map((item) => ({
      title: item.title ?? "",
      url: item.link ?? "",
      source: item.publisher ?? "",
      publishedAt: item.providerPublishTime
        ? new Date(item.providerPublishTime * 1000).toISOString()
        : "",
    }));
  } catch {
    return [];
  }
}

// ── fetchPriceHistory ────────────────────────────────────────────────

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

  const now = Math.floor(Date.now() / 1000);
  const period1 = Math.floor((Date.now() - periodMs[period]) / 1000);

  const res = await yahooFetchPublic(
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?period1=${period1}&period2=${now}&interval=${intervalMap[period]}`
  );
  const json = await res.json();

  const result = json?.chart?.result?.[0];
  if (!result) return [];

  const timestamps: number[] = result.timestamp ?? [];
  const quotes = result.indicators?.quote?.[0] ?? {};
  const closes: (number | null)[] = quotes.close ?? [];
  const volumes: (number | null)[] = quotes.volume ?? [];

  return timestamps.map((ts, i) => ({
    date: new Date(ts * 1000).toISOString().split("T")[0],
    close: closes[i] ?? 0,
    volume: volumes[i] ?? 0,
  }));
}

// ── fetchCompetitors ─────────────────────────────────────────────────

export async function fetchCompetitors(
  ticker: string
): Promise<CompetitorSummary[]> {
  let competitorTickers: string[] = [];

  // Try recommendationsBySymbol first
  try {
    const res = await yahooFetchPublic(
      `https://query2.finance.yahoo.com/v6/finance/recommendationsbysymbol/${encodeURIComponent(ticker)}`
    );
    const json = await res.json();
    const recommended =
      json?.finance?.result?.[0]?.recommendedSymbols ?? [];
    if (recommended.length > 0) {
      competitorTickers = recommended
        .slice(0, 3)
        .map((s: { symbol: string }) => s.symbol);
    }
  } catch {
    // Fall through to sector peers
  }

  // Fallback to sector peers
  if (competitorTickers.length === 0) {
    try {
      const quote = await fetchStockQuote(ticker);
      const sector = quote.sector;
      const peers = SECTOR_PEERS[sector] ?? [];
      competitorTickers = peers.filter((t) => t !== ticker).slice(0, 3);
    } catch {
      return [];
    }
  }

  // Fetch data for each competitor
  const competitors: CompetitorSummary[] = [];
  for (const compTicker of competitorTickers) {
    try {
      const [quote, fundamentals] = await Promise.all([
        fetchStockQuote(compTicker),
        fetchTimeseries(compTicker, "annual", 2 * 365 * 24 * 60 * 60 * 1000),
      ]);

      const latest = fundamentals[0]; // Already sorted descending
      const totalAssets = (latest?.totalAssets as number) ?? 0;
      const totalLiabilities =
        (latest?.totalLiabilitiesNetMinorityInterest as number) ?? 0;
      const equity =
        (latest?.stockholdersEquity as number) ??
        totalAssets - totalLiabilities;

      competitors.push({
        ticker: compTicker,
        name: quote.name,
        sector: quote.sector,
        totalAssets,
        totalLiabilities,
        shareholdersEquity: equity,
        marketCap: quote.marketCap,
        trailingPE: quote.trailingPE,
        priceToBook: quote.priceToBook,
      });
    } catch {
      // Skip this competitor if data fetch fails
    }
  }

  return competitors;
}
