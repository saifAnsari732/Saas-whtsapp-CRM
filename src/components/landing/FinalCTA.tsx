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
          className="relative rounded-[40px] bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 px-6 py-20 sm:px-16 sm:py-24 text-center overflow-hidden shadow-2xl"
        >
          {/* Background Glows inside the CTA Card */}
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/10 blur-[100px] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white/10 blur-[100px] translate-x-1/3 translate-y-1/3 rounded-full pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-[24px] bg-white/20 backdrop-blur-md shadow-lg border border-white/30">
               <MessageCircle className="h-10 w-10 text-white" />
            </div>

            <p className="text-[13px] font-black uppercase tracking-[0.2em] text-white font-heading mb-6 bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-sm">
              Get Started Today
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-[60px] font-black tracking-tight text-white font-heading mb-8 leading-[1.05]">
              Ready to transform your communication?
            </h2>
            <p className="text-[18px] text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed font-semibold">
              Join thousands of modern businesses using our official platform to scale their WhatsApp presence effortlessly and securely.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <Link href="/signup" className="w-full sm:w-auto group">
                <Button className="w-full sm:w-auto h-16 px-10 text-base font-extrabold bg-white text-blue-700 hover:bg-slate-50 rounded-full shadow-xl hover:-translate-y-1 transition-all">
                  Start 7-Day Free Trial 
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto h-16 px-10 text-base font-extrabold bg-white/10 border-white/40 text-white rounded-full hover:bg-white/20 hover:-translate-y-1 transition-all">
                  Book a Demo
                </Button>
              </Link>
            </div>
            
            <p className="mt-8 text-xs text-white/80 font-bold uppercase tracking-wider">
              No credit card required • 7-day free trial • Cancel anytime
            </p>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
