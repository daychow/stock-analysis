"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { StockQuote, FinancialsData, CompetitorSummary } from "@/lib/types";

function fmt(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

interface CompanyData {
  ticker: string; name: string;
  totalAssets: number; totalLiabilities: number;
  shareholdersEquity: number; debtToEquity: number;
  marketCap: number; trailingPE: number; priceToBook: number;
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
      .then(([quoteData, financialsData, competitorsData]: [StockQuote, FinancialsData, { competitors: CompetitorSummary[] }]) => {
        const bs = financialsData.balanceSheet[0];
        setMainCompany({
          ticker: quoteData.ticker, name: quoteData.name,
          totalAssets: bs?.totalAssets ?? 0, totalLiabilities: bs?.totalLiabilities ?? 0,
          shareholdersEquity: bs?.shareholdersEquity ?? 0,
          debtToEquity: bs?.debtToEquity ?? 0,
          marketCap: quoteData.marketCap ?? 0, trailingPE: quoteData.trailingPE ?? 0, priceToBook: quoteData.priceToBook ?? 0,
        });
        setCompetitors((competitorsData.competitors ?? []).map((c) => ({
          ticker: c.ticker, name: c.name,
          totalAssets: c.totalAssets, totalLiabilities: c.totalLiabilities,
          shareholdersEquity: c.shareholdersEquity,
          debtToEquity: c.shareholdersEquity !== 0 ? c.totalLiabilities / c.shareholdersEquity : 0,
          marketCap: c.marketCap ?? 0, trailingPE: c.trailingPE ?? 0, priceToBook: c.priceToBook ?? 0,
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ticker]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-64" /><Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const allCompanies = mainCompany ? [mainCompany, ...competitors] : competitors;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/stock/${ticker}`} className="text-blue-600 hover:underline text-sm">← 返回 {ticker}</Link>
        <h1 className="text-2xl font-bold">競爭對手對比</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Balance Sheet 對比</CardTitle></CardHeader>
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
                <TableRow key={company.ticker} className={company.ticker === ticker ? "bg-blue-50 font-semibold" : ""}>
                  <TableCell>{company.name} ({company.ticker})</TableCell>
                  <TableCell className="text-right">{fmt(company.totalAssets)}</TableCell>
                  <TableCell className="text-right">{fmt(company.totalLiabilities)}</TableCell>
                  <TableCell className="text-right">{fmt(company.shareholdersEquity)}</TableCell>
                  <TableCell className="text-right">{company.debtToEquity.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                <TableRow key={`val-${company.ticker}`} className={company.ticker === ticker ? "bg-blue-50 font-semibold" : ""}>
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

      <Card>
        <CardHeader><CardTitle>Assets vs Liabilities</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allCompanies.map((company) => {
              const total = company.totalAssets || 1;
              const liabPct = (company.totalLiabilities / total) * 100;
              return (
                <div key={company.ticker}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={company.ticker === ticker ? "font-semibold" : ""}>{company.ticker}</span>
                    <span className="text-muted-foreground">Assets: {fmt(company.totalAssets)} | Liabilities: {fmt(company.totalLiabilities)}</span>
                  </div>
                  <div className="relative h-6 bg-green-100 rounded overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-red-400 rounded-r" style={{ width: `${liabPct}%` }} />
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
