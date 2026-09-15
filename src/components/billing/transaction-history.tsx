"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type Transaction = {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  status: 'success' | 'pending' | 'failed';
  created_at: string;
};

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const filteredTransactions = transactions.filter((tx) => 
    filter === "all" ? true : tx.type === filter
  );

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const currentTransactions = filteredTransactions.slice(
    (page - 1) * itemsPerPage, 
    page * itemsPerPage
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>View your recent billing activities</CardDescription>
          </div>
          <Select value={filter} onValueChange={(val) => { setFilter(val ?? "all"); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="credit">Credits</SelectItem>
              <SelectItem value="debit">Debits</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {currentTransactions.length > 0 ? (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {format(new Date(tx.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={tx.type === 'credit' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}
                        >
                          {tx.type === 'credit' ? (
                            <ArrowDownRight className="mr-1 h-3 w-3" />
                          ) : (
                            <ArrowUpRight className="mr-1 h-3 w-3" />
                          )}
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          tx.status === 'success' ? 'default' : 
                          tx.status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-bold ${tx.type === 'credit' ? 'text-green-600' : ''}`}>
                        {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-end space-x-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No transactions found.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
