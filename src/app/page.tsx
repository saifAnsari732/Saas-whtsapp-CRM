import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Bot,
  MessageSquare,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  Globe,
  Users
} from "lucide-react";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">wacrm</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Log in
            </Link>
            <Link href="/signup">
              <Button size="sm" className="hidden sm:flex">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 lg:py-32">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-50 blur-[100px]"></div>
          
          <div className="container relative z-10 mx-auto px-4 text-center md:px-8">
            <div className="mx-auto flex max-w-[800px] flex-col items-center gap-6">
              <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Meta Official Tech Provider
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Automate your WhatsApp Business with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Confidence</span>
              </h1>
              <p className="max-w-[600px] text-lg text-muted-foreground sm:text-xl">
                The ultimate CRM platform to engage customers, automate replies with AI, and scale your marketing using the official WhatsApp Cloud API.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row mt-4">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base">
                    Start for Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base bg-background">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Embedded Signup Highlight */}
        <section className="border-y border-border/50 bg-muted/30 py-16">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 space-y-6">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Connect in 1-Click with <span className="text-primary">Embedded Signup</span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  No more complex developer setups or manual API configurations. As an official Meta Tech Provider, we offer a seamless Embedded Signup experience.
                </p>
                <ul className="space-y-4">
                  {[
                    "Instantly connect your WhatsApp Business number.",
                    "Zero technical skills required to get started.",
                    "Direct integration with your Meta Business Manager.",
                    "Start sending messages and broadcasts in minutes."
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
                <div className="aspect-video rounded-xl border border-border/50 bg-card shadow-2xl overflow-hidden flex items-center justify-center p-8 relative">
                   <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
                   <div className="flex flex-col items-center text-center space-y-4 z-10">
                      <Globe className="h-16 w-16 text-primary mb-2" />
                      <h3 className="text-xl font-semibold">Meta Business Login</h3>
                      <p className="text-sm text-muted-foreground max-w-[250px]">Securely link your WhatsApp account directly through Facebook.</p>
                      <Button className="mt-4 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white border-0">
                         Continue with Facebook
                      </Button>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24">
          <div className="container mx-auto px-4 md:px-8">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
                Everything you need to grow
              </h2>
              <p className="text-lg text-muted-foreground max-w-[600px] mx-auto">
                Powerful tools designed to help you manage conversations, run marketing campaigns, and automate support.
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="group rounded-2xl border border-border bg-card p-8 transition-all hover:shadow-lg hover:border-primary/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all group-hover:bg-primary/20"></div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Shared Smart Inbox</h3>
                <p className="text-muted-foreground">
                  Collaborate with your team. Assign chats, leave internal notes, and manage thousands of conversations from a single dashboard.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group rounded-2xl border border-border bg-card p-8 transition-all hover:shadow-lg hover:border-primary/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all group-hover:bg-primary/20"></div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-bold">AI Assistant</h3>
                <p className="text-muted-foreground">
                  Connect GPT or Gemini to auto-reply to customer queries 24/7. Upload documents to give your AI instant knowledge about your business.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group rounded-2xl border border-border bg-card p-8 transition-all hover:shadow-lg hover:border-primary/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all group-hover:bg-primary/20"></div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Marketing Broadcasts</h3>
                <p className="text-muted-foreground">
                  Send personalized template messages at scale. Upload CSV contacts, track delivery, and monitor read receipts in real-time.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="group rounded-2xl border border-border bg-card p-8 transition-all hover:shadow-lg hover:border-primary/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all group-hover:bg-primary/20"></div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Contact Management</h3>
                <p className="text-muted-foreground">
                  Store custom attributes, manage opt-outs, and segment your audience. Build a powerful database of your WhatsApp leads.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="group rounded-2xl border border-border bg-card p-8 transition-all hover:shadow-lg hover:border-primary/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all group-hover:bg-primary/20"></div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Automated Workflows</h3>
                <p className="text-muted-foreground">
                  Trigger actions based on incoming keywords. Automatically assign tags, send templates, or route to human agents.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="group rounded-2xl border border-border bg-card p-8 transition-all hover:shadow-lg hover:border-primary/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all group-hover:bg-primary/20"></div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Official & Compliant</h3>
                <p className="text-muted-foreground">
                  Built on the official Cloud API. Avoid bans by using the legitimate, Meta-approved way to message your customers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 md:px-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl mb-6">
              Ready to transform your communication?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
              Join the growing list of businesses using our platform to scale their WhatsApp presence effortlessly.
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="h-12 px-8 text-base">
                Get Started for Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12 text-muted-foreground">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">wacrm</span>
            </div>
            <p className="text-sm">
              &copy; {new Date().getFullYear()} wacrm. All rights reserved.
            </p>
            <div className="flex gap-4 text-sm">
              <Link href="/login" className="hover:text-foreground transition-colors">Login</Link>
              <Link href="/signup" className="hover:text-foreground transition-colors">Sign up</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
