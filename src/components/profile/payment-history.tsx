import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentHistoryProps {
  transactions: Array<{
    id: string;
    amount: number;
    type: 'credit' | 'debit';
    description: string;
    reference_id?: string;
    created_at: string;
  }>;
}

export function PaymentHistory({ transactions }: PaymentHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>View your recent wallet transactions and payments</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Receipt className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No transactions yet</p>
            <p className="text-xs text-muted-foreground mt-1">Your payment history will appear here</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm">
                      {new Date(tx.created_at).toLocaleDateString(undefined, { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {tx.type === 'credit' ? (
                          <div className="h-6 w-6 rounded bg-green-500/10 flex items-center justify-center">
                            <ArrowDownRight className="h-3 w-3 text-green-500" />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded bg-red-500/10 flex items-center justify-center">
                            <ArrowUpRight className="h-3 w-3 text-red-500" />
                          </div>
                        )}
                        <span className="text-sm font-medium">{tx.description}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {tx.reference_id || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "text-sm font-semibold",
                        tx.type === 'credit' ? "text-green-500" : "text-foreground"
                      )}>
                        {tx.type === 'credit' ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(2)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
