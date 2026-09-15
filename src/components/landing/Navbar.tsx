"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MessageSquare, Menu, X } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Services", href: "#pricing" },
    { name: "WhatsApp API", href: "/settings?tab=whatsapp" },
    { name: "Coexistence QR", href: "/dashboard/coexistence" },
    { name: "Pricing & Plans", href: "#pricing" },
    { name: "Features", href: "#features" },
  ];

  return (
    <header className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-50 shadow-xs">
      <div className="container mx-auto px-4 md:px-8 py-3.5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-blue-600 to-emerald-600 shadow-md">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900 font-heading">
              Botify.ai
            </span>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-xs font-extrabold uppercase tracking-wider text-slate-600 hover:text-blue-600 transition-colors relative group"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-xs font-extrabold uppercase tracking-wider text-slate-700 hover:text-blue-600 transition-colors px-3 py-2">
              Log in
            </Link>
            <Link href="/signup">
              <Button className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white shadow-md rounded-full text-xs font-extrabold uppercase tracking-wider transition-all">
                Start Free Trial
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-navy p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="flex flex-col space-y-4 pt-6 pb-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-lg font-bold text-navy hover:text-green-deep transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="h-px w-full bg-border/50 my-2" />
                <Link
                  href="/login"
                  className="text-lg font-bold text-navy hover:text-green-deep transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full h-12 bg-gradient-to-r from-[var(--color-green-deep)] to-[var(--color-green-vivid)] text-white rounded-xl shadow-sm mt-2 text-lg font-bold">
                    Get Started
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
