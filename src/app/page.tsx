import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import StatsBar from "@/components/landing/StatsBar";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import HowItWorks from "@/components/landing/HowItWorks";
import TechServices from "@/components/landing/TechServices";
import EmbeddedSignup from "@/components/landing/EmbeddedSignup";
import PricingSection from "@/components/landing/PricingSection";
import Testimonials from "@/components/landing/Testimonials";
import FAQSection from "@/components/landing/FAQSection";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";
import CustomCursor from "@/components/landing/CustomCursor";
import WhatsAppFloatingButton from "@/components/landing/WhatsAppFloatingButton";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#25D366]/30 selection:text-slate-900 relative">
      <CustomCursor />
      <Navbar />
      <main className="w-full">
        <HeroSection />
        <StatsBar />
        <FeaturesGrid />
        <HowItWorks />
        <TechServices />
        <EmbeddedSignup />
        <PricingSection />
        <Testimonials />
        <FAQSection />
        <FinalCTA />
      </main>
      <Footer />
      <WhatsAppFloatingButton phoneNumber="9511450914" />
    </div>
  );
}
