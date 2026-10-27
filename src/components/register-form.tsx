"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema } from "@/lib/schemas";

type Values = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError("");
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = await response.json();
    if (!response.ok) {
      setServerError(result.error ?? "Registration failed.");
      return;
    }
    const login = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    if (login?.error) {
      router.push("/login");
      return;
    }
    router.push("/onboarding");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <Field label="Your name" error={errors.name?.message}><Input autoComplete="name" {...register("name")} /></Field>
      <Field label="Email" error={errors.email?.message}><Input type="email" autoComplete="email" {...register("email")} /></Field>
      <Field label="Password" error={errors.password?.message}><Input type="password" autoComplete="new-password" {...register("password")} /></Field>
      <Field label="Confirm password" error={errors.confirmPassword?.message}><Input type="password" autoComplete="new-password" {...register("confirmPassword")} /></Field>
      {serverError && <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700" role="alert">{serverError}</p>}
      <p className="text-xs leading-5 text-[#7d8799] dark:text-slate-400">By creating an account, you understand that child profile and allergy data are used only to personalize and safety-check features. You can export or delete your data in Settings.</p>
      <Button type="submit" variant="peach" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Creating your account…" : "Create account"}</Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div><Label>{label}</Label>{children}{error && <p className="mt-1 text-xs font-bold text-red-600">{error}</p>}</div>;
}
