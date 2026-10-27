import { z } from "zod";
import { COMMON_ALLERGENS, MIN_SOLIDS_AGE_MONTHS, SAFETY_RULESET_VERSION } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { ingredientSchema, mealSchema } from "@/lib/schemas";
import { validateRecipeSafety } from "@/lib/safety";

export const adminRecipeSchema = z.object({
  sourceId: z.string().min(1),
  title: z.string().trim().min(2).max(120),
  slug: z.string().trim().max(100).optional().default(""),
  description: z.string().trim().min(2).max(300),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  ingredients: z.array(ingredientSchema).min(1).max(20),
  instructions: z.array(z.string().trim().min(2).max(400)).min(1).max(12),
  prepMinutes: z.number().int().min(1).max(180),
  texture: z.string().trim().min(2).max(100),
  minAgeMonths: z.number().int().min(MIN_SOLIDS_AGE_MONTHS).max(120),
  maxAgeMonthsExclusive: z.number().int().min(MIN_SOLIDS_AGE_MONTHS + 1).max(121).nullable().optional(),
  allergenTags: z.array(z.enum(COMMON_ALLERGENS)).max(COMMON_ALLERGENS.length),
  whyGood: z.string().trim().min(2).max(300),
}).refine((value) => value.maxAgeMonthsExclusive == null || value.maxAgeMonthsExclusive > value.minAgeMonths, {
  message: "The exclusive upper age must be greater than the minimum age.",
  path: ["maxAgeMonthsExclusive"],
});

export function recipeSlug(value: string) {
  return value.toLocaleLowerCase("en").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
}

export async function validateAdminRecipe(input: z.infer<typeof adminRecipeSchema>) {
  const [source, rules] = await Promise.all([
    prisma.safetySource.findFirst({ where: { id: input.sourceId, status: "ACTIVE" } }),
    prisma.safetyRule.findMany({ where: { active: true } }),
  ]);
  if (!source) return { safe: false, reasons: ["Select an active reviewed safety source."], rulesetVersion: SAFETY_RULESET_VERSION };
  const meal = mealSchema.parse({
    mealType: input.mealType,
    title: input.title,
    description: input.description,
    ingredients: input.ingredients,
    instructions: input.instructions,
    prepMinutes: input.prepMinutes,
    texture: input.texture,
    allergenTags: input.allergenTags,
    whyGood: input.whyGood,
  });
  const result = validateRecipeSafety(meal, { completedMonths: input.minAgeMonths, allergyStatus: "NO", knownAllergens: [] }, rules);
  return { ...result, rulesetVersion: SAFETY_RULESET_VERSION };
}
