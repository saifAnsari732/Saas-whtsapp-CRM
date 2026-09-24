import { MessageSquare } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/chatflyr-logo.png" alt="ChatFlyr" width={180} height={48} className="h-12 sm:h-14 w-auto object-contain" />
            </Link>
            <p className="text-gray-500 mb-6 max-w-sm">
              The ultimate WhatsApp SaaS CRM for growing businesses. Automate, scale, and engage with your customers effortlessly.
            </p>
            <div className="flex items-center gap-4">
              {/* Twitter / X */}
              <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-[#25D366] transition-colors">
                <svg className="w-5 h-5 fill-currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a href="#" aria-label="Instagram" className="text-gray-400 hover:text-[#25D366] transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              </a>
              {/* LinkedIn */}
              <a href="#" aria-label="LinkedIn" className="text-gray-400 hover:text-[#25D366] transition-colors">
                <svg className="w-5 h-5 fill-currentColor" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2m1.4 9.74V9.93H5.06v8.57h2.8z"/>
                </svg>
              </a>
              {/* YouTube */}
              <a href="#" aria-label="YouTube" className="text-gray-400 hover:text-[#25D366] transition-colors">
                <svg className="w-5 h-5 fill-currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-[#1A1A2E] mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">Features</a></li>
              <li><a href="#" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">Pricing</a></li>
              <li><a href="#" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">Integrations</a></li>
              <li><a href="#" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">API Docs</a></li>
              <li><a href="#" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">Changelog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#1A1A2E] mb-4">Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">About</a></li>
              <li><a href="#" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">Careers</a></li>
              <li><a href="#" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">Blog</a></li>
              <li><a href="#" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">Press</a></li>
              <li><a href="#" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">Partners</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#1A1A2E] mb-4">Resources</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">Documentation</a></li>
              <li><a href="#" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">Help Center</a></li>
              <li><a href="#" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">Community</a></li>
              <li><a href="#" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">Status</a></li>
              <li><a href="#" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">Tutorials</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#1A1A2E] mb-4">Follow Us</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4" /> WhatsApp</a></li>
              <li>
                <a href="#" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Twitter / X
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2m1.4 9.74V9.93H5.06v8.57h2.8z"/></svg>
                  LinkedIn
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  YouTube
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © 2025 ChatFlyr. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-500 hover:text-[#25D366] text-sm">Privacy Policy</a>
            <a href="#" className="text-gray-500 hover:text-[#25D366] text-sm">Terms of Service</a>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 rounded-full bg-[#25D366]"></span>
              All systems operational
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
