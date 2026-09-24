'use client';

import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Bot, 
  Send, 
  Users2, 
  FileImage, 
  BarChart3, 
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: MessageSquare,
    title: 'Official WhatsApp API',
    description: 'Get verified green tick and communicate safely with official Meta Cloud APIs without ban risks.',
    badge: 'Meta Verified',
    accentColor: 'text-[#00A884]',
    iconBg: 'bg-[#E8F8F5] border-[#D1F2EB]',
    highlight: 'Zero Ban Risk'
  },
  {
    icon: Bot,
    title: 'Message Automation',
    description: 'Create multi-step chatbots, automated greeting sequences, and instant FAQ auto-replies 24/7.',
    badge: 'AI Powered',
    accentColor: 'text-blue-600',
    iconBg: 'bg-blue-50 border-blue-100',
    highlight: '< 2s Response'
  },
  {
    icon: Send,
    title: 'Bulk Messaging & Broadcast',
    description: 'Launch scheduled promotional campaigns and broadcast to 100,000+ opted-in contacts with 1 click.',
    badge: 'High Delivery',
    accentColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50 border-emerald-100',
    highlight: '98% Open Rate'
  },
  {
    icon: Users2,
    title: 'Smart Contact Management',
    description: 'Organize leads with custom attributes, dynamic audience tags, multi-agent assign & live chat inbox.',
    badge: 'CRM Integrated',
    accentColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50 border-indigo-100',
    highlight: 'Team Inbox'
  },
  {
    icon: FileImage,
    title: 'Rich Media & Templates',
    description: 'Send high-converting catalog messages, PDFs, image carousels and interactive call-to-action buttons.',
    badge: 'Interactive',
    accentColor: 'text-amber-600',
    iconBg: 'bg-amber-50 border-amber-100',
    highlight: 'Meta Approved'
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics & Reports',
    description: 'Track sent, delivered, read, and reply rates live. Export campaign ROI and agent performance metrics.',
    badge: 'Live KPI',
    accentColor: 'text-violet-600',
    iconBg: 'bg-violet-50 border-violet-100',
    highlight: 'Instant Insights'
  }
];

export default function FeaturesGrid() {
  return (
    <section id="features" className="py-20 lg:py-24 bg-white relative overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#00A884]/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10">
        
        {/* TOP SECTION: Centered Headline, Badge, Subtitle & CTA */}
        <div className="text-center max-w-3xl mx-auto mb-14 lg:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E8F8F5] border border-[#D1F2EB] text-[#00A884] text-xs font-semibold mb-4 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Why Choose ChatFlyr?</span>
            </div>

            {/* Main Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-heading font-extrabold text-[#111827] leading-[1.15] tracking-tight mb-4">
              Everything You Need for <span className="text-[#00A884]">WhatsApp Business</span> Success
            </h2>

            {/* Description Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto mb-7 font-normal">
              Our platform helps you connect, engage and convert with your customers — faster, easier and smarter with official Meta Cloud API tools.
            </p>

            {/* CTA Button */}
            <Link 
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-bold text-white transition-all bg-[#00A884] hover:bg-[#008f70] rounded-full shadow-md shadow-[#00A884]/25 hover:-translate-y-0.5"
            >
              <span>Explore All Features</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        {/* BOTTOM SECTION: 3-Column / 2-Row Grid of Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  {/* Top Row: Icon + Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-13 h-13 rounded-2xl ${feature.iconBg} border flex items-center justify-center shadow-2xs`}>
                      <Icon className={`w-6 h-6 ${feature.accentColor}`} />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                      {feature.badge}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-bold font-heading text-slate-900 mb-2.5">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-600 text-sm leading-relaxed mb-5">
                    {feature.description}
                  </p>
                </div>

                {/* Bottom Highlight Row */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-semibold text-[#00A884] flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-current" />
                    {feature.highlight}
                  </span>
                  <span className="text-[#00A884] font-semibold text-[11px]">
                    Included
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
