"use client";

import { motion } from "framer-motion";
import { CheckCircle2, TrendingUp, ArrowRight, ShieldCheck, Headphones, Zap } from "lucide-react";
import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="py-20 lg:py-24 relative overflow-hidden bg-gradient-to-br from-[#054c44] via-[#075E54] to-[#00A884]">
      {/* Background Decorative Soft Circles */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#25D366]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 flex flex-col items-start"
          >
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-semibold border border-white/20 mb-5 shadow-xs">
              <Zap className="w-3.5 h-3.5 fill-current text-[#25D366]" />
              <span>Ready to Scale Your Business?</span>
            </div>

            {/* Main Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-white font-heading tracking-tight leading-[1.15] mb-5">
              Supercharge Your WhatsApp Communication Today with ChatFlyr
            </h2>

            {/* Subtitle with High Contrast */}
            <p className="text-base sm:text-lg text-emerald-50/90 leading-relaxed mb-8 max-w-xl font-normal">
              Join thousands of businesses already using our official WhatsApp API platform to automate support, send high-converting broadcasts, and multiply conversions.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-8 w-full sm:w-auto">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-[#075E54] font-bold text-sm shadow-lg shadow-black/10 hover:bg-slate-50 transition-all hover:-translate-y-0.5"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              <Link
                href="#contact"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/30 backdrop-blur-md transition-all"
              >
                <span>Contact Sales</span>
              </Link>
            </div>

            {/* Guarantees List */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-emerald-100/90">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#25D366]" />
                14-day free trial
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#25D366]" />
                No setup fees or credit card
              </div>
              <div className="flex items-center gap-1.5">
                <Headphones className="w-4 h-4 text-[#25D366]" />
                Dedicated setup assistance
              </div>
            </div>
          </motion.div>

          {/* Right Floating Preview Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 relative flex justify-center"
          >
            <div className="bg-white rounded-3xl p-6 shadow-2xl border border-white/40 max-w-sm w-full backdrop-blur-lg">
              
              {/* Card Header */}
              <div className="flex items-center gap-3.5 mb-5 pb-5 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00A884] to-[#25D366] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  CF
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span>ChatFlyr Business Account</span>
                    <CheckCircle2 className="w-4 h-4 text-[#00A884]" />
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">Official WhatsApp Cloud API</p>
                </div>
              </div>

              {/* Stats Preview */}
              <div className="space-y-3">
                <div className="bg-[#E8F8F5] rounded-2xl p-4 flex items-center justify-between border border-[#D1F2EB]">
                  <div>
                    <span className="text-[10px] font-bold text-[#075E54] uppercase tracking-wider block mb-0.5">
                      Messages Read Rate
                    </span>
                    <span className="text-2xl font-black text-slate-900">98.4%</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#00A884] shadow-xs">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      AI Auto-Reply Speed
                    </span>
                    <span className="text-2xl font-black text-slate-900">&lt; 2 sec</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#00A884]/10 flex items-center justify-center text-[#00A884] shadow-xs">
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                </div>

                <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#25D366] animate-ping" />
                    <span className="font-semibold text-[11px]">System Status: 100% Operational</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Meta Tier 2</span>
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
