"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { StockChart } from "@/components/StockChart";
import { CompanyInfo } from "@/components/CompanyInfo";
import { FinancialSummary } from "@/components/FinancialSummary";
import { NewsList } from "@/components/NewsList";
import { CompetitorCard } from "@/components/CompetitorCard";
import { AIAnalysis } from "@/components/AIAnalysis";
import { RecommendationBadge } from "@/components/RecommendationBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { StockQuote, FinancialsData, NewsArticle, CompetitorSummary, AIAnalysisResult } from "@/lib/types";

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
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    setError(null);

    Promise.all([
      fetch(`/api/stock/${ticker}`).then((r) => r.json()),
      fetch(`/api/stock/${ticker}/financials`).then((r) => r.json()),
      fetch(`/api/stock/${ticker}/news`).then((r) => r.json()),
      fetch(`/api/stock/${ticker}/competitors`).then((r) => r.json()),
    ])
      .then(([quoteData, financialsData, newsData, competitorsData]) => {
        if (quoteData.error) { setError(quoteData.error); return; }
        setQuote(quoteData);
        setFinancials(financialsData);
        setNews(newsData.news ?? []);
        setCompetitors(competitorsData.competitors ?? []);
      })
      .catch(() => setError("Failed to load stock data"));
  }, [ticker]);

  function runAnalysis() {
    setLoadingAnalysis(true);
    setAnalysisError(null);
    fetch(`/api/stock/${ticker}/analysis`, { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setAnalysisError(data.error); } else { setAnalysis(data); }
        setLoadingAnalysis(false);
      })
      .catch(() => { setAnalysisError("AI 分析失敗，請確認 OPENROUTER_API_KEY 已設定"); setLoadingAnalysis(false); });
  }

  function fmtNum(n: number): string {
    if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    return `$${n.toFixed(0)}`;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <SearchBar className="mb-6" />
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/" className="text-blue-600 hover:underline">返回首頁</Link>
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
        <div className="grid grid-cols-2 gap-4"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
      </div>
    );
  }

  const changeColor = quote.change >= 0 ? "text-green-600" : "text-red-600";
  const changeSign = quote.change >= 0 ? "+" : "";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <SearchBar />

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{quote.name} ({quote.ticker})</h1>
          <p className="text-muted-foreground text-sm">{quote.sector} · {quote.industry}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{quote.currency} {quote.price.toFixed(2)}</div>
          <div className={`font-semibold ${changeColor}`}>
            {changeSign}{quote.change.toFixed(2)} ({changeSign}{quote.changePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* AI Recommendation */}
      {analysis && <RecommendationBadge recommendation={analysis.recommendation} reason={analysis.recommendation_reason} />}
      {!analysis && !loadingAnalysis && (
        <div>
          <Button onClick={runAnalysis} className="w-full">運行 AI 分析</Button>
          {analysisError && <p className="text-red-500 text-sm mt-2 text-center">{analysisError}</p>}
        </div>
      )}
      {loadingAnalysis && <Skeleton className="h-12 w-full" />}

      {/* Price Chart */}
      <StockChart ticker={ticker} />

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

      {/* News */}
      {news.length > 0 && <NewsList articles={news} />}

      {/* Competitors */}
      {competitors.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">競爭對手</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {competitors.map((c) => (<CompetitorCard key={c.ticker} competitor={c} mainTicker={ticker} />))}
          </div>
        </div>
      )}

      {/* AI Analysis Details */}
      {analysis && <AIAnalysis analysis={analysis} />}
    </div>
  );
}
