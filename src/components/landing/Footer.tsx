import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/chatflyr-logo.png" alt="ChatFlyr" width={280} height={75} className="h-16 sm:h-18 w-auto object-contain" />
            </Link>
            <p className="text-gray-500 mb-6 max-w-sm">
              The ultimate WhatsApp SaaS CRM for growing businesses. Automate, scale, and engage with your customers effortlessly.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-[#1A1A2E] mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="#features" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">Features</a></li>
              <li><a href="#pricing" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">Pricing</a></li>
              <li><a href="#integrations" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">Integrations</a></li>
              <li><a href="/docs" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">API Docs</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#1A1A2E] mb-4">Company</h4>
            <ul className="space-y-3">
              <li><a href="#about" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">About</a></li>
              <li><a href="#contact" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">Contact</a></li>
              <li><a href="#careers" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">Careers</a></li>
              <li><a href="#partners" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">Partners</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#1A1A2E] mb-4">Resources</h4>
            <ul className="space-y-3">
              <li><a href="/docs" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">Documentation</a></li>
              <li><a href="#help" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">Help Center</a></li>
              <li><a href="#status" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">Status</a></li>
              <li><a href="#tutorials" className="text-gray-500 hover:text-[#25D366] transition-colors text-sm">Tutorials</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} ChatFlyr. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="text-gray-500 hover:text-[#25D366] text-sm">Privacy Policy</a>
            <a href="/terms" className="text-gray-500 hover:text-[#25D366] text-sm">Terms of Service</a>
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
