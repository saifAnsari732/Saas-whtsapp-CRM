"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, UsersRound } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const t = useTranslations("LoginPage");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("Failed to fetch")) {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    const destination = inviteToken
      ? `/join/${encodeURIComponent(inviteToken)}`
      : "/dashboard";
    window.location.href = destination;
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-slate-50 font-sans">
      
      {/* Form Column */}
      <div className="flex flex-col items-center justify-center px-4 py-12 lg:px-8 relative z-10">
        <Link href="/" className="mb-8 flex items-center justify-center group">
          <Image
            src="/chatflyr-logo.png"
            alt="ChatFlyr"
            width={240}
            height={70}
            priority
            className="h-14 sm:h-16 w-auto object-contain hover:scale-105 transition-transform"
          />
        </Link>

        <div className="w-full max-w-[440px] rounded-[32px] border border-slate-200/80 bg-white p-8 sm:p-12 shadow-xl relative">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black text-slate-900 font-heading mb-2">
              {inviteToken ? t('titleAccept') : t('titleWelcome')}
            </h1>
            <p className="text-sm font-medium text-slate-500">
              {inviteToken ? t('descAccept') : t('descWelcome')}
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 font-semibold">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {t('emailLabel')}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl border-slate-200 bg-white text-slate-900 px-4 font-medium placeholder:text-slate-400 focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t('passwordLabel')}
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {t('forgotPassword')}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl border-slate-200 bg-white text-slate-900 px-4 font-medium placeholder:text-slate-400 focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500/20"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-4 h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-extrabold uppercase tracking-wider shadow-md hover:from-blue-700 hover:to-emerald-700 hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              {loading ? t('signingIn') : t('signIn')}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs font-semibold text-slate-500">
            {t('noAccount')}{" "}
            <Link
              href={
                inviteToken
                  ? `/signup?invite=${encodeURIComponent(inviteToken)}`
                  : "/signup"
              }
              className="font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              {t('createAccount')}
            </Link>
          </p>
        </div>
      </div>

      {/* Image Column */}
      <div className="hidden lg:block relative bg-[var(--color-navy)] overflow-hidden">
        <Image
          src="/auth-login-bg.jpg"
          alt="ChatFlyr Authentication Background"
          fill
          className="object-cover object-center opacity-90"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-green-deep)]/90 via-transparent to-transparent mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent mix-blend-overlay"></div>
        
        <div className="absolute bottom-20 left-16 right-16 text-white z-10 max-w-lg">
          <h2 className="text-[40px] font-bold font-heading leading-[1.1] mb-5">
            Scale your business with intelligent WhatsApp CRM
          </h2>
          <p className="text-[17px] text-white/85 font-medium leading-relaxed">
            Join thousands of companies automating their support, sales, and marketing on the world's most popular messaging app.
          </p>
        </div>
      </div>

    </div>
  );
}
