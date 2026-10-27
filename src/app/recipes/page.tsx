import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowRight, Clock3, Search, ShieldCheck } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { GenerateRecipeButton } from "@/components/generate-recipe-button";
import { PublicHeader } from "@/components/public-header";
import { RecipeDisclaimer } from "@/components/recipe-disclaimer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { authOptions } from "@/lib/auth-options";
import { calculateAge } from "@/lib/age";
import { ALLERGEN_LABELS, COMMON_ALLERGENS, MIN_SOLIDS_AGE_MONTHS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { recipeMatchesQuery } from "@/lib/recipe-search";
import { mealSchema } from "@/lib/schemas";
import { validateRecipeSafety } from "@/lib/safety";

export const metadata: Metadata = { title: "Vetted recipes" };
export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  baby?: string;
  mealType?: string;
  allergen?: string;
  stage?: string;
};

export default async function RecipesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [params, session, stages, allRecipes] = await Promise.all([
    searchParams,
    getServerSession(authOptions),
    prisma.ageStage.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.recipe.findMany({
      where: { reviewStatus: "ADMIN_REVIEWED" },
      orderBy: [{ minAgeMonths: "asc" }, { title: "asc" }],
    }),
  ]);
  const babies = session?.user?.id
    ? await prisma.baby.findMany({
        where: { userId: session.user.id },
        include: { allergies: true },
        orderBy: { createdAt: "asc" },
      })
    : [];
  const selectedBaby = babies.find((baby) => baby.id === params.baby);
  const rules = selectedBaby ? await prisma.safetyRule.findMany({ where: { active: true } }) : [];
  const stageAge = params.stage ? Number(params.stage) : null;
  const query = params.q?.trim() ?? "";
  const selectedBabyAge = selectedBaby ? calculateAge(selectedBaby.dateOfBirth).completedMonths : null;

  const recipes = allRecipes.filter((recipe) => {
    if (query && !recipeMatchesQuery(recipe, query)) return false;
    if (params.mealType && recipe.mealType !== params.mealType) return false;
    const allergens = JSON.parse(recipe.allergenTagsJson) as string[];
    if (params.allergen && allergens.includes(params.allergen)) return false;
    if (stageAge !== null && Number.isFinite(stageAge)) {
      if (recipe.minAgeMonths > stageAge) return false;
      if (recipe.maxAgeMonthsExclusive !== null && stageAge >= recipe.maxAgeMonthsExclusive) return false;
    }
    if (selectedBaby && selectedBabyAge !== null) {
      if (recipe.minAgeMonths > selectedBabyAge) return false;
      if (recipe.maxAgeMonthsExclusive !== null && selectedBabyAge >= recipe.maxAgeMonthsExclusive) return false;
      try {
        const meal = mealSchema.parse({
          mealType: recipe.mealType,
          title: recipe.title,
          description: recipe.description,
          ingredients: JSON.parse(recipe.ingredientsJson),
          instructions: JSON.parse(recipe.instructionsJson),
          prepMinutes: recipe.prepMinutes,
          texture: recipe.texture,
          allergenTags: allergens,
          whyGood: recipe.whyGood,
        });
        return validateRecipeSafety(
          meal,
          {
            completedMonths: selectedBabyAge,
            allergyStatus: selectedBaby.allergyStatus,
            knownAllergens: selectedBaby.allergies.map((item) => item.allergen),
          },
          rules,
        ).safe;
      } catch {
        return false;
      }
    }
    return true;
  });

  const favorites = session?.user?.id
    ? await prisma.favorite.findMany({
        where: { userId: session.user.id, recipeId: { in: recipes.map((recipe) => recipe.id) } },
      })
    : [];
  const favoriteByRecipe = new Map(favorites.map((favorite) => [favorite.recipeId, favorite.id]));

  return (
    <main className="min-h-screen bg-[#fffaf1] dark:bg-[#101a2b]">
      <PublicHeader />
      <section className="page-shell pb-20 pt-12">
        <div className="max-w-3xl"><Badge className="bg-[#cff4e4] text-[#28614f]">Admin-reviewed catalogue</Badge><h1 className="mt-5 text-4xl font-black tracking-[-.05em] sm:text-6xl">Find a tiny recipe</h1><p className="mt-5 text-lg leading-8 text-[#6d788d] dark:text-slate-300">Search the vetted catalogue in English or Bosnian/Croatian/Serbian, then filter for a profile, stage, meal, or excluded allergen.</p></div>

        <form action="/recipes" className="mt-8 grid gap-3 rounded-[2rem] bg-white p-4 shadow-[0_15px_50px_rgba(38,53,76,.08)] dark:bg-white/5 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <label className="relative"><span className="sr-only">Search recipes</span><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#8993a5]" /><input name="q" defaultValue={query} placeholder="Try ‘carrot soup’ or ‘supa od mrkve’" className="min-h-12 w-full rounded-2xl border border-[#26354c]/15 bg-white pl-12 pr-4 font-bold text-[#26354c] outline-none focus:border-[#ff936b] dark:border-white/15 dark:bg-[#18243a] dark:text-white" /></label>
          {babies.length > 0 && <label><span className="sr-only">Baby profile</span><select name="baby" defaultValue={selectedBaby?.id ?? ""} className="min-h-12 w-full rounded-2xl border border-[#26354c]/15 bg-white px-4 font-bold text-[#26354c] dark:border-white/15 dark:bg-[#18243a] dark:text-white"><option value="">Any profile</option>{babies.map((baby) => <option key={baby.id} value={baby.id}>{baby.name}</option>)}</select></label>}
          <label><span className="sr-only">Age stage</span><select name="stage" defaultValue={params.stage ?? ""} className="min-h-12 w-full rounded-2xl border border-[#26354c]/15 bg-white px-4 font-bold text-[#26354c] dark:border-white/15 dark:bg-[#18243a] dark:text-white"><option value="">Any age stage</option>{stages.filter((stage) => stage.minAgeMonthsInclusive >= MIN_SOLIDS_AGE_MONTHS).map((stage) => <option key={stage.id} value={stage.minAgeMonthsInclusive}>{stage.title}</option>)}</select></label>
          <label><span className="sr-only">Meal type</span><select name="mealType" defaultValue={params.mealType ?? ""} className="min-h-12 w-full rounded-2xl border border-[#26354c]/15 bg-white px-4 font-bold text-[#26354c] dark:border-white/15 dark:bg-[#18243a] dark:text-white"><option value="">Any meal</option>{["BREAKFAST", "LUNCH", "DINNER", "SNACK"].map((meal) => <option key={meal} value={meal}>{meal.toLowerCase()}</option>)}</select></label>
          <button className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#26354c] px-7 text-sm font-black text-white">Search</button>
          <label className="md:col-span-2 xl:col-span-5"><span className="mr-3 text-xs font-black uppercase tracking-wider text-[#7b8799]">Exclude allergen</span><select name="allergen" defaultValue={params.allergen ?? ""} className="min-h-10 rounded-xl border border-[#26354c]/15 bg-white px-3 text-sm font-bold text-[#26354c] dark:border-white/15 dark:bg-[#18243a] dark:text-white"><option value="">None selected</option>{COMMON_ALLERGENS.map((allergen) => <option key={allergen} value={allergen}>{ALLERGEN_LABELS[allergen]}-free</option>)}</select></label>
        </form>

        {selectedBaby && <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#eff8ff] px-4 py-3 text-sm font-bold text-[#405c74] dark:bg-[#a8d8ff]/10 dark:text-slate-200"><ShieldCheck className="size-4 text-[#2f8b69]" />Results are deterministically checked for {selectedBaby.name}&apos;s current age and allergy status.</div>}
        <div className="mt-6 max-w-3xl"><RecipeDisclaimer /></div>

        {recipes.length > 0 ? <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recipes.map((recipe, index) => <Card key={recipe.id} className="group flex h-full flex-col overflow-hidden transition hover:-translate-y-1"><Link href={`/recipes/${recipe.slug}${selectedBaby ? `?baby=${selectedBaby.id}` : ""}`} className="block"><div className={`${["bg-[#ffddd0]", "bg-[#cff4e4]", "bg-[#dceeff]", "bg-[#eee4ff]"][index % 4]} p-6 text-[#26354c]`}><div className="flex items-center justify-between"><Badge className="bg-white/65 text-[#26354c]">{recipe.mealType.toLowerCase()}</Badge><span className="flex items-center gap-1 text-xs font-black"><Clock3 className="size-3.5" />{recipe.prepMinutes}m</span></div><span className="mt-8 block text-5xl" aria-hidden="true">{["🥣", "🥕", "🍲", "🥑"][index % 4]}</span></div><div className="p-6 pb-3"><h2 className="text-xl font-black leading-6">{recipe.title}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-[#748095] dark:text-slate-300">{recipe.description}</p><div className="mt-5 flex items-center justify-between"><Badge>{recipe.minAgeMonths}+ months</Badge><ArrowRight className="size-5 text-[#d86543] transition group-hover:translate-x-1" /></div></div></Link>{session?.user?.id && <div className="mt-auto px-6 pb-6 pt-2"><FavoriteButton recipeId={recipe.id} initialFavoriteId={favoriteByRecipe.get(recipe.id)} compact /></div>}</Card>)}
        </div> : <div className="mt-10 rounded-[2rem] border border-dashed border-[#26354c]/15 p-8 text-center"><h2 className="text-2xl font-black">No vetted recipes match those filters</h2><p className="mt-2 text-[#748095]">Try a broader search or remove a filter.</p></div>}

        {query && recipes.length === 0 && selectedBaby && selectedBabyAge !== null && selectedBabyAge >= MIN_SOLIDS_AGE_MONTHS && <div className="mt-6"><GenerateRecipeButton query={query} babyId={selectedBaby.id} /></div>}
        {query && recipes.length === 0 && selectedBabyAge !== null && selectedBabyAge < MIN_SOLIDS_AGE_MONTHS && <div className="mt-6 rounded-3xl bg-[#eff8ff] p-6 font-bold text-[#405c74] dark:bg-[#a8d8ff]/10 dark:text-slate-200">Solid-food recipe generation is not available below the approved minimum age. Please use the age guide instead.</div>}
        {query && recipes.length === 0 && session?.user?.id && babies.length > 0 && !selectedBaby && <p className="mt-6 rounded-2xl bg-[#fff0b6] p-4 text-sm font-bold text-[#66531f]">Choose a baby profile before requesting a generated recipe so Bellybloom can apply age and allergy rules.</p>}
      </section>
    </main>
  );
}
