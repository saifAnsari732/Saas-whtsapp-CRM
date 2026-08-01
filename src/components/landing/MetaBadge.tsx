"use client";

import { motion } from "framer-motion";
import { Check, ShieldCheck, Zap, LayoutTemplate, MessageSquare } from "lucide-react";

export function MetaBadge() {
  const perks = [
    { icon: ShieldCheck, text: "Zero Ban Risk" },
    { icon: Zap, text: "Official Cloud API" },
    { icon: LayoutTemplate, text: "Meta Approved Templates" },
  ];

  return (
    <section className="bg-[var(--color-gray-light)] py-24">
      <div className="container mx-auto px-4 md:px-8 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="w-full max-w-3xl rounded-[32px] bg-white p-8 md:p-12 text-center shadow-[0_8px_32px_rgba(7,94,84,0.06)] border border-border"
        >
          {/* Badge */}
          <div className="mb-8 inline-flex items-center rounded-full bg-[var(--color-green-mint)] px-4 py-1.5 border border-[var(--color-green-vivid)]/20">
            <Check className="mr-1.5 h-4 w-4 text-[var(--color-green-deep)]" />
            <span className="text-sm font-bold uppercase tracking-widest text-[var(--color-green-deep)] font-heading">
              Verified Partner
            </span>
          </div>

          {/* Logos */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0668E1]/10 text-[#0668E1]">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                 <path d="M12 2C6.48 2 2 6.48 2 12c0 5.02 3.7 9.19 8.5 9.92v-7.02H8.17v-2.9h2.33V9.69c0-2.31 1.38-3.59 3.48-3.59.99 0 2.03.18 2.03.18v2.24h-1.15c-1.13 0-1.48.7-1.48 1.42v1.7h2.51l-.4 2.9h-2.1v7.02c4.8-.73 8.5-4.9 8.5-9.92 0-5.52-4.48-10-10-10z" />
               </svg>
            </div>
            <span className="text-2xl font-bold text-gray/40">+</span>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-green-deep)] to-[var(--color-green-vivid)] shadow-md">
               <MessageSquare className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Text Content */}
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-navy md:text-4xl font-heading">
            Meta Official Tech Provider
          </h2>
          <p className="mb-10 text-lg text-gray max-w-xl mx-auto leading-relaxed">
            Unlike unauthorized third-party apps that put your number at risk of permanent bans, WaCRM is built directly on the official WhatsApp Cloud API. We are officially recognized by Meta to provide enterprise-grade messaging infrastructure.
          </p>

          {/* Perks */}
          <div className="grid gap-4 sm:grid-cols-3">
            {perks.map((perk, i) => (
              <div key={i} className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-[var(--color-gray-light)] p-5 border border-border">
                <perk.icon className="h-6 w-6 text-[var(--color-green-deep)]" />
                <span className="text-sm font-bold text-navy font-heading">{perk.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
