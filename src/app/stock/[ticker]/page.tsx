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
    fetch(`/api/stock/${ticker}/analysis`, { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); } else { setAnalysis(data); }
        setLoadingAnalysis(false);
      })
      .catch(() => { setError("AI analysis failed"); setLoadingAnalysis(false); });
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
      {!analysis && !loadingAnalysis && <Button onClick={runAnalysis} className="w-full">運行 AI 分析</Button>}
      {loadingAnalysis && <Skeleton className="h-12 w-full" />}

      {/* Price Chart */}
      <StockChart ticker={ticker} />

      {/* Company Info + Balance Sheet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CompanyInfo description={quote.description} revenueBreakdown={quote.revenueBreakdown} />
        {financials && <BalanceSheet data={financials.balanceSheet} />}
      </div>

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
