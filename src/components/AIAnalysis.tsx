import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AIAnalysisResult } from "@/lib/types";

interface Props { analysis: AIAnalysisResult; }

export function AIAnalysis({ analysis }: Props) {
  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader><CardTitle className="text-base">AI 分析</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed">{analysis.summary}</p>
        <div>
          <p className="text-sm font-semibold text-green-700 mb-1">強項</p>
          <ul className="text-sm space-y-1 pl-4">
            {analysis.strengths.map((s, i) => (<li key={i} className="list-disc text-muted-foreground">{s}</li>))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-red-700 mb-1">弱項</p>
          <ul className="text-sm space-y-1 pl-4">
            {analysis.weaknesses.map((w, i) => (<li key={i} className="list-disc text-muted-foreground">{w}</li>))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold mb-1">競爭對手比較</p>
          <p className="text-sm text-muted-foreground">{analysis.competitor_comparison}</p>
        </div>
        <div>
          <p className="text-sm font-semibold mb-1">風險因素</p>
          <ul className="text-sm space-y-1 pl-4">
            {analysis.risk_factors.map((r, i) => (<li key={i} className="list-disc text-muted-foreground">{r}</li>))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
