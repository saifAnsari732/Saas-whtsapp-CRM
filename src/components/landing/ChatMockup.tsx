"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Phone, Video, ChevronLeft, Check, CheckCheck, ImageIcon } from "lucide-react";

export function ChatMockup() {
  const [step, setStep] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => {
        if (prev >= 6) {
          return 0; // Reset to start looping like a video
        }
        return prev + 1;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [step]);

  const floatAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  };

  const bubbleVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 250, damping: 20 } },
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
        <div ref={chatContainerRef} className="h-[480px] p-4 flex flex-col gap-4 overflow-y-auto bg-[url('https://web.whatsapp.com/img/bg-chat-tile-light_04fcacde539c58cca6745483d4858c52.png')] bg-repeat bg-[length:400px] scroll-smooth pb-12">
          
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

          {/* Message 2: Outgoing Template (Catalog with Image) */}
          <AnimatePresence>
            {step >= 2 && (
              <motion.div variants={bubbleVariants} initial="hidden" animate="visible" className="flex justify-end">
                <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-sm p-1.5 shadow-sm max-w-[90%] w-full">
                   {/* Catalog Image */}
                   <div className="relative h-32 w-full rounded-xl overflow-hidden mb-2 bg-gradient-to-tr from-orange-400 to-pink-500 flex items-center justify-center">
                     <span className="text-white font-bold text-xl drop-shadow-md">Summer Collection</span>
                     <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
                   </div>
                   
                   <div className="px-2 pb-1">
                     <p className="text-[15px] text-[#111b21] font-semibold mb-1">Welcome to Tejomart! 🚀</p>
                     <p className="text-[15px] text-[#111b21]">Thanks for reaching out. Check out our latest catalog above!</p>
                     <p className="text-[10px] text-gray text-right mt-1 flex items-center justify-end gap-1">10:42 AM <CheckCheck className="h-3 w-3 text-blue-500" /></p>
                   </div>
                   <div className="border-t border-black/5 mt-1 pt-1">
                      <div className="bg-white/60 hover:bg-white/80 transition-colors rounded-xl py-2 flex items-center justify-center cursor-pointer">
                        <span className="text-blue-600 text-[15px] font-semibold">View Catalog</span>
                      </div>
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

          {/* Message 4: Outgoing AI Reply with Image */}
          <AnimatePresence>
            {step >= 5 && (
              <motion.div variants={bubbleVariants} initial="hidden" animate="visible" className="flex justify-end">
                <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-sm p-1.5 shadow-sm max-w-[90%] w-full">
                  <div className="flex items-center gap-1 mb-2 ml-1 bg-white/50 w-fit px-2 py-0.5 rounded text-[10px] font-semibold text-[var(--color-green-deep)]">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-green-vivid)] animate-pulse"></span>
                    AI Generated
                  </div>
                  
                  {/* Product Image */}
                  <div className="relative h-28 w-full rounded-xl overflow-hidden mb-2 bg-gradient-to-tr from-slate-200 to-slate-300 flex flex-col items-center justify-center">
                     <ImageIcon className="h-8 w-8 text-slate-400 mb-1" />
                     <span className="text-slate-500 font-bold text-sm">Alpha Headphones</span>
                  </div>

                  <div className="px-2 pb-1">
                    <p className="text-[15px] text-[#111b21] leading-snug">Our absolute bestseller is the Alpha Series Headphones! Would you like a direct link to purchase?</p>
                    <p className="text-[10px] text-gray text-right mt-1 flex items-center justify-end gap-1">10:43 AM <CheckCheck className="h-3 w-3 text-blue-500" /></p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
        
        {/* Input Area */}
        <div className="bg-[#f0f2f5] p-2 flex items-center gap-2 relative z-10 border-t border-border/50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <div className="h-10 w-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/5 transition-colors">
            <span className="text-xl">😀</span>
          </div>
          <div className="flex-1 bg-white rounded-full h-10 px-4 flex items-center shadow-sm border border-black/5">
            <span className="text-gray/50 text-[15px]">Type a message</span>
          </div>
          <div className="h-10 w-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/5 transition-colors">
            <span className="text-xl">🎙️</span>
          </div>
        </div>
      </div>
    </div>
  );
}
