import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { AlertTriangle, CalendarDays, Salad } from "lucide-react";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { calculateAge, getStageForAge, suggestedFeedingStage } from "@/lib/age";
import { ALLERGEN_LABELS, FEEDING_STAGE_LABELS } from "@/lib/constants";
import { parseStringArray } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BabyProfileEditor } from "@/components/baby-profile-editor";
import { RecipeDisclaimer } from "@/components/recipe-disclaimer";
import { FoodDiary } from "@/components/food-diary";

export const dynamic = "force-dynamic";

export default async function BabyPage({ params }: { params: Promise<{ babyId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const { babyId } = await params;
  const [baby, stages] = await Promise.all([
    prisma.baby.findFirst({
      where: { id: babyId, userId: session.user.id },
      include: { allergies: true, foodLogs: { orderBy: [{ servedAt: "desc" }, { createdAt: "desc" }] } },
    }),
    prisma.ageStage.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (!baby) notFound();
  const age = calculateAge(baby.dateOfBirth);
  const stage = getStageForAge(age.completedMonths, stages);
  const foods = parseStringArray(baby.foodsIntroduced);
  const dislikes = parseStringArray(baby.foodsDisliked);
  const feedingStage = baby.feedingStageOverride ?? suggestedFeedingStage(age.completedMonths);
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <section className="relative overflow-hidden rounded-[2.2rem] bg-[#26354c] p-7 text-white sm:p-10">
        <div className="absolute -right-10 -top-16 size-64 rounded-full bg-[#cdb4ff]/25" /><div className="absolute bottom-0 right-44 size-32 rounded-full bg-[#9ee7c7]/15" />
        <div className="relative"><Badge className="bg-white/10 text-white">{stage?.title}</Badge><h1 className="mt-4 text-4xl font-black tracking-[-.05em] sm:text-5xl">{baby.name} <span aria-hidden="true">🌼</span></h1><p className="mt-3 text-lg font-bold text-slate-300">{age.label} · {age.completedDays} completed days</p></div>
      </section>
      <div className="mt-6 grid gap-5 lg:grid-cols-[.72fr_1.28fr]">
        <div className="space-y-5">
          <Card className="p-6"><div className="flex items-center gap-3"><CalendarDays className="size-5 text-[#dd6d4b]" /><h2 className="text-lg font-black">Current stage</h2></div><p className="mt-4 font-black text-[#26354c] dark:text-white">{FEEDING_STAGE_LABELS[feedingStage as keyof typeof FEEDING_STAGE_LABELS]}</p><p className="mt-2 text-sm leading-6 text-[#748095] dark:text-slate-300">{stage?.summary}</p></Card>
          <Card className="p-6"><div className="flex items-center gap-3"><AlertTriangle className="size-5 text-[#dd6d4b]" /><h2 className="text-lg font-black">Allergy profile</h2></div><div className="mt-4 flex flex-wrap gap-2">{baby.allergyStatus === "NO" && <Badge>No known allergies</Badge>}{baby.allergyStatus === "NOT_SURE" && <Badge className="bg-[#fff0b6] text-[#6b5722]">Not sure — conservative filter</Badge>}{baby.allergies.map(({ allergen }) => <Badge key={allergen}>{ALLERGEN_LABELS[allergen as keyof typeof ALLERGEN_LABELS] ?? allergen}</Badge>)}</div>{baby.otherAllergies && <p className="mt-3 text-sm text-[#748095]">{baby.otherAllergies}</p>}</Card>
          <RecipeDisclaimer />
        </div>
        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-3"><Salad className="size-5 text-[#3a9c77]" /><h2 className="text-xl font-black">Profile details</h2></div>
          <div className="my-6 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-[#f5f3ed] p-4 dark:bg-white/5"><p className="text-xs font-black uppercase tracking-wider text-[#8791a3]">Foods introduced</p><p className="mt-2 font-bold">{foods.length ? foods.join(", ") : "None logged yet"}</p></div><div className="rounded-2xl bg-[#f5f3ed] p-4 dark:bg-white/5"><p className="text-xs font-black uppercase tracking-wider text-[#8791a3]">Foods disliked</p><p className="mt-2 font-bold">{dislikes.length ? dislikes.join(", ") : "None logged"}</p></div></div>
          <BabyProfileEditor baby={{ id: baby.id, name: baby.name, dateOfBirth: baby.dateOfBirth.toISOString().slice(0, 10), allergyStatus: baby.allergyStatus, allergies: baby.allergies.map((item) => item.allergen), otherAllergies: baby.otherAllergies ?? "", feedingStageOverride: baby.feedingStageOverride ?? "", foodsIntroduced: foods, foodsDisliked: dislikes }} />
        </Card>
      </div>
      <FoodDiary babyId={baby.id} initialEntries={baby.foodLogs.map((entry) => ({ id: entry.id, foodName: entry.foodName, reaction: entry.reaction, notes: entry.notes, servedAt: entry.servedAt.toISOString() }))} />
    </main>
  );
}
