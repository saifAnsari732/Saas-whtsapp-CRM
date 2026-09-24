"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ChevronDown } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-xs border-b border-gray-100 py-3"
          : "bg-transparent py-4 sm:py-5"
      }`}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/chatflyr-logo.png"
              alt="ChatFlyr"
              width={220}
              height={56}
              priority
              className="h-11 sm:h-12 md:h-14 w-auto object-contain"
            />
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-8">
            <Link
              href="/"
              className="text-[#00A884] font-semibold text-sm relative pb-1 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#00A884] after:rounded-full"
            >
              Home
            </Link>
            <div className="relative group cursor-pointer flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors">
              <span>Services</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
            </div>
            <div className="relative group cursor-pointer flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors">
              <span>Features</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
            </div>
            <Link
              href="#pricing"
              className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="#about"
              className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
            >
              About
            </Link>
            <Link
              href="#contact"
              className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
            >
              Contact
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2 rounded-full text-slate-700 hover:text-slate-950 font-medium text-sm border border-slate-200 hover:border-slate-300 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 rounded-full bg-[#00A884] hover:bg-[#008f70] text-white font-semibold text-sm transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>Get Started Free</span>
              <span className="text-base leading-none">→</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 text-slate-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-6 py-5 shadow-lg space-y-4">
          <Link href="/" className="block text-[#00A884] font-semibold text-sm">
            Home
          </Link>
          <Link href="#services" className="block text-slate-700 font-medium text-sm">
            Services
          </Link>
          <Link href="#features" className="block text-slate-700 font-medium text-sm">
            Features
          </Link>
          <Link href="#pricing" className="block text-slate-700 font-medium text-sm">
            Pricing
          </Link>
          <Link href="#contact" className="block text-slate-700 font-medium text-sm">
            Contact
          </Link>
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
            <Link
              href="/login"
              className="w-full text-center py-2.5 rounded-full text-slate-700 font-medium text-sm border border-slate-200"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="w-full text-center py-2.5 rounded-full bg-[#00A884] text-white font-semibold text-sm"
            >
              Get Started Free →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
