"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Phone, Video, ChevronLeft, Check, CheckCheck } from "lucide-react";

export function ChatMockup() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev < 5 ? prev + 1 : prev));
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const floatAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  };

  const bubbleVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } },
  };

  return (
    <div className="relative w-full max-w-[320px] mx-auto sm:max-w-[380px] lg:max-w-[420px] xl:max-w-[380px]">
      {/* Floating Stat 1 */}
      <motion.div
        animate={floatAnimation}
        className="absolute -right-8 top-12 z-20 hidden rounded-2xl bg-white p-4 shadow-[0_8px_32px_rgba(7,94,84,0.12)] sm:block border border-border"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-green-mint)]">
            <CheckCheck className="h-5 w-5 text-[var(--color-green-vivid)]" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray font-heading">Delivery</p>
            <p className="text-lg font-black text-navy font-heading">98.5% Rate</p>
          </div>
        </div>
      </motion.div>

      {/* Floating Stat 2 */}
      <motion.div
        animate={{ ...floatAnimation, transition: { ...floatAnimation.transition, delay: 1.5 } }}
        className="absolute -left-12 bottom-24 z-20 hidden rounded-2xl bg-white p-4 shadow-[0_8px_32px_rgba(7,94,84,0.12)] sm:block border border-border"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
            <span className="text-lg font-black text-blue-600">⚡</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray font-heading">Response</p>
            <p className="text-lg font-black text-navy font-heading">1.2s Avg Time</p>
          </div>
        </div>
      </motion.div>

      {/* Phone Frame */}
      <div className="relative overflow-hidden rounded-[40px] border-[8px] border-white bg-[#efeae2] shadow-2xl ring-1 ring-border">
        {/* Header */}
        <div className="bg-[#075E54] px-4 py-3 text-white flex items-center justify-between shadow-md relative z-10">
          <div className="flex items-center gap-2">
            <ChevronLeft className="h-6 w-6" />
            <div className="h-10 w-10 rounded-full bg-white/20 overflow-hidden flex items-center justify-center font-bold text-lg">
              T
            </div>
            <div>
              <h3 className="font-semibold leading-tight">Tejomart Trade</h3>
              <p className="text-[11px] text-white/80">online</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Video className="h-5 w-5 opacity-90" />
            <Phone className="h-5 w-5 opacity-90" />
            <MoreVertical className="h-5 w-5 opacity-90" />
          </div>
        </div>

        {/* Chat Area */}
        <div className="h-[480px] p-4 flex flex-col gap-4 overflow-y-auto bg-[url('https://web.whatsapp.com/img/bg-chat-tile-light_04fcacde539c58cca6745483d4858c52.png')] bg-repeat bg-[length:400px]">
          {/* Message 1: Incoming */}
          <AnimatePresence>
            {step >= 1 && (
              <motion.div variants={bubbleVariants} initial="hidden" animate="visible" className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2 shadow-sm max-w-[85%]">
                  <p className="text-[15px] text-[#111b21]">Hi! I'm interested in your products 👋</p>
                  <p className="text-[10px] text-gray text-right mt-1">10:42 AM</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message 2: Outgoing Template */}
          <AnimatePresence>
            {step >= 2 && (
              <motion.div variants={bubbleVariants} initial="hidden" animate="visible" className="flex justify-end">
                <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-sm p-1 shadow-sm max-w-[90%]">
                   <div className="px-3 py-2">
                     <p className="text-[15px] text-[#111b21] font-semibold mb-1">Welcome to Tejomart! 🚀</p>
                     <p className="text-[15px] text-[#111b21]">Thanks for reaching out. Check out our latest catalog below.</p>
                     <p className="text-[10px] text-gray text-right mt-1 flex items-center justify-end gap-1">10:42 AM <CheckCheck className="h-3 w-3 text-blue-500" /></p>
                   </div>
                   <div className="border-t border-black/5 p-2 bg-white/50 rounded-b-xl flex items-center justify-center">
                      <span className="text-blue-500 text-[15px] font-medium">View Catalog</span>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message 3: Incoming */}
          <AnimatePresence>
            {step >= 3 && (
              <motion.div variants={bubbleVariants} initial="hidden" animate="visible" className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2 shadow-sm max-w-[85%]">
                  <p className="text-[15px] text-[#111b21]">Wow that's great! What are your bestsellers?</p>
                  <p className="text-[10px] text-gray text-right mt-1">10:43 AM</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {step === 4 && (
              <motion.div variants={bubbleVariants} initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }} className="flex justify-end">
                <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm flex items-center gap-1">
                   <motion.div className="w-1.5 h-1.5 bg-[#111b21]/50 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                   <motion.div className="w-1.5 h-1.5 bg-[#111b21]/50 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                   <motion.div className="w-1.5 h-1.5 bg-[#111b21]/50 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message 4: Outgoing AI Reply */}
          <AnimatePresence>
            {step >= 5 && (
              <motion.div variants={bubbleVariants} initial="hidden" animate="visible" className="flex justify-end">
                <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-sm px-4 py-2 shadow-sm max-w-[85%]">
                  <div className="flex items-center gap-1 mb-1 bg-white/40 w-fit px-2 py-0.5 rounded text-[10px] font-semibold text-[var(--color-green-deep)]">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-green-vivid)] animate-pulse"></span>
                    AI Generated
                  </div>
                  <p className="text-[15px] text-[#111b21]">Our current bestsellers are the Alpha Series Headphones and the Smart Home Hub! Would you like a direct link to purchase?</p>
                  <p className="text-[10px] text-gray text-right mt-1 flex items-center justify-end gap-1">10:43 AM <Check className="h-3 w-3 text-gray" /></p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
        
        {/* Input Area */}
        <div className="bg-[#f0f2f5] p-2 flex items-center gap-2 relative z-10">
          <div className="h-10 w-10 rounded-full flex items-center justify-center">
            <span className="text-xl">😀</span>
          </div>
          <div className="flex-1 bg-white rounded-full h-10 px-4 flex items-center">
            <span className="text-gray/50 text-[15px]">Type a message</span>
          </div>
          <div className="h-10 w-10 rounded-full flex items-center justify-center">
            <span className="text-xl">🎙️</span>
          </div>
        </div>
      </div>
    </div>
  );
}
