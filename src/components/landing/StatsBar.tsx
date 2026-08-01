"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

function Counter({ end, suffix = "", duration = 2 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (isInView) {
      let startTime: number | null = null;
      const animateCount = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        
        // Easing out function for smoother stop
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        
        setCount(Math.floor(easeOutQuart * end));
        
        if (progress < 1) {
          requestAnimationFrame(animateCount);
        } else {
          setCount(end); // Ensure we hit exactly the end number
        }
      };
      
      requestAnimationFrame(animateCount);
    }
  }, [isInView, end, duration]);

  // For specific formatting (like 98.5)
  const displayCount = end % 1 !== 0 && count === Math.floor(end) ? end : count;

  return (
    <span ref={ref}>
      {displayCount}
      {suffix}
    </span>
  );
}

export function StatsBar() {
  const stats = [
    { value: 2400, suffix: "+", label: "Active Businesses" },
    { value: 50, suffix: "M+", label: "Messages Sent/Mo" },
    { value: 98.5, suffix: "%", label: "Avg Delivery Rate" },
    { value: 24, suffix: "/7", label: "Automated Support", noCounter: true },
  ];

  return (
    <section className="bg-[var(--color-navy)] py-12 lg:py-16">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 gap-y-8 md:grid-cols-4 md:gap-y-0 divide-x-0 md:divide-x md:divide-white/10">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex flex-col items-center justify-center text-center px-4"
            >
              <div className="text-4xl md:text-5xl font-extrabold text-white font-heading mb-2">
                {stat.noCounter ? (
                  <span>{stat.value}{stat.suffix}</span>
                ) : (
                  <Counter end={stat.value} suffix={stat.suffix} />
                )}
              </div>
              <p className="text-sm md:text-base font-medium text-white/70 uppercase tracking-widest font-heading">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
