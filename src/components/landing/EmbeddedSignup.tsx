"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, ShieldCheck, Zap, MessageSquare } from "lucide-react";
import Link from "next/link";

const trustPoints = [
  "Official WhatsApp API (100% compliant)",
  "Enterprise-grade security & reliability",
  "Easy integration with your existing tools",
  "Dedicated support team",
  "Transparent pricing, no hidden fees",
];

export default function EmbeddedSignup() {
  return (
    <section className="py-24 bg-gradient-to-br from-[#075E54] via-[#128C7E] to-[#25D366] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 font-heading leading-tight">
              Why Businesses Trust ChatFlyr
            </h2>
            <p className="text-lg text-white/80 mb-10 font-sans max-w-lg">
              Join thousands of businesses that rely on our robust infrastructure and official WhatsApp integration to power their customer communications.
            </p>
            
            <ul className="space-y-4 mb-10">
              {trustPoints.map((point, index) => (
                <motion.li 
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center gap-3 text-white"
                >
                  <CheckCircle2 className="w-6 h-6 text-green-200 shrink-0" />
                  <span className="font-medium">{point}</span>
                </motion.li>
              ))}
            </ul>
            
            <Link 
              href="/about" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white hover:text-[#075E54] transition-all duration-300"
            >
              Learn More
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Right Side: Mockup / Floating Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 md:p-8 rounded-3xl shadow-2xl relative z-10">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 font-heading">System Status</h3>
                    <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      All systems operational
                    </p>
                  </div>
                  <ShieldCheck className="w-8 h-8 text-[#128C7E]" />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Customer Support</p>
                        <p className="text-xs text-slate-500">12 agents online</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      Active
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Sales Team</p>
                        <p className="text-xs text-slate-500">8 agents online</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      Active
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Uptime</p>
                      <p className="text-xl font-bold text-slate-900">99.99%</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Messages Today</p>
                      <p className="text-xl font-bold text-slate-900">1.2M+</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating decorative elements behind the card */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-green-400 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-teal-400 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob animation-delay-2000"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
