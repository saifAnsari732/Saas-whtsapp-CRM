"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

interface Review {
  id: number;
  name: string;
  location: string;
  avatarText: string;
  avatarBg: string;
  rating: number;
  text: string;
}

const reviews: Review[] = [
  {
    id: 1,
    name: "Ram Shakal Singh",
    location: "UP",
    avatarText: "RS",
    avatarBg: "bg-amber-600",
    rating: 5,
    text: "ChatFlyr WhatsApp automation transformed our business communication. Every customer gets an immediate reply.",
  },
  {
    id: 2,
    name: "Prabhash Yadav",
    location: "BIHAR",
    avatarText: "PY",
    avatarBg: "bg-blue-600",
    rating: 5,
    text: "The bulk messaging delivery rate is amazing. Even with large festival campaigns, delivery is 100% compliant.",
  },
  {
    id: 3,
    name: "Surendra Yadav",
    location: "JHARKHAND",
    avatarText: "SY",
    avatarBg: "bg-emerald-600",
    rating: 5,
    text: "I'm a distributor and very happy with their services. Supplies and orders always come on time.",
  },
  {
    id: 4,
    name: "Amit Verma",
    location: "DELHI",
    avatarText: "AV",
    avatarBg: "bg-purple-600",
    rating: 5,
    text: "Very reliable platform. Managing multiple client accounts from a single dashboard has 10x our agency productivity.",
  },
  {
    id: 5,
    name: "Rakesh Kumar",
    location: "PUNJAB",
    avatarText: "RK",
    avatarBg: "bg-teal-600",
    rating: 5,
    text: "Packaging is excellent and delivery is always on time. The AI chatbot handles 80% of customer inquiries.",
  },
  {
    id: 6,
    name: "Vikram Malhotra",
    location: "MUMBAI",
    avatarText: "VM",
    avatarBg: "bg-indigo-600",
    rating: 5,
    text: "Best Official WhatsApp Business API solution. No risk of numbers getting banned and zero technical headache.",
  },
  {
    id: 7,
    name: "Ananya Roy",
    location: "KOLKATA",
    avatarText: "AR",
    avatarBg: "bg-rose-600",
    rating: 5,
    text: "Our conversion rate jumped from 4% to 19% after setting up automated cart recovery workflows on ChatFlyr.",
  }
];

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(2);
  const [isPaused, setIsPaused] = useState(false);

  // Auto Smooth Slide Effect (moves every 3.5 seconds)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % reviews.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % reviews.length);
  };

  // Get visible indices centered around activeIndex (5 cards: -2, -1, 0, 1, 2)
  const getVisibleCards = () => {
    const total = reviews.length;
    return [-2, -1, 0, 1, 2].map((offset) => {
      const idx = (activeIndex + offset + total) % total;
      return { review: reviews[idx], offset, originalIndex: idx };
    });
  };

  const visibleCards = getVisibleCards();

  return (
    <section 
      id="about" 
      className="py-20 lg:py-28 bg-[#FBF6F3] relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Soft Pink Glow in Middle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[450px] bg-[#f8e8e3]/60 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        {/* Title matching reference: WHAT OUR CLIENTS SAY */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading text-slate-900 tracking-tight uppercase mb-3">
          WHAT OUR <span className="text-[#007A55]">CLIENTS SAY</span>
        </h2>
        <p className="text-slate-500 text-sm sm:text-base mb-12 max-w-xl mx-auto font-normal">
          Real feedback from our trusted network and families across India.
        </p>

        {/* 3D Arc Perspective Stage */}
        <div className="relative min-h-[460px] flex items-center justify-center">
          
          {/* Navigation Arrows positioned on outer cards */}
          <button
            onClick={handlePrev}
            aria-label="Previous review"
            className="absolute left-2 sm:left-10 lg:left-24 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white text-slate-800 shadow-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:scale-105 transition-transform"
          >
            <ChevronLeft className="w-5 h-5 text-[#007A55]" />
          </button>

          <button
            onClick={handleNext}
            aria-label="Next review"
            className="absolute right-2 sm:right-10 lg:right-24 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white text-slate-800 shadow-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:scale-105 transition-transform"
          >
            <ChevronRight className="w-5 h-5 text-[#007A55]" />
          </button>

          {/* 5 Overlapping Cards Stage */}
          <div className="relative w-full max-w-6xl h-[580px] flex items-center justify-center">
            {visibleCards.map(({ review, offset, originalIndex }) => {
              const isCenter = offset === 0;
              const isImmediate = Math.abs(offset) === 1;

              // Arc perspective coordinates
              const xTranslation = offset * 215; // spacing between card centers
              const scale = isCenter ? 1.08 : isImmediate ? 0.94 : 0.82;
              const zIndex = isCenter ? 30 : isImmediate ? 20 : 10;
              const yTranslation = isCenter ? -18 : isImmediate ? 8 : 26;
              const opacity = isCenter ? 1 : isImmediate ? 0.92 : 0.65;

              return (
                <motion.div
                  key={`${review.id}-${originalIndex}`}
                  layout
                  onClick={() => setActiveIndex(originalIndex)}
                  animate={{
                    x: xTranslation,
                    y: yTranslation,
                    scale,
                    opacity,
                    zIndex,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 26,
                  }}
                  className={`absolute w-[270px] sm:w-[305px] md:w-[325px] cursor-pointer rounded-[32px] overflow-hidden shadow-2xl border bg-white select-none transition-shadow ${
                    isCenter 
                      ? "border-[#007A55]/30 shadow-2xl ring-4 ring-[#007A55]/15" 
                      : "border-slate-200/90 shadow-md"
                  }`}
                >
                  {/* Top Dark Teal Green Card section with Quote marks */}
                  <div
                    className={`p-7 sm:p-8 text-center text-white relative min-h-[290px] flex flex-col justify-center ${
                      isCenter
                        ? "bg-[#0b5c46]"
                        : "bg-[#295c4d]"
                    }`}
                  >
                    {/* Double quote SVG icons in corners */}
                    <span className="absolute top-4 left-5 text-white/30 text-3xl font-serif leading-none select-none">
                      “
                    </span>
                    <span className="absolute bottom-4 right-5 text-white/30 text-3xl font-serif leading-none select-none">
                      ”
                    </span>

                    <p className="text-sm sm:text-[15px] leading-relaxed font-normal text-white/95 px-3">
                      {review.text}
                    </p>
                  </div>

                  {/* Circular Avatar Badge in exact middle */}
                  <div className="relative -mt-8 flex justify-center z-20">
                    <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center overflow-hidden">
                      <div className={`w-full h-full ${review.avatarBg} text-white flex items-center justify-center font-bold text-base tracking-wider`}>
                        {review.avatarText}
                      </div>
                    </div>
                  </div>

                  {/* Bottom White Area with 5 Green Stars & Name */}
                  <div className="pt-4 pb-8 px-4 text-center bg-white">
                    <div className="flex justify-center items-center gap-1.5 text-[#007A55] mb-2.5">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current text-[#007A55]" />
                      ))}
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-base sm:text-lg font-heading leading-tight">
                      {review.name}
                    </h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {review.location}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>

        {/* Carousel Pagination Indicator Dots */}
        <div className="flex justify-center items-center gap-1.5 mt-6">
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? "w-6 bg-[#007A55]"
                  : "w-1.5 bg-emerald-200 hover:bg-emerald-300"
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
