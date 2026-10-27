import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3, ShieldCheck } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { PublicHeader } from "@/components/public-header";
import { RecipeDisclaimer } from "@/components/recipe-disclaimer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { calculateAge } from "@/lib/age";
import { authOptions } from "@/lib/auth-options";
import { ALLERGEN_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { mealSchema } from "@/lib/schemas";
import { validateRecipeSafety } from "@/lib/safety";

export const dynamic = "force-dynamic";

export default async function RecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, session] = await Promise.all([params, getServerSession(authOptions)]);
  const recipe = await prisma.recipe.findUnique({
    where: { slug },
    include: { source: true, generatedForBaby: { include: { allergies: true } } },
  });
  if (!recipe) notFound();
  const userId = session?.user?.id;
  const isVetted = recipe.reviewStatus === "ADMIN_REVIEWED";
  const isOwner = Boolean(userId && recipe.createdByUserId === userId);
  if (!isVetted && !isOwner) notFound();

  const ingredients = JSON.parse(recipe.ingredientsJson) as Array<{ name: string; amount: string }>;
  const instructions = JSON.parse(recipe.instructionsJson) as string[];
  const allergens = JSON.parse(recipe.allergenTagsJson) as string[];

  if (!isVetted) {
    const baby = recipe.generatedForBaby;
    if (!baby || !userId || baby.userId !== userId) notFound();
    const rules = await prisma.safetyRule.findMany({ where: { active: true } });
    const candidate = mealSchema.parse({
      mealType: recipe.mealType,
      title: recipe.title,
      description: recipe.description,
      ingredients,
      instructions,
      prepMinutes: recipe.prepMinutes,
      texture: recipe.texture,
      allergenTags: allergens,
      whyGood: recipe.whyGood,
    });
    const safety = validateRecipeSafety(
      candidate,
      {
        completedMonths: calculateAge(baby.dateOfBirth).completedMonths,
        allergyStatus: baby.allergyStatus,
        knownAllergens: baby.allergies.map((item) => item.allergen),
      },
      rules,
    );
    if (!safety.safe) {
      const priorRecord = await prisma.recipeRejection.findFirst({
        where: {
          babyId: baby.id,
          userId,
          requestType: "DISPLAY_RECHECK",
          promptSummary: recipe.id,
        },
        select: { id: true },
      });
      if (!priorRecord) {
        await prisma.recipeRejection.create({
          data: {
            babyId: baby.id,
            userId,
            requestType: "DISPLAY_RECHECK",
            promptSummary: recipe.id,
            candidateJson: JSON.stringify(candidate),
            reasonsJson: JSON.stringify(safety.reasons),
            rulesetVersion: recipe.rulesetVersion ?? "unknown",
          },
        });
      }
      const alternatives = await prisma.recipe.findMany({
        where: { reviewStatus: "ADMIN_REVIEWED" },
        take: 3,
        orderBy: [{ minAgeMonths: "asc" }, { title: "asc" }],
      });
      return (
        <main className="min-h-screen bg-[#fffaf1] dark:bg-[#101a2b]"><PublicHeader /><section className="page-shell max-w-4xl py-16"><Card className="p-8 sm:p-12"><Badge className="bg-[#ffddd0] text-[#7e3723]">Recipe withheld</Badge><h1 className="mt-5 text-4xl font-black tracking-[-.05em]">This generated recipe is no longer shown</h1><p className="mt-4 max-w-2xl leading-7 text-[#69758a] dark:text-slate-300">It did not pass the current deterministic age, allergen, or choking rules for this profile. The rejection reason has been recorded for review.</p><h2 className="mt-8 text-lg font-black">Choose a vetted recipe instead</h2><div className="mt-3 flex flex-wrap gap-2">{alternatives.map((item) => <Link key={item.id} href={`/recipes/${item.slug}`} className="rounded-full bg-[#26354c] px-4 py-2 text-sm font-black text-white">{item.title}</Link>)}</div></Card></section></main>
      );
    }
  }

  const favorite = session?.user?.id
    ? await prisma.favorite.findUnique({
        where: { userId_recipeId: { userId: session.user.id, recipeId: recipe.id } },
      })
    : null;
  return (
    <main className="min-h-screen bg-[#fffaf1] dark:bg-[#101a2b]"><PublicHeader /><article className="page-shell max-w-5xl pb-20 pt-8"><Link href="/recipes" className="inline-flex items-center gap-2 text-sm font-black text-[#657187]"><ArrowLeft className="size-4" />All recipes</Link><div className="mt-7 overflow-hidden rounded-[2.3rem] bg-[#26354c] p-7 text-white sm:p-11"><div className="flex flex-wrap gap-2"><Badge className="bg-[#9ee7c7] text-[#24483c]">{recipe.minAgeMonths}+ completed months</Badge><Badge className="bg-white/10 text-white">{recipe.mealType.toLowerCase()}</Badge>{!isVetted && <Badge className="bg-[#fff0b6] text-[#66531f]">Private validated idea</Badge>}</div><h1 className="mt-5 text-4xl font-black tracking-[-.05em] sm:text-6xl">{recipe.title}</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">{recipe.description}</p><div className="mt-6 flex flex-wrap items-center gap-5 text-sm font-bold text-slate-200"><span className="flex items-center gap-2"><Clock3 className="size-4 text-[#ffe27a]" />{recipe.prepMinutes} minutes</span><span className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#9ee7c7]" />{isVetted ? "admin reviewed" : "deterministically revalidated"}</span>{session?.user?.id && <FavoriteButton recipeId={recipe.id} initialFavoriteId={favorite?.id} />}</div></div><div className="mt-6 grid gap-6 lg:grid-cols-[.42fr_.58fr]"><Card className="p-7"><h2 className="text-2xl font-black">Ingredients</h2><ul className="mt-5 space-y-3">{ingredients.map((item) => <li key={`${item.name}-${item.amount}`} className="flex justify-between gap-4 border-b border-[#26354c]/8 pb-3"><span>{item.name}</span><strong>{item.amount}</strong></li>)}</ul><h3 className="mt-7 text-sm font-black uppercase tracking-wider text-[#dd6d4b]">Allergen tags</h3><div className="mt-3 flex flex-wrap gap-2">{allergens.length ? allergens.map((allergen) => <Badge key={allergen}>{ALLERGEN_LABELS[allergen as keyof typeof ALLERGEN_LABELS] ?? allergen}</Badge>) : <Badge>No common allergen tags</Badge>}</div></Card><Card className="p-7"><h2 className="text-2xl font-black">Method</h2><ol className="mt-5 space-y-5">{instructions.map((instruction, index) => <li key={`${index}-${instruction}`} className="flex gap-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#ffddd0] text-sm font-black text-[#8c402a]">{index + 1}</span><p className="pt-1 leading-7 text-[#647188] dark:text-slate-300">{instruction}</p></li>)}</ol><div className="mt-7 rounded-2xl bg-[#f2f7f3] p-5 dark:bg-white/5"><h3 className="font-black">Why this recipe is included</h3><p className="mt-2 text-sm leading-6 text-[#69758a] dark:text-slate-300">{recipe.whyGood}</p><p className="mt-3 text-xs font-bold text-[#8791a4]">Safety framework: {recipe.source.organization} · {recipe.source.version}</p>{!isVetted && <p className="mt-2 text-xs font-bold text-[#b65335]">This generated idea passed ruleset {recipe.rulesetVersion}; it was not individually clinician-reviewed.</p>}</div></Card></div><div className="mt-6"><RecipeDisclaimer /></div></article></main>
  );
}
