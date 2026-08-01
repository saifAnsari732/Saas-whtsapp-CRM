"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
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
      price: "₹2,499",
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
    <section id="pricing" className="bg-white py-24">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            className="text-sm font-bold uppercase tracking-widest text-[var(--color-green-deep)] font-heading mb-4"
          >
            Simple Pricing
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-extrabold tracking-tight text-navy md:text-5xl font-heading mb-6"
          >
            Scale without surprises
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray"
          >
            Pay for what you use. Upgrade as you grow. No hidden Meta API markup fees.
          </motion.p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto items-center">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className={`relative rounded-3xl p-8 transition-all ${
                plan.featured
                  ? "bg-gradient-to-b from-[var(--color-green-deep)] to-[#094d45] text-white shadow-[0_20px_60px_rgba(7,94,84,0.25)] lg:scale-105 border border-white/10"
                  : "bg-white text-navy border border-border shadow-[0_8px_32px_rgba(7,94,84,0.04)]"
              }`}
            >
              {plan.featured && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="inline-block rounded-full bg-[var(--color-green-vivid)] px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                    {plan.badge}
                  </span>
                </div>
              )}
              
              {/* Subtle pulse border on featured */}
              {plan.featured && (
                <div className="absolute inset-0 rounded-3xl ring-2 ring-[var(--color-green-vivid)]/30 animate-pulse pointer-events-none" />
              )}

              <h3 className={`text-xl font-bold font-heading mb-2 ${plan.featured ? "text-white" : "text-navy"}`}>
                {plan.name}
              </h3>
              <p className={`text-sm mb-6 ${plan.featured ? "text-white/80" : "text-gray"}`}>
                {plan.desc}
              </p>

              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight font-heading">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className={`text-lg font-medium ${plan.featured ? "text-white/70" : "text-gray"}`}>
                    {plan.period}
                  </span>
                )}
              </div>

              <Button
                className={`w-full h-12 rounded-xl text-base font-semibold transition-all hover:-translate-y-0.5 mb-8 ${
                  plan.featured
                    ? "bg-[var(--color-green-vivid)] hover:bg-[var(--color-green-vivid)]/90 text-navy shadow-[0_8px_24px_rgba(37,211,102,0.35)]"
                    : "bg-[var(--color-gray-light)] hover:bg-border text-navy border border-border"
                }`}
              >
                {plan.buttonText}
              </Button>

              <ul className="space-y-4">
                {plan.features.map((feat, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <CheckCircle2 className={`h-5 w-5 shrink-0 ${plan.featured ? "text-[var(--color-green-vivid)]" : "text-[var(--color-green-deep)]"}`} />
                    <span className={`text-sm font-medium ${plan.featured ? "text-white/90" : "text-gray"}`}>
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
