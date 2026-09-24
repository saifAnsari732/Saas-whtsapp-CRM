'use client';

import { motion } from 'framer-motion';
import { UserPlus, Link2, Settings, Send, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    icon: UserPlus,
    title: 'Create Account',
    description: 'Sign up with your email, Google or Facebook account.',
    number: '01'
  },
  {
    icon: Link2,
    title: 'Connect WhatsApp',
    description: 'Link your number and start your WhatsApp API journey.',
    number: '02'
  },
  {
    icon: Settings,
    title: 'Configure Settings',
    description: 'Set up templates, auto-replies, and workflow automations.',
    number: '03'
  },
  {
    icon: Send,
    title: 'Start Messaging',
    description: 'Send broadcasts, automate conversations, and grow.',
    number: '04'
  }
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center space-x-2 bg-[#25D366]/10 text-[#075E54] px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <span>⚡</span>
              <span>Simple & Easy Steps</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-[#1A1A2E] mb-6">
              Get Started in <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#075E54] to-[#25D366]">4 Easy Steps</span>
            </h2>
            <p className="text-lg text-gray-600 mb-8 font-sans">
              Launch your WhatsApp Business CRM in minutes. No technical knowledge required.
            </p>
            <Link 
              href="/signup"
              className="group inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white transition-all duration-200 bg-[#25D366] rounded-xl hover:bg-[#075E54] hover:shadow-lg"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Background Number */}
                <span className="absolute -top-4 -right-2 text-8xl font-bold text-gray-100/70 font-heading select-none">
                  {step.number}
                </span>

                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-[#E8F8F5] border border-[#D1F2EB] flex items-center justify-center mb-6">
                    <Icon className="w-8 h-8 text-[#00A884]" />
                  </div>
                  <h3 className="text-xl font-bold font-heading text-[#1A1A2E] mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 font-sans leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
