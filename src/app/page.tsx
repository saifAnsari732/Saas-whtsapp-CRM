import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsBar } from "@/components/landing/StatsBar";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { EmbeddedSignup } from "@/components/landing/EmbeddedSignup";
import { MetaBadge } from "@/components/landing/MetaBadge";
import { PricingSection } from "@/components/landing/PricingSection";
import { Testimonials } from "@/components/landing/Testimonials";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-[var(--color-navy)] selection:bg-[var(--color-green-vivid)]/30 selection:text-[var(--color-navy)]">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <StatsBar />
        <HowItWorks />
        <FeaturesGrid />
        <EmbeddedSignup />
        <MetaBadge />
        <PricingSection />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
