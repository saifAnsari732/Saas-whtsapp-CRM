"use client";

import { motion } from "framer-motion";
import { Link2, Sparkles, Rocket } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: Link2,
      title: "Connect via Embedded Signup",
      desc: "Connect your WhatsApp number via Meta Business Login in 1-click. No complex developer setup required."
    },
    {
      num: "02",
      icon: Sparkles,
      title: "Create Message Templates",
      desc: "Use our AI-assisted template builder with real-time Meta approval tracking to craft the perfect message."
    },
    {
      num: "03",
      icon: Rocket,
      title: "Launch & Automate",
      desc: "Send bulk broadcasts, set up drip campaigns, and let our AI handle replies while you sleep."
    }
  ];

  return (
    <section id="how-it-works" className="bg-[var(--color-green-mint)] py-24">
      <div className="container mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="mb-16 max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            className="text-sm font-bold uppercase tracking-widest text-[var(--color-green-deep)] font-heading mb-4"
          >
            How it works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-extrabold tracking-tight text-navy md:text-5xl font-heading mb-6"
          >
            From zero to sending in under 5 minutes
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray"
          >
            We've streamlined the official WhatsApp Cloud API onboarding so you can focus on what matters: growing your business.
          </motion.p>
        </div>

        {/* Steps Grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="relative overflow-hidden rounded-[20px] bg-white p-8 shadow-[0_8px_32px_rgba(7,94,84,0.04)] hover:shadow-[0_16px_48px_rgba(7,94,84,0.08)] transition-all border border-border"
            >
              {/* Faded Background Number */}
              <div className="absolute -right-4 -top-8 text-[120px] font-black text-[var(--color-navy)] opacity-[0.03] pointer-events-none select-none font-heading">
                {step.num}
              </div>

              {/* Icon Box */}
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[14px] bg-gradient-to-br from-[var(--color-green-deep)] to-[var(--color-green-vivid)] shadow-md">
                <step.icon className="h-6 w-6 text-white" />
              </div>

              {/* Content */}
              <h3 className="mb-3 text-xl font-bold text-navy font-heading">
                Step {step.num} — {step.title}
              </h3>
              <p className="text-gray leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
