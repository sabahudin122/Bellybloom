import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth-card";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <AuthCard title="Welcome back" description="Your baby profiles and today’s menu are waiting." alternateText="New to Bellybloom?" alternateHref="/register" alternateLabel="Create an account">
      <Suspense fallback={<p className="text-sm text-[#778196]">Loading…</p>}><LoginForm /></Suspense>
    </AuthCard>
  );
}
