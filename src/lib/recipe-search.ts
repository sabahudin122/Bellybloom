import { randomUUID } from "node:crypto";
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
import { mealSchema, type Meal } from "@/lib/schemas";
import { validateRecipeSafety } from "@/lib/safety";

type BabyWithAllergies = Baby & { allergies: BabyAllergy[] };

const bilingualTerms: Record<string, string[]> = {
  juha: ["soup"],
  kasa: ["porridge", "oats"],
  kaša: ["porridge", "oats"],
  mrkva: ["carrot"],
  piletina: ["chicken"],
  riba: ["fish", "salmon"],
  supa: ["soup"],
  tikvica: ["zucchini", "courgette"],
  zob: ["oats", "oatmeal"],
};

function normalize(value: string) {
  return value.toLocaleLowerCase("en").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

export function buildRecipeSearchTerms(query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return [...new Set(words.flatMap((word) => [word, ...(bilingualTerms[word] ?? [])].map(normalize)))];
}

export function recipeMatchesQuery(
  recipe: Pick<Recipe, "title" | "description" | "ingredientsJson">,
  query: string,
) {
  const terms = buildRecipeSearchTerms(query);
  if (terms.length === 0) return true;
  const haystack = normalize(`${recipe.title} ${recipe.description} ${recipe.ingredientsJson}`);
  return terms.some((term) => haystack.includes(term));
}

function slugify(value: string) {
  const base = normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);
  return `${base || "recipe"}-${randomUUID().slice(0, 8)}`;
}

async function vettedFallbacks(baby: BabyWithAllergies, rules: SafetyRule[]) {
  const age = calculateAge(baby.dateOfBirth).completedMonths;
  const context = {
    completedMonths: age,
    allergyStatus: baby.allergyStatus,
    knownAllergens: baby.allergies.map((item) => item.allergen),
  };
  const recipes = await prisma.recipe.findMany({
    where: { reviewStatus: "ADMIN_REVIEWED" },
    orderBy: [{ minAgeMonths: "asc" }, { title: "asc" }],
  });

  return recipes
    .filter(
      (recipe) =>
        recipe.minAgeMonths <= age &&
        (recipe.maxAgeMonthsExclusive === null || age < recipe.maxAgeMonthsExclusive),
    )
    .filter((recipe) => {
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
      return validateRecipeSafety(meal, context, rules).safe;
    })
    .slice(0, 3)
    .map(({ id, slug, title, minAgeMonths }) => ({ id, slug, title, minAgeMonths }));
}

export type GeneratedRecipeResult =
  | { status: "CREATED"; recipe: Recipe }
  | { status: "NOT_CONFIGURED" | "REJECTED" | "FAILED"; fallbacks: Awaited<ReturnType<typeof vettedFallbacks>> };

export async function generateSafeSearchRecipe(
  query: string,
  baby: BabyWithAllergies,
  userId: string,
): Promise<GeneratedRecipeResult> {
  const age = calculateAge(baby.dateOfBirth).completedMonths;
  if (age < MIN_SOLIDS_AGE_MONTHS) {
    throw new Error("SOLIDS_NOT_AVAILABLE");
  }

  const rules = await prisma.safetyRule.findMany({ where: { active: true } });
  const fallbacks = await vettedFallbacks(baby, rules);
  if (
    process.env.AI_RECIPE_GENERATION_ENABLED !== "true" ||
    !process.env.OPENAI_API_KEY
  ) {
    return { status: "NOT_CONFIGURED", fallbacks };
  }

  const source = await prisma.safetySource.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { reviewDate: "desc" },
  });
  if (!source) return { status: "FAILED", fallbacks };

  const context = {
    completedMonths: age,
    allergyStatus: baby.allergyStatus,
    knownAllergens: baby.allergies.map((item) => item.allergen),
  };
  const excludedAllergens =
    baby.allergyStatus === "NOT_SURE"
      ? [...COMMON_ALLERGENS]
      : baby.allergies.map((item) => item.allergen);
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  let rejectedCandidate = false;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    let candidate: Meal | null = null;
    try {
      const response = await openai.responses.parse({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        input: [
          {
            role: "system",
            content:
              "Create one general baby-food recipe idea, never medical advice. Do not recommend allergy testing, exposure, diagnosis, or treatment. Follow every supplied restriction and return only the requested structure.",
          },
          {
            role: "user",
            content: JSON.stringify({
              requestedRecipe: query,
              completedAgeMonths: age,
              allergyStatus: baby.allergyStatus,
              excludedAllergens,
              activeRules: rules.map((rule) => ({
                code: rule.code,
                title: rule.title,
                minAgeMonthsInclusive: rule.minAgeMonthsInclusive,
                maxAgeMonthsExclusive: rule.maxAgeMonthsExclusive,
              })),
              rulesetVersion: SAFETY_RULESET_VERSION,
            }),
          },
        ],
        text: { format: zodTextFormat(mealSchema, "baby_recipe") },
      });
      candidate = response.output_parsed ?? null;
    } catch (error) {
      console.error(
        "Recipe generation failed; offering vetted alternatives",
        error instanceof Error ? error.message : "Unknown error",
      );
      return { status: "FAILED", fallbacks };
    }

    if (!candidate) continue;
    const result = validateRecipeSafety(candidate, context, rules);
    if (!result.safe) {
      rejectedCandidate = true;
      await prisma.recipeRejection.create({
        data: {
          babyId: baby.id,
          userId,
          requestType: "RECIPE_SEARCH",
          promptSummary: `Recipe search attempt ${attempt}: ${query}`,
          candidateJson: JSON.stringify(candidate),
          reasonsJson: JSON.stringify(result.reasons),
          rulesetVersion: SAFETY_RULESET_VERSION,
        },
      });
      continue;
    }

    const recipe = await prisma.recipe.create({
      data: {
        sourceId: source.id,
        createdByUserId: userId,
        generatedForBabyId: baby.id,
        title: candidate.title,
        slug: slugify(candidate.title),
        description: candidate.description,
        mealType: candidate.mealType,
        ingredientsJson: JSON.stringify(candidate.ingredients),
        instructionsJson: JSON.stringify(candidate.instructions),
        prepMinutes: candidate.prepMinutes,
        texture: candidate.texture,
        minAgeMonths: age,
        allergenTagsJson: JSON.stringify(candidate.allergenTags),
        whyGood: candidate.whyGood,
        reviewStatus: "AI_VALIDATED",
        rulesetVersion: SAFETY_RULESET_VERSION,
      },
    });
    return { status: "CREATED", recipe };
  }

  return { status: rejectedCandidate ? "REJECTED" : "FAILED", fallbacks };
}
