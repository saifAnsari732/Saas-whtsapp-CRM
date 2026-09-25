"use client";

import { useState } from "react";
import {
  Smartphone,
  Zap,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Users,
  Bot,
  Calendar,
  MessageSquare,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  RefreshCw,
  Lock,
  Layers,
  Flame,
  Radio,
  Clock,
  Send,
  AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CoexistenceGuide() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "Coexistence क्या है और यह Meta Cloud API से कैसे अलग है?",
      a: "Meta Cloud API आपके नंबर को physical phone से disconnect कर देता है (या virtual number मांगता है)। जबकि Coexistence (Baileys Multi-Device) आपके असली मोबाइल फोन के WhatsApp ऐप को बिना बंद किए ChatFlyr CRM से जोड़ता है। आप अपने फोन में भी WhatsApp चलाते रहते हैं और CRM से भी AI Auto-reply और Group Broadcasts भेजते हैं।"
    },
    {
      q: "क्या मेरा मोबाइल WhatsApp ऐप बंद या लॉगआउट हो जाएगा?",
      a: "बिल्कुल नहीं! यह WhatsApp Web / 'Linked Devices' तकनीक पर काम करता है। आपका फोन 100% सामान्य रूप से चलता रहेगा, कॉल्स आएंगी और आप नॉर्मल चैटिंग करते रहेंगे।"
    },
    {
      q: "क्या इसके लिए फोन को हमेशा इंटरनेट से कनेक्ट रखना जरूरी है?",
      a: "WhatsApp के Multi-Device आर्किटेक्चर के कारण, एक बार QR स्कैन होने के बाद CRM सेशन 14 दिनों तक बिना फोन इंटरनेट के भी ऑनलाइन रह सकता है। हालांकि बेस्ट सिंक के लिए फोन में इंटरनेट चालू रखना बेहतर है।"
    },
    {
      q: "क्या WhatsApp Groups में भी मैसेज और ब्रॉडकास्ट भेजे जा सकते हैं?",
      a: "हाँ! Coexistence की सबसे बड़ी खासियत यही है। Meta Cloud API में ग्रुप मैसेजिंग सपोर्ट नहीं होती, लेकिन Coexistence के जरिए आप अपने सभी WhatsApp Groups को सिंक कर सकते हैं, उनमें 1-क्लिक बल्क मैसेज और शेड्यूल्ड रिमाइंडर्स भेज सकते हैं।"
    },
    {
      q: "नंबर बैन (Ban) होने से कैसे सुरक्षित रखें?",
      a: "ChatFlyr Coexistence इंजन में इन-बिल्ट स्मार्ट ह्यूमन-लाइक डीले (2-5 सेकंड का गैप) है। नए नंबर पर एक साथ हज़ारों अनजान लोगों को मैसेज न भेजें, पहले नोन कॉन्टैक्ट्स और ग्रुप्स में इस्तेमाल करें।"
    }
  ];

  return (
    <div className="space-y-8 mt-4">
      {/* SECTION 1: WHAT IS COEXISTENCE & ARCHITECTURE */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/40 via-card to-teal-950/20 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 px-3 py-1 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 mr-1 text-emerald-400" />
              Complete Guide & Architecture
            </Badge>
            <Badge variant="outline" className="text-slate-400 border-border/80 text-xs">
              Dual-Device Sync Engine
            </Badge>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              WhatsApp Coexistence क्या है और यह कैसे काम करता है?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
              <strong className="text-foreground">Coexistence</strong> का सीधा मतलब है: <span className="text-emerald-500 font-semibold">फोन भी चलेगा + CRM भी चलेगा!</span> आप अपने पर्सनल या बिजनेस फोन का व्हाट्सएप ऐप बिना डिस्टर्ब किए, क्यूआर कोड स्कैन करके चैटफ्लाईआर सीआरएम के शक्तिशाली ऑटोमेशन, ग्रुप ब्रॉडकास्टर और एआई बॉट से जोड़ सकते हैं।
            </p>
          </div>

          {/* 3-STEP VISUAL WORKFLOW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="group relative rounded-2xl border border-border/80 bg-card/80 backdrop-blur-sm p-5 shadow-xs hover:border-emerald-500/40 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500 font-bold">
                  1
                </div>
                <Smartphone className="h-5 w-5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">1-Click QR Scan</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                फोन में व्हाट्सएप खोलें → <strong>Linked Devices</strong> → <strong>Link a Device</strong> चुनकर ऊपर दिया गया QR कोड स्कैन करें। 10 सेकंड में फोन लिंक हो जाएगा।
              </p>
            </div>

            <div className="group relative rounded-2xl border border-border/80 bg-card/80 backdrop-blur-sm p-5 shadow-xs hover:border-teal-500/40 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/15 text-teal-500 font-bold">
                  2
                </div>
                <RefreshCw className="h-5 w-5 text-muted-foreground group-hover:text-teal-500 transition-colors" />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">Real-Time Bi-Directional Sync</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                आपके फोन के सारे चैट्स, ग्रुप्स और आने वाले मैसेजेस तुरंत सीआरएम पर लाइव सिंक हो जाते हैं। फोन पर रिप्लाई दें या सीआरएम से, दोनों जगह चैट अपडेट रहेगी।
              </p>
            </div>

            <div className="group relative rounded-2xl border border-border/80 bg-card/80 backdrop-blur-sm p-5 shadow-xs hover:border-indigo-500/40 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-500 font-bold">
                  3
                </div>
                <Zap className="h-5 w-5 text-muted-foreground group-hover:text-indigo-500 transition-colors" />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">Supercharged Automations</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                अब आप ग्रुप्स में ब्रॉडकास्ट कर सकते हैं, 24/7 AI ऑटो-रिप्लाई बॉट चला सकते हैं, और ऑटोमेटेड शेड्यूल्ड फॉलो-अप मैसेजेस भेज सकते हैं।
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: SIDE-BY-SIDE COMPARISON (COEXISTENCE VS CLOUD API) */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-foreground">
              Coexistence QR vs Meta Official Cloud API
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            दोनों में क्या अंतर है और आपको अपने बिजनेस के लिए कब क्या इस्तेमाल करना चाहिए?
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border/80">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-muted/70 text-foreground font-bold border-b border-border/80">
              <tr>
                <th className="p-4 w-1/3">Feature / Capability</th>
                <th className="p-4 w-1/3 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                  <div className="flex items-center gap-1.5 font-black text-sm">
                    <Smartphone className="h-4 w-4" />
                    Coexistence (Phone QR)
                  </div>
                </th>
                <th className="p-4 w-1/3 text-blue-600 dark:text-blue-400">
                  <div className="flex items-center gap-1.5 font-black text-sm">
                    <ShieldCheck className="h-4 w-4" />
                    Meta Official Cloud API
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr className="hover:bg-muted/20">
                <td className="p-4 font-semibold text-foreground">
                  Physical Phone App Usage
                  <span className="block text-[11px] font-normal text-muted-foreground">क्या मोबाइल फोन में व्हाट्सएप चलता रहेगा?</span>
                </td>
                <td className="p-4 bg-emerald-500/5 font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    हाँ! 100% सामान्य काम करेगा
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    नहीं, मोबाइल ऐप डिस्कनेक्ट हो जाता है
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-muted/20">
                <td className="p-4 font-semibold text-foreground">
                  WhatsApp Groups Messaging
                  <span className="block text-[11px] font-normal text-muted-foreground">ग्रुप्स में मैसेज और ब्रॉडकास्ट</span>
                </td>
                <td className="p-4 bg-emerald-500/5 font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    Full Support (सभी ग्रुप्स में ब्रॉडकास्ट)
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    सपोर्टेड नहीं (केवल 1-to-1 चैट)
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-muted/20">
                <td className="p-4 font-semibold text-foreground">
                  Meta Template Approval
                  <span className="block text-[11px] font-normal text-muted-foreground">मैसेज भेजने से पहले परमिशन</span>
                </td>
                <td className="p-4 bg-emerald-500/5 font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    कोई अप्रूवल नहीं, डायरेक्ट मैसेज भेजें
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                    Meta से टेम्पलेट अप्रूवल अनिवार्य
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-muted/20">
                <td className="p-4 font-semibold text-foreground">
                  24-Hour Session Window
                  <span className="block text-[11px] font-normal text-muted-foreground">24 घंटे का मैसेजिंग प्रतिबंध</span>
                </td>
                <td className="p-4 bg-emerald-500/5 font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    कोई रोक नहीं, कभी भी भेजें
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                    24h बाद सिर्फ पेड टेम्पलेट जा सकता है
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-muted/20">
                <td className="p-4 font-semibold text-foreground">
                  Per-Message Charges
                  <span className="block text-[11px] font-normal text-muted-foreground">मैसेज का खर्च</span>
                </td>
                <td className="p-4 bg-emerald-500/5 font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    ₹0 (आपके सिम/मोबाइल डेटा से)
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-blue-500" />
                    Meta प्रति बातचीत ₹0.13 - ₹0.72 चार्ज करता है
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-muted/20">
                <td className="p-4 font-semibold text-foreground">
                  Green Tick & Enterprise Scale
                  <span className="block text-[11px] font-normal text-muted-foreground">ऑफिशियल बिजनेस वेरिफिकेशन</span>
                </td>
                <td className="p-4 bg-emerald-500/5 font-medium text-muted-foreground">
                  नॉर्मल पर्सनल/बिजनेस नंबर
                </td>
                <td className="p-4 font-bold text-blue-600 dark:text-blue-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-500" />
                    Official Meta Green Tick Eligible
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-muted/20">
                <td className="p-4 font-semibold text-foreground">
                  Best Suited For
                  <span className="block text-[11px] font-normal text-muted-foreground">किसके लिए सबसे सही है?</span>
                </td>
                <td className="p-4 bg-emerald-500/5 font-bold text-emerald-700 dark:text-emerald-300">
                  लोकल बिजनेस, फील्ड सेल्स, ग्रुप ब्रॉडकास्ट, पर्सनल फॉलो-अप
                </td>
                <td className="p-4 font-bold text-blue-700 dark:text-blue-300">
                  बड़ी कंपनियां, 50k+ मास मार्केटिंग कैंपेन, ऑफिशियल ब्रैंडिंग
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: KEY POWER FEATURES */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground">
            Coexistence इंजन के मुख्य फीचर्स
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            क्यूआर कनेक्ट होते ही आपको ये सभी टूल्स अनलॉक्ड मिलेंगे
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-2.5 hover:border-emerald-500/30 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-sm sm:text-base text-foreground">WhatsApp Group Broadcaster</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              अपने सभी व्हाट्सएप ग्रुप्स को एक साथ सेलेक्ट करें और 1-क्लिक में ऑफर्स, मीटिंग लिंक्स या अपडेट्स ब्रॉडकास्ट करें।
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-2.5 hover:border-purple-500/30 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Bot className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-sm sm:text-base text-foreground">24/7 AI Auto-Reply Bot</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              जब आप सो रहे हों या बिजी हों, तो एआई चैटबॉट ग्राहकों के सवालों का जवाब देगा और लीड्स क्वालिफाई करेगा।
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-2.5 hover:border-amber-500/30 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Calendar className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-sm sm:text-base text-foreground">Scheduled Group Reminders</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              किसी भी ग्रुप में रोज सुबह या तय तारीख और समय पर ऑटोमेटेड रिमाइंडर्स और नोटिस शेड्यूल करें।
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-2.5 hover:border-blue-500/30 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Send className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-sm sm:text-base text-foreground">Direct Number Bulk Dispatch</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              फोन नंबर्स की लिस्ट पेस्ट करें और बिना कॉन्टैक्ट सेव किए तेजी से कस्टमाइज्ड मैसेज भेजें।
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-2.5 hover:border-teal-500/30 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-sm sm:text-base text-foreground">Shared Team Inbox</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              आपकी टीम के कई एजेंट एक ही मोबाइल नंबर से कस्टमर्स को रिप्लाई कर सकते हैं।
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-2.5 hover:border-rose-500/30 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-sm sm:text-base text-foreground">Anti-Ban Protection Buffer</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              ह्यूमन टाइपिंग स्पीड और रैंडम डिले इंटरवल्स के साथ मैसेजिंग ताकि आपके व्हाट्सएप अकाउंट पर कोई रिस्क न आए।
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 4: SAFE USAGE TIPS */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 space-y-3">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm sm:text-base">
          <AlertTriangle className="h-5 w-5" />
          <span>WhatsApp सुरक्षा और एंटी-बैन टिप्स (Best Practices)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
          <div className="space-y-1">
            <strong className="text-foreground block">1. रैंडम स्पैमिंग न करें</strong>
            <span>केवल उन्हीं लोगों या ग्रुप्स में मैसेज भेजें जो आपको जानते हैं। अनचाहे अनजान नंबर्स पर बल्क मैसेजिंग से रिपोर्ट होने का खतरा रहता है।</span>
          </div>
          <div className="space-y-1">
            <strong className="text-foreground block">2. नए नंबर को वॉर्म-अप करें</strong>
            <span>अगर नंबर नया है, तो पहले दिन 20-50 मैसेज से शुरू करें, सीधे हजारों मैसेज एक दिन में न भेजें।</span>
          </div>
          <div className="space-y-1">
            <strong className="text-foreground block">3. पर्सनल बातचीत जारी रखें</strong>
            <span>फोन से सामान्य बातचीत भी करते रहें। व्हाट्सएप एल्गोरिद्म जब सामान्य इंसानी एक्टिविटी देखता है, तो अकाउंट सुरक्षित रहता है।</span>
          </div>
        </div>
      </div>

      {/* SECTION 5: INTERACTIVE FAQ */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 font-bold">
            <HelpCircle className="h-5 w-5" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground">
            अक्सर पूछे जाने वाले सवाल (Frequently Asked Questions)
          </h3>
        </div>

        <div className="divide-y divide-border/60">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className="py-3.5">
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 text-left font-bold text-sm sm:text-base text-foreground hover:text-emerald-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  <span className="shrink-0 p-1 rounded-lg bg-muted text-muted-foreground">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </button>
                {isOpen && (
                  <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed pr-6 animate-in fade-in slide-in-from-top-1 duration-200">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
