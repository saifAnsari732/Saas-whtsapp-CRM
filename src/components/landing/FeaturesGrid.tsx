"use client";

import { motion } from "framer-motion";
import { 
  Megaphone, 
  Bot, 
  LayoutTemplate, 
  Users, 
  Workflow, 
  BarChart3, 
  Plug, 
  ShieldCheck, 
  Smartphone,
  ArrowUpRight
} from "lucide-react";

export function FeaturesGrid() {
  const features = [
    {
      icon: Megaphone,
      title: "Massive Bulk Broadcasts",
      desc: "Send thousands of personalized messages instantly with zero ban risk using official Meta Cloud API infrastructure.",
      colSpan: "lg:col-span-2",
      highlight: true,
    },
    {
      icon: Bot,
      title: "AI Auto-Replies",
      desc: "Train AI on your catalog to handle customer queries 24/7 automatically.",
      colSpan: "lg:col-span-1",
    },
    {
      icon: LayoutTemplate,
      title: "Template Manager",
      desc: "Drag-and-drop builder for Meta-approved rich media templates.",
      colSpan: "lg:col-span-1",
    },
    {
      icon: Users,
      title: "Shared Team Inbox",
      desc: "Collaborate seamlessly. Assign chats and leave internal notes.",
      colSpan: "lg:col-span-1",
    },
    {
      icon: Workflow,
      title: "Intelligent Drip Campaigns",
      desc: "Set up automated sequences for cart recovery, onboarding, and order updates that run on autopilot.",
      colSpan: "lg:col-span-2",
      highlight: true,
    },
    {
      icon: BarChart3,
      title: "Analytics",
      desc: "Track delivery, read rates, and direct revenue attribution.",
      colSpan: "lg:col-span-1",
    },
    {
      icon: Plug,
      title: "CRM Integrations",
      desc: "Connects with Shopify, WooCommerce, Zoho, HubSpot & more.",
      colSpan: "lg:col-span-1",
    },
    {
      icon: ShieldCheck,
      title: "Official & Secure",
      desc: "E2E encrypted, GDPR compliant, and 100% Meta approved.",
      colSpan: "lg:col-span-1",
    },
    {
      icon: Smartphone,
      title: "Multi-Number Support",
      desc: "Manage unlimited WhatsApp Business numbers from a single, unified dashboard without logging out.",
      colSpan: "lg:col-span-2",
      highlight: true,
    }
  ];

  return (
    <section id="features" className="relative py-32 bg-[#fafcfa] overflow-hidden">
      
      {/* Premium Dot Pattern Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#075e5415_1px,transparent_1px)] bg-[size:24px_24px] opacity-70"></div>
      {/* Subtle Glows */}
      <div className="absolute top-40 left-0 w-[500px] h-[500px] bg-[var(--color-green-vivid)]/5 rounded-full blur-[100px] -translate-x-1/2"></div>
      <div className="absolute bottom-40 right-0 w-[500px] h-[500px] bg-[var(--color-green-deep)]/5 rounded-full blur-[100px] translate-x-1/2"></div>

      <div className="container relative mx-auto px-4 md:px-8 max-w-[1200px] z-10">
        
        {/* Section Header */}
        <div className="mb-20 text-center max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            className="text-4xl md:text-5xl lg:text-[54px] font-extrabold tracking-tight text-navy font-heading mb-6 leading-tight"
          >
            Everything you need to <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-green-deep)] to-[var(--color-green-vivid)]">dominate your market</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-[19px] text-gray font-medium leading-relaxed"
          >
            A complete, enterprise-grade suite of tools designed to help you manage conversations, run aggressive marketing campaigns, and automate support effortlessly.
          </motion.p>
        </div>

        {/* Bento Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`group relative overflow-hidden rounded-[28px] bg-white/70 backdrop-blur-xl border border-border/60 p-8 hover:bg-white hover:border-[var(--color-green-vivid)]/40 hover:shadow-[0_20px_40px_rgba(7,94,84,0.06)] transition-all duration-300 ${feature.colSpan}`}
            >
              
              {/* Highlight Decorative Element for large cards */}
              {feature.highlight && (
                 <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br from-[var(--color-green-vivid)]/10 to-[var(--color-green-deep)]/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              )}

              <div className="flex flex-col h-full relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-[var(--color-green-deep)]/5 to-[var(--color-green-vivid)]/10 border border-[var(--color-green-vivid)]/20 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-6 w-6 text-[var(--color-green-deep)]" />
                  </div>
                  {feature.highlight && (
                    <ArrowUpRight className="h-5 w-5 text-gray-300 group-hover:text-[var(--color-green-vivid)] transition-colors" />
                  )}
                </div>
                
                <h3 className="mb-3 text-[22px] font-bold text-navy font-heading group-hover:text-[var(--color-green-deep)] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-[16px] text-gray leading-relaxed font-medium mt-auto">
                  {feature.desc}
                </p>
              </div>

            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
