"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { ChatMockup } from "./ChatMockup";

export function HeroSection() {
  const headline = "Turn WhatsApp Into Your".split(" ");
  
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32 bg-[#fafcfa]">
      
      {/* Modern Grid & Radial Glow Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#075e5410_1px,transparent_1px),linear-gradient(to_bottom,#075e5410_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[600px] w-[600px] rounded-full bg-[var(--color-green-vivid)] opacity-20 blur-[120px]"></div>

      <div className="container relative mx-auto px-4 md:px-8 max-w-screen-2xl">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-12 items-center">
          
          {/* LEFT: Text Content */}
          <div className="flex flex-col items-start max-w-2xl relative z-10">
            
            {/* Premium Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
              className="mb-8 inline-flex items-center rounded-full bg-white px-4 py-2 border border-border/50 shadow-sm"
            >
              <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-green-deep)] to-[var(--color-green-vivid)]">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-bold tracking-wide text-navy font-heading">
                Meta Official Tech Provider
              </span>
            </motion.div>

            {/* Headline */}
            <h1 className="mb-6 text-[46px] font-extrabold leading-[1.05] tracking-tight text-navy sm:text-6xl lg:text-[76px] font-heading">
              {headline.map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
                  className="inline-block mr-4"
                >
                  {word}
                </motion.span>
              ))}
              <br className="hidden lg:block" />
              <motion.span 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-green-deep)] to-[var(--color-green-vivid)] mt-2 lg:mt-3"
              >
                #1 Growth Engine
                <motion.svg
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
                  className="absolute -bottom-3 left-0 w-full h-4 origin-left text-[var(--color-green-vivid)] opacity-70"
                  viewBox="0 0 200 9"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.00018 6.99996C39.4673 2.87114 116.143 -1.8217 197.801 6.30907"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </motion.svg>
              </motion.span>
            </h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mb-10 text-[19px] leading-relaxed text-gray max-w-[540px] font-medium"
            >
              Automate sales, support, and marketing with intelligent AI bots built directly on the official Meta Cloud API. Unstoppable delivery, zero bans.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <Link href="/signup" className="w-full sm:w-auto group">
                <Button className="w-full sm:w-auto h-14 px-8 text-base font-bold bg-[var(--color-navy)] hover:bg-[var(--color-navy)]/90 text-white shadow-lg shadow-navy/20 rounded-full hover:-translate-y-1 transition-all">
                  Get Started for Free 
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/signup?redirect=%2Fsettings%3Ftab%3Dwhatsapp" className="w-full sm:w-auto group">
                <Button className="w-full sm:w-auto h-14 px-8 text-base font-bold bg-[#1877F2] hover:bg-[#1877F2]/90 text-white rounded-full hover:-translate-y-1 transition-all shadow-md shadow-blue-500/20">
                  <svg viewBox="0 0 24 24" className="mr-2 h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Connect with Facebook
                </Button>
              </Link>
            </motion.div>

            {/* Trust Row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="mt-14 flex items-center gap-4 bg-white/60 backdrop-blur-md py-2.5 px-4 rounded-full border border-border/50 shadow-sm"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-9 w-9 rounded-full border-2 border-white bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${i * 10}&backgroundColor=e2e8f0`} alt="Avatar" className="w-full h-full" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(star => (
                    <svg key={star} className="w-3.5 h-3.5 text-[#F59E0B]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[13px] font-medium text-navy mt-0.5">
                  Trusted by <strong>2,400+</strong> teams
                </p>
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Visual Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
            className="relative lg:ml-auto w-full max-w-lg flex justify-center lg:justify-end z-10"
          >
            {/* Decorative elements behind phone */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-[var(--color-green-vivid)]/20 to-[var(--color-green-deep)]/20 blur-2xl rounded-full -z-10"></div>
            <ChatMockup />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
