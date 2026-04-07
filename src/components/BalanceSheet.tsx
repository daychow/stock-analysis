import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BalanceSheetEntry } from "@/lib/types";

interface Props { data: BalanceSheetEntry[]; }

function formatNumber(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

export function BalanceSheet({ data }: Props) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Balance Sheet 摘要</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Year</TableHead>
              <TableHead className="text-right">Total Assets</TableHead>
              <TableHead className="text-right">Total Liabilities</TableHead>
              <TableHead className="text-right">Equity</TableHead>
              <TableHead className="text-right">D/E Ratio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.year}>
                <TableCell className="font-medium">{row.year}</TableCell>
                <TableCell className="text-right">{formatNumber(row.totalAssets)}</TableCell>
                <TableCell className="text-right">{formatNumber(row.totalLiabilities)}</TableCell>
                <TableCell className="text-right">{formatNumber(row.shareholdersEquity)}</TableCell>
                <TableCell className="text-right">{row.debtToEquity.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
