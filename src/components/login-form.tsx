"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: data.get("email"),
      password: data.get("password"),
      redirect: false,
      callbackUrl: searchParams.get("callbackUrl") ?? "/dashboard",
    });
    if (result?.error) {
      setError("Email or password is incorrect, or the account is unavailable.");
      setPending(false);
      return;
    }
    window.location.href = result?.url ?? "/dashboard";
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div>
      <div><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" autoComplete="current-password" required /></div>
      {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700" role="alert">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Logging in…" : "Log in"}</Button>
    </form>
  );
}
