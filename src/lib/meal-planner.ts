import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { Baby, BabyAllergy, Recipe, SafetyRule } from "@prisma/client";
import { calculateAge } from "@/lib/age";
import {
  COMMON_ALLERGENS,
  MIN_SOLIDS_AGE_MONTHS,
  SAFETY_RULESET_VERSION,
} from "@/lib/constants";
import { prisma } from "@/lib/db";
import { mealPlanPayloadSchema, mealSchema, type Meal, type MealPlanPayload } from "@/lib/schemas";
import { validateRecipeSafety } from "@/lib/safety";

type BabyWithAllergies = Baby & { allergies: BabyAllergy[] };

function parseJsonArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function recipeToMeal(recipe: Recipe): Meal {
  return mealSchema.parse({
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
}

function expectedSlots(completedMonths: number) {
  return completedMonths >= 8
    ? ["BREAKFAST", "LUNCH", "DINNER", "SNACK"]
    : ["BREAKFAST", "LUNCH", "DINNER"];
}

function buildFallbackPlan(
  recipes: Recipe[],
  baby: BabyWithAllergies,
  rules: SafetyRule[],
  offset = 0,
): MealPlanPayload {
  const age = calculateAge(baby.dateOfBirth).completedMonths;
  const context = {
    completedMonths: age,
    allergyStatus: baby.allergyStatus,
    knownAllergens: baby.allergies.map((item) => item.allergen),
  };
  const safeRecipes = recipes
    .filter(
      (recipe) =>
        recipe.minAgeMonths <= age &&
        (recipe.maxAgeMonthsExclusive === null || age < recipe.maxAgeMonthsExclusive),
    )
    .map(recipeToMeal)
    .filter((meal) => validateRecipeSafety(meal, context, rules).safe);

  const meals = expectedSlots(age).map((slot, index) => {
    const matches = safeRecipes.filter((recipe) => recipe.mealType === slot);
    const match = matches.length ? matches[(offset + index) % matches.length] : null;
    const fallback = match ?? safeRecipes[(offset + index) % safeRecipes.length];
    if (!fallback) {
      throw new Error("No vetted recipes match this baby's safety profile.");
    }
    return { ...fallback, mealType: slot as Meal["mealType"] };
  });

  return mealPlanPayloadSchema.parse({ meals });
}

export async function getSafeVettedMeals(baby: BabyWithAllergies) {
  const age = calculateAge(baby.dateOfBirth).completedMonths;
  if (age < MIN_SOLIDS_AGE_MONTHS) throw new Error("SOLIDS_NOT_AVAILABLE");
  const [rules, recipes] = await Promise.all([
    prisma.safetyRule.findMany({ where: { active: true } }),
    prisma.recipe.findMany({ where: { reviewStatus: "ADMIN_REVIEWED" } }),
  ]);
  const context = {
    completedMonths: age,
    allergyStatus: baby.allergyStatus,
    knownAllergens: baby.allergies.map((item) => item.allergen),
  };
  return recipes
    .filter(
      (recipe) =>
        recipe.minAgeMonths <= age &&
        (recipe.maxAgeMonthsExclusive === null || age < recipe.maxAgeMonthsExclusive),
    )
    .map(recipeToMeal)
    .filter((meal) => validateRecipeSafety(meal, context, rules).safe);
}

export async function createVettedWeeklyPlans(baby: BabyWithAllergies) {
  const age = calculateAge(baby.dateOfBirth).completedMonths;
  if (age < MIN_SOLIDS_AGE_MONTHS) throw new Error("SOLIDS_NOT_AVAILABLE");
  const [rules, recipes] = await Promise.all([
    prisma.safetyRule.findMany({ where: { active: true } }),
    prisma.recipe.findMany({ where: { reviewStatus: "ADMIN_REVIEWED" } }),
  ]);
  return Array.from({ length: 7 }, (_, index) => buildFallbackPlan(recipes, baby, rules, index));
}

async function generateWithOpenAI(
  baby: BabyWithAllergies,
  rules: SafetyRule[],
): Promise<MealPlanPayload | null> {
  if (
    process.env.AI_RECIPE_GENERATION_ENABLED !== "true" ||
    !process.env.OPENAI_API_KEY
  ) {
    return null;
  }

  const age = calculateAge(baby.dateOfBirth).completedMonths;
  const excludedAllergens =
    baby.allergyStatus === "NOT_SURE"
      ? [...COMMON_ALLERGENS]
      : baby.allergies.map((item) => item.allergen);
  const activeRules = rules.map((rule) => ({
    code: rule.code,
    title: rule.title,
    appliesUntilExclusive: rule.maxAgeMonthsExclusive,
  }));
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.responses.parse({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    input: [
      {
        role: "system",
        content:
          "Create general baby-food recipe ideas only. Do not give medical advice, allergy testing, exposure, diagnosis, or treatment guidance. Follow every supplied safety restriction. Return only the requested structure.",
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "Create one daily menu using the requested meal slots.",
          completedAgeMonths: age,
          mealSlots: expectedSlots(age),
          excludedAllergens,
          allergyStatus: baby.allergyStatus,
          foodsAlreadyIntroduced: parseJsonArray(baby.foodsIntroduced),
          foodsDisliked: parseJsonArray(baby.foodsDisliked),
          deterministicRules: activeRules,
          rulesetVersion: SAFETY_RULESET_VERSION,
        }),
      },
    ],
    text: { format: zodTextFormat(mealPlanPayloadSchema, "baby_meal_plan") },
  });

  return response.output_parsed ?? null;
}

export async function createSafeDailyPlan(
  baby: BabyWithAllergies,
  userId: string,
): Promise<{ payload: MealPlanPayload; source: "AI" | "VETTED" }> {
  const age = calculateAge(baby.dateOfBirth).completedMonths;
  if (age < MIN_SOLIDS_AGE_MONTHS) {
    throw new Error("SOLIDS_NOT_AVAILABLE");
  }

  const [rules, recipes] = await Promise.all([
    prisma.safetyRule.findMany({ where: { active: true } }),
    prisma.recipe.findMany({ where: { reviewStatus: "ADMIN_REVIEWED" } }),
  ]);
  const context = {
    completedMonths: age,
    allergyStatus: baby.allergyStatus,
    knownAllergens: baby.allergies.map((item) => item.allergen),
  };

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const candidate = await generateWithOpenAI(baby, rules);
      if (!candidate) break;

      const rejected = candidate.meals.flatMap((meal) => {
        const result = validateRecipeSafety(meal, context, rules);
        return result.safe ? [] : [{ meal, reasons: result.reasons }];
      });

      if (rejected.length === 0) {
        return { payload: candidate, source: "AI" };
      }

      await prisma.recipeRejection.create({
        data: {
          babyId: baby.id,
          userId,
          requestType: "DAILY_PLAN",
          promptSummary: `Daily plan attempt ${attempt} for ${age} completed months`,
          candidateJson: JSON.stringify(candidate),
          reasonsJson: JSON.stringify(rejected.map((item) => item.reasons).flat()),
          rulesetVersion: SAFETY_RULESET_VERSION,
        },
      });
    } catch (error) {
      console.error("AI meal generation failed; using vetted fallback", error instanceof Error ? error.message : "Unknown error");
      break;
    }
  }

  return { payload: buildFallbackPlan(recipes, baby, rules), source: "VETTED" };
}
