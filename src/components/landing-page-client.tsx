"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  MessageSquare,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  Globe,
  Users,
  ChevronRight,
  Github,
  Twitter,
  Linkedin
} from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export function LandingPageClient() {
  return (
    <div className="flex min-h-screen flex-col bg-[#020817] text-slate-50 selection:bg-primary/30">
      {/* Navbar - Glassmorphism */}
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#020817]/60 backdrop-blur-xl supports-[backdrop-filter]:bg-[#020817]/40">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8 mx-auto">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">wacrm</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/signup">
              <Button size="sm" className="hidden sm:flex bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 lg:py-40">
          {/* Animated Background Orbs */}
          <div className="absolute top-1/4 left-1/4 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px] opacity-50"></div>
          <div className="absolute top-3/4 right-1/4 -z-10 h-[400px] w-[400px] translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/20 blur-[100px] opacity-40"></div>
          
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10"></div>
          
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="container relative z-10 mx-auto px-4 text-center md:px-8"
          >
            <div className="mx-auto flex max-w-[800px] flex-col items-center gap-8">
              <motion.div variants={fadeIn} className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Meta Official Tech Provider
              </motion.div>
              
              <motion.h1 variants={fadeIn} className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
                Automate WhatsApp with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-primary to-purple-500">Confidence</span>
              </motion.h1>
              
              <motion.p variants={fadeIn} className="max-w-[650px] text-lg text-slate-400 sm:text-xl leading-relaxed">
                The ultimate CRM platform to engage customers, automate replies with AI, and scale your marketing using the official WhatsApp Cloud API.
              </motion.p>
              
              <motion.div variants={fadeIn} className="flex flex-col gap-4 sm:flex-row mt-4 w-full sm:w-auto">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base bg-primary hover:bg-primary/90 text-white rounded-full shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] hover:-translate-y-1">
                    Start for Free <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base rounded-full border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-md transition-all hover:-translate-y-1">
                    Go to Dashboard
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Embedded Signup Highlight */}
        <section className="relative py-24 border-y border-white/10 bg-[#040d21]">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className="flex-1 space-y-8"
              >
                <h2 className="text-4xl font-bold tracking-tight md:text-5xl leading-tight text-white">
                  Connect in 1-Click with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Embedded Signup</span>
                </h2>
                <p className="text-lg text-slate-400 leading-relaxed">
                  No more complex developer setups or manual API configurations. As an official Meta Tech Provider, we offer a seamless onboarding experience.
                </p>
                <ul className="space-y-5">
                  {[
                    "Instantly connect your WhatsApp Business number.",
                    "Zero technical skills required to get started.",
                    "Direct integration with your Meta Business Manager.",
                    "Start sending messages and broadcasts in minutes."
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <div className="flex h-7 w-7 mt-0.5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className="text-slate-300 text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7 }}
                className="flex-1 w-full max-w-lg lg:max-w-none relative"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-2xl blur-3xl transform -rotate-3"></div>
                <div className="aspect-[4/3] rounded-2xl border border-white/10 bg-[#0a1128]/80 backdrop-blur-xl shadow-2xl overflow-hidden flex items-center justify-center p-8 relative z-10 transform transition-transform hover:scale-[1.02] duration-500">
                   <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
                   <div className="flex flex-col items-center text-center space-y-5 z-10 bg-white/5 p-10 rounded-2xl border border-white/10 backdrop-blur-sm shadow-xl">
                      <Globe className="h-16 w-16 text-blue-400 mb-2" />
                      <h3 className="text-2xl font-semibold text-white">Meta Business Login</h3>
                      <p className="text-sm text-slate-400 max-w-[260px]">Securely link your WhatsApp account directly through Facebook.</p>
                      <Button className="mt-6 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white border-0 h-12 px-8 rounded-lg shadow-[0_4px_14px_0_rgba(24,119,242,0.39)] transition-all hover:shadow-[0_6px_20px_rgba(24,119,242,0.5)] hover:-translate-y-0.5">
                         Continue with Facebook
                      </Button>
                   </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-32 relative">
          <div className="absolute top-1/2 left-1/2 -z-10 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-900/10 blur-[120px]"></div>
          <div className="container mx-auto px-4 md:px-8">
            <div className="mb-20 text-center">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl font-bold tracking-tight md:text-5xl mb-6 text-white"
              >
                Everything you need to scale
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-xl text-slate-400 max-w-[650px] mx-auto"
              >
                Powerful tools designed to help you manage conversations, run high-converting campaigns, and automate support.
              </motion.p>
            </div>
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {[
                { icon: MessageSquare, title: "Shared Smart Inbox", desc: "Collaborate with your team. Assign chats, leave internal notes, and manage thousands of conversations from a single dashboard." },
                { icon: Bot, title: "AI Assistant", desc: "Connect GPT or Gemini to auto-reply to customer queries 24/7. Upload documents to give your AI instant knowledge about your business." },
                { icon: Zap, title: "Marketing Broadcasts", desc: "Send personalized template messages at scale. Upload CSV contacts, track delivery, and monitor read receipts in real-time." },
                { icon: Users, title: "Contact Management", desc: "Store custom attributes, manage opt-outs, and segment your audience. Build a powerful database of your WhatsApp leads." },
                { icon: Smartphone, title: "Automated Workflows", desc: "Trigger actions based on incoming keywords. Automatically assign tags, send templates, or route to human agents instantly." },
                { icon: ShieldCheck, title: "Official & Compliant", desc: "Built on the official WhatsApp Cloud API. Avoid bans by using the legitimate, Meta-approved way to message your customers." }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  variants={fadeIn}
                  className="group relative rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm transition-all hover:bg-white/[0.04] hover:border-primary/40 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl transition-all duration-500 group-hover:bg-primary/30"></div>
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-primary shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:bg-primary/20 group-hover:border-primary/30">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/10"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#020817] via-transparent to-[#020817]"></div>
          <div className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[100px]"></div>
          
          <div className="container mx-auto px-4 md:px-8 text-center relative z-10">
            <motion.h2 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="text-4xl font-extrabold tracking-tight md:text-6xl mb-6 text-white"
            >
              Ready to transform your <br className="hidden md:block"/> communication?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-300 text-xl mb-10 max-w-2xl mx-auto"
            >
              Join the growing list of businesses using our platform to scale their WhatsApp presence effortlessly and securely.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Link href="/signup">
                <Button size="lg" className="h-14 px-10 text-lg bg-white text-primary hover:bg-slate-100 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] hover:-translate-y-1">
                  Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Professional Multi-Column Footer */}
      <footer className="border-t border-white/10 bg-[#01040A] py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5 mb-16">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">wacrm</span>
              </div>
              <p className="text-slate-400 max-w-sm text-sm leading-relaxed">
                The most advanced, self-hostable CRM for WhatsApp. Built for modern businesses that value speed, automation, and reliability.
              </p>
              <div className="flex gap-4">
                <a href="#" className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-slate-400 hover:text-white">
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="#" className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-slate-400 hover:text-white">
                  <Github className="h-4 w-4" />
                </a>
                <a href="#" className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-slate-400 hover:text-white">
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Product</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center group">Features <ChevronRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0"/></Link></li>
                <li><Link href="#" className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center group">Pricing <ChevronRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0"/></Link></li>
                <li><Link href="#" className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center group">Integrations <ChevronRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0"/></Link></li>
                <li><Link href="#" className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center group">Changelog <ChevronRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0"/></Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Resources</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center group">Documentation <ChevronRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0"/></Link></li>
                <li><Link href="#" className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center group">API Reference <ChevronRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0"/></Link></li>
                <li><Link href="#" className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center group">Blog <ChevronRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0"/></Link></li>
                <li><Link href="#" className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center group">Community <ChevronRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0"/></Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Company</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center group">About <ChevronRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0"/></Link></li>
                <li><Link href="#" className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center group">Contact <ChevronRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0"/></Link></li>
                <li><Link href="#" className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center group">Privacy Policy <ChevronRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0"/></Link></li>
                <li><Link href="#" className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center group">Terms of Service <ChevronRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0"/></Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} wacrm. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
               <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
               <span className="text-sm text-slate-400">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
