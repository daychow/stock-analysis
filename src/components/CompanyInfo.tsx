import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props { description: string; revenueBreakdown: string; }

export function CompanyInfo({ description, revenueBreakdown }: Props) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">公司業務</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        {revenueBreakdown && (
          <div>
            <p className="text-sm font-semibold mb-1">盈利方式</p>
            <p className="text-sm text-muted-foreground">{revenueBreakdown}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
