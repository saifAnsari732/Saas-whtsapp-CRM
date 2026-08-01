"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[var(--color-navy)] to-[#2D1B69] py-32">
      {/* Animated Glows */}
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-green-deep)]/40 blur-[120px]"
      />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay -z-10" />

      <div className="container mx-auto px-4 md:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto"
        >
          <p className="text-sm font-bold uppercase tracking-widest text-[var(--color-green-vivid)] font-heading mb-6">
            Get Started Today
          </p>
          <h2 className="text-4xl font-extrabold tracking-tight text-white md:text-6xl font-heading mb-8 leading-[1.1]">
            Ready to transform your communication?
          </h2>
          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of modern businesses using our official platform to scale their WhatsApp presence effortlessly and securely.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button className="w-full h-14 px-10 text-lg font-bold bg-white text-[var(--color-navy)] hover:bg-white/90 rounded-xl shadow-[0_8px_32px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 transition-all">
                Start for Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#demo" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full h-14 px-10 text-lg font-bold bg-transparent border-white/30 text-white rounded-xl hover:bg-white/10 hover:-translate-y-0.5 transition-all">
                Book a Demo
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
