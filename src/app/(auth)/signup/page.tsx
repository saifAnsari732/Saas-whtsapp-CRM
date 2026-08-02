"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, CheckCircle } from "lucide-react";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageInner />
    </Suspense>
  );
}

function SignupPageInner() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const emailRedirectTo = inviteToken
      ? `${window.location.origin}/join/${encodeURIComponent(inviteToken)}`
      : undefined;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
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

        <div className="w-full max-w-[440px] rounded-[32px] border border-border/50 bg-white p-8 sm:p-12 shadow-[0_20px_60px_rgba(7,94,84,0.06)] text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[20px] bg-green-50 shadow-sm border border-green-100">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="mb-3 text-2xl font-bold text-navy font-heading">
            Check your email
          </h1>
          <p className="mb-8 text-[15px] text-gray leading-relaxed">
            We've sent a confirmation link to <br/>
            <strong className="text-navy">{email}</strong><br/>
            Please check your inbox and click the link to verify your account.
          </p>
          <Link
            href={
              inviteToken
                ? `/login?invite=${encodeURIComponent(inviteToken)}`
                : "/login"
            }
          >
            <Button
              className="h-12 w-full rounded-xl bg-[var(--color-gray-light)] text-navy border border-border shadow-sm hover:bg-gray-100 transition-colors font-bold"
            >
              Back to sign in
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-[var(--color-gray-light)] font-sans">
      
      {/* Form Column */}
      <div className="flex flex-col items-center justify-center px-4 py-12 lg:px-8 relative z-10">
        <Link href="/" className="mb-8 flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-[var(--color-green-deep)] to-[var(--color-green-vivid)] shadow-sm">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <span className="text-3xl font-black tracking-tight text-navy font-heading">
            wacrm
          </span>
        </Link>

        <div className="w-full max-w-[440px] rounded-[32px] border border-border/50 bg-white p-8 sm:p-12 shadow-[0_20px_60px_rgba(7,94,84,0.06)] relative">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-navy font-heading mb-3">
              {inviteToken ? "Create account & join" : "Create account"}
            </h1>
            <p className="text-[15px] text-gray">
              {inviteToken
                ? "Verify your email, then accept the invitation to join your team."
                : "Get started with WaCRM in seconds"}
            </p>
          </div>

          <form onSubmit={handleSignup} className="flex flex-col gap-5">
            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-600 font-medium">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <Label htmlFor="fullName" className="text-[15px] font-semibold text-navy">
                Full name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-12 rounded-xl border-border bg-white text-navy px-4 placeholder:text-gray-400 focus-visible:border-[var(--color-green-vivid)] focus-visible:ring-[var(--color-green-vivid)]/20"
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <Label htmlFor="email" className="text-[15px] font-semibold text-navy">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl border-border bg-white text-navy px-4 placeholder:text-gray-400 focus-visible:border-[var(--color-green-vivid)] focus-visible:ring-[var(--color-green-vivid)]/20"
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <Label htmlFor="password" className="text-[15px] font-semibold text-navy">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl border-border bg-white text-navy px-4 placeholder:text-gray-400 focus-visible:border-[var(--color-green-vivid)] focus-visible:ring-[var(--color-green-vivid)]/20"
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <Label htmlFor="confirmPassword" className="text-[15px] font-semibold text-navy">
                Confirm password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-12 rounded-xl border-border bg-white text-navy px-4 placeholder:text-gray-400 focus-visible:border-[var(--color-green-vivid)] focus-visible:ring-[var(--color-green-vivid)]/20"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-4 h-12 w-full rounded-xl bg-gradient-to-r from-[var(--color-green-deep)] to-[var(--color-green-vivid)] text-white text-[15px] font-bold shadow-md hover:opacity-90 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-8 text-center text-[15px] font-medium text-gray">
            Already have an account?{" "}
            <Link
              href={
                inviteToken
                  ? `/login?invite=${encodeURIComponent(inviteToken)}`
                  : "/login"
              }
              className="font-bold text-[var(--color-green-deep)] hover:text-[var(--color-green-vivid)] transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Image Column */}
      <div className="hidden lg:block relative bg-[var(--color-navy)] overflow-hidden">
        <Image
          src="/auth-signup-bg.jpg"
          alt="WaCRM Authentication Background"
          fill
          className="object-cover object-center opacity-90"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-green-deep)]/90 via-transparent to-transparent mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent mix-blend-overlay"></div>
        
        <div className="absolute bottom-20 left-16 right-16 text-white z-10 max-w-lg">
          <h2 className="text-[40px] font-bold font-heading leading-[1.1] mb-5">
            Everything you need to automate conversations
          </h2>
          <p className="text-[17px] text-white/85 font-medium leading-relaxed">
            Create an account to access advanced WhatsApp AI replies, bulk broadcasting, and team inbox completely free.
          </p>
        </div>
      </div>

    </div>
  );
}
