"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { SearchBar, getRecentSearches } from "@/components/SearchBar";

export default function HomePage() {
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => { setRecent(getRecentSearches()); }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-3xl font-bold mb-2">Stock Analysis</h1>
      <p className="text-muted-foreground mb-8">輸入股票代碼開始分析</p>
      <SearchBar className="w-full max-w-lg" />
      {recent.length > 0 && (
        <div className="mt-6 text-sm text-muted-foreground">
          <span>最近搜索：</span>
          {recent.map((ticker) => (
            <Link key={ticker} href={`/stock/${ticker}`} className="inline-block mx-1 px-3 py-1 bg-muted rounded-full hover:bg-muted-foreground/10 transition">
              {ticker}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
