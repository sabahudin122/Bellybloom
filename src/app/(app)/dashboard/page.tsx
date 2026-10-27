import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Baby, BookOpen, ChevronRight, ShieldCheck } from "lucide-react";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { calculateAge, getStageForAge } from "@/lib/age";
import { parseStringArray } from "@/lib/utils";
import { MIN_SOLIDS_AGE_MONTHS } from "@/lib/constants";
import { BabySwitcher } from "@/components/baby-switcher";
import { MealPlannerCard } from "@/components/meal-planner-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WeeklyPlanner } from "@/components/weekly-planner";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ baby?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");
  const [{ baby: requestedBaby }, babies, stages] = await Promise.all([
    searchParams,
    prisma.baby.findMany({ where: { userId: session.user.id }, include: { allergies: true }, orderBy: { createdAt: "asc" } }),
    prisma.ageStage.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (babies.length === 0) redirect("/onboarding");
  const baby = babies.find((item) => item.id === requestedBaby) ?? babies[0];
  const age = calculateAge(baby.dateOfBirth);
  const stage = getStageForAge(age.completedMonths, stages);
  const today = new Date();
  const date = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const existingPlan = await prisma.mealPlan.findUnique({ where: { babyId_planDate: { babyId: baby.id, planDate: date } } });
  const plan = existingPlan ? { ...existingPlan, meals: JSON.parse(existingPlan.mealsJson), servedSlots: JSON.parse(existingPlan.servedSlotsJson) } : null;

  return (
    <main className="mx-auto max-w-[92rem] px-4 py-7 sm:px-7 lg:px-10 lg:py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-black uppercase tracking-[.16em] text-[#dd6d4b]">Your family space</p><h1 className="mt-1 text-3xl font-black tracking-[-.045em] text-[#26354c] sm:text-4xl dark:text-white">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {session.user.name?.split(" ")[0]} <span aria-hidden="true">👋</span></h1><p className="mt-2 text-[#718096] dark:text-slate-300">Here&apos;s what&apos;s blooming for {baby.name} today.</p></div>
        <BabySwitcher babies={babies} selectedId={baby.id} />
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-[1.25fr_.75fr]">
        <Card className="relative overflow-hidden bg-[#26354c] p-7 text-white">
          <div className="absolute -right-12 -top-12 size-44 rounded-full bg-[#cdb4ff]/25" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div><Badge className="bg-white/10 text-white">{stage?.title ?? "Age stage unavailable"}</Badge><h2 className="mt-4 text-3xl font-black tracking-[-.04em]">{baby.name} is {age.label}</h2><p className="mt-2 max-w-xl leading-7 text-slate-300">{stage?.summary}</p></div>
            <Link href={`/babies/${baby.id}`} className={buttonVariants({ variant: "mint" })}>View profile <ChevronRight className="size-4" /></Link>
          </div>
        </Card>
        <Card className="grid grid-cols-2 gap-3 p-5">
          <div className="rounded-2xl bg-[#fff0e8] p-4 text-[#7a3d2a]"><Baby className="size-5" /><p className="mt-5 text-2xl font-black">{baby.allergyStatus === "NO" ? "None" : baby.allergyStatus === "YES" ? baby.allergies.length : "Unsure"}</p><p className="text-xs font-bold">allergy profile</p></div>
          <div className="rounded-2xl bg-[#e5f5ed] p-4 text-[#285f4d]"><BookOpen className="size-5" /><p className="mt-5 text-2xl font-black">{parseStringArray(baby.foodsIntroduced).length}</p><p className="text-xs font-bold">foods introduced</p></div>
        </Card>
      </section>

      <div className="mt-10">
        {age.completedMonths < MIN_SOLIDS_AGE_MONTHS ? (
          <Card className="border-[#a8d8ff]/60 bg-[#eff8ff] p-7 dark:bg-[#a8d8ff]/10">
            <div className="flex gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#a8d8ff] text-[#26354c]"><ShieldCheck className="size-6" /></span><div><h2 className="text-xl font-black text-[#26354c] dark:text-white">No solid-food menu yet</h2><p className="mt-2 max-w-2xl leading-7 text-[#617087] dark:text-slate-300">The active guidance starts solid-food planning at 6 completed months. Bellybloom will not generate a solid-food menu for {baby.name} at this age.</p><Link href="/age-guide" className="mt-4 inline-flex font-black text-[#b65335]">Read the approved age guide</Link></div></div>
          </Card>
        ) : (
          <><MealPlannerCard babyId={baby.id} initialPlan={plan} /><WeeklyPlanner babyId={baby.id} /></>
        )}
      </div>
    </main>
  );
}
