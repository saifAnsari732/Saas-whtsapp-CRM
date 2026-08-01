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
  Layout 
} from "lucide-react";

export function TechServices() {
  const services = [
    {
      icon: Globe,
      title: "Website Development",
      desc: "Custom, high-performance websites built with the latest technologies to convert visitors into customers.",
      color: "bg-blue-50 text-blue-600",
      shadow: "group-hover:shadow-[0_8px_30px_rgba(37,99,235,0.12)]"
    },
    {
      icon: Search,
      title: "SEO Optimization",
      desc: "Boost your search engine rankings and drive organic traffic to your business with our proven SEO strategies.",
      color: "bg-indigo-50 text-indigo-600",
      shadow: "group-hover:shadow-[0_8px_30px_rgba(79,70,229,0.12)]"
    },
    {
      icon: TrendingUp,
      title: "Google Ads",
      desc: "Highly targeted PPC campaigns that maximize your ROI and put your brand in front of ready-to-buy customers.",
      color: "bg-sky-50 text-sky-600",
      shadow: "group-hover:shadow-[0_8px_30px_rgba(14,165,233,0.12)]"
    },
    {
      icon: Megaphone,
      title: "Meta Ads",
      desc: "Creative and data-driven advertising across Facebook and Instagram to scale your business growth.",
      color: "bg-purple-50 text-purple-600",
      shadow: "group-hover:shadow-[0_8px_30px_rgba(147,51,234,0.12)]"
    },
    {
      icon: Share2,
      title: "Social Media Marketing",
      desc: "Building and managing your brand presence across all social platforms to engage with your audience.",
      color: "bg-pink-50 text-pink-600",
      shadow: "group-hover:shadow-[0_8px_30px_rgba(219,39,119,0.12)]"
    },
    {
      icon: Palette,
      title: "Branding",
      desc: "Crafting unique and memorable brand identities that resonate with your target market.",
      color: "bg-rose-50 text-rose-600",
      shadow: "group-hover:shadow-[0_8px_30px_rgba(225,29,72,0.12)]"
    },
    {
      icon: Users,
      title: "Lead Generation",
      desc: "Strategic funnel building and lead magnet creation to fill your pipeline with high-quality prospects.",
      color: "bg-teal-50 text-teal-600",
      shadow: "group-hover:shadow-[0_8px_30px_rgba(13,148,136,0.12)]"
    },
    {
      icon: ImageIcon,
      title: "Graphic Designing",
      desc: "Stunning visual assets, from logos to social media posts, that elevate your professional image.",
      color: "bg-orange-50 text-orange-600",
      shadow: "group-hover:shadow-[0_8px_30px_rgba(234,88,12,0.12)]"
    },
    {
      icon: Smartphone,
      title: "App Development",
      desc: "High-performance iOS and Android applications with stunning UI/UX design to engage your mobile users.",
      color: "bg-blue-50 text-blue-600",
      shadow: "group-hover:shadow-[0_8px_30px_rgba(37,99,235,0.12)]"
    },
    {
      icon: Cpu,
      title: "AI Automation",
      desc: "Smart AI agents and workflow automation to save time and scale your business operations 24/7.",
      color: "bg-fuchsia-50 text-fuchsia-600",
      shadow: "group-hover:shadow-[0_8px_30px_rgba(192,38,211,0.12)]"
    },
    {
      icon: MessageSquare,
      title: "WhatsApp & Integrations",
      desc: "Seamless WhatsApp API and CRM integrations to boost customer engagement and sales.",
      color: "bg-[var(--color-green-mint)] text-[var(--color-green-vivid)]",
      shadow: "group-hover:shadow-[0_8px_30px_rgba(37,211,102,0.12)]"
    },
    {
      icon: Layout,
      title: "WordPress Development",
      desc: "Custom, easy-to-manage WordPress websites tailored exactly to your brand's unique needs.",
      color: "bg-cyan-50 text-cyan-600",
      shadow: "group-hover:shadow-[0_8px_30px_rgba(8,145,178,0.12)]"
    }
  ];

  return (
    <section className="bg-[var(--color-gray-light)] py-32 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-white to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="mb-20 text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            className="mb-6 inline-flex items-center rounded-full bg-white px-5 py-2 shadow-sm border border-border"
          >
            <span className="text-sm font-bold uppercase tracking-widest text-[var(--color-navy)] font-heading">
              Beyond WhatsApp
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-extrabold tracking-tight text-navy md:text-5xl font-heading mb-6"
          >
            Complete Tech & Growth Solutions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray"
          >
            We don't just automate your messaging. We build, market, and scale your entire digital presence with our expert in-house team.
          </motion.p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ delay: (i % 4) * 0.1, duration: 0.5 }}
              whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}
              className={`group rounded-[28px] bg-white p-8 border border-border/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 ${service.shadow} cursor-default relative overflow-hidden`}
            >
              {/* Soft glow behind the card on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white to-gray-50/50 pointer-events-none" />
              
              <div className={`mb-6 flex h-[60px] w-[60px] items-center justify-center rounded-[18px] ${service.color} transition-transform duration-300 group-hover:scale-110 relative z-10`}>
                <service.icon className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-navy font-heading relative z-10">
                {service.title}
              </h3>
              <p className="text-gray text-sm leading-relaxed relative z-10">
                {service.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
