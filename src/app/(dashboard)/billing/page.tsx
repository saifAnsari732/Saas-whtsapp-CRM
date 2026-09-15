"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { RazorpayCheckout } from "@/components/billing/razorpay-checkout";
import { TransactionHistory, Transaction } from "@/components/billing/transaction-history";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Wallet, CreditCard, ExternalLink, Loader2, Sparkles, Shield, MessageSquare, Globe, Bot, BrainCircuit, Search, Workflow, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

// Default Plan data that matches landing page
const DEFAULT_PLANS = [
  {
    id: "starter",
    name: "Starter (Testing)",
    price: 10,
    gradient: "from-blue-500 to-blue-600",
    popular: false,
    services: [
      { name: "WhatsApp API", icon: MessageSquare, value: "Basic 2K msg", included: true },
      { name: "Website", icon: Globe, value: "", included: false },
      { name: "Chatbot", icon: Bot, value: "Basic", included: true },
      { name: "AI Agent", icon: BrainCircuit, value: "", included: false },
      { name: "SEO", icon: Search, value: "", included: false },
      { name: "AI Automation", icon: Workflow, value: "", included: false },
    ],
    features: [
      "1 WhatsApp Number",
      "2,000 Contacts",
      "1 User",
      "Basic CRM Templates"
    ]
  },
  {
    id: "essential",
    name: "Essential",
    price: 999,
    gradient: "from-emerald-500 to-teal-600",
    popular: false,
    services: [
      { name: "WhatsApp API", icon: MessageSquare, value: "15K msg", included: true },
      { name: "Website", icon: Globe, value: "Landing Page", included: true },
      { name: "Chatbot", icon: Bot, value: "Advanced", included: true },
      { name: "AI Agent", icon: BrainCircuit, value: "", included: false },
      { name: "SEO", icon: Search, value: "", included: false },
      { name: "AI Automation", icon: Workflow, value: "Basic", included: true },
    ],
    features: [
      "2 WhatsApp Numbers",
      "15,000 Contacts",
      "5 Users",
      "Unlimited Campaigns"
    ]
  },
  {
    id: "growth",
    name: "Growth",
    price: 1999,
    gradient: "from-[var(--color-navy)] to-[#0f172a]",
    popular: true,
    services: [
      { name: "WhatsApp API", icon: MessageSquare, value: "50K msg", included: true },
      { name: "Website", icon: Globe, value: "Full Site", included: true },
      { name: "Chatbot", icon: Bot, value: "Custom", included: true },
      { name: "AI Agent", icon: BrainCircuit, value: "3 Agents", included: true },
      { name: "SEO", icon: Search, value: "Basic", included: true },
      { name: "AI Automation", icon: Workflow, value: "Advanced", included: true },
    ],
    features: [
      "3 WhatsApp Numbers",
      "Unlimited Contacts",
      "15 Users",
      "Flow Builder & AI Generator"
    ]
  },
  {
    id: "all-in-one",
    name: "All-In-One",
    price: 3999,
    gradient: "from-purple-500 to-violet-600",
    popular: false,
    services: [
      { name: "WhatsApp API", icon: MessageSquare, value: "Unlimited", included: true },
      { name: "Website", icon: Globe, value: "Full + Mobile App", included: true },
      { name: "Chatbot", icon: Bot, value: "Unlimited", included: true },
      { name: "AI Agent", icon: BrainCircuit, value: "Unlimited", included: true },
      { name: "SEO", icon: Search, value: "Full", included: true },
      { name: "AI Automation", icon: Workflow, value: "Full Suite", included: true },
    ],
    features: [
      "Unlimited WhatsApp Numbers",
      "Unlimited Contacts",
      "Mobile App Development",
      "Sequence & Dedicated Manager"
    ]
  }
];

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState("starter");
  const [trialStatus, setTrialStatus] = useState<"active" | "expired" | "none">("active");
  const [walletBalance, setWalletBalance] = useState(150);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [plansData, setPlansData] = useState(DEFAULT_PLANS);
  const [isYearly, setIsYearly] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  
  // Checkout state
  const [checkoutData, setCheckoutData] = useState<{
    orderId: string;
    amount: number;
    type: 'subscription' | 'wallet_topup';
    planId?: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  
  const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

  useEffect(() => {
    async function fetchData() {
      try {
        const [plansRes, subRes, walletRes, txRes] = await Promise.allSettled([
          fetch('/api/billing/plans').then(res => res.ok ? res.json() : null),
          fetch('/api/billing/subscription').then(res => res.ok ? res.json() : null),
          fetch('/api/billing/wallet').then(res => res.ok ? res.json() : null),
          fetch('/api/billing/wallet').then(res => res.ok ? res.json() : null)
        ]);

        if (plansRes.status === 'fulfilled' && plansRes.value && plansRes.value.length > 0) {
          setPlansData(plansRes.value);
        }
        if (subRes.status === 'fulfilled' && subRes.value) {
          setCurrentPlan(subRes.value.plan || "starter");
          setTrialStatus(subRes.value.status === 'trial' ? "active" : subRes.value.status === 'expired' ? "expired" : "none");
        }
        if (walletRes.status === 'fulfilled' && walletRes.value && walletRes.value.wallet) {
          setWalletBalance(Number(walletRes.value.wallet.balance) || 0);
          if (walletRes.value.transactions && walletRes.value.transactions.length > 0) {
            setTransactions(walletRes.value.transactions.map((t: any) => ({
              id: t.id,
              amount: Number(t.amount) || 0,
              type: t.type === 'credit' ? 'credit' : 'debit',
              description: t.description || 'Transaction',
              status: 'success',
              created_at: t.created_at
            })));
          }
        }
      } catch (err) {
        console.error("Failed to fetch billing data, using defaults", err);
      } finally {
        setIsFetchingData(false);
      }
    }
    fetchData();
  }, []);

  const handleCreateOrder = async (amount: number, type: 'subscription' | 'wallet_topup', planId?: string) => {
    try {
      setIsLoading(true);
      if (type === 'subscription' && planId) {
        setProcessingPlanId(planId);
      }
      
      const res = await fetch('/api/billing/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, type, plan_id: planId }),
      });

      if (!res.ok) throw new Error("Failed to create order");
      const data = await res.json();
      
      setCheckoutData({
        orderId: data.order_id,
        amount: data.amount / 100, // convert paise back to rupees for display
        type,
        planId,
      });
    } catch (error) {
      toast.error("Failed to initialize payment");
      console.error(error);
    } finally {
      setIsLoading(false);
      setProcessingPlanId(null);
    }
  };

  const handlePaymentSuccess = async (paymentId: string, signature: string) => {
    if (!checkoutData) return;

    try {
      const res = await fetch('/api/billing/razorpay/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: checkoutData.orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          type: checkoutData.type,
          plan_id: checkoutData.planId,
          amount: checkoutData.amount,
        }),
      });

      if (!res.ok) throw new Error("Payment verification failed");
      
      toast.success("Payment successful!");
      
      // Update local state
      if (checkoutData.type === 'wallet_topup') {
        setWalletBalance(prev => prev + checkoutData.amount);
      } else if (checkoutData.type === 'subscription' && checkoutData.planId) {
        setCurrentPlan(checkoutData.planId);
        setTrialStatus("none");
      }
      
      // Add transaction to list
      setTransactions(prev => [{
        id: Math.random().toString(),
        amount: checkoutData.amount,
        type: 'credit',
        description: checkoutData.type === 'wallet_topup' ? 'Wallet Top-up' : `Subscription: ${checkoutData.planId}`,
        status: 'success',
        created_at: new Date().toISOString()
      }, ...prev]);

    } catch (error) {
      toast.error("Payment verification failed. Please contact support.");
      console.error(error);
    } finally {
      setCheckoutData(null);
    }
  };

  if (isFetchingData) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-[1400px] space-y-12">
      
      {/* 1. Trial / Subscription Status Banner */}
      <section>
        {trialStatus === "active" && (
          <div className="bg-gradient-to-r from-[#128C7E] to-[#25D366] text-white p-4 rounded-xl flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6" />
              <span className="font-semibold text-lg">🎉 You're on a 7-day free trial! 5 days remaining</span>
            </div>
            <Button variant="secondary" className="bg-white text-[#128C7E] hover:bg-gray-100 font-bold" onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}>
              Upgrade Now
            </Button>
          </div>
        )}
        
        {trialStatus === "expired" && (
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 rounded-xl flex items-center gap-3 shadow-md">
            <Shield className="h-6 w-6" />
            <span className="font-semibold text-lg">⚠️ Your trial has expired. Choose a plan to continue.</span>
          </div>
        )}

        {trialStatus === "none" && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center gap-3 shadow-sm">
            <Check className="h-6 w-6 text-[#25D366]" />
            <span className="font-medium text-lg">✅ You're on the <span className="font-bold capitalize">{currentPlan}</span> plan</span>
          </div>
        )}
      </section>

      {/* 2. Pricing Plans Section */}
      <section id="pricing" className="space-y-6 relative">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight text-navy">Simple, transparent pricing</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Choose the perfect plan for your business needs. No hidden fees.</p>
          
          <div className="flex items-center justify-center gap-4 mt-4">
            <span className={`text-sm font-bold ${!isYearly ? "text-slate-900" : "text-gray-400"}`}>Monthly</span>
            <button 
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${isYearly ? 'bg-[var(--color-green-vivid, #25D366)]' : 'bg-slate-900'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isYearly ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-bold ${isYearly ? "text-slate-900" : "text-gray-400"}`}>
              Yearly <span className="text-[var(--color-green-vivid, #25D366)] ml-1">(Save 20%)</span>
            </span>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-start mt-8">
          {plansData.map((plan, i) => {
            const isCurrentPlan = currentPlan === plan.id;
            const price = isYearly ? Math.round(plan.price * 0.8 * 12) : plan.price;
            const period = isYearly ? "/yr" : "/mo";
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className={`relative flex flex-col h-full rounded-[32px] overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular 
                    ? 'bg-white border-2 border-[#25D366] shadow-xl lg:scale-105 z-10' 
                    : 'bg-white border border-slate-200 shadow-md hover:shadow-xl'
                }`}
              >
                {/* Header Gradient */}
                <div className={`p-6 pb-6 relative bg-gradient-to-br ${plan.gradient} text-white`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                      <span className="bg-gradient-to-r from-[#128C7E] to-[#25D366] text-white text-[11px] font-extrabold px-4 py-1 rounded-full uppercase tracking-wider shadow-lg border border-white/30">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <h3 className="text-[22px] font-bold font-heading mb-2 text-white pt-2">
                    {plan.name}
                  </h3>
                  
                  <div className="flex items-end gap-1 mt-4 mb-2 text-white">
                    <span className="text-4xl font-extrabold tracking-tight text-white">₹{price.toLocaleString()}</span>
                    <span className="text-[15px] font-medium mb-1 text-white/80">
                      {period}
                    </span>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6 flex-1 flex flex-col bg-white">
                  {isCurrentPlan ? (
                    <div className="w-full mb-6 py-3 bg-green-50 text-green-700 text-center font-bold rounded-xl border border-green-200">
                      Current Plan
                    </div>
                  ) : (
                    <Button 
                      className={`w-full h-12 rounded-xl text-[15px] font-bold transition-all mb-6 ${
                        plan.popular 
                          ? "bg-gradient-to-r from-[#128C7E] to-[#25D366] hover:from-[#25D366] hover:to-[#25D366] text-white shadow-md border-none" 
                          : "bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200"
                      }`}
                      onClick={() => handleCreateOrder(price, 'subscription', plan.id)}
                      disabled={isLoading}
                    >
                      {processingPlanId === plan.id ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                      ) : (
                        'Upgrade'
                      )}
                    </Button>
                  )}
                  
                  <div className="space-y-3 flex-1">
                    <div className="text-[12px] font-bold uppercase tracking-wider text-slate-400 mb-3">Services Included</div>
                    {plan.services.map((svc, j) => {
                      const Icon = svc.icon;
                      return (
                        <div key={j} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-[14px] h-[14px] ${plan.popular ? 'text-[#25D366]' : 'text-slate-400'}`} />
                            <span className="text-[13px] font-medium text-slate-700">{svc.name}</span>
                          </div>
                          {svc.included ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none font-semibold text-[11px] px-2 py-0 h-5">
                              {svc.value}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="font-normal text-[11px] px-2 py-0 h-5 text-slate-400 border-slate-200">
                              Not included
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="mt-8">
                    <div className="text-[12px] font-bold uppercase tracking-wider text-slate-400 mb-4">Additional Features</div>
                    <ul className="space-y-3">
                      {plan.features.map((feat, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <CheckCircle2 className={`h-[18px] w-[18px] shrink-0 ${plan.popular ? "text-[#25D366]" : "text-[#128C7E]"}`} />
                          <span className="text-[13px] font-medium leading-tight pt-0.5 text-slate-700">
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 3. Messaging Wallet Section */}
      <section className="space-y-6 mt-12">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Messaging Wallet</h2>
          <p className="text-muted-foreground">Top up your wallet to send broadcast messages and beyond-plan messages.</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-slate-50 border-slate-200 rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-100/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-slate-700 text-lg">
                <Wallet className="h-5 w-5 text-[#128C7E]" /> Current Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-5xl font-extrabold text-slate-900 tracking-tight">₹{walletBalance.toFixed(2)}</div>
              <p className="text-muted-foreground mt-2 font-medium">Available for messaging charges</p>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => handleCreateOrder(500, 'wallet_topup')} 
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold text-lg py-6 rounded-xl shadow-md"
                disabled={isLoading}
              >
                Recharge Wallet
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="rounded-2xl shadow-sm border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Quick Recharge</CardTitle>
              <CardDescription>Select an amount to instantly top up your wallet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[10, 500, 1000, 2000].map(amount => (
                  <Button 
                    key={amount} 
                    variant="outline" 
                    onClick={() => handleCreateOrder(amount, 'wallet_topup')} 
                    disabled={isLoading}
                    className="h-auto py-5 text-lg font-semibold hover:border-[#25D366] hover:text-[#128C7E] rounded-xl transition-colors"
                  >
                    ₹{amount}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 4. Payment Methods Row */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Payment Methods</h2>
          <p className="text-muted-foreground">We support multiple secure ways to pay for your plan and wallet.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="pt-8 flex flex-col items-center text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                <CreditCard className="h-7 w-7 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-slate-900">Razorpay</h3>
                <p className="text-sm text-muted-foreground mt-1">Pay securely via UPI, Cards, or Net Banking.</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all group shadow-sm border-slate-200" onClick={() => window.open('https://business.facebook.com/wa/manage/billing', '_blank')}>
            <CardContent className="pt-8 flex flex-col items-center text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
                <ExternalLink className="h-7 w-7 text-[#25D366]" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-slate-900">Meta Direct</h3>
                <p className="text-sm text-muted-foreground mt-1">Pay WhatsApp conversation charges directly to Meta.</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="pt-8 flex flex-col items-center text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-orange-50 flex items-center justify-center border border-orange-100">
                <Shield className="h-7 w-7 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-slate-900">Manual Payment</h3>
                <p className="text-sm text-muted-foreground mt-1">Contact support for direct bank transfer details.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 5. Transaction History */}
      <section className="space-y-6 pt-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Transaction History</h2>
          <p className="text-muted-foreground">View your recent payments and wallet deductions.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <TransactionHistory transactions={transactions} />
        </div>
      </section>

      {/* Razorpay Checkout Modal */}
      {checkoutData && (
        <RazorpayCheckout
          orderId={checkoutData.orderId}
          amount={checkoutData.amount}
          currency="INR"
          keyId={razorpayKey}
          onSuccess={handlePaymentSuccess}
          onClose={() => setCheckoutData(null)}
        />
      )}
    </div>
  );
}
