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
