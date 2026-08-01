"use client";

import { motion } from "framer-motion";

export function Testimonials() {
  const testimonials = [
    {
      quote: "We switched from an unauthorized QR tool to WaCRM. No more worrying about random number bans. The embedded signup took exactly 2 minutes.",
      author: "Amit Kumar",
      role: "Founder, SwiftKart India",
      initials: "AK",
      color: "from-blue-400 to-blue-600"
    },
    {
      quote: "The AI Auto-Replies feature handles 80% of our customer queries automatically. Our sales team only steps in for closing deals now. Incredible ROI.",
      author: "Riya Patel",
      role: "Operations Lead, FreshBasket",
      initials: "RP",
      color: "from-purple-400 to-purple-600"
    },
    {
      quote: "Managing 15 client numbers from a single dashboard is a game-changer. The analytics are spot on, and the templates get approved in minutes.",
      author: "Vikram Sharma",
      role: "Director, DigitalBoost Agency",
      initials: "VS",
      color: "from-orange-400 to-orange-600"
    }
  ];

  return (
    <section className="bg-[var(--color-green-mint)] py-24">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            className="text-4xl font-extrabold tracking-tight text-navy md:text-5xl font-heading mb-6"
          >
            Loved by fast-growing brands
          </motion.h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((test, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="rounded-[20px] bg-white p-8 shadow-[0_8px_32px_rgba(7,94,84,0.04)] hover:shadow-[0_16px_48px_rgba(7,94,84,0.08)] border border-border flex flex-col justify-between"
            >
              <div>
                <div className="mb-6 flex gap-1 text-[#F59E0B]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray text-lg italic leading-relaxed mb-8">
                  "{test.quote}"
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${test.color} text-white font-bold tracking-wider shadow-sm`}>
                  {test.initials}
                </div>
                <div>
                  <h4 className="font-bold text-navy font-heading">{test.author}</h4>
                  <p className="text-sm text-gray">{test.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
