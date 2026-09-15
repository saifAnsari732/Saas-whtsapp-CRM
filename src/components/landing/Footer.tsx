import Link from "next/link";
import { MessageSquare } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white text-slate-600 pt-20 pb-10 border-t border-slate-200">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 shadow-md">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900 font-heading">
                Botify.ai
              </span>
            </Link>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed mb-6 font-medium">
              The most advanced, self-hostable CRM & Tech Platform for WhatsApp. Built for modern businesses that value speed, automation, and growth.
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="text-slate-900 font-extrabold tracking-widest text-xs uppercase mb-6 font-heading">Product</h4>
            <ul className="space-y-3.5">
              <li><Link href="#pricing" className="text-slate-500 hover:text-blue-600 font-medium transition-colors text-sm">Features</Link></li>
              <li><Link href="#pricing" className="text-slate-500 hover:text-blue-600 font-medium transition-colors text-sm">Pricing & Plans</Link></li>
              <li><Link href="/dashboard/coexistence" className="text-slate-500 hover:text-blue-600 font-medium transition-colors text-sm">Coexistence QR</Link></li>
              <li><Link href="/billing" className="text-slate-500 hover:text-blue-600 font-medium transition-colors text-sm">Messaging Wallet</Link></li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="text-slate-900 font-extrabold tracking-widest text-xs uppercase mb-6 font-heading">Services</h4>
            <ul className="space-y-3.5">
              <li><Link href="#pricing" className="text-slate-500 hover:text-blue-600 font-medium transition-colors text-sm">WhatsApp Cloud API</Link></li>
              <li><Link href="#pricing" className="text-slate-500 hover:text-blue-600 font-medium transition-colors text-sm">Website Development</Link></li>
              <li><Link href="#pricing" className="text-slate-500 hover:text-blue-600 font-medium transition-colors text-sm">Mobile App Dev</Link></li>
              <li><Link href="#pricing" className="text-slate-500 hover:text-blue-600 font-medium transition-colors text-sm">AI Agents & Bots</Link></li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-slate-900 font-extrabold tracking-widest text-xs uppercase mb-6 font-heading">Company</h4>
            <ul className="space-y-3.5">
              <li><Link href="/login" className="text-slate-500 hover:text-blue-600 font-medium transition-colors text-sm">Login to App</Link></li>
              <li><Link href="/signup" className="text-slate-500 hover:text-blue-600 font-medium transition-colors text-sm">Start Free Trial</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-600 font-medium transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-600 font-medium transition-colors text-sm">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-xs font-semibold">
            &copy; {new Date().getFullYear()} Botify.ai. All rights reserved.
          </p>
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="text-emerald-700 text-xs font-bold">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
