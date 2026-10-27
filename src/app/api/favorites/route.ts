import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, assertSameOrigin } from "@/lib/api";
import { AuthorizationError, getOwnedBaby, requireUser } from "@/lib/authorization";
import { calculateAge } from "@/lib/age";
import { SAFETY_RULESET_VERSION } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { mealSchema } from "@/lib/schemas";
import { validateRecipeSafety } from "@/lib/safety";

const favoriteSchema = z.object({
  recipeId: z.string().min(1).optional(),
  babyId: z.string().min(1).optional(),
  meal: mealSchema.optional(),
}).refine((value) => Boolean(value.recipeId) !== Boolean(value.babyId && value.meal), {
  message: "Choose one recipe to save.",
});

function slugify(value: string) {
  return `${value.toLocaleLowerCase("en").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "recipe"}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function GET() {
  try {
    const user = await requireUser();
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: { recipe: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ favorites });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const input = favoriteSchema.parse(await request.json());
    let recipeId = input.recipeId;
    if (recipeId) {
      const recipe = await prisma.recipe.findFirst({
        where: { id: recipeId, OR: [{ reviewStatus: "ADMIN_REVIEWED" }, { createdByUserId: user.id }] },
        select: { id: true },
      });
      if (!recipe) throw new AuthorizationError("Recipe was not found.", 404);
    } else if (input.babyId && input.meal) {
      const baby = await getOwnedBaby(user.id, input.babyId);
      const rules = await prisma.safetyRule.findMany({ where: { active: true } });
      const safety = validateRecipeSafety(input.meal, {
        completedMonths: calculateAge(baby.dateOfBirth).completedMonths,
        allergyStatus: baby.allergyStatus,
        knownAllergens: baby.allergies.map((item) => item.allergen),
      }, rules);
      if (!safety.safe) {
        await prisma.recipeRejection.create({
          data: {
            babyId: baby.id,
            userId: user.id,
            requestType: "FAVORITE_RECHECK",
            promptSummary: input.meal.title,
            candidateJson: JSON.stringify(input.meal),
            reasonsJson: JSON.stringify(safety.reasons),
            rulesetVersion: SAFETY_RULESET_VERSION,
          },
        });
        return NextResponse.json({ error: "This meal did not pass the current safety recheck and was not saved." }, { status: 422 });
      }
      const ingredientsJson = JSON.stringify(input.meal.ingredients);
      let savedRecipe = await prisma.recipe.findFirst({
        where: { createdByUserId: user.id, generatedForBabyId: baby.id, title: input.meal.title, ingredientsJson },
      });
      if (!savedRecipe) {
        const source = await prisma.safetySource.findFirst({ where: { status: "ACTIVE" }, orderBy: { reviewDate: "desc" } });
        if (!source) throw new AuthorizationError("No active safety source is available.", 503);
        savedRecipe = await prisma.recipe.create({
          data: {
            sourceId: source.id,
            createdByUserId: user.id,
            generatedForBabyId: baby.id,
            title: input.meal.title,
            slug: slugify(input.meal.title),
            description: input.meal.description,
            mealType: input.meal.mealType,
            ingredientsJson,
            instructionsJson: JSON.stringify(input.meal.instructions),
            prepMinutes: input.meal.prepMinutes,
            texture: input.meal.texture,
            minAgeMonths: calculateAge(baby.dateOfBirth).completedMonths,
            allergenTagsJson: JSON.stringify(input.meal.allergenTags),
            whyGood: input.meal.whyGood,
            reviewStatus: "PLAN_VALIDATED",
            rulesetVersion: SAFETY_RULESET_VERSION,
          },
        });
      }
      recipeId = savedRecipe.id;
    }
    if (!recipeId) throw new AuthorizationError("Recipe was not found.", 404);

    const favorite = await prisma.favorite.upsert({
      where: { userId_recipeId: { userId: user.id, recipeId } },
      update: {},
      create: { userId: user.id, recipeId },
    });
    return NextResponse.json({ favorite, recipeId }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
