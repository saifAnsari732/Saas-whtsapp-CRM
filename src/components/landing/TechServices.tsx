"use client";

import { motion } from "framer-motion";
import { 
  Globe, 
  Search, 
  TrendingUp, 
  Megaphone, 
  Share2, 
  Palette, 
  Users, 
  Image as ImageIcon, 
  Smartphone, 
  Cpu, 
  MessageSquare, 
  Layout,
  ArrowRight
} from "lucide-react";

export function TechServices() {
  const services = [
    {
      icon: Globe,
      title: "Website Development",
      desc: "Custom, high-performance websites built to convert.",
      color: "from-blue-500 to-cyan-500",
      shadow: "shadow-blue-500/20"
    },
    {
      icon: Search,
      title: "SEO Optimization",
      desc: "Boost search engine rankings and drive organic traffic.",
      color: "from-indigo-500 to-purple-500",
      shadow: "shadow-indigo-500/20"
    },
    {
      icon: TrendingUp,
      title: "Google Ads",
      desc: "Highly targeted PPC campaigns that maximize your ROI.",
      color: "from-sky-500 to-blue-600",
      shadow: "shadow-sky-500/20"
    },
    {
      icon: Megaphone,
      title: "Meta Ads",
      desc: "Data-driven advertising across Facebook & Instagram.",
      color: "from-purple-500 to-pink-500",
      shadow: "shadow-purple-500/20"
    },
    {
      icon: Share2,
      title: "Social Media",
      desc: "Managing your brand presence to engage your audience.",
      color: "from-pink-500 to-rose-500",
      shadow: "shadow-pink-500/20"
    },
    {
      icon: Palette,
      title: "Brand Identity",
      desc: "Crafting unique, memorable brands that resonate.",
      color: "from-rose-500 to-orange-500",
      shadow: "shadow-rose-500/20"
    },
    {
      icon: Users,
      title: "Lead Generation",
      desc: "Strategic funnels and lead magnets to fill your pipeline.",
      color: "from-teal-500 to-emerald-500",
      shadow: "shadow-teal-500/20"
    },
    {
      icon: ImageIcon,
      title: "Graphic Design",
      desc: "Stunning visual assets that elevate your professional image.",
      color: "from-orange-500 to-amber-500",
      shadow: "shadow-orange-500/20"
    },
    {
      icon: Smartphone,
      title: "App Development",
      desc: "High-performance iOS and Android applications.",
      color: "from-blue-600 to-indigo-600",
      shadow: "shadow-blue-600/20"
    },
    {
      icon: Cpu,
      title: "AI Automation",
      desc: "Smart AI agents and workflows to scale operations 24/7.",
      color: "from-fuchsia-500 to-purple-600",
      shadow: "shadow-fuchsia-500/20"
    },
    {
      icon: MessageSquare,
      title: "WhatsApp API",
      desc: "Seamless API and CRM integrations to boost engagement.",
      color: "from-[#25D366] to-[#075E54]",
      shadow: "shadow-[#25D366]/20"
    },
    {
      icon: Layout,
      title: "WordPress Dev",
      desc: "Easy-to-manage sites tailored to your unique needs.",
      color: "from-cyan-500 to-teal-500",
      shadow: "shadow-cyan-500/20"
    }
  ];

  return (
    <section className="bg-white py-32 relative overflow-hidden">
      {/* Decorative Wavy Background Lines */}
      <svg className="absolute inset-0 w-full h-full stroke-gray-100/50 [mask-image:radial-gradient(100%_100%_at_top_center,white,transparent)] z-0" aria-hidden="true">
        <defs>
          <pattern id="waves" width="200" height="200" x="50%" y="-1" patternUnits="userSpaceOnUse">
            <path d="M100 200V.5M.5 .5H200" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" strokeWidth="0" fill="url(#waves)" />
      </svg>
      
      <div className="container mx-auto px-4 md:px-8 relative z-10 max-w-[1400px]">
        
        {/* Header Section in a Flex Layout for Desktop */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-20 gap-8">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              className="mb-6 inline-flex items-center rounded-full bg-[var(--color-gray-light)] px-4 py-2 border border-border/50"
            >
              <span className="text-[13px] font-extrabold uppercase tracking-widest text-[var(--color-green-deep)] font-heading">
                Beyond WhatsApp
              </span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-[56px] font-extrabold tracking-tight text-navy font-heading mb-6 leading-[1.1]"
            >
              Complete Tech & <br className="hidden md:block"/> Growth Solutions
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-[19px] text-gray font-medium"
            >
              We don't just automate your messaging. We build, market, and scale your entire digital presence with our expert in-house team.
            </motion.p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: 0.3 }}
            className="hidden lg:block pb-2"
          >
             <button className="group flex items-center gap-2 text-lg font-bold text-[var(--color-green-deep)] hover:text-[var(--color-green-vivid)] transition-colors">
                Explore All Services 
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-green-light)] group-hover:bg-[var(--color-green-vivid)]/20 transition-colors">
                  <ArrowRight className="h-4 w-4" />
                </span>
             </button>
          </motion.div>
        </div>

        {/* Distinctive Horizontal Card Grid */}
        <div className="grid gap-x-6 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ delay: (i % 3) * 0.05, duration: 0.4 }}
              className="group relative flex items-start gap-5 rounded-[24px] bg-white p-5 pr-6 border border-gray-100 hover:border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default"
            >
              {/* Colorful Gradient Icon Box */}
              <div className={`relative flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br ${service.color} ${service.shadow} shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                <service.icon className="h-7 w-7 text-white relative z-10" />
                {/* Glow behind icon inside box */}
                <div className="absolute inset-0 bg-white/20 blur-md rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              
              <div className="flex flex-col py-1">
                <h3 className="text-[17px] font-bold text-navy mb-1.5 font-heading group-hover:text-[var(--color-green-deep)] transition-colors">
                  {service.title}
                </h3>
                <p className="text-[14px] text-gray leading-snug font-medium">
                  {service.desc}
                </p>
              </div>
              
              {/* Subtle hover arrow */}
              <div className="absolute top-5 right-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                <ArrowRight className="h-4 w-4 text-gray-300" />
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Mobile CTA */}
        <div className="mt-10 flex justify-center lg:hidden">
          <button className="group flex items-center gap-2 text-base font-bold text-[var(--color-green-deep)] hover:text-[var(--color-green-vivid)] transition-colors">
             Explore All Services 
             <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-green-light)] group-hover:bg-[var(--color-green-vivid)]/20 transition-colors">
               <ArrowRight className="h-4 w-4" />
             </span>
          </button>
        </div>

      </div>
    </section>
  );
}
