import type { Metadata } from "next";
import Navbar from "@/components/landing/Navbar";
import ContactSection from "@/components/landing/ContactSection";
import FAQSection from "@/components/landing/FAQSection";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";
import WhatsAppFloatingButton from "@/components/landing/WhatsAppFloatingButton";
import { Building2, MapPin, Phone, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us — ChatFlyr Official WhatsApp Business API & CRM",
  description:
    "Get in touch with ChatFlyr support & sales. Call or WhatsApp +91 9511450914 for WhatsApp API onboarding, custom CRM development, AI chatbots & enterprise solutions.",
};

const REGIONAL_OFFICES = [
  {
    city: "Lucknow (Headquarters)",
    state: "Uttar Pradesh",
    address: "Alambagh, In front of Apollo Hospital, Lucknow, UP",
    phone: "+91 9511450914",
    email: "support@chatflyr.kisandigital.org",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#25D366]/30 selection:text-slate-900">
      <Navbar />

      <main className="pt-24 sm:pt-28">
        {/* Page Header */}
        <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-[#007A55] text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,168,132,0.15)_0,transparent_70%)] pointer-events-none" />
          <div className="max-w-4xl mx-auto relative z-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4 border border-white/10">
              Direct Support & Sales
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-heading tracking-tight mb-4">
              We&apos;re Here to Help Your Business Grow
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-medium">
              Reach out for Meta WhatsApp API onboarding, custom CRM pricing, technical integrations, or enterprise automation demos.
            </p>
          </div>
        </div>

        {/* Main Interactive Contact Section */}
        <ContactSection />

        {/* Regional Offices Section */}
        <section className="py-20 bg-slate-50 border-y border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl font-extrabold text-slate-900 font-heading">
                Our Regional Hubs Across India
              </h2>
              <p className="text-slate-600 text-sm font-medium mt-2">
                Serving clients nationwide with localized support and technical consultations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {REGIONAL_OFFICES.map((office, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all"
                >
                  <div className="p-3 rounded-xl bg-emerald-50 text-[#00A884] w-fit mb-4">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 font-heading mb-1">
                    {office.city}
                  </h3>
                  <span className="text-xs font-semibold text-[#00A884] block mb-3">
                    {office.state}
                  </span>
                  <div className="space-y-2 text-xs text-slate-600 font-medium">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{office.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{office.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{office.email}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs Preview */}
        <FAQSection />

        {/* Final CTA */}
        <FinalCTA />
      </main>

      <Footer />
      <WhatsAppFloatingButton phoneNumber="9511450914" />
    </div>
  );
}
