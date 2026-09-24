"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is the Official WhatsApp API?",
    answer: "The WhatsApp Business API is Meta's official cloud solution designed for medium and large businesses to communicate with customers at scale. Unlike the regular WhatsApp Business app, it allows for multi-agent support, automated flows, and API integrations.",
  },
  {
    question: "Is it mandatory to use WhatsApp Official API?",
    answer: "To ensure compliance with Meta's policies and avoid getting your number banned, using the Official WhatsApp API is highly recommended for businesses sending marketing or automated messages at scale.",
  },
  {
    question: "How many messages can I send per day?",
    answer: "Message limits are based on your number's quality rating and tier. New numbers start at 1,000 business-initiated conversations per 24 hours and can scale to 10k, 100k, and unlimited as your tier upgrades.",
  },
  {
    question: "Can I integrate ChatFlyr with my existing tools?",
    answer: "Yes! ChatFlyr provides webhooks and a REST API that lets you seamlessly integrate with your existing CRM, eCommerce platforms, payment gateways, and other operational tools.",
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. Messages are transmitted securely using Meta's Cloud API encryption. ChatFlyr complies with standard data privacy regulations (including GDPR) and ensures your customer data is safe and private.",
  },
  {
    question: "What happens after the free trial?",
    answer: "After your 14-day free trial expires, you can choose one of our flexible pricing plans to continue using ChatFlyr. No credit card is required to start the trial, and you won't be charged automatically.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-gray-50" id="faq">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[#075E54] text-sm font-medium mb-6 border border-gray-200">
              <span>❓</span> Frequently Asked Questions
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-6 font-heading tracking-tight">
              Got Questions? We've Got Answers
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Everything you need to know about ChatFlyr and how it works. Can't find your answer? Contact our friendly support team.
            </p>
            <button className="inline-flex items-center justify-center px-6 py-3 border border-gray-200 bg-white text-[#1A1A2E] rounded-xl font-medium hover:border-[#25D366] hover:text-[#25D366] transition-colors shadow-sm">
              Contact us
            </button>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                  >
                    <span className="font-semibold text-[#1A1A2E] pr-8">{faq.question}</span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0"
                    >
                      <ChevronDown className={`w-5 h-5 ${isOpen ? "text-[#25D366]" : "text-gray-400"}`} />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div className="px-6 pb-6 pt-0 text-gray-600 leading-relaxed border-t border-gray-50">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
