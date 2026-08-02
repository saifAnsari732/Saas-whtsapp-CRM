"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Phone, Video, ChevronLeft, CheckCheck, Paperclip, Camera, Mic, Smile, Image as ImageIcon } from "lucide-react";

export function ChatMockup() {
  const [step, setStep] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => {
        if (prev >= 6) return 0;
        return prev + 1;
      });
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [step]);

  const floatAnimation = {
    y: [0, -8, 0],
    transition: {
      duration: 3.5,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  };

  const bubbleVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95, transformOrigin: "bottom left" },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } },
  };

  const bubbleVariantsRight = {
    hidden: { opacity: 0, y: 10, scale: 0.95, transformOrigin: "bottom right" },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } },
  };

  return (
    <div className="relative w-full max-w-[340px] mx-auto sm:max-w-[380px] lg:max-w-[420px] xl:max-w-[380px]">
      
      {/* Floating Stat 1 */}
      <motion.div
        animate={floatAnimation}
        className="absolute -right-12 top-20 z-30 hidden rounded-2xl bg-white p-4 shadow-[0_12px_40px_rgba(7,94,84,0.15)] sm:block border border-gray-100"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
            <CheckCheck className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-heading">Delivery</p>
            <p className="text-lg font-black text-navy font-heading leading-none">98.5% Rate</p>
          </div>
        </div>
      </motion.div>

      {/* Floating Stat 2 */}
      <motion.div
        animate={{ ...floatAnimation, transition: { ...floatAnimation.transition, delay: 1.5 } }}
        className="absolute -left-12 bottom-32 z-30 hidden rounded-2xl bg-white p-4 shadow-[0_12px_40px_rgba(7,94,84,0.15)] sm:block border border-gray-100"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
            <span className="text-lg font-black text-blue-500">⚡</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-heading">Response</p>
            <p className="text-lg font-black text-navy font-heading leading-none">1.2s Avg Time</p>
          </div>
        </div>
      </motion.div>

      {/* Phone Frame */}
      <div className="relative overflow-hidden rounded-[3rem] border-[12px] border-gray-900 bg-[#efeae2] shadow-[0_24px_80px_rgba(7,94,84,0.2)] ring-1 ring-black/5">
        
        {/* Dynamic Island Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[110px] h-[28px] bg-gray-900 rounded-b-3xl z-50 flex justify-center items-center gap-2 shadow-sm">
          <div className="w-12 h-1.5 rounded-full bg-black/40"></div>
          <div className="w-3 h-3 rounded-full bg-[#111] border border-white/5 relative flex items-center justify-center">
             <div className="w-1 h-1 bg-blue-500/40 rounded-full blur-[0.5px]"></div>
          </div>
        </div>

        {/* Header - Authentic WhatsApp Green */}
        <div className="bg-[#008069] px-4 pt-8 pb-3.5 text-white flex items-center justify-between shadow-sm relative z-20">
          <div className="flex items-center gap-3">
            <div className="flex items-center -ml-1 cursor-pointer">
              <ChevronLeft className="h-6 w-6" />
              <div className="h-9 w-9 rounded-full bg-white/20 overflow-hidden flex items-center justify-center font-bold text-base shadow-sm">
                T
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="font-semibold text-[15px] leading-tight">Tejomart Trade</h3>
              <p className="text-[12px] text-white/80 font-medium">online</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <Video className="h-5 w-5 fill-white" />
            <Phone className="h-[18px] w-[18px] fill-white" />
            <MoreVertical className="h-5 w-5" />
          </div>
        </div>

        {/* Chat Area - Hidden Scrollbar */}
        <div 
          ref={chatContainerRef} 
          className="h-[520px] p-4 flex flex-col gap-3 overflow-y-auto bg-[#EFEAE2] bg-repeat bg-[length:400px] scroll-smooth pb-20 relative z-10"
          style={{ 
            backgroundImage: "url('https://web.whatsapp.com/img/bg-chat-tile-light_04fcacde539c58cca6745483d4858c52.png')",
            scrollbarWidth: "none",
            msOverflowStyle: "none" 
          }}
        >
          {/* Inject style to hide webkit scrollbar */}
          <style>{`
            .overflow-y-auto::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          {/* Message 1: Incoming */}
          <AnimatePresence>
            {step >= 1 && (
              <motion.div variants={bubbleVariants} initial="hidden" animate="visible" className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-tl-none px-3 py-2 shadow-sm max-w-[85%] relative border border-gray-100">
                  <p className="text-[14px] text-[#111b21] leading-relaxed pr-2">Hi! I'm interested in your products 👋</p>
                  <div className="flex justify-end mt-1">
                    <span className="text-[10px] text-gray-400 font-medium">10:42 AM</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message 2: Outgoing Template (Catalog) */}
          <AnimatePresence>
            {step >= 2 && (
              <motion.div variants={bubbleVariantsRight} initial="hidden" animate="visible" className="flex justify-end">
                <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-none p-1.5 shadow-sm max-w-[85%] w-full relative border border-green-200/50">
                   {/* Beautiful Product Cover */}
                   <div className="relative h-36 w-full rounded-xl overflow-hidden mb-2 shadow-sm">
                     <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80" alt="Headphones" className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                       <span className="text-white font-bold text-lg drop-shadow-md">Summer Collection</span>
                     </div>
                   </div>
                   
                   <div className="px-2 pb-1">
                     <p className="text-[14px] text-[#111b21] font-bold mb-1">Welcome to Tejomart! 🚀</p>
                     <p className="text-[14px] text-[#111b21] leading-snug">Thanks for reaching out. Check out our latest catalog above!</p>
                     <div className="flex justify-end items-center gap-1 mt-1.5">
                       <span className="text-[10px] text-[#667781] font-medium">10:42 AM</span>
                       <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                     </div>
                   </div>
                   <div className="border-t border-black/5 mt-1 pt-1.5 pb-1">
                      <div className="text-[#00a884] text-[14px] font-bold text-center cursor-pointer hover:bg-white/30 py-1.5 rounded-lg transition-colors">
                        View Catalog
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
                <div className="bg-white rounded-2xl rounded-tl-none px-3 py-2 shadow-sm max-w-[85%] border border-gray-100">
                  <p className="text-[14px] text-[#111b21] leading-relaxed pr-2">Wow that's great! What are your bestsellers?</p>
                  <div className="flex justify-end mt-1">
                    <span className="text-[10px] text-gray-400 font-medium">10:43 AM</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {step === 4 && (
              <motion.div variants={bubbleVariantsRight} initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }} className="flex justify-end">
                <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-none px-4 py-3.5 shadow-sm flex items-center gap-1.5 border border-green-200/50">
                   <motion.div className="w-1.5 h-1.5 bg-[#667781] rounded-full" animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} />
                   <motion.div className="w-1.5 h-1.5 bg-[#667781] rounded-full" animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} />
                   <motion.div className="w-1.5 h-1.5 bg-[#667781] rounded-full" animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message 4: Outgoing AI Reply */}
          <AnimatePresence>
            {step >= 5 && (
              <motion.div variants={bubbleVariantsRight} initial="hidden" animate="visible" className="flex justify-end">
                <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-none p-2 shadow-sm max-w-[85%] w-full border border-green-200/50">
                  {/* AI Badge */}
                  <div className="flex items-center gap-1.5 mb-2 bg-white/60 w-fit px-2 py-0.5 rounded-md text-[10px] font-bold text-[#008069] border border-[#008069]/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#008069] animate-pulse"></span>
                    AI Generated
                  </div>
                  
                  <div className="flex gap-3 bg-white/40 p-2 rounded-xl mb-2 items-center">
                     <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 shadow-sm bg-white flex items-center justify-center">
                        <img src="https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=150&q=80" alt="Product" className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-1">
                       <p className="text-[13px] font-bold text-navy line-clamp-1">Alpha ANC Pro</p>
                       <p className="text-[11px] text-gray-500 font-medium">₹12,999</p>
                     </div>
                  </div>

                  <div className="px-1 pb-0.5">
                    <p className="text-[14px] text-[#111b21] leading-snug">Our absolute bestseller is the Alpha ANC Pro! Would you like a direct link to purchase?</p>
                    <div className="flex justify-end items-center gap-1 mt-1">
                      <span className="text-[10px] text-[#667781] font-medium">10:43 AM</span>
                      <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Authentic WhatsApp Input Area */}
        <div className="bg-[#f0f2f5] px-2 py-2.5 flex items-end gap-2 relative z-20 border-t border-gray-200">
          <div className="flex gap-2 pb-1.5">
            <button className="text-[#54656f] hover:text-[#00a884] transition-colors p-1 rounded-full">
              <Smile className="h-[26px] w-[26px]" />
            </button>
            <button className="text-[#54656f] hover:text-[#00a884] transition-colors p-1 rounded-full hidden sm:block">
              <Paperclip className="h-[24px] w-[24px]" />
            </button>
          </div>
          
          <div className="flex-1 bg-white rounded-[24px] min-h-[42px] px-4 flex items-center shadow-sm">
            <span className="text-[#8696a0] text-[15px] pb-0.5">Type a message</span>
          </div>
          
          <div className="flex gap-2 pb-1.5">
            <button className="text-[#54656f] hover:text-[#00a884] transition-colors p-1 rounded-full hidden sm:block">
              <Camera className="h-[24px] w-[24px]" />
            </button>
            <div className="h-10 w-10 bg-[#00a884] rounded-full flex items-center justify-center text-white shadow-md hover:bg-[#008f6f] transition-colors cursor-pointer shrink-0">
              <Mic className="h-[20px] w-[20px] fill-white" />
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
