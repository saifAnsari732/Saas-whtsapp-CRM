"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { ChatMockup } from "./ChatMockup";

export function HeroSection() {
  const headline = "Automate WhatsApp with".split(" ");
  
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32 bg-[linear-gradient(160deg,white_0%,var(--color-green-mint)_60%,white_100%)]">
      {/* Animated Background Glow */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] -translate-y-1/3 translate-x-1/3 rounded-full bg-[var(--color-green-vivid)]/10 blur-[100px]"
      />

      <div className="container mx-auto px-4 md:px-8 max-w-screen-2xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          
          {/* LEFT: Text Content */}
          <div className="flex flex-col items-start max-w-2xl">
            
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
              className="mb-8 inline-flex items-center rounded-full bg-[var(--color-green-light)] px-4 py-1.5 border border-[var(--color-green-vivid)]/20"
            >
              <span className="mr-2 h-2 w-2 rounded-full bg-[var(--color-green-vivid)] animate-pulse" />
              <span className="text-sm font-bold uppercase tracking-widest text-[var(--color-green-deep)] font-heading">
                Meta Official Tech Provider
              </span>
            </motion.div>

            {/* Headline */}
            <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight text-navy sm:text-6xl lg:text-7xl font-heading">
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
              <span className="relative inline-block text-[var(--color-green-deep)] mt-2 lg:mt-0">
                Confidence
                <motion.svg
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
                  className="absolute -bottom-2 left-0 w-full h-3 origin-left text-[var(--color-green-vivid)]"
                  viewBox="0 0 200 9"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.00018 6.99996C39.4673 2.87114 116.143 -1.8217 197.801 6.30907"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </motion.svg>
              </span>
            </h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mb-8 text-lg sm:text-xl text-gray max-w-[600px]"
            >
              The ultimate CRM platform to engage customers, automate replies with AI, and scale your marketing — powered by the official WhatsApp Cloud API. No bans. No workarounds. Just results.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <Link href="/signup" className="w-full sm:w-auto">
                <Button className="w-full h-14 px-8 text-base font-semibold bg-gradient-to-r from-green-deep to-green-vivid hover:from-green-deep hover:to-green-deep text-white shadow-[0_8px_24px_rgba(37,211,102,0.35)] rounded-xl hover:-translate-y-0.5 transition-all">
                  Start for Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#demo" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full h-14 px-8 text-base font-semibold bg-white border-border text-navy rounded-xl hover:bg-gray-light hover:-translate-y-0.5 transition-all shadow-sm">
                  <Play className="mr-2 h-5 w-5 fill-navy" /> Watch Demo
                </Button>
              </Link>
            </motion.div>

            {/* Trust Row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="mt-12 flex items-center gap-4"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden shadow-sm">
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${i}&backgroundColor=e2e8f0`} alt="Avatar" className="w-full h-full" />
                  </div>
                ))}
              </div>
              <p className="text-sm font-medium text-gray">
                <strong className="text-navy">2,400+</strong> businesses already using WaCRM
              </p>
            </motion.div>
          </div>

          {/* RIGHT: Visual Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
            className="relative lg:ml-auto w-full max-w-lg flex justify-center lg:justify-end"
          >
            <ChatMockup />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
