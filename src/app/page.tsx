import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LandingPageClient } from "@/components/landing-page-client";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LandingPageClient />;
}
