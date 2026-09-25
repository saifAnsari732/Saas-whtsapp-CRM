"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  MessageSquare, 
  Globe, 
  Bot, 
  BrainCircuit, 
  Search, 
  Workflow, 
  CheckCircle2,
  Sparkles,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

interface PlanService {
  name: string;
  icon: any;
  value: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  headerBg: string;
  btnBg: string;
  popular: boolean;
  services: PlanService[];
  features: string[];
}

const plans: Plan[] = [
  {
    id: "essential",
    name: "Essential",
    monthlyPrice: 999,
    yearlyPrice: 949,
    headerBg: "bg-[#00A884]", // Vibrant Emerald WhatsApp Green
    btnBg: "bg-slate-100 hover:bg-slate-200 text-slate-800",
    popular: false,
    services: [
      { name: "WhatsApp API", icon: MessageSquare, value: "15K msg", included: true },
      { name: "Website", icon: Globe, value: "Landing Page", included: true },
      { name: "Chatbot", icon: Bot, value: "Advanced", included: true },
      { name: "AI Agent", icon: BrainCircuit, value: "Not included", included: false },
      { name: "SEO", icon: Search, value: "Not included", included: false },
      { name: "AI Automation", icon: Workflow, value: "Basic", included: true },
    ],
    features: [
      "2 WhatsApp Numbers",
      "15,000 Contacts",
      "5 Users",
      "Unlimited Campaigns",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    monthlyPrice: 1999,
    yearlyPrice: 1899,
    headerBg: "bg-[#111c24]", // Sleek Deep Navy/Charcoal
    btnBg: "bg-[#00A884] hover:bg-[#008f70] text-white",
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
      "Flow Builder & AI Generator",
    ],
  },
  {
    id: "all-in-one",
    name: "All-In-One",
    monthlyPrice: 3999,
    yearlyPrice: 3799,
    headerBg: "bg-[#8b3cfc]", // Vibrant Violet Purple
    btnBg: "bg-slate-100 hover:bg-slate-200 text-slate-800",
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
      "Sequence & Dedicated Manager",
    ],
  },
];

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-20 lg:py-24 bg-white relative overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[#00A884]/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E8F8F5] border border-[#D1F2EB] text-[#00A884] text-xs font-semibold mb-4 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Choose the perfect plan for your business needs. No hidden fees.</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-heading font-extrabold text-[#111827] leading-[1.15] tracking-tight mb-4">
            Simple & Transparent <span className="text-[#00A884]">Pricing Plans</span>
          </h2>

          {/* Monthly / Yearly Toggle */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className={`text-sm font-bold ${!isYearly ? "text-slate-900" : "text-slate-400"}`}>
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setIsYearly(!isYearly)}
              aria-label="Toggle Monthly/Yearly billing"
              className="relative inline-flex h-7 w-13 items-center rounded-full bg-slate-900 p-1 transition-colors cursor-pointer"
            >
              <motion.span
                layout
                className="inline-block h-5 w-5 rounded-full bg-white shadow-xs"
                animate={{ x: isYearly ? 22 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm font-bold ${isYearly ? "text-slate-900" : "text-slate-400"}`}>
              Yearly <span className="text-[#00A884] text-xs font-semibold bg-[#E8F8F5] border border-[#D1F2EB] px-2 py-0.5 rounded-full ml-1">Save 5% OFF</span>
            </span>
          </div>
        </div>

        {/* 3 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-6xl mx-auto">
          {plans.map((plan) => {
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-[26px] overflow-hidden shadow-md border flex flex-col justify-between ${
                  plan.popular
                    ? "border-[#00A884]/40 ring-2 ring-[#00A884]/30 shadow-xl"
                    : "border-slate-200"
                }`}
              >
                {/* Most Popular Floating Pill on Header */}
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
                    <span className="bg-[#00A884] text-white text-[10px] font-extrabold px-3 py-1 rounded-b-xl uppercase tracking-wider shadow-sm">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {/* Top Colored Header Section */}
                <div className={`${plan.headerBg} p-6 text-white text-left relative`}>
                  <h3 className="text-xl font-bold font-heading mb-3 tracking-tight">
                    {plan.name}
                  </h3>

                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-extrabold tracking-tight">
                      ₹{price.toLocaleString()}
                    </span>
                    <span className="text-sm font-medium text-white/80">/mo</span>
                  </div>
                </div>

                {/* Bottom Body */}
                <div className="p-6 flex-1 flex flex-col justify-between bg-white text-slate-800">
                  
                  {/* Action Button */}
                  <Link
                    href={`/billing`}
                    className={`w-full py-3 rounded-xl font-bold text-sm text-center mb-6 transition-all block ${
                      plan.popular
                        ? "bg-[#00A884] hover:bg-[#008f70] text-white shadow-md shadow-[#00A884]/20"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200/80"
                    }`}
                  >
                    {plan.id === "starter" ? "Get Started" : "Upgrade"}
                  </Link>

                  {/* Services Included */}
                  <div className="space-y-2.5 mb-7">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                      SERVICES INCLUDED
                    </div>

                    {plan.services.map((svc, idx) => {
                      const Icon = svc.icon;
                      return (
                        <div key={idx} className="flex items-center justify-between text-xs py-1">
                          <div className="flex items-center gap-2 text-slate-700 font-medium">
                            <Icon className={`w-3.5 h-3.5 ${svc.included ? "text-[#00A884]" : "text-slate-400"}`} />
                            <span>{svc.name}</span>
                          </div>

                          {svc.included ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F8F5] text-[#00A884] border border-[#D1F2EB]">
                              {svc.value}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400">
                              Not included
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Additional Features */}
                  <div className="pt-5 border-t border-slate-100">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                      ADDITIONAL FEATURES
                    </div>

                    <ul className="space-y-2.5">
                      {plan.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                          <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.popular ? "text-[#00A884]" : "text-emerald-600"}`} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
