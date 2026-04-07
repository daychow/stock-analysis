// src/components/FinancialSummary.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { FinancialsData } from "@/lib/types";

interface Props { data: FinancialsData; }

function fmt(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

function GrowthBadge({ value }: { value: number }) {
  const color = value > 0 ? "text-green-600" : value < 0 ? "text-red-600" : "text-muted-foreground";
  const sign = value > 0 ? "+" : "";
  return <span className={`text-xs font-medium ${color}`}>{sign}{value.toFixed(1)}%</span>;
}

export function FinancialSummary({ data }: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Balance Sheet</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Total Assets</TableHead>
                <TableHead className="text-right">Total Liabilities</TableHead>
                <TableHead className="text-right">Equity</TableHead>
                <TableHead className="text-right">D/E</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.balanceSheet.map((row) => (
                <TableRow key={row.year}>
                  <TableCell className="font-medium">{row.year}</TableCell>
                  <TableCell className="text-right">{fmt(row.totalAssets)}</TableCell>
                  <TableCell className="text-right">{fmt(row.totalLiabilities)}</TableCell>
                  <TableCell className="text-right">{fmt(row.shareholdersEquity)}</TableCell>
                  <TableCell className="text-right">{row.debtToEquity.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {data.cashFlow.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Cash Flow</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-right">Operating CF</TableHead>
                  <TableHead className="text-right">CapEx</TableHead>
                  <TableHead className="text-right">Free CF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.cashFlow.map((row) => (
                  <TableRow key={row.year}>
                    <TableCell className="font-medium">{row.year}</TableCell>
                    <TableCell className="text-right">{fmt(row.operatingCashFlow)}</TableCell>
                    <TableCell className="text-right">{fmt(row.capitalExpenditure)}</TableCell>
                    <TableCell className="text-right">{fmt(row.freeCashFlow)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {data.quarterly.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">季度業績 (最近 4 季)</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quarter</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Net Income</TableHead>
                  <TableHead className="text-right">Operating CF</TableHead>
                  <TableHead className="text-right">FCF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.quarterly.map((row) => (
                  <TableRow key={row.quarter}>
                    <TableCell className="font-medium">{row.quarter}</TableCell>
                    <TableCell className="text-right">{fmt(row.totalRevenue)}</TableCell>
                    <TableCell className="text-right">{fmt(row.netIncome)}</TableCell>
                    <TableCell className="text-right">{fmt(row.operatingCashFlow)}</TableCell>
                    <TableCell className="text-right">{fmt(row.freeCashFlow)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {(data.revenueGrowth.length > 0 || data.netIncomeGrowth.length > 0 || data.fcfGrowth.length > 0) && (
        <Card>
          <CardHeader><CardTitle className="text-base">成長率 (YoY)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              {data.revenueGrowth.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                  <GrowthBadge value={data.revenueGrowth[0]} />
                </div>
              )}
              {data.netIncomeGrowth.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Net Income</p>
                  <GrowthBadge value={data.netIncomeGrowth[0]} />
                </div>
              )}
              {data.fcfGrowth.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Free Cash Flow</p>
                  <GrowthBadge value={data.fcfGrowth[0]} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
