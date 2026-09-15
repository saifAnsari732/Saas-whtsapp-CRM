"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type CategoryId = "web" | "app" | "automation" | "whatsapp";

interface PlanItem {
  name: string;
  price: string;
  subtitle: string;
  popular?: boolean;
  features: string[];
}

const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "web", label: "WEB PACKAGES" },
  { id: "app", label: "APP DEVELOPMENT" },
  { id: "automation", label: "AI AUTOMATION" },
  { id: "whatsapp", label: "WHATSAPP & CRM" },
];

const PLAN_DATA: Record<CategoryId, PlanItem[]> = {
  web: [
    {
      name: "BASIC WEBSITE",
      price: "₹2,999",
      subtitle: "PERFECT FOR LOCAL PRESENCE.",
      features: [
        "One Page Static Website",
        "Hosting Included",
        "Free SSL Certificate",
        "Mobile Responsive Design",
        "WhatsApp Chat Button",
        "Google Map Integration",
        "Social Media Integration",
        "Basic SEO Optimization",
        "Free Landing Page",
      ],
    },
    {
      name: "STANDARD WEBSITE",
      price: "₹4,999",
      subtitle: "MOST POPULAR FOR SMALL BUSINESS.",
      popular: true,
      features: [
        "0-10 Pages Website",
        "Hosting Included",
        "Free SSL Certificate",
        "Mobile & Tablet Responsive",
        "WhatsApp Chat Button",
        "Google Map Integration",
        "Social Media Integration",
        "Lead Generation Forms",
        "On-Page SEO Setup",
        "2-3 Domain Email Id",
        "6 Months Free Website Maintenance",
        "Free Landing Page",
      ],
    },
    {
      name: "BUSINESS WEBSITE",
      price: "₹7,999",
      subtitle: "ADVANCED FEATURES FOR GROWTH.",
      features: [
        "10-20 Pages Website",
        "Hosting Included",
        "Free SSL Certificate",
        "Premium Responsive Design",
        "WhatsApp Chat Button",
        "Google Map Integration",
        "Social Media Integration",
        "Advanced SEO Optimization",
        "Admin Panel Access",
        "2-5 Domain Email Id",
        "12 Months Free Website Maintenance",
        "Free Landing Page",
      ],
    },
  ],
  app: [
    {
      name: "BASIC APP",
      price: "₹9,999",
      subtitle: "STARTUP HYBRID APP.",
      features: [
        "Android Hybrid App",
        "Play Store Publishing",
        "Push Notifications",
        "User Auth & Profiles",
        "WhatsApp Live Chat",
        "Basic Analytics",
        "3 Months Support",
      ],
    },
    {
      name: "PRO MOBILE APP",
      price: "₹19,999",
      subtitle: "IOS & ANDROID COMPLETE APP.",
      popular: true,
      features: [
        "iOS & Android Native Apps",
        "Play Store & App Store Publishing",
        "Custom UI/UX Design",
        "Payment Gateway Integration",
        "Realtime Database & Backend",
        "Automated Push Notifications",
        "Admin Portal Dashboard",
        "6 Months Maintenance",
      ],
    },
    {
      name: "ENTERPRISE APP",
      price: "₹39,999",
      subtitle: "FULL TECH STACK & SOURCE CODE.",
      features: [
        "Cross-Platform Flutter/React Native",
        "Dedicated Backend Server",
        "Custom AI Chatbot Embedded",
        "Scalable Cloud Architecture",
        "Full Source Code Handover",
        "Advanced Analytics & Security",
        "12 Months Priority Support",
      ],
    },
  ],
  automation: [
    {
      name: "AI CHATBOT",
      price: "₹1,499",
      subtitle: "AUTOMATE CUSTOMER QUERIES.",
      features: [
        "Smart Keyword Auto-Reply",
        "24/7 Support Bot",
        "Multi-language Support",
        "Lead Capture Forms",
        "Instant Email/SMS Alerts",
        "Standard Integration",
      ],
    },
    {
      name: "AI AGENT SUITE",
      price: "₹3,499",
      subtitle: "ADVANCED WORKFLOWS & BOT.",
      popular: true,
      features: [
        "Custom Trained AI Model (Gemini/OpenAI)",
        "Automated Follow-up Sequences",
        "CRM & Database Sync",
        "Intent Recognition",
        "E-Commerce Product Recommendations",
        "Priority Support",
      ],
    },
    {
      name: "FULL AI AUTOMATION",
      price: "₹6,999",
      subtitle: "COMPLETE BUSINESS AUTOMATION.",
      features: [
        "Unlimited Custom Workflows",
        "Multi-Channel Bot (WhatsApp, Web, IG)",
        "Voice & Document Parsing",
        "Custom API & Webhook Triggers",
        "Dedicated AI Engineer",
        "24/7 SLA Guarantee",
      ],
    },
  ],
  whatsapp: [
    {
      name: "STARTER CRM",
      price: "₹499",
      subtitle: "PERFECT FOR SMALL TEAMS.",
      features: [
        "1 WhatsApp Number",
        "2,000 Contacts",
        "1 Team Member",
        "Basic CRM Templates",
        "Basic Broadcasts",
        "Community Support",
      ],
    },
    {
      name: "GROWTH CRM",
      price: "₹1,999",
      subtitle: "MOST POPULAR FOR SCALING.",
      popular: true,
      features: [
        "3 WhatsApp Numbers",
        "50,000 Messages/mo",
        "Unlimited Contacts",
        "15 Team Members",
        "Advanced Flow Builder",
        "AI Template Generator",
        "Messaging Wallet",
        "Priority Support",
      ],
    },
    {
      name: "ALL-IN-ONE CRM",
      price: "₹3,999",
      subtitle: "UNLIMITED EVERYTHING + APPS.",
      features: [
        "Unlimited WhatsApp Numbers",
        "Unlimited Contacts",
        "Unlimited Team Members",
        "Mobile App & Web Dev Included",
        "Full AI Automation Suite",
        "Dedicated Account Manager",
      ],
    },
  ],
};

export function PricingSection() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("web");

  return (
    <section id="pricing" className="bg-[#fafcfa] py-28 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 relative z-10 max-w-[1300px]">
        {/* Header */}
        <div className="mb-14 text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mb-4 inline-flex items-center rounded-full bg-white px-4 py-1.5 border border-slate-200 shadow-sm"
          >
            <Sparkles className="mr-2 h-4 w-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-800">
              PRICING & SERVICES
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 font-heading mb-4 uppercase"
          >
            CHOOSE YOUR <span className="text-blue-600 italic">PLAN</span>
          </motion.h2>

          {/* Category Tabs (Pills) */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`relative rounded-full px-6 py-3 text-xs font-extrabold uppercase tracking-wider transition-all duration-300 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                      : "bg-white text-slate-600 border border-slate-200 hover:border-blue-400 hover:text-blue-600 shadow-sm"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pricing Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid gap-8 md:grid-cols-3 items-stretch max-w-6xl mx-auto"
          >
            {PLAN_DATA[activeCategory].map((plan, i) => (
              <div
                key={i}
                className={`relative flex flex-col justify-between rounded-[36px] bg-white p-8 md:p-10 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                  plan.popular
                    ? "border-2 border-blue-600 shadow-xl scale-105 z-10"
                    : "border border-slate-200/80 shadow-md"
                }`}
              >
                {/* Most Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-[10px] font-extrabold px-5 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {/* Top Section */}
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-wide font-heading uppercase mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-6">
                    {plan.subtitle}
                  </p>

                  <div className="mb-8 flex items-baseline gap-1 border-b border-slate-100 pb-6">
                    <span className="text-5xl font-black text-blue-600 tracking-tight font-heading">
                      {plan.price}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      / PROJECT
                    </span>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3.5 mb-8">
                    {plan.features.map((feat, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 leading-snug">
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom Action Button */}
                <div className="pt-4">
                  <Link href="/signup" className="block w-full">
                    <Button
                      className={`w-full h-12 rounded-full text-xs font-extrabold uppercase tracking-widest transition-all ${
                        plan.popular
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30"
                          : "bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200"
                      }`}
                    >
                      SELECT PLAN
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

