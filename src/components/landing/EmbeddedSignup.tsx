"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmbeddedSignup() {
  const checklist = [
    "Sign in with your Facebook Business account",
    "Select your WhatsApp Business number",
    "Done! Start sending campaigns immediately"
  ];

  return (
    <section className="bg-gradient-to-br from-[var(--color-green-deep)] via-[#0d7a6d] to-[var(--color-green-vivid)] py-24 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-black/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="grid gap-16 lg:grid-cols-2 items-center">
          
          {/* LEFT: Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-bold uppercase tracking-widest text-white/70 font-heading mb-4">
              Seamless Onboarding
            </p>
            <h2 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl font-heading mb-6 leading-[1.1]">
              Connect in 1-Click. <br />
              <span className="text-white/90">No Tech Skills Needed.</span>
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-[500px]">
              As a Meta Official Tech Provider, we use Meta's Embedded Signup flow. This means no more dealing with complex APIs, App IDs, or manual configurations.
            </p>

            <ul className="space-y-4">
              {[
                "Instant approval for standard messaging",
                "Direct link to your Meta Business Manager",
                "Secure OAuth connection",
                "Start messaging within minutes",
                "Zero developer involvement required"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white/90 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* RIGHT: Visual Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md mx-auto lg:ml-auto"
          >
            <div className="rounded-[32px] bg-white p-8 sm:p-10 shadow-[0_20px_60px_rgba(7,94,84,0.4)]">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-navy font-heading mb-2">Connect Your WhatsApp</h3>
                <p className="text-sm text-gray">Securely link your business account.</p>
              </div>

              <Button className="w-full h-14 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white rounded-xl text-base font-semibold shadow-[0_8px_24px_rgba(24,119,242,0.3)] hover:-translate-y-0.5 transition-all">
                Continue with Facebook
              </Button>

              <div className="relative my-8 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <span className="relative bg-white px-4 text-sm font-medium text-gray">
                  or follow these steps
                </span>
              </div>

              <div className="space-y-6">
                {checklist.map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-green-mint)] text-[var(--color-green-deep)] font-bold text-sm border border-[var(--color-green-vivid)]/20">
                      {i + 1}
                    </div>
                    <p className="text-sm text-navy font-medium pt-1 leading-snug">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
