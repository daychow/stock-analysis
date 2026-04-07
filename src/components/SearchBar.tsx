"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props { className?: string; }

export function SearchBar({ className }: Props) {
  const [ticker, setTicker] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = ticker.trim().toUpperCase();
    if (!cleaned) return;
    const recent = getRecentSearches();
    const updated = [cleaned, ...recent.filter((s) => s !== cleaned)].slice(0, 10);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
    router.push(`/stock/${encodeURIComponent(cleaned)}`);
  }

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className ?? ""}`}>
      <Input placeholder="輸入股票代碼 e.g. AAPL, 0700.HK" value={ticker} onChange={(e) => setTicker(e.target.value)} className="text-base" />
      <Button type="submit">搜索</Button>
    </form>
  );
}

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("recentSearches") ?? "[]"); }
  catch { return []; }
}
