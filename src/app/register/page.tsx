import type { Metadata } from "next";
import { AuthCard } from "@/components/auth-card";
import { RegisterForm } from "@/components/register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <AuthCard title="Let’s grow together" description="Create your private family space, then add your baby’s profile." alternateText="Already have an account?" alternateHref="/login" alternateLabel="Log in">
      <RegisterForm />
    </AuthCard>
  );
}
