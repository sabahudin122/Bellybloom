import { NextResponse } from "next/server";
import { adminRecipeSchema, recipeSlug, validateAdminRecipe } from "@/lib/admin-recipes";
import { apiError, assertSameOrigin } from "@/lib/api";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireAdmin();
    const input = adminRecipeSchema.parse(await request.json());
    const safety = await validateAdminRecipe(input);
    if (!safety.safe) return NextResponse.json({ error: "Recipe failed deterministic safety review.", reasons: safety.reasons }, { status: 422 });
    let slug = recipeSlug(input.slug || input.title);
    if (await prisma.recipe.findUnique({ where: { slug } })) slug = `${slug}-${crypto.randomUUID().slice(0, 8)}`;
    const recipe = await prisma.recipe.create({ data: {
      sourceId: input.sourceId, title: input.title, slug, description: input.description, mealType: input.mealType,
      ingredientsJson: JSON.stringify(input.ingredients), instructionsJson: JSON.stringify(input.instructions), prepMinutes: input.prepMinutes,
      texture: input.texture, minAgeMonths: input.minAgeMonths, maxAgeMonthsExclusive: input.maxAgeMonthsExclusive ?? null,
      allergenTagsJson: JSON.stringify(input.allergenTags), whyGood: input.whyGood, reviewStatus: "ADMIN_REVIEWED", rulesetVersion: safety.rulesetVersion,
    } });
    return NextResponse.json({ recipe }, { status: 201 });
  } catch (error) { return apiError(error); }
}
