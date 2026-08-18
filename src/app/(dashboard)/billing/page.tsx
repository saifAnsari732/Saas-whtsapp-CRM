'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AlertTriangle, 
  Wallet, 
  CreditCard, 
  Bell, 
  FileText, 
  ChevronRight,
  Plus,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WalletData {
  balance: number;
  low_balance_alert: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  created_at: string;
}

export default function BillingPage() {
  const router = useRouter();
  
  // State
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [lowBalanceAlert, setLowBalanceAlert] = useState('100.00');
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('1000');
  const [isProcessing, setIsProcessing] = useState(false);
  const [savingAlert, setSavingAlert] = useState(false);

  const loadWallet = useCallback(async () => {
    try {
      const res = await fetch('/api/billing/wallet');
      const data = await res.json();
      if (data.success && data.wallet) {
        setWallet(data.wallet);
        setLowBalanceAlert(data.wallet.low_balance_alert.toString());
        if (data.transactions) {
          setTransactions(data.transactions);
        }
      }
    } catch (err) {
      console.error('Failed to load wallet', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  const handleUpdateAlert = async () => {
    setSavingAlert(true);
    try {
      const res = await fetch('/api/billing/wallet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ low_balance_alert: parseFloat(lowBalanceAlert) }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Low balance alert updated successfully');
        setWallet(data.wallet);
      } else {
        toast.error(data.error || 'Failed to update alert');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setSavingAlert(false);
    }
  };

  const handleRecharge = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setRechargeModalOpen(false);
      alert(`Simulation: Proceeding to Razorpay/Stripe with amount ₹${rechargeAmount}. Backend endpoint needs to be linked here.`);
    }, 1500);
  };

  const currentBalance = wallet ? wallet.balance : 0.00;
  const alertThreshold = wallet ? wallet.low_balance_alert : 100.00;
  const isLowBalance = currentBalance <= alertThreshold;

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in-50 duration-500 max-w-5xl mx-auto space-y-8 pb-10">
      
      {/* Expiry Banner */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 text-red-800">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <div>
            <h3 className="font-semibold text-sm">Your trial period is over</h3>
            <p className="text-xs mt-0.5 text-red-700">Please choose a plan to continue using the CRM.</p>
          </div>
        </div>
        <Button className="bg-red-600 hover:bg-red-700 text-white shadow-sm shrink-0">Subscribe to Premium</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Billing & Plans</h1>
          <p className="text-sm text-muted-foreground">Manage your subscription, wallet, and billing history.</p>
        </div>
      </div>

      {/* Account Details */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Pro Plan <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">Trial</Badge></h3>
            <p className="text-sm text-muted-foreground mt-1">Expired on Aug 18, 2026</p>
          </div>
          <div className="text-right flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 text-emerald-600 p-2 rounded-full hidden sm:flex">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Account Balance</p>
                <p className="font-semibold">₹{currentBalance.toFixed(2)}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="hidden sm:flex">Change Plan</Button>
          </div>
        </div>
        
        <div className="divide-y divide-border">
          <div className="p-4 flex items-center justify-between group cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary p-2 rounded-md">
                <Plus className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-foreground">Any other services?</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
          </div>
          
          <div className="p-4 flex items-center justify-between group cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 text-blue-600 p-2 rounded-md">
                <CreditCard className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-foreground">Manual Payment?</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
          </div>
        </div>
      </div>

      {/* Messaging Wallet */}
      <div>
        <h2 className="text-xl font-bold mb-1">Messaging Wallet</h2>
        <p className="text-sm text-muted-foreground mb-4">Prepaid balance for WhatsApp messaging</p>
        
        {isLowBalance && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-md p-3 mb-6 flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Your balance is low. Please recharge to avoid messaging interruption.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Current Balance */}
          <div className="bg-card rounded-lg border border-border shadow-sm flex flex-col justify-between">
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-[#00a884] uppercase tracking-wider">Current Balance</p>
                <div className="bg-emerald-50 text-[#00a884] p-1.5 rounded-md">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-foreground">₹{currentBalance.toFixed(2)}</h3>
              <p className="text-xs text-muted-foreground mt-1">Available for messaging</p>
            </div>
            <div className="border-t border-border p-3 flex items-center justify-between bg-emerald-50/50 hover:bg-emerald-50 transition-colors cursor-pointer text-[#00a884]">
              <span className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" /> View Transactions
              </span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>

          {/* Low Balance Alert */}
          <div className="bg-card rounded-lg border border-border shadow-sm p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-[40px] pointer-events-none -z-10"></div>
            <div>
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-orange-500 uppercase tracking-wider">Low Balance Alert</p>
                <div className="bg-orange-50 text-orange-500 p-1.5 rounded-md">
                  <Bell className="h-4 w-4" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-foreground">₹{parseFloat(lowBalanceAlert || '0').toFixed(2)}</h3>
              <p className="text-xs text-muted-foreground mt-1">Notify me when balance drops below</p>
              
              <div className="flex gap-2 mt-4">
                <Input 
                  type="number" 
                  value={lowBalanceAlert} 
                  onChange={(e) => setLowBalanceAlert(e.target.value)}
                  className="h-9"
                />
                <Button 
                  onClick={handleUpdateAlert}
                  disabled={savingAlert}
                  className="h-9 bg-[#00a884] hover:bg-[#008069] text-white"
                >
                  {savingAlert ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set'}
                </Button>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-orange-500">
              <Bell className="h-3 w-3" /> Alert is active
            </div>
          </div>

          {/* Add Funds */}
          <div className="bg-card rounded-lg border border-border shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-[#00a884] uppercase tracking-wider">Add Funds</p>
                <div className="bg-emerald-50 text-[#00a884] p-1.5 rounded-md">
                  <Plus className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Top up your wallet to keep messaging running smoothly</p>
            </div>
            
            <div className="space-y-3 mt-6">
              <Button 
                onClick={() => setRechargeModalOpen(true)}
                className="w-full bg-[#00a884] hover:bg-[#008069] text-white font-bold h-11"
              >
                <Plus className="h-4 w-4 mr-2" /> Recharge Wallet
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-11 text-[#1877F2] border-[#1877F2]/30 hover:bg-[#1877F2]/10 hover:text-[#1877F2] font-semibold"
                onClick={() => window.open('https://business.facebook.com/wa/manage/billing', '_blank')}
              >
                <CreditCard className="h-4 w-4 mr-2" /> Pay via Meta Directly
              </Button>
              <Button variant="outline" className="w-full h-11 text-muted-foreground font-semibold">
                <FileText className="h-4 w-4 mr-2" /> Manual Payment
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* Message Rates Note */}
      <div className="flex items-center justify-between border-b border-border pb-4 pt-4">
        <div>
          <h4 className="font-semibold text-sm">Message Rates</h4>
          <p className="text-xs text-muted-foreground">Per message charges - GST included</p>
        </div>
        <span className="text-xs font-medium bg-orange-100 text-orange-800 px-3 py-1 rounded-full border border-orange-200">
          Save up to 10% - 6 month plan
        </span>
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Recent Transactions</h3>
        {transactions.length === 0 ? (
          <div className="border border-border rounded-lg bg-card/50 flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm font-medium">No transactions yet</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{tx.description}</td>
                    <td className="px-6 py-4">
                      {tx.type === 'credit' ? (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-medium">Credit</span>
                      ) : (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">Debit</span>
                      )}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-foreground'}`}>
                      {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recharge Modal */}
      <Dialog open={rechargeModalOpen} onOpenChange={setRechargeModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Recharge Wallet</DialogTitle>
            <DialogDescription>
              Enter the amount you wish to add to your messaging wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Amount (₹)</label>
              <Input 
                type="number" 
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                placeholder="e.g. 1000"
                className="text-lg font-bold h-12"
              />
            </div>
            <div className="flex gap-2">
              {[500, 1000, 2000, 5000].map(amt => (
                <Button 
                  key={amt} 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  onClick={() => setRechargeAmount(amt.toString())}
                  className="flex-1 text-xs"
                >
                  ₹{amt}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRechargeModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleRecharge} 
              disabled={isProcessing || parseFloat(rechargeAmount) <= 0}
              className="bg-[#00a884] hover:bg-[#008069] text-white"
            >
              {isProcessing ? 'Processing...' : 'Proceed to Pay'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
