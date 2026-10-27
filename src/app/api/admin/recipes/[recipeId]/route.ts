import { NextResponse } from "next/server";
import { adminRecipeSchema, recipeSlug, validateAdminRecipe } from "@/lib/admin-recipes";
import { apiError, assertSameOrigin } from "@/lib/api";
import { AuthorizationError, requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";

export async function PATCH(request: Request, { params }: { params: Promise<{ recipeId: string }> }) {
  try {
    assertSameOrigin(request); await requireAdmin();
    const { recipeId } = await params;
    const current = await prisma.recipe.findFirst({ where: { id: recipeId, reviewStatus: "ADMIN_REVIEWED" } });
    if (!current) throw new AuthorizationError("Recipe was not found.", 404);
    const input = adminRecipeSchema.parse(await request.json());
    const safety = await validateAdminRecipe(input);
    if (!safety.safe) return NextResponse.json({ error: "Recipe failed deterministic safety review.", reasons: safety.reasons }, { status: 422 });
    const desiredSlug = recipeSlug(input.slug || input.title);
    const conflict = await prisma.recipe.findFirst({ where: { slug: desiredSlug, NOT: { id: current.id } }, select: { id: true } });
    const recipe = await prisma.recipe.update({ where: { id: current.id }, data: {
      sourceId: input.sourceId, title: input.title, slug: conflict ? current.slug : desiredSlug, description: input.description, mealType: input.mealType,
      ingredientsJson: JSON.stringify(input.ingredients), instructionsJson: JSON.stringify(input.instructions), prepMinutes: input.prepMinutes,
      texture: input.texture, minAgeMonths: input.minAgeMonths, maxAgeMonthsExclusive: input.maxAgeMonthsExclusive ?? null,
      allergenTagsJson: JSON.stringify(input.allergenTags), whyGood: input.whyGood, rulesetVersion: safety.rulesetVersion,
    } });
    return NextResponse.json({ recipe });
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ recipeId: string }> }) {
  try {
    assertSameOrigin(request); await requireAdmin();
    const { recipeId } = await params;
    const recipe = await prisma.recipe.findFirst({ where: { id: recipeId, reviewStatus: "ADMIN_REVIEWED" }, select: { id: true } });
    if (!recipe) throw new AuthorizationError("Recipe was not found.", 404);
    await prisma.recipe.delete({ where: { id: recipe.id } });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
