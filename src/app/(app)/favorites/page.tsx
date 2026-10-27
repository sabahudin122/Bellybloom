import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Clock3, Heart, ShieldAlert } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { RecipeDisclaimer } from "@/components/recipe-disclaimer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { calculateAge } from "@/lib/age";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { mealSchema } from "@/lib/schemas";
import { validateRecipeSafety } from "@/lib/safety";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const [favorites, rules] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: { recipe: { include: { generatedForBaby: { include: { allergies: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.safetyRule.findMany({ where: { active: true } }),
  ]);

  const visibleFavorites = favorites.filter(({ recipe }) => {
    if (recipe.reviewStatus === "ADMIN_REVIEWED") return true;
    const baby = recipe.generatedForBaby;
    if (!baby || baby.userId !== session.user.id) return false;
    try {
      const meal = mealSchema.parse({
        mealType: recipe.mealType,
        title: recipe.title,
        description: recipe.description,
        ingredients: JSON.parse(recipe.ingredientsJson),
        instructions: JSON.parse(recipe.instructionsJson),
        prepMinutes: recipe.prepMinutes,
        texture: recipe.texture,
        allergenTags: JSON.parse(recipe.allergenTagsJson),
        whyGood: recipe.whyGood,
      });
      return validateRecipeSafety(
        meal,
        {
          completedMonths: calculateAge(baby.dateOfBirth).completedMonths,
          allergyStatus: baby.allergyStatus,
          knownAllergens: baby.allergies.map((item) => item.allergen),
        },
        rules,
      ).safe;
    } catch {
      return false;
    }
  });
  const withheldCount = favorites.length - visibleFavorites.length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <div><p className="text-sm font-black uppercase tracking-[.16em] text-[#dd6d4b]">Saved collection</p><h1 className="mt-1 text-4xl font-black tracking-[-.05em]">Favorite recipes</h1><p className="mt-3 text-[#748095] dark:text-slate-300">Keep vetted recipes and private, safety-validated ideas close at hand.</p></div>
      <div className="mt-6 max-w-3xl"><RecipeDisclaimer /></div>
      {withheldCount > 0 && <div className="mt-5 flex gap-3 rounded-2xl bg-[#fff0b6] p-4 text-sm font-bold text-[#66531f]"><ShieldAlert className="size-5 shrink-0" /><p>{withheldCount} generated {withheldCount === 1 ? "recipe is" : "recipes are"} hidden because the current safety recheck did not pass.</p></div>}
      {visibleFavorites.length === 0 ? <Card className="mt-8 p-10 text-center"><Heart className="mx-auto size-10 text-[#d86543]" /><h2 className="mt-4 text-2xl font-black">No visible favorites yet</h2><p className="mt-2 text-[#748095]">Browse the vetted catalogue and save recipes you want to revisit.</p><Link href="/recipes" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[#26354c] px-6 text-sm font-black text-white">Browse recipes</Link></Card> : <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visibleFavorites.map(({ id, recipe }, index) => <Card key={id} className="overflow-hidden"><div className={`${["bg-[#ffddd0]", "bg-[#cff4e4]", "bg-[#dceeff]"][index % 3]} p-6 text-[#26354c]`}><div className="flex items-center justify-between"><Badge className="bg-white/70 text-[#26354c]">{recipe.reviewStatus === "ADMIN_REVIEWED" ? "vetted" : "private validated"}</Badge><span className="flex items-center gap-1 text-xs font-black"><Clock3 className="size-4" />{recipe.prepMinutes}m</span></div><span className="mt-8 block text-5xl" aria-hidden="true">{["🥣", "🥕", "🍲"][index % 3]}</span></div><div className="p-6"><Link href={`/recipes/${recipe.slug}${recipe.generatedForBabyId ? `?baby=${recipe.generatedForBabyId}` : ""}`}><h2 className="text-xl font-black hover:text-[#b65335]">{recipe.title}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-[#748095] dark:text-slate-300">{recipe.description}</p></Link><div className="mt-5"><FavoriteButton recipeId={recipe.id} initialFavoriteId={id} compact /></div></div></Card>)}
      </div>}
    </main>
  );
}
