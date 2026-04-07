"use client";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PriceHistoryPoint } from "@/lib/types";

type Period = "1mo" | "3mo" | "1y" | "5y";
const periods: { value: Period; label: string }[] = [
  { value: "1mo", label: "1M" }, { value: "3mo", label: "3M" },
  { value: "1y", label: "1Y" }, { value: "5y", label: "5Y" },
];

interface Props { ticker: string; }

export function StockChart({ ticker }: Props) {
  const [period, setPeriod] = useState<Period>("1mo");
  const [data, setData] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stock/${ticker}?period=${period}`)
      .then((r) => r.json())
      .then((json) => { setData(json.history ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ticker, period]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">股價走勢</CardTitle>
        <div className="flex gap-1">
          {periods.map((p) => (
            <Button key={p.value} variant={period === p.value ? "default" : "outline"} size="sm" onClick={() => setPeriod(p.value)}>
              {p.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => { const d = new Date(v); return `${d.getMonth() + 1}/${d.getDate()}`; }} />
              <YAxis tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
              <Tooltip />
              <Line type="monotone" dataKey="close" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
