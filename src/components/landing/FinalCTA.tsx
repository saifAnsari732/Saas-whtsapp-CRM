"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-white py-20 lg:py-32">
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="relative rounded-[40px] bg-[var(--color-navy)] px-6 py-20 sm:px-16 sm:py-24 text-center overflow-hidden shadow-2xl border border-navy/50"
        >
          {/* Stunning Background Glows inside the CTA Card */}
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-[var(--color-green-vivid)]/30 to-transparent blur-[100px] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-[var(--color-green-deep)]/40 to-transparent blur-[100px] translate-x-1/3 translate-y-1/3 rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-[24px] bg-white/10 backdrop-blur-md shadow-lg border border-white/20">
               <MessageCircle className="h-10 w-10 text-white" />
            </div>

            <p className="text-[14px] font-extrabold uppercase tracking-[0.2em] text-[var(--color-green-vivid)] font-heading mb-6">
              Get Started Today
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-[64px] font-extrabold tracking-tight text-white font-heading mb-8 leading-[1.05]">
              Ready to transform your communication?
            </h2>
            <p className="text-[19px] text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
              Join thousands of modern businesses using our official platform to scale their WhatsApp presence effortlessly and securely.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <Link href="/signup" className="w-full sm:w-auto group">
                <Button className="w-full sm:w-auto h-16 px-10 text-lg font-bold bg-white text-[var(--color-navy)] hover:bg-gray-100 rounded-full shadow-[0_8px_32px_rgba(255,255,255,0.2)] hover:-translate-y-1 transition-all">
                  Start for Free 
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#demo" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto h-16 px-10 text-lg font-bold bg-transparent border-white/30 text-white rounded-full hover:bg-white/10 hover:-translate-y-1 transition-all">
                  Book a Demo
                </Button>
              </Link>
            </div>
            
            <p className="mt-8 text-sm text-white/50 font-medium">
              No credit card required • 14-day free trial • Cancel anytime
            </p>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
