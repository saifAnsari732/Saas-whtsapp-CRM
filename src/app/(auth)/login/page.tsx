"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-gray-light)] px-4 font-sans">
      <Link href="/" className="mb-8 flex items-center gap-2 group">
        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-[var(--color-green-deep)] to-[var(--color-green-vivid)] shadow-sm">
          <MessageSquare className="h-5 w-5 text-white" />
        </div>
        <span className="text-3xl font-black tracking-tight text-navy font-heading">
          wacrm
        </span>
      </Link>

      <div className="w-full max-w-[440px] rounded-[32px] border border-border/50 bg-white p-8 sm:p-12 shadow-[0_20px_60px_rgba(7,94,84,0.06)]">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-navy font-heading mb-3">
            {inviteToken ? t('titleAccept') : t('titleWelcome')}
          </h1>
          <p className="text-[15px] text-gray">
            {inviteToken ? t('descAccept') : t('descWelcome')}
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            <Label htmlFor="email" className="text-[15px] font-semibold text-navy">
              {t('emailLabel')}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 rounded-xl border-border bg-white text-navy px-4 placeholder:text-gray-400 focus-visible:border-[var(--color-green-vivid)] focus-visible:ring-[var(--color-green-vivid)]/20"
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-[15px] font-semibold text-navy">
                {t('passwordLabel')}
              </Label>
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-[var(--color-green-deep)] hover:text-[var(--color-green-vivid)] transition-colors"
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
              className="h-12 rounded-xl border-border bg-white text-navy px-4 placeholder:text-gray-400 focus-visible:border-[var(--color-green-vivid)] focus-visible:ring-[var(--color-green-vivid)]/20"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="mt-4 h-12 w-full rounded-xl bg-[var(--color-navy)] text-white text-[15px] font-bold shadow-md hover:bg-[var(--color-navy)]/90 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {loading ? t('signingIn') : t('signIn')}
          </Button>
        </form>

        <p className="mt-8 text-center text-[15px] font-medium text-gray">
          {t('noAccount')}{" "}
          <Link
            href={
              inviteToken
                ? `/signup?invite=${encodeURIComponent(inviteToken)}`
                : "/signup"
            }
            className="font-bold text-[var(--color-green-deep)] hover:text-[var(--color-green-vivid)] transition-colors"
          >
            {t('createAccount')}
          </Link>
        </p>
      </div>
    </div>
  );
}
