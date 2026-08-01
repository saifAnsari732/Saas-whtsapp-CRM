"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MessageSquare, Menu, X } from "lucide-react";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How it Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 backdrop-blur-md shadow-sm border-b border-border"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-green-deep)] to-[var(--color-green-vivid)] shadow-md transition-transform group-hover:scale-105">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-navy font-heading">
            wacrm
          </span>
        </Link>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-gray hover:text-green-deep transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-navy hover:text-green-deep transition-colors">
            Log in
          </Link>
          <Link href="/signup">
            <Button className="bg-gradient-to-r from-green-deep to-green-vivid hover:from-green-deep hover:to-green-deep text-white shadow-[0_8px_24px_rgba(37,211,102,0.35)] hover:-translate-y-0.5 transition-all rounded-xl">
              Get Started &rarr;
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-navy p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-border px-4 py-4 space-y-4 shadow-lg absolute w-full left-0 top-16">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-base font-medium text-navy hover:text-green-deep transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <hr className="border-border my-2" />
            <Link
              href="/login"
              className="text-base font-medium text-navy hover:text-green-deep transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Log in
            </Link>
            <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full bg-gradient-to-r from-green-deep to-green-vivid hover:from-green-deep hover:to-green-deep text-white rounded-xl shadow-md mt-2">
                Get Started &rarr;
              </Button>
            </Link>
          </div>
        </div>
      )}
    </motion.header>
  );
}
