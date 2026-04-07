"use client";
import { Badge } from "@/components/ui/badge";
import type { Recommendation } from "@/lib/types";

const config: Record<Recommendation, { label: string; className: string }> = {
  BUY: { label: "買入 BUY", className: "bg-green-500 hover:bg-green-600 text-white" },
  WATCH: { label: "觀察 WATCH", className: "bg-yellow-500 hover:bg-yellow-600 text-white" },
  SELL: { label: "賣出 SELL", className: "bg-red-500 hover:bg-red-600 text-white" },
};

interface Props { recommendation: Recommendation; reason: string; }

export function RecommendationBadge({ recommendation, reason }: Props) {
  const { label, className } = config[recommendation];
  const bgMap: Record<Recommendation, string> = {
    BUY: "bg-green-50 border-green-200", WATCH: "bg-yellow-50 border-yellow-200", SELL: "bg-red-50 border-red-200",
  };
  const textMap: Record<Recommendation, string> = {
    BUY: "text-green-800", WATCH: "text-yellow-800", SELL: "text-red-800",
  };

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 ${bgMap[recommendation]}`}>
      <Badge className={className}>{label}</Badge>
      <span className={`text-sm ${textMap[recommendation]}`}>{reason}</span>
    </div>
  );
}
