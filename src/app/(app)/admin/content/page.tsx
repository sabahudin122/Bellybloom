import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminContentManager } from "@/components/admin-content-manager";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  await requireAdmin();
  const [stages, recipes, sources] = await Promise.all([
    prisma.ageStage.findMany({ where: { active: true }, include: { source: true }, orderBy: { sortOrder: "asc" } }),
    prisma.recipe.findMany({ where: { reviewStatus: "ADMIN_REVIEWED" }, orderBy: { title: "asc" } }),
    prisma.safetySource.findMany({ where: { status: "ACTIVE" }, orderBy: { reviewDate: "desc" } }),
  ]);
  const serializedStages = stages.map((stage) => ({ id: stage.id, title: stage.title, minAgeMonthsInclusive: stage.minAgeMonthsInclusive, maxAgeMonthsExclusive: stage.maxAgeMonthsExclusive, summary: stage.summary, foods: stage.foods, avoid: stage.avoid, textures: stage.textures, mealsPerDay: stage.mealsPerDay, warnings: stage.warnings, source: { organization: stage.source.organization, version: stage.source.version, reviewDate: stage.source.reviewDate.toISOString(), reviewerNotes: stage.source.reviewerNotes } }));
  const serializedRecipes = recipes.map((recipe) => ({ id: recipe.id, sourceId: recipe.sourceId, title: recipe.title, slug: recipe.slug, description: recipe.description, mealType: recipe.mealType, ingredientsJson: recipe.ingredientsJson, instructionsJson: recipe.instructionsJson, prepMinutes: recipe.prepMinutes, texture: recipe.texture, minAgeMonths: recipe.minAgeMonths, maxAgeMonthsExclusive: recipe.maxAgeMonthsExclusive, allergenTagsJson: recipe.allergenTagsJson, whyGood: recipe.whyGood }));
  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10"><Link href="/admin" className="inline-flex items-center gap-2 text-sm font-black text-[#657187]"><ArrowLeft className="size-4" />Admin dashboard</Link><h1 className="mt-6 text-4xl font-black tracking-[-.05em]">Guidance & recipes</h1><p className="mt-3 text-[#748095] dark:text-slate-300">Manage reviewed content without bypassing age-boundary or recipe safety validation.</p><div className="mt-8"><AdminContentManager initialStages={serializedStages} initialRecipes={serializedRecipes} sources={sources.map((source) => ({ id: source.id, organization: source.organization, version: source.version, reviewDate: source.reviewDate.toISOString(), reviewerNotes: source.reviewerNotes }))} /></div></main>;
}
