'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AlertTriangle, 
  Calendar, 
  Wallet, 
  ChevronRight, 
  Bell, 
  Plus, 
  FileText, 
  CreditCard 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

export default function BillingPage() {
  const router = useRouter();
  
  // State
  const [lowBalanceAlert, setLowBalanceAlert] = useState('100.00');
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('1000');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRecharge = () => {
    setIsProcessing(true);
    // Simulate payment gateway redirect or initialization
    setTimeout(() => {
      setIsProcessing(false);
      setRechargeModalOpen(false);
      alert(`Proceeding to payment gateway to add ₹${rechargeAmount}...`);
    }, 1500);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20">
      
      {/* Alert Banner */}
      <div className="bg-red-500 text-white rounded-lg p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <div>
            <h3 className="font-bold">Your trial period is over</h3>
            <p className="text-sm">Please subscribe to a plan to continue using the app.</p>
          </div>
        </div>
        <Button variant="secondary" className="bg-white text-red-600 hover:bg-gray-100 font-bold shrink-0">
          Subscribe
        </Button>
      </div>

      {/* Plan Details */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> Plan Details
            </p>
            <h2 className="text-2xl font-bold">Trial period</h2>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="font-semibold">
              <Plus className="h-4 w-4 mr-2" /> Add Funds
            </Button>
            <Button className="bg-[#00a884] hover:bg-[#008069] text-white font-semibold">
              Subscribe to plan
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-8 py-4 border-t border-border">
          <div className="flex items-start gap-3">
            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-md">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Trial Expires On</p>
              <p className="font-semibold">2026-05-12 10:04:27</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-md">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Account Balance</p>
              <p className="font-semibold">₹0.00</p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/20 hover:bg-muted/50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-md">
                <FileText className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-foreground">Any other services?</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
          </div>
          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/20 hover:bg-muted/50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-md">
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
        
        <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-md p-3 mb-6 flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          Your balance is low. Please recharge to avoid messaging interruption.
        </div>

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
              <h3 className="text-3xl font-bold text-foreground">₹0.00</h3>
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
              <h3 className="text-3xl font-bold text-foreground">₹{parseFloat(lowBalanceAlert).toFixed(2)}</h3>
              <p className="text-xs text-muted-foreground mt-1">Notify me when balance drops below</p>
              
              <div className="flex gap-2 mt-4">
                <Input 
                  type="number" 
                  value={lowBalanceAlert} 
                  onChange={(e) => setLowBalanceAlert(e.target.value)}
                  className="h-9"
                />
                <Button className="h-9 bg-[#00a884] hover:bg-[#008069] text-white">Set</Button>
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
        <div className="border border-border rounded-lg bg-card/50 flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="h-10 w-10 mb-3 opacity-20" />
          <p className="text-sm font-medium">No transactions yet</p>
        </div>
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
