import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Logo } from "@/components/logo";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { authOptions } from "@/lib/auth-options";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  return (
    <main className="soft-grid min-h-screen bg-[#fffaf1] px-4 py-8 dark:bg-[#101a2b]">
      <div className="mx-auto mb-8 max-w-2xl"><Logo /></div>
      <div className="grid place-items-center"><OnboardingWizard /></div>
    </main>
  );
}
