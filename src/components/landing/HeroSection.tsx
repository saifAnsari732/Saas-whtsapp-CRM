"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Play,
  Zap,
  TrendingUp,
  MessageSquare,
  Globe,
  Smartphone,
  Users,
  ShoppingCart,
  Send,
  Bell,
  Code2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
  const bottomBarServices = [
    {
      icon: (
        <div className="w-8 h-8 rounded-full bg-[#E8F8F5] text-[#00A884] flex items-center justify-center">
          <MessageSquare className="w-4 h-4 fill-current" />
        </div>
      ),
      title: "WhatsApp API",
      subtitle: "Auto & Bulk Messaging",
    },
    {
      icon: (
        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
          <Globe className="w-4 h-4" />
        </div>
      ),
      title: "Website Development",
      subtitle: "Modern & Responsive",
    },
    {
      icon: (
        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
          <Smartphone className="w-4 h-4" />
        </div>
      ),
      title: "App Development",
      subtitle: "Android & iOS",
    },
    {
      icon: (
        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
          <Users className="w-4 h-4" />
        </div>
      ),
      title: "CRM Software",
      subtitle: "Manage Your Leads",
    },
    {
      icon: (
        <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center">
          <ShoppingCart className="w-4 h-4" />
        </div>
      ),
      title: "E-commerce",
      subtitle: "Sell Online Easily",
    },
    {
      icon: (
        <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
          <Code2 className="w-4 h-4" />
        </div>
      ),
      title: "Custom Software",
      subtitle: "Built for Your Needs",
    },
    {
      icon: (
        <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center">
          <Send className="w-4 h-4" />
        </div>
      ),
      title: "Digital Marketing",
      subtitle: "Grow Your Reach",
    },
    {
      icon: (
        <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
        </div>
      ),
      title: "& Many More",
      subtitle: "All in One Platform",
    },
  ];

  return (
    <section className="relative pt-20 pb-8 sm:pt-24 sm:pb-10 overflow-hidden bg-gradient-to-b from-[#eafaf1]/70 via-[#f4fbf7]/40 to-white">
      {/* Background Soft Glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00A884]/15 via-transparent to-transparent pointer-events-none -z-10" />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10">
        
        {/* Main Grid: Left Copy & Right Mockup */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-6 items-center">
          
          {/* LEFT COLUMN: Headings, Badge, CTAs, 3 Checks */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 flex flex-col items-start"
          >
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F8F5] text-[#00A884] text-xs font-semibold border border-[#D1F2EB] mb-5">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>All-in-One Digital Business Platform</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-heading font-extrabold text-[#111827] leading-[1.12] tracking-tight mb-5">
              Everything You Need to{" "}
              <span className="text-[#00A884]">Grow Your Business</span> in One Place
            </h1>

            {/* Subtext */}
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-7 max-w-lg font-normal">
              From WhatsApp API, Website, App, CRM to Digital Marketing, E-commerce and more — ChatFlyr gives you all the tools to automate, engage and scale your business.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 mb-7 w-full sm:w-auto">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#00A884] hover:bg-[#008f70] text-white font-semibold text-sm transition-all shadow-sm shadow-[#00A884]/30 hover:-translate-y-0.5"
              >
                <span>Get Started Free</span>
                <span className="text-base leading-none">→</span>
              </Link>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-sm font-semibold transition-all hover:border-slate-300 shadow-xs"
              >
                <div className="w-4 h-4 rounded-full bg-[#00A884]/15 flex items-center justify-center text-[#00A884]">
                  <Play className="w-2 h-2 fill-current ml-0.5" />
                </div>
                <span>Watch Demo</span>
              </button>
            </div>

            {/* 3 Checks Row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00A884]" />
                No Credit Card Required
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00A884]" />
                Setup in Minutes
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00A884]" />
                24/7 Support
              </div>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: Exact Hero Mockup from Reference */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-7 relative flex justify-center items-center py-4"
          >
            {/* Visual Container */}
            <div className="relative w-full max-w-[640px] h-[440px] sm:h-[480px]">
              
              {/* Floating Pill Top Left: WhatsApp API & Automation */}
              <div className="absolute -top-3 left-12 sm:left-20 bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-full shadow-md border border-slate-100 flex items-center gap-2 z-30">
                <div className="w-5 h-5 rounded-full bg-[#00A884] text-white flex items-center justify-center text-[10px]">
                  <MessageSquare className="w-3 h-3 fill-current" />
                </div>
                <span className="text-[11px] font-bold text-slate-800">WhatsApp API & Automation</span>
              </div>

              {/* Floating Pill Top Right: Smart CRM */}
              <div className="absolute top-2 right-12 sm:right-28 bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-full shadow-md border border-slate-100 flex items-center gap-2 z-30">
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                  <Users className="w-3 h-3" />
                </div>
                <span className="text-[11px] font-bold text-slate-800">Smart CRM</span>
              </div>

              {/* Doodle arrow pointing to dashboard */}
              <div className="absolute top-8 right-36 hidden sm:block text-[#00A884] pointer-events-none z-20">
                <svg className="w-7 h-7" viewBox="0 0 50 50" fill="none">
                  <path d="M40 5 C30 20, 20 25, 5 35 M5 35 L12 30 M5 35 L10 40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* 1. DESKTOP SAAS DASHBOARD (Large white card) */}
              <div className="absolute top-6 right-0 w-[92%] sm:w-[540px] bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden z-10">
                {/* Header row */}
                <div className="bg-white px-5 py-3 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#00A884] flex items-center justify-center text-white text-xs font-bold">
                      C
                    </div>
                    <span className="font-heading font-extrabold text-sm text-[#111827]">ChatFlyr</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                      <Bell className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center text-[10px] font-bold">
                        S
                      </div>
                      <div className="hidden sm:block text-left">
                        <span className="text-[10px] font-bold text-slate-800 block leading-tight">Saifuddin Ansari</span>
                        <span className="text-[8px] text-slate-400 block">Admin</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Inner Body with Sidebar layout */}
                <div className="flex bg-[#fafbfb] text-slate-800 h-[340px]">
                  
                  {/* Left Mini Sidebar */}
                  <div className="w-28 bg-[#0f172a] text-slate-300 p-2.5 flex flex-col gap-1 text-[10px]">
                    <div className="bg-[#00A884] text-white px-2 py-1.5 rounded-md font-semibold flex items-center gap-1.5">
                      <span>Dashboard</span>
                    </div>
                    <div className="px-2 py-1 text-slate-400 hover:text-white rounded-md">WhatsApp API</div>
                    <div className="px-2 py-1 text-slate-400 hover:text-white rounded-md">Contacts</div>
                    <div className="px-2 py-1 text-slate-400 hover:text-white rounded-md">Campaigns</div>
                    <div className="px-2 py-1 text-slate-400 hover:text-white rounded-md">Automation</div>
                    <div className="px-2 py-1 text-slate-400 hover:text-white rounded-md">CRM</div>
                    <div className="px-2 py-1 text-slate-400 hover:text-white rounded-md">Website</div>
                    <div className="px-2 py-1 text-slate-400 hover:text-white rounded-md">Ecommerce</div>
                    <div className="px-2 py-1 text-slate-400 hover:text-white rounded-md">Apps</div>
                    <div className="px-2 py-1 text-slate-400 hover:text-white rounded-md">Settings</div>
                  </div>

                  {/* Main Dashboard Canvas */}
                  <div className="flex-1 p-3 overflow-hidden flex flex-col justify-between">
                    <div>
                      {/* Dashboard Title & Welcome */}
                      <div className="mb-2">
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">Dashboard</h4>
                        <span className="text-[9px] text-slate-400">Welcome back, Saifuddin! 👋</span>
                      </div>

                      {/* 4 Metric Cards */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-2xs">
                          <span className="text-[8px] text-slate-400 block">Total Messages</span>
                          <span className="text-xs font-bold text-slate-900 block">24,568</span>
                          <span className="text-[8px] text-[#00A884] font-semibold">↑ 12%</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-2xs">
                          <span className="text-[8px] text-slate-400 block">Total Contacts</span>
                          <span className="text-xs font-bold text-slate-900 block">11,842</span>
                          <span className="text-[8px] text-[#00A884] font-semibold">↑ 18%</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-2xs">
                          <span className="text-[8px] text-slate-400 block">Total Leads</span>
                          <span className="text-xs font-bold text-slate-900 block">10,421</span>
                          <span className="text-[8px] text-[#00A884] font-semibold">↑ 22%</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-2xs">
                          <span className="text-[8px] text-slate-400 block">Conversion Rate</span>
                          <span className="text-xs font-bold text-slate-900 block">8.7%</span>
                          <span className="text-[8px] text-[#00A884] font-semibold">↑ 5%</span>
                        </div>
                      </div>

                      {/* Chart & Recent Chats split */}
                      <div className="grid grid-cols-12 gap-2">
                        {/* Chart */}
                        <div className="col-span-7 bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-bold text-slate-800">Business Growth</span>
                            <span className="text-[8px] font-bold text-[#00A884] bg-emerald-50 px-1 py-0.5 rounded">
                              +32%
                            </span>
                          </div>
                          <div className="h-16 w-full">
                            <svg className="w-full h-full" viewBox="0 0 200 50" preserveAspectRatio="none">
                              <path
                                d="M0,40 Q25,25 50,35 T100,20 T150,10 T200,15"
                                fill="none"
                                stroke="#00A884"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                          <div className="flex justify-between text-[7px] text-slate-400 mt-1">
                            <span>Apr 20</span>
                            <span>Apr 22</span>
                            <span>Apr 24</span>
                            <span>Apr 26</span>
                            <span>Apr 27</span>
                          </div>
                        </div>

                        {/* Recent Chats */}
                        <div className="col-span-5 bg-white p-2 rounded-lg border border-slate-100 shadow-2xs">
                          <div className="flex items-center justify-between mb-1 text-[8px]">
                            <span className="font-bold text-slate-800">Recent Chats</span>
                            <span className="text-[#00A884] font-semibold">View All</span>
                          </div>
                          <div className="space-y-1 text-[8px]">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-slate-800 truncate max-w-[70px]">Rahul Sharma</span>
                              <span className="text-[7px] text-slate-400">10:24 AM</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-50 pt-0.5">
                              <span className="font-medium text-slate-800 truncate max-w-[70px]">Priya Verma</span>
                              <span className="text-[7px] text-slate-400">09:45 AM</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-50 pt-0.5">
                              <span className="font-medium text-slate-800 truncate max-w-[70px]">Amit Singh</span>
                              <span className="text-[7px] text-slate-400">09:32 AM</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom 5 Mini Service Tiles inside Dashboard */}
                    <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-slate-100">
                      <div className="bg-white p-1 rounded border border-slate-100 text-center">
                        <MessageSquare className="w-3 h-3 text-[#00A884] mx-auto mb-0.5" />
                        <span className="text-[7px] font-bold block text-slate-800">WhatsApp API</span>
                        <span className="text-[6px] text-slate-400 block">Connect & Automate</span>
                      </div>
                      <div className="bg-white p-1 rounded border border-slate-100 text-center">
                        <Globe className="w-3 h-3 text-blue-500 mx-auto mb-0.5" />
                        <span className="text-[7px] font-bold block text-slate-800">Website</span>
                        <span className="text-[6px] text-slate-400 block">Build Your Brand</span>
                      </div>
                      <div className="bg-white p-1 rounded border border-slate-100 text-center">
                        <Smartphone className="w-3 h-3 text-emerald-500 mx-auto mb-0.5" />
                        <span className="text-[7px] font-bold block text-slate-800">Mobile App</span>
                        <span className="text-[6px] text-slate-400 block">Engage on Mobile</span>
                      </div>
                      <div className="bg-white p-1 rounded border border-slate-100 text-center">
                        <Users className="w-3 h-3 text-indigo-500 mx-auto mb-0.5" />
                        <span className="text-[7px] font-bold block text-slate-800">CRM</span>
                        <span className="text-[6px] text-slate-400 block">Manage Customers</span>
                      </div>
                      <div className="bg-white p-1 rounded border border-slate-100 text-center">
                        <ShoppingCart className="w-3 h-3 text-purple-500 mx-auto mb-0.5" />
                        <span className="text-[7px] font-bold block text-slate-800">E-commerce</span>
                        <span className="text-[6px] text-slate-400 block">Sell Online</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* 2. REALISTIC MOBILE PHONE OVERLAY (Left foreground) */}
              <div className="absolute top-10 left-0 sm:left-4 w-[205px] sm:w-[220px] bg-slate-900 rounded-[34px] p-2 shadow-2xl border-4 border-slate-800 z-20">
                <div className="bg-[#0f172a] rounded-[26px] overflow-hidden text-white flex flex-col h-[360px]">
                  
                  {/* WhatsApp Header */}
                  <div className="bg-[#008069] px-2.5 py-2 flex items-center justify-between text-white">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                        C
                      </div>
                      <div>
                        <span className="font-bold text-[10px] block leading-tight">ChatFlyr</span>
                        <span className="text-[8px] text-emerald-100 block">Business Account</span>
                      </div>
                    </div>
                    <div className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[8px]">✓</div>
                  </div>

                  {/* Chat Content */}
                  <div className="flex-1 bg-[#efeae2] p-2 flex flex-col gap-1.5 overflow-hidden text-slate-800 text-[10px]">
                    <div className="self-start max-w-[85%] bg-white rounded-lg px-2 py-1 shadow-2xs">
                      <span className="block text-slate-700">Hello 👋 Welcome to ChatFlyr! How can we help you today?</span>
                      <span className="text-[7px] text-slate-400 text-right block mt-0.5">10:24 AM</span>
                    </div>

                    {/* Interactive CTA buttons */}
                    <div className="space-y-1 mt-1">
                      <div className="bg-white text-[#008069] font-bold text-center py-1 rounded border border-emerald-100 text-[9px] shadow-2xs">
                        📋 Our Services
                      </div>
                      <div className="bg-white text-[#008069] font-bold text-center py-1 rounded border border-emerald-100 text-[9px] shadow-2xs">
                        💰 Pricing
                      </div>
                      <div className="bg-white text-[#008069] font-bold text-center py-1 rounded border border-emerald-100 text-[9px] shadow-2xs">
                        💬 Talk to Agent
                      </div>
                    </div>
                  </div>

                  {/* Chat Input */}
                  <div className="bg-[#f0f2f5] p-1.5 flex items-center gap-1.5">
                    <div className="flex-1 bg-white rounded-full px-2 py-0.5 text-[8px] text-slate-400">
                      Type a message...
                    </div>
                    <div className="w-5 h-5 rounded-full bg-[#00a884] flex items-center justify-center text-white text-[8px]">
                      <Send className="w-2.5 h-2.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Pill on the Right: Grow Faster */}
              <div className="absolute top-28 -right-2 sm:-right-4 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow-md border border-slate-100 flex flex-col items-center z-30">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#00A884] flex items-center justify-center mb-1">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold text-slate-800">Grow</span>
                <span className="text-[9px] font-bold text-slate-800">Faster</span>
              </div>

              {/* Floating Pill Bottom Right: Custom Development */}
              <div className="absolute bottom-10 -right-2 sm:-right-4 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow-md border border-slate-100 flex flex-col items-center z-30">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center mb-1">
                  <Code2 className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold text-slate-800">Custom</span>
                <span className="text-[9px] font-bold text-slate-800">Development</span>
              </div>

            </div>
          </motion.div>

        </div>

        {/* BOTTOM HORIZONTAL SERVICE CAROUSEL / TICKER ROW */}
        <div className="mt-8 pt-4 border-t border-slate-100/90">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
            {bottomBarServices.map((service, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50/80 transition-colors"
              >
                {service.icon}
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {service.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {service.subtitle}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
