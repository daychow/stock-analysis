import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NewsArticle } from "@/lib/types";

interface Props { articles: NewsArticle[]; }

export function NewsList({ articles }: Props) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">最新新聞</CardTitle></CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {articles.map((article, i) => (
            <li key={i}>
              <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{article.title}</a>
              <div className="text-xs text-muted-foreground mt-0.5">
                {article.source}{article.publishedAt && ` · ${new Date(article.publishedAt).toLocaleDateString()}`}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
