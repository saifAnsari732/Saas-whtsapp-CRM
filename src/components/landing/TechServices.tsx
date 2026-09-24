"use client";

import { motion } from "framer-motion";
import { 
  ShoppingCart, 
  Heart, 
  GraduationCap, 
  Building2, 
  Plane, 
  BadgePercent,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

const industries = [
  {
    title: "E-Commerce & Retail",
    description: "Automate abandoned cart recovery, deliver instant order tracking & dynamic product catalogs on WhatsApp.",
    icon: ShoppingCart,
    tag: "98% Open Rate",
    gradient: "from-emerald-500/15 via-teal-500/5 to-transparent",
    iconBg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    stats: "3.2x Higher Sales"
  },
  {
    title: "Healthcare & Clinics",
    description: "Send automated appointment confirmations, lab report alerts, health tips and pre-visit questionnaires securely.",
    icon: Heart,
    tag: "HIPAA Compliant",
    gradient: "from-rose-500/15 via-pink-500/5 to-transparent",
    iconBg: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    stats: "70% Fewer No-Shows"
  },
  {
    title: "EdTech & Institutions",
    description: "Streamline student admissions, course alerts, fee payment reminders and multi-agent student counselling.",
    icon: GraduationCap,
    tag: "Instant Support",
    gradient: "from-blue-500/15 via-indigo-500/5 to-transparent",
    iconBg: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    stats: "4x Faster Admissions"
  },
  {
    title: "Real Estate & Builders",
    description: "Qualify high-intent property leads, send HD brochures, video walk-throughs & schedule site visits in 1 click.",
    icon: Building2,
    tag: "Lead Qualification",
    gradient: "from-amber-500/15 via-orange-500/5 to-transparent",
    iconBg: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    stats: "85% Response Rate"
  },
  {
    title: "Travel & Hospitality",
    description: "Share e-tickets, hotel check-in details, real-time flight updates and 24/7 automated concierge assistance.",
    icon: Plane,
    tag: "24/7 Concierge",
    gradient: "from-cyan-500/15 via-sky-500/5 to-transparent",
    iconBg: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
    stats: "Instant Check-In"
  },
  {
    title: "BFSI & Fintech",
    description: "Send fraud alerts, loan application status, automated EMI reminders and statements with bank-grade encryption.",
    icon: BadgePercent,
    tag: "Bank-Grade Security",
    gradient: "from-violet-500/15 via-purple-500/5 to-transparent",
    iconBg: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    badgeColor: "bg-violet-50 text-violet-700 border-violet-200",
    stats: "100% Encrypted"
  },
];

export default function TechServices() {
  return (
    <section id="services" className="py-20 lg:py-24 bg-gradient-to-b from-white via-slate-50/60 to-white relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#00A884]/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E8F8F5] border border-[#D1F2EB] mb-4 shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-[#00A884]" />
            <span className="text-xs font-semibold text-[#00A884] uppercase tracking-wider">Built for Every Industry</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-[#111827] font-heading tracking-tight leading-tight mb-4"
          >
            Tailored Solutions for <span className="text-[#00A884]">Every Business</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed"
          >
            Whether you operate in retail, healthcare, education or financial services, ChatFlyr provides customized WhatsApp automation designed to drive higher ROI.
          </motion.p>
        </div>

        {/* 6 Cards Grid with High Visual Polish */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
          {industries.map((ind, i) => {
            const Icon = ind.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="relative bg-white rounded-3xl p-7 shadow-sm border border-slate-200 flex flex-col justify-between overflow-hidden"
              >
                {/* Subtle colored accent top border gradient */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${ind.gradient.split(" ")[0]} to-transparent`} />

                <div>
                  {/* Top row: Icon + Pill Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-13 h-13 rounded-2xl ${ind.iconBg} border flex items-center justify-center shadow-xs`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${ind.badgeColor}`}>
                      {ind.tag}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-slate-900 mb-2.5 font-heading">
                    {ind.title}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    {ind.description}
                  </p>
                </div>

                {/* Card Footer: Metrics + Link */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <TrendingUp className="w-4 h-4 text-[#00A884]" />
                    <span>{ind.stats}</span>
                  </div>
                  <span className="text-[#00A884] font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Explore <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
