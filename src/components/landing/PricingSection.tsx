"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PricingSection() {
  const plans = [
    {
      name: "Starter",
      price: "Free",
      desc: "Perfect for testing the waters and small businesses.",
      features: [
        "1 WhatsApp Number",
        "1,000 Messages / month",
        "Basic Templates",
        "2 Team Agents",
        "Community Support"
      ],
      buttonText: "Get Started Free",
      featured: false,
    },
    {
      name: "Growth",
      price: ",12,499",
      period: "/mo",
      desc: "For growing businesses ready to automate and scale.",
      features: [
        "3 WhatsApp Numbers",
        "25,000 Messages / month",
        "AI Auto-Replies",
        "Bulk Broadcasts & Drip Campaigns",
        "10 Team Agents",
        "Priority Email Support"
      ],
      buttonText: "Start 14-Day Trial",
      featured: true,
      badge: "Most Popular",
    },
    {
      name: "Enterprise",
      price: "Custom",
      desc: "Advanced security and unlimited scale for large teams.",
      features: [
        "Unlimited WhatsApp Numbers",
        "Unlimited Messages",
        "White-label Option",
        "Custom CRM Integrations",
        "Unlimited Team Agents",
        "Dedicated Account Manager"
      ],
      buttonText: "Contact Sales",
      featured: false,
    }
  ];

  return (
    <section id="pricing" className="bg-[#fafcfa] py-32 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[var(--color-green-vivid)]/5 rounded-[100%] blur-[120px] pointer-events-none"></div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        
        {/* Header */}
        <div className="mb-20 text-center max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            className="mb-6 inline-flex items-center rounded-full bg-white px-4 py-2 border border-border/50 shadow-sm"
          >
            <div className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-green-light)]">
              <Sparkles className="h-3 w-3 text-[var(--color-green-deep)]" />
            </div>
            <span className="text-[13px] font-extrabold uppercase tracking-widest text-navy font-heading">
              Simple Pricing
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-[56px] font-extrabold tracking-tight text-navy font-heading mb-6 leading-[1.1]"
          >
            Scale without surprises
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-[19px] text-gray font-medium"
          >
            Pay for what you use. Upgrade as you grow. No hidden Meta API markup fees.
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto items-center">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className={`relative rounded-[32px] p-8 sm:p-10 transition-all duration-300 ${
                plan.featured
                  ? "bg-gradient-to-b from-[var(--color-navy)] to-[#0f172a] text-white shadow-[0_30px_60px_rgba(7,94,84,0.15)] lg:scale-105 border border-navy/50 lg:-mt-4"
                  : "bg-white text-navy border border-border shadow-[0_8px_32px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.06)] hover:-translate-y-1"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[var(--color-green-vivid)] blur-md opacity-50"></div>
                    <span className="relative inline-block rounded-full bg-gradient-to-r from-[var(--color-green-deep)] to-[var(--color-green-vivid)] px-5 py-1.5 text-[13px] font-extrabold uppercase tracking-widest text-white shadow-lg border border-white/20">
                      {plan.badge}
                    </span>
                  </div>
                </div>
              )}

              <h3 className={`text-[22px] font-bold font-heading mb-2 ${plan.featured ? "text-white" : "text-navy"}`}>
                {plan.name}
              </h3>
              <p className={`text-[15px] mb-8 font-medium ${plan.featured ? "text-white/70" : "text-gray"}`}>
                {plan.desc}
              </p>

              <div className="mb-8 flex items-end gap-1">
                <span className="text-[48px] leading-[1] font-extrabold tracking-tight font-heading">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className={`text-[17px] font-medium mb-1 ${plan.featured ? "text-white/60" : "text-gray"}`}>
                    {plan.period}
                  </span>
                )}
              </div>

              <Button
                className={`w-full h-14 rounded-[16px] text-base font-bold transition-all hover:-translate-y-1 mb-10 ${
                  plan.featured
                    ? "bg-gradient-to-r from-[var(--color-green-deep)] to-[var(--color-green-vivid)] hover:from-[var(--color-green-vivid)] hover:to-[var(--color-green-vivid)] text-white shadow-[0_8px_24px_rgba(37,211,102,0.3)] border-none"
                    : "bg-[var(--color-gray-light)] hover:bg-gray-100 text-navy border border-border shadow-sm"
                }`}
              >
                {plan.buttonText}
              </Button>

              <ul className="space-y-4">
                {plan.features.map((feat, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <CheckCircle2 className={`h-[22px] w-[22px] shrink-0 ${plan.featured ? "text-[var(--color-green-vivid)]" : "text-[var(--color-green-deep)]"}`} />
                    <span className={`text-[15px] font-medium leading-tight pt-0.5 ${plan.featured ? "text-white/90" : "text-navy"}`}>
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
