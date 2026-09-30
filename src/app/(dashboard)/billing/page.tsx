"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { RazorpayCheckout } from "@/components/billing/razorpay-checkout";
import { TransactionHistory, Transaction } from "@/components/billing/transaction-history";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Wallet, CreditCard, ExternalLink, Loader2, Sparkles, Shield, MessageSquare, Globe, Bot, BrainCircuit, Search, Workflow, CheckCircle2, Tag, Percent } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

// Default Plan data that matches landing page
const DEFAULT_PLANS = [
  {
    id: "essential",
    name: "Essential",
    price: 999,
    gradient: "from-emerald-500 to-teal-600",
    popular: false,
    services: [
      { name: "WhatsApp API + QR", icon: MessageSquare, value: "15K msg", included: true },
      { name: "No-Code Flow Builder", icon: Bot, value: "Full Access", included: true },
      { name: "AI Chat Agent Engine", icon: BrainCircuit, value: "1K Credits", included: true },
      { name: "Team Shared Inbox", icon: Globe, value: "5 Agents FREE", included: true },
      { name: "E-Commerce Catalog", icon: Search, value: "Included", included: true },
      { name: "AI Automations", icon: Workflow, value: "Included", included: true },
    ],
    features: [
      "2 WhatsApp Numbers (API + QR)",
      "15,000 Messages & Contacts",
      "5 Team Agents (No per-seat fee)",
      "Flow Builder & AI Included FREE",
      "CTWA Ads & Webhooks Included"
    ]
  },
  {
    id: "growth",
    name: "Growth",
    price: 1999,
    gradient: "from-[var(--color-navy)] to-[#0f172a]",
    popular: true,
    services: [
      { name: "WhatsApp API + QR", icon: MessageSquare, value: "50K msg", included: true },
      { name: "No-Code Flow Builder", icon: Bot, value: "Advanced", included: true },
      { name: "AI Chat Agent Engine", icon: BrainCircuit, value: "10K Credits", included: true },
      { name: "Team Shared Inbox", icon: Globe, value: "15 Agents FREE", included: true },
      { name: "E-Commerce Catalog", icon: Search, value: "Shopify Sync", included: true },
      { name: "AI Automations", icon: Workflow, value: "Smart Routing", included: true },
    ],
    features: [
      "3 WhatsApp Numbers (API + QR)",
      "UNLIMITED Contacts & Attributes",
      "15 Team Agents Included FREE",
      "Smart Auto-Routing & Retargeting",
      "Carousel Click Tracking & Webhooks"
    ]
  },
  {
    id: "allinone",
    name: "All-In-One Enterprise",
    price: 3999,
    gradient: "from-purple-500 to-violet-600",
    popular: false,
    services: [
      { name: "WhatsApp API + QR", icon: MessageSquare, value: "UNLIMITED", included: true },
      { name: "No-Code Flow Builder", icon: Bot, value: "Unlimited", included: true },
      { name: "AI Chat Agent Engine", icon: BrainCircuit, value: "UNLIMITED", included: true },
      { name: "Team Shared Inbox", icon: Globe, value: "UNLIMITED Agents", included: true },
      { name: "E-Commerce Catalog", icon: Search, value: "Multi-Store", included: true },
      { name: "AI Automations", icon: Workflow, value: "Custom Hooks", included: true },
    ],
    features: [
      "UNLIMITED WhatsApp Numbers",
      "UNLIMITED Contacts & Speed",
      "UNLIMITED Team Agents",
      "Number Masking & IP Whitelist",
      "Dedicated Account Manager + SLA"
    ]
  }
];

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState("none");
  const [trialStatus, setTrialStatus] = useState<"active" | "expired" | "none">("expired");
  const [subData, setSubData] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [plansData, setPlansData] = useState(DEFAULT_PLANS);
  const [isYearly, setIsYearly] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  
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
        const [plansRes, subRes, walletRes] = await Promise.allSettled([
          fetch('/api/billing/plans').then(res => res.ok ? res.json() : null),
          fetch('/api/billing/subscription').then(res => res.ok ? res.json() : null),
          fetch('/api/billing/wallet').then(res => res.ok ? res.json() : null),
        ]);

        if (plansRes.status === 'fulfilled' && plansRes.value && plansRes.value.length > 0) {
          const filtered = plansRes.value.filter((p: any) => p.id !== 'starter');
          if (filtered.length > 0) setPlansData(filtered);
        }
        if (subRes.status === 'fulfilled' && subRes.value) {
          const s = subRes.value;
          setSubData(s);
          if (s.status === 'expired' || s.status === 'blocked' || !s.isActive) {
            setTrialStatus("expired");
            setCurrentPlan("none");
          } else if (s.status === 'trial') {
            setTrialStatus("active");
            setCurrentPlan("trial");
          } else {
            setTrialStatus("none");
            setCurrentPlan(s.plan || "essential");
          }
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

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    try {
      const res = await fetch('/api/billing/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponInput.trim(),
          plan_id: 'essential',
          billing_cycle: isYearly ? 'yearly' : 'monthly'
        })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon(data.coupon);
        const desc = data.coupon.discount_type === 'percentage' 
          ? `${data.coupon.discount_value}% OFF` 
          : `₹${data.coupon.discount_value} OFF`;
        toast.success(`Coupon '${data.coupon.code}' applied! (${desc})`);
      } else {
        toast.error(data.error || 'Invalid or expired coupon code');
      }
    } catch (err) {
      toast.error('Failed to apply coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleCreateOrder = async (amount: number, type: 'subscription' | 'wallet_topup', planId?: string) => {
    try {
      setIsLoading(true);
      if (type === 'subscription' && planId) {
        setProcessingPlanId(planId);
      }
      
      const res = await fetch('/api/billing/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount, 
          type, 
          plan_id: planId,
          billing_cycle: isYearly ? 'yearly' : 'monthly',
          coupon_code: appliedCoupon?.code
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create order");
      }
      const data = await res.json();
      
      const targetOrderId = data.order_id;
      
      setCheckoutData({
        orderId: targetOrderId,
        amount: data.amount / 100, // convert paise back to rupees for display
        type,
        planId,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to initialize payment");
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
          billing_cycle: isYearly ? 'yearly' : 'monthly',
          amount: checkoutData.amount,
        }),
      });

      const vData = await res.json();
      if (!res.ok || !vData.success) {
        throw new Error(vData.error || "Payment signature verification failed");
      }
      
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
    <div className="container mx-auto py-4 px-4 max-w-[1300px] space-y-6">
      
      {/* 1. Trial / Subscription Status Banner & What You Can Do */}
      <section className="space-y-4">
        {trialStatus === "active" && (
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md border border-emerald-500/30">
            <div className="flex items-start md:items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md shadow-inner">
                <Sparkles className="h-5 w-5 text-yellow-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm md:text-base">🎉 5-Day Free Trial Active! (All Features Unlocked)</h3>
                <p className="text-xs text-emerald-100">
                  You have full unlimited access to Bulk Broadcasts, WhatsApp Cloud API, QR Coexistence, Automations, AI & Shared Inbox ({subData?.daysRemaining ?? 5} days remaining).
                </p>
              </div>
            </div>
            <Button 
              variant="secondary" 
              className="bg-white text-emerald-800 hover:bg-emerald-50 font-extrabold text-xs h-8 shadow-sm shrink-0" 
              onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
            >
              Choose a Plan →
            </Button>
          </div>
        )}
        
        {trialStatus === "expired" && (
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md border border-red-500/30">
            <div className="flex items-start md:items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md shadow-inner">
                <Shield className="h-5 w-5 text-yellow-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm md:text-base">⚠️ Your 5-Day Free Trial Has Ended</h3>
                <p className="text-xs text-red-100">
                  All messaging, broadcasts, automations & coexistence actions are currently locked. Upgrade to an active plan below to resume messaging.
                </p>
              </div>
            </div>
            <Button 
              variant="secondary" 
              className="bg-white text-red-700 hover:bg-red-50 font-extrabold text-xs h-8 shadow-sm shrink-0" 
              onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
            >
              Upgrade Plan Now →
            </Button>
          </div>
        )}

        {trialStatus === "none" && (
          <div className="bg-gradient-to-r from-emerald-500/10 via-background to-teal-500/10 border border-emerald-500/30 text-foreground p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm capitalize">Active Subscription: {currentPlan} Plan</h3>
                <p className="text-xs text-muted-foreground">
                  Your business account has full paid access to your plan features and monthly quotas.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 rounded-full">
                Active
              </span>
            </div>
          </div>
        )}

        {/* Feature Permissions / What You Can Do Card */}
        <div className="bg-card rounded-2xl border border-border/70 p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3 mb-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">Your Plan Capabilities & Feature Permissions</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {trialStatus === 'expired'
                  ? 'Your 5-day free trial has expired. All features below are currently locked until you purchase a plan.'
                  : 'Summary of what features your account can access under this tier.'}
              </p>
            </div>
            <span className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md self-start sm:self-auto ${
              trialStatus === 'expired'
                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                : 'bg-primary/10 text-primary'
            }`}>
              Tier: {trialStatus === 'active' ? '5-Day Full Trial' : trialStatus === 'expired' ? 'Trial Expired — Locked' : currentPlan}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
            {[
              { label: 'Meta Cloud API', enabled: trialStatus !== 'expired' },
              { label: 'QR Coexistence', enabled: trialStatus !== 'expired' && (trialStatus === 'active' || currentPlan !== 'starter') },
              { label: 'Live Shared Inbox', enabled: trialStatus !== 'expired' },
              { label: 'Bulk Broadcasts', enabled: trialStatus !== 'expired' && (trialStatus === 'active' || currentPlan !== 'starter') },
              { label: 'Automations', enabled: trialStatus !== 'expired' && (trialStatus === 'active' || currentPlan !== 'starter') },
              { label: 'Visual Flow Builder', enabled: trialStatus !== 'expired' && (trialStatus === 'active' || currentPlan === 'essential' || currentPlan === 'growth' || currentPlan === 'all-in-one' || currentPlan === 'allinone') },
              { label: 'AI Smart Reply', enabled: trialStatus !== 'expired' && (trialStatus === 'active' || currentPlan === 'essential' || currentPlan === 'growth' || currentPlan === 'all-in-one' || currentPlan === 'allinone') },
              { label: 'Contacts Management', enabled: trialStatus !== 'expired' },
            ].map((feat) => (
              <div
                key={feat.label}
                className={`flex items-center gap-2 p-2 rounded-xl border ${
                  feat.enabled
                    ? 'bg-muted/40 border-border/50 text-foreground'
                    : 'bg-red-500/5 border-dashed border-red-500/30 text-muted-foreground opacity-75'
                }`}
              >
                {feat.enabled ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <X className="h-3.5 w-3.5 text-red-500 shrink-0" />
                )}
                <span className="font-medium text-xs">{feat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Coupon Code Entry Section */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm max-w-lg mx-auto space-y-2">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-emerald-600" />
          <h3 className="font-extrabold text-xs text-foreground">Have a Promo or Coupon Code?</h3>
        </div>
        <div className="flex items-center gap-2">
          <Input 
            placeholder="Enter Coupon Code (e.g. SAVE50)" 
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
            className="h-9 text-xs font-mono font-bold uppercase tracking-wider rounded-xl"
          />
          <Button 
            onClick={handleApplyCoupon} 
            disabled={applyingCoupon || !couponInput.trim()}
            className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shrink-0 rounded-xl"
          >
            {applyingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply Coupon"}
          </Button>
        </div>
        {appliedCoupon && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-bold">
            <span>✓ Coupon '{appliedCoupon.code}' Applied! ({appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}% OFF` : `₹${appliedCoupon.discount_value} OFF`})</span>
            <button onClick={() => setAppliedCoupon(null)} className="text-red-500 hover:underline">Remove</button>
          </div>
        )}
      </div>

      {/* 3. Pricing Plans Section */}
      <section id="pricing" className="space-y-4 relative">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-navy">Simple, transparent pricing</h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">Choose the perfect plan for your business needs. No hidden fees.</p>
          
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className={`text-xs font-bold ${!isYearly ? "text-slate-900" : "text-gray-400"}`}>Monthly</span>
            <button 
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${isYearly ? 'bg-[var(--color-green-vivid, #25D366)]' : 'bg-slate-900'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isYearly ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
            <span className={`text-xs font-bold ${isYearly ? "text-slate-900" : "text-gray-400"}`}>
              Yearly <span className="text-[var(--color-green-vivid, #25D366)] ml-1 font-bold">(Save 5% OFF)</span>
            </span>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4 items-start mt-4 max-w-5xl mx-auto">
          {plansData.map((plan, i) => {
            const isCurrentPlan = currentPlan === plan.id;
            const originalPrice = isYearly ? Math.round(plan.price * 0.95 * 12) : plan.price;
            
            let finalPrice = originalPrice;
            let couponDiscountAmount = 0;

            if (appliedCoupon) {
              if (appliedCoupon.discount_type === 'percentage') {
                couponDiscountAmount = Math.round(originalPrice * (Number(appliedCoupon.discount_value) / 100));
              } else {
                couponDiscountAmount = Number(appliedCoupon.discount_value);
              }
              couponDiscountAmount = Math.min(originalPrice, Math.max(0, couponDiscountAmount));
              finalPrice = Math.max(0, originalPrice - couponDiscountAmount);
            }

            const period = isYearly ? "/yr" : "/mo";
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                className={`relative flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular 
                    ? 'bg-white border-2 border-[#25D366] shadow-lg lg:scale-[1.02] z-10' 
                    : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Header Gradient */}
                <div className={`p-4 relative bg-gradient-to-br ${plan.gradient} text-white`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                      <span className="bg-gradient-to-r from-[#128C7E] to-[#25D366] text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm border border-white/30">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <h3 className="text-lg font-bold font-heading text-white pt-1">
                    {plan.name}
                  </h3>
                  
                  <div className="flex items-end gap-1.5 mt-2 text-white flex-wrap">
                    {appliedCoupon && couponDiscountAmount > 0 ? (
                      <>
                        <span className="text-3xl font-black tracking-tight text-white">₹{finalPrice.toLocaleString()}</span>
                        <span className="text-sm font-bold line-through text-white/70 mb-1">₹{originalPrice.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="text-3xl font-black tracking-tight text-white">₹{originalPrice.toLocaleString()}</span>
                    )}
                    <span className="text-xs font-medium mb-1 text-white/80">
                      {period}
                    </span>
                  </div>

                  {appliedCoupon && couponDiscountAmount > 0 && (
                    <div className="mt-1">
                      <span className="inline-block bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded uppercase shadow-sm">
                        Save ₹{couponDiscountAmount.toLocaleString()} with {appliedCoupon.code}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-4 flex-1 flex flex-col bg-white">
                  {isCurrentPlan ? (
                    <div className="w-full mb-3 py-2 bg-green-50 text-green-700 text-center text-xs font-bold rounded-xl border border-green-200">
                      Current Plan
                    </div>
                  ) : (
                    <Button 
                      className={`w-full h-9 rounded-xl text-xs font-bold transition-all mb-3 ${
                        plan.popular 
                          ? "bg-gradient-to-r from-[#128C7E] to-[#25D366] hover:from-[#25D366] hover:to-[#25D366] text-white shadow-sm border-none" 
                          : "bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200"
                      }`}
                      onClick={() => handleCreateOrder(finalPrice, 'subscription', plan.id)}
                      disabled={isLoading}
                    >
                      {processingPlanId === plan.id ? (
                        <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Processing...</>
                      ) : (
                        'Upgrade'
                      )}
                    </Button>
                  )}
                  
                  <div className="space-y-1.5 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Services Included</div>
                    {plan.services.map((svc, j) => {
                      const Icon = svc.icon;
                      return (
                        <div key={j} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Icon className={`w-3.5 h-3.5 ${plan.popular ? 'text-[#25D366]' : 'text-slate-400'}`} />
                            <span className="font-medium text-slate-700 text-xs">{svc.name}</span>
                          </div>
                          {svc.included ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none font-semibold text-[10px] px-1.5 py-0 h-4">
                              {svc.value}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="font-normal text-[10px] px-1.5 py-0 h-4 text-slate-400 border-slate-200">
                              Not included
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Additional Features</div>
                    <ul className="space-y-1.5">
                      {plan.features.map((feat, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${plan.popular ? "text-[#25D366]" : "text-[#128C7E]"}`} />
                          <span className="font-medium leading-tight text-slate-700 text-[11px]">
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
