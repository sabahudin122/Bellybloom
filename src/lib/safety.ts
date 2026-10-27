import type { SafetyRule } from "@prisma/client";
import { COMMON_ALLERGENS, MIN_SOLIDS_AGE_MONTHS } from "@/lib/constants";
import type { Meal } from "@/lib/schemas";

export type SafetyContext = {
  completedMonths: number;
  allergyStatus: string;
  knownAllergens: string[];
};

export type SafetyResult = {
  safe: boolean;
  reasons: string[];
};

const allergenTerms: Record<(typeof COMMON_ALLERGENS)[number], string[]> = {
  MILK: ["milk", "yogurt", "yoghurt", "cheese", "butter", "cream", "whey", "casein"],
  EGG: ["egg", "mayonnaise", "meringue"],
  PEANUT: ["peanut", "groundnut"],
  TREE_NUT: ["almond", "walnut", "cashew", "pistachio", "hazelnut", "pecan", "macadamia"],
  WHEAT_GLUTEN: ["wheat", "flour", "bread", "pasta", "couscous", "barley", "rye", "gluten"],
  SOY: ["soy", "soya", "tofu", "edamame"],
  FISH: ["salmon", "tuna", "cod", "haddock", "sardine", "fish"],
  SHELLFISH: ["shrimp", "prawn", "crab", "lobster", "shellfish", "mussel"],
  SESAME: ["sesame", "tahini"],
};

function normalize(value: string) {
  return value.toLocaleLowerCase("en").normalize("NFKD");
}

function includesTerm(text: string, term: string) {
  const escaped = normalize(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, "i").test(text);
}

function excludedAllergens(context: SafetyContext) {
  if (context.allergyStatus === "NOT_SURE") return [...COMMON_ALLERGENS];
  if (context.allergyStatus === "YES") return context.knownAllergens;
  return [];
}

export function validateRecipeSafety(
  meal: Meal,
  context: SafetyContext,
  rules: Pick<
    SafetyRule,
    | "code"
    | "title"
    | "termsJson"
    | "minAgeMonthsInclusive"
    | "maxAgeMonthsExclusive"
    | "active"
  >[],
): SafetyResult {
  const reasons: string[] = [];

  if (context.completedMonths < MIN_SOLIDS_AGE_MONTHS) {
    reasons.push("Solid-food plans are unavailable below the approved minimum age.");
  }

  const ingredientText = meal.ingredients.map((item) => item.name).join(" | ");
  const fullText = normalize(
    [
      meal.title,
      meal.description,
      ingredientText,
      ...meal.instructions,
      meal.texture,
    ].join(" | "),
  );

  for (const allergen of excludedAllergens(context)) {
    const typedAllergen = allergen as (typeof COMMON_ALLERGENS)[number];
    const tagged = meal.allergenTags.includes(typedAllergen);
    const detected = allergenTerms[typedAllergen]?.some((term) => includesTerm(fullText, term));
    if (tagged || detected) {
      reasons.push(`Contains or may contain excluded allergen: ${typedAllergen}.`);
    }
  }

  for (const rule of rules) {
    if (!rule.active) continue;
    const starts = rule.minAgeMonthsInclusive ?? 0;
    const ends = rule.maxAgeMonthsExclusive;
    const applies =
      context.completedMonths >= starts &&
      (ends === null || context.completedMonths < ends);
    if (!applies) continue;

    const terms = JSON.parse(rule.termsJson) as string[];
    if (terms.some((term) => includesTerm(fullText, term))) {
      reasons.push(`${rule.code}: ${rule.title}`);
    }
  }

  return { safe: reasons.length === 0, reasons: [...new Set(reasons)] };
}
