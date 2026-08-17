import Link from "next/link";
import { MessageSquare } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[var(--color-navy)] pt-20 pb-10 border-t border-white/10">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-green-deep)] to-[var(--color-green-vivid)]">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white font-heading">
                Botify.ai
              </span>
            </Link>
            <p className="text-white/60 text-sm max-w-sm leading-relaxed mb-6">
              The most advanced, self-hostable CRM for WhatsApp. Built for modern businesses that value speed, automation, and reliability.
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="text-white font-bold tracking-widest text-xs uppercase mb-6 font-heading">Product</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-white/60 hover:text-white transition-colors text-sm">Features</Link></li>
              <li><Link href="#" className="text-white/60 hover:text-white transition-colors text-sm">Pricing</Link></li>
              <li><Link href="#" className="text-white/60 hover:text-white transition-colors text-sm">Integrations</Link></li>
              <li><Link href="#" className="text-white/60 hover:text-white transition-colors text-sm">Changelog</Link></li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="text-white font-bold tracking-widest text-xs uppercase mb-6 font-heading">Resources</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-white/60 hover:text-white transition-colors text-sm">Documentation</Link></li>
              <li><Link href="#" className="text-white/60 hover:text-white transition-colors text-sm">API Reference</Link></li>
              <li><Link href="#" className="text-white/60 hover:text-white transition-colors text-sm">Blog</Link></li>
              <li><Link href="#" className="text-white/60 hover:text-white transition-colors text-sm">Community</Link></li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-white font-bold tracking-widest text-xs uppercase mb-6 font-heading">Company</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-white/60 hover:text-white transition-colors text-sm">About</Link></li>
              <li><Link href="#" className="text-white/60 hover:text-white transition-colors text-sm">Contact</Link></li>
              <li><Link href="#" className="text-white/60 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link href="#" className="text-white/60 hover:text-white transition-colors text-sm">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-sm">
            &copy; {new Date().getFullYear()} Botify.ai. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--color-green-vivid)] animate-pulse shadow-[0_0_8px_rgba(37,211,102,0.8)]" />
            <span className="text-white/60 text-sm font-medium">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
