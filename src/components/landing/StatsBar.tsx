"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Users, MessageSquare, ShieldCheck, Headphones } from "lucide-react";

function Counter({ end, duration = 2 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number | null = null;
    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
      else setCount(end);
    };
    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return <span ref={ref}>{count}</span>;
}

export default function StatsBar() {
  const stats = [
    { icon: Users, value: 10000, suffix: "+", label: "Happy Businesses" },
    { icon: MessageSquare, value: 500, suffix: "M+", label: "Messages Delivered" },
    { icon: ShieldCheck, value: 99.9, suffix: "%", label: "Uptime Guarantee" },
    { icon: Headphones, value: 24, suffix: "/7", label: "Customer Support" },
  ];

  return (
    <section className="bg-white border-y border-gray-100 py-16 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#E8F8F5] flex items-center justify-center mb-5 shadow-sm border border-[#D1F2EB]">
                  <Icon className="w-8 h-8 text-[#075E54]" />
                </div>
                <div className="flex items-center justify-center mb-1">
                  <span className="text-3xl md:text-4xl font-heading font-extrabold text-[#1A1A2E] tracking-tight">
                    <Counter end={stat.value} duration={2} />
                    {stat.suffix}
                  </span>
                </div>
                <p className="mt-1 text-sm md:text-base font-medium text-slate-500">
                  {stat.label}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
