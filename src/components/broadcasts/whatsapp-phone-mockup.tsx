'use client';

import React from 'react';
import { 
  Phone, 
  Video, 
  MoreVertical, 
  ChevronLeft, 
  CheckCheck, 
  ExternalLink, 
  Reply, 
  Paperclip, 
  Smile, 
  Mic, 
  Camera, 
  FileText, 
  Play, 
  ShieldCheck, 
  Wifi, 
  Signal, 
  Battery, 
  Lock,
  MessageSquare
} from 'lucide-react';
import { MessageTemplate } from '@/types';
import { cn } from '@/lib/utils';

interface WhatsAppPhoneMockupProps {
  businessName?: string;
  template?: MessageTemplate | null;
  bodyText?: string;
  headerMediaUrl?: string;
  className?: string;
}

export function WhatsAppPhoneMockup({
  businessName = 'ChatFlyr Business',
  template,
  bodyText,
  headerMediaUrl,
  className
}: WhatsAppPhoneMockupProps) {
  const displayText = bodyText || template?.body_text || '';

  return (
    <div className={cn("relative mx-auto w-full max-w-[340px] sm:max-w-[360px] select-none", className)}>
      {/* Side Hardware Buttons Simulation */}
      <div className="absolute -left-[14px] top-24 h-10 w-[3px] rounded-l-md bg-slate-700/80" />
      <div className="absolute -left-[14px] top-38 h-12 w-[3px] rounded-l-md bg-slate-700/80" />
      <div className="absolute -left-[14px] top-54 h-12 w-[3px] rounded-l-md bg-slate-700/80" />
      <div className="absolute -right-[14px] top-32 h-16 w-[3px] rounded-r-md bg-slate-700/80" />

      {/* Main Outer Phone Chassis */}
      <div className="relative rounded-[48px] bg-slate-950 p-2.5 shadow-2xl ring-1 ring-slate-800/80 border-[3px] border-slate-700/60">
        {/* Subtle Metallic Bezel Inner Highlight */}
        <div className="rounded-[40px] overflow-hidden bg-slate-900 border border-slate-800/90 flex flex-col h-[640px] sm:h-[670px] relative shadow-inner">
          
          {/* Top Notch / Dynamic Island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 h-[22px] w-[100px] bg-black rounded-full flex items-center justify-between px-3 shadow-xs">
            {/* Camera lens reflection */}
            <div className="h-2 w-2 rounded-full bg-slate-900 border border-slate-700/50 flex items-center justify-center">
              <div className="h-1 w-1 rounded-full bg-blue-900/60" />
            </div>
            {/* Speaker bar */}
            <div className="h-1 w-8 rounded-full bg-slate-800/80" />
          </div>

          {/* iOS / Mobile Status Bar */}
          <div className="bg-[#075e54] dark:bg-[#1f2c34] text-white px-6 pt-2 pb-1 flex items-center justify-between text-[11px] font-semibold tracking-tight z-30 shrink-0 select-none">
            <span>9:41</span>
            <div className="flex items-center gap-1.5 opacity-90 text-[10px]">
              <Signal className="h-3 w-3" />
              <span className="text-[10px] font-bold">5G</span>
              <Wifi className="h-3 w-3" />
              <Battery className="h-3.5 w-3.5 fill-current" />
            </div>
          </div>

          {/* WhatsApp Brand Header */}
          <div className="bg-[#075e54] dark:bg-[#1f2c34] text-white px-3 py-2 flex items-center justify-between shadow-xs z-30 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <button type="button" className="flex items-center text-white/90 hover:text-white -ml-1">
                <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
                <span className="text-[11px] font-medium bg-emerald-500/30 px-1 rounded-full text-emerald-100">12</span>
              </button>

              {/* Business Avatar with Verified Badge */}
              <div className="relative shrink-0">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-xs text-white shadow-xs">
                  {businessName.slice(0, 2).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-[#1f2c34] rounded-full p-0.5">
                  <div className="h-3.5 w-3.5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <ShieldCheck className="h-2.5 w-2.5 text-white" />
                  </div>
                </div>
              </div>

              {/* Business Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <h4 className="text-xs font-bold text-white truncate max-w-[120px] sm:max-w-[140px] leading-tight">
                    {businessName}
                  </h4>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </div>
                <p className="text-[10px] text-emerald-200/90 truncate leading-tight">
                  Official Business Account
                </p>
              </div>
            </div>

            {/* Header Action Icons */}
            <div className="flex items-center gap-3 text-white/90 shrink-0">
              <Video className="h-4 w-4 hover:text-white cursor-pointer transition-colors" />
              <Phone className="h-4 w-4 hover:text-white cursor-pointer transition-colors" />
              <MoreVertical className="h-4 w-4 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>

          {/* WhatsApp Chat Wall with Authentic Pattern */}
          <div className="flex-1 overflow-y-auto p-3.5 flex flex-col justify-start gap-2.5 bg-[#efeae2] dark:bg-[#0b141a] bg-[radial-gradient(#0000000d_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] scrollbar-thin">
            
            {/* Date Badge */}
            <div className="self-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs text-[10px] font-semibold text-slate-600 dark:text-slate-400 px-3 py-0.5 rounded-full shadow-2xs border border-black/5 dark:border-white/5">
              TODAY
            </div>

            {/* Encryption Notice */}
            <div className="self-center bg-[#ffeebd]/90 dark:bg-[#1f2c34]/90 text-[10px] text-amber-900/80 dark:text-amber-200/80 px-3 py-1 rounded-lg text-center max-w-[85%] shadow-2xs flex items-center justify-center gap-1.5 border border-amber-300/30">
              <Lock className="h-2.5 w-2.5 shrink-0 text-amber-700 dark:text-amber-300" />
              <span className="leading-tight">Messages and calls are end-to-end encrypted.</span>
            </div>

            {/* Main Message Bubble */}
            {template ? (
              <div className="self-start max-w-[90%] relative group animate-in fade-in-50 duration-200">
                {/* Authentic WhatsApp Bubble Tail */}
                <div className="absolute top-0 -left-1.5 w-2 h-3 overflow-hidden pointer-events-none">
                  <div className="w-3 h-3 bg-white dark:bg-[#202c33] rotate-45 transform origin-top-right shadow-xs" />
                </div>

                {/* Bubble Container */}
                <div className="bg-white dark:bg-[#202c33] text-slate-800 dark:text-slate-100 rounded-2xl rounded-tl-xs shadow-sm border border-slate-200/70 dark:border-slate-700/60 overflow-hidden">
                  
                  {/* Header Media */}
                  {headerMediaUrl && (
                    <div className="relative bg-slate-100 dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-700/50 overflow-hidden">
                      {template.header_type === 'video' ? (
                        <div className="relative">
                          <video 
                            src={headerMediaUrl} 
                            controls 
                            className="w-full max-h-48 object-cover bg-black" 
                          />
                          <div className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full pointer-events-none">
                            <Play className="h-3 w-3 fill-current" />
                          </div>
                        </div>
                      ) : template.header_type === 'document' ? (
                        <div className="p-3 flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80">
                          <div className="h-10 w-10 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">Document Attachment</p>
                            <p className="text-[10px] text-slate-400">PDF • Click to open</p>
                          </div>
                        </div>
                      ) : (
                        <img 
                          src={headerMediaUrl} 
                          alt="Template Header Media" 
                          className="w-full max-h-48 object-cover" 
                        />
                      )}
                    </div>
                  )}

                  <div className="p-3 space-y-2">
                    {/* Header Text (if text header) */}
                    {template.header_type === 'text' && template.header_content && (
                      <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                        {template.header_content}
                      </h5>
                    )}

                    {/* Message Body */}
                    <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-100 break-words">
                      {displayText || <span className="italic text-slate-400">No message text</span>}
                    </div>

                    {/* Footer Text */}
                    {template.footer_text && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-700/40 pt-1.5 font-normal">
                        {template.footer_text}
                      </p>
                    )}

                    {/* Time & Read Double Tick */}
                    <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 dark:text-slate-500 pt-0.5 select-none">
                      <span>12:00 PM</span>
                      <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                    </div>
                  </div>

                  {/* Interactive Template Buttons */}
                  {template.buttons && template.buttons.length > 0 && (
                    <div className="border-t border-slate-100 dark:border-slate-700/80 divide-y divide-slate-100 dark:divide-slate-700/80 bg-slate-50/50 dark:bg-slate-800/30">
                      {template.buttons.map((btn: any, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          className="w-full py-2.5 px-3 text-center font-bold text-xs text-[#00a884] dark:text-[#00a884] flex items-center justify-center gap-1.5 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 active:bg-slate-200/70 transition-colors cursor-pointer"
                        >
                          {btn.type === 'URL' ? (
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 stroke-[2.2]" />
                          ) : btn.type === 'PHONE_NUMBER' ? (
                            <Phone className="h-3.5 w-3.5 shrink-0 stroke-[2.2]" />
                          ) : (
                            <Reply className="h-3.5 w-3.5 shrink-0 stroke-[2.2]" />
                          )}
                          <span className="truncate">{btn.text}</span>
                        </button>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            ) : (
              /* Empty Placeholder State */
              <div className="flex flex-col items-center justify-center my-auto py-20 px-4 text-center space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center shadow-xs">
                  <MessageSquare className="h-7 w-7 text-emerald-600 dark:text-emerald-400 stroke-[1.8]" />
                </div>
                <div className="space-y-1 max-w-[220px]">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Live WhatsApp Preview
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Select an approved WhatsApp template on the left to see your formatted message bubble in real time.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* WhatsApp Bottom Chat Bar */}
          <div className="bg-[#f0f2f5] dark:bg-[#1f2c34] px-2.5 py-2 flex items-center gap-2 border-t border-slate-200/80 dark:border-slate-700/80 shrink-0 z-30">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 shrink-0">
              <Smile className="h-5 w-5 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer" />
              <Paperclip className="h-4 w-4 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer" />
            </div>

            <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-full px-3 py-1.5 text-xs text-slate-400 dark:text-slate-300 flex items-center justify-between border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
              <span className="truncate">Message</span>
              <Camera className="h-4 w-4 text-slate-400 dark:text-slate-400 cursor-pointer hover:text-slate-600" />
            </div>

            <div className="h-8 w-8 rounded-full bg-[#00a884] hover:bg-[#008f70] text-white flex items-center justify-center shadow-xs cursor-pointer shrink-0 transition-colors">
              <Mic className="h-4 w-4" />
            </div>
          </div>

          {/* Bottom Phone Home Indicator Bar */}
          <div className="bg-[#f0f2f5] dark:bg-[#1f2c34] pt-1 pb-2 flex justify-center shrink-0">
            <div className="h-1 w-28 bg-slate-400/60 dark:bg-slate-600 rounded-full" />
          </div>

        </div>
      </div>
    </div>
  );
}
