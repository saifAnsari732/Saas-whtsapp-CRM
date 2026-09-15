"use client";

import { AlertTriangle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface WalletCardProps {
  balance: number;
  lowBalanceThreshold: number;
  onAddFunds: (amount: number) => void;
}

export function WalletCard({ balance, lowBalanceThreshold, onAddFunds }: WalletCardProps) {
  const isLowBalance = balance < lowBalanceThreshold;

  return (
    <Card className="overflow-hidden relative bg-gradient-to-br from-card to-muted/50 border-muted">
      <CardHeader className="pb-8">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Wallet Balance
          </CardTitle>
        </div>
        <CardDescription>Available funds for extra messages and services</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex items-baseline text-5xl font-extrabold tracking-tight">
          ₹{balance.toFixed(2)}
        </div>
        
        {isLowBalance && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Low Balance</AlertTitle>
            <AlertDescription>
              Your balance is running low. Please add funds to avoid service interruption.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Quick Add</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[500, 1000, 2000, 5000].map((amount) => (
              <Button 
                key={amount} 
                variant="outline" 
                onClick={() => onAddFunds(amount)}
              >
                ₹{amount}
              </Button>
            ))}
          </div>
          <Button 
            className="w-full mt-4" 
            size="lg" 
            onClick={() => onAddFunds(1000)} // Default generic add funds
          >
            Add Custom Amount
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
