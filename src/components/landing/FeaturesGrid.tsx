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
  Smartphone 
} from "lucide-react";

export function FeaturesGrid() {
  const features = [
    {
      icon: Megaphone,
      title: "Bulk Broadcasts",
      desc: "Send thousands of personalized messages, zero ban risk."
    },
    {
      icon: Bot,
      title: "AI Auto-Replies",
      desc: "Train AI on your catalog, handles queries 24/7."
    },
    {
      icon: LayoutTemplate,
      title: "Template Manager",
      desc: "Drag-drop builder, Meta-approved templates."
    },
    {
      icon: Users,
      title: "Team Inbox",
      desc: "Shared inbox, assign chats, internal notes."
    },
    {
      icon: Workflow,
      title: "Drip Campaigns",
      desc: "Automated sequences, cart recovery, order updates."
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      desc: "Delivery, read rates, revenue attribution."
    },
    {
      icon: Plug,
      title: "CRM Integrations",
      desc: "Shopify, WooCommerce, Zoho, HubSpot + REST API."
    },
    {
      icon: ShieldCheck,
      title: "Official & Secure",
      desc: "Meta Cloud API, E2E encrypted, GDPR compliant."
    },
    {
      icon: Smartphone,
      title: "Multi-Number Support",
      desc: "Manage unlimited numbers in one dashboard."
    }
  ];

  return (
    <section id="features" className="bg-white py-24">
      <div className="container mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            className="text-4xl font-extrabold tracking-tight text-navy md:text-5xl font-heading mb-6"
          >
            Everything you need to grow
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray"
          >
            A complete suite of tools designed to help you manage conversations, run marketing campaigns, and automate support effortlessly.
          </motion.p>
        </div>

        {/* Features 3x3 Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ delay: (i % 3) * 0.1, duration: 0.5 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group rounded-[20px] bg-white border border-border p-8 transition-all hover:bg-[var(--color-green-mint)] hover:border-[var(--color-green-vivid)]/40 hover:shadow-[0_8px_32px_rgba(7,94,84,0.06)] cursor-default"
            >
              <div className="mb-5 flex h-[56px] w-[56px] items-center justify-center rounded-[14px] bg-[var(--color-gray-light)] transition-colors group-hover:bg-white group-hover:shadow-sm border border-transparent group-hover:border-[var(--color-green-vivid)]/20">
                <feature.icon className="h-6 w-6 text-[var(--color-green-deep)]" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-navy font-heading group-hover:text-[var(--color-green-deep)] transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
