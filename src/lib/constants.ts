export const APP_NAME = "Bellybloom";
export const MIN_SOLIDS_AGE_MONTHS = 6;
export const SAFETY_RULESET_VERSION = "2026.03-cdc-nhs-v1";
export const DAILY_REGENERATION_LIMIT = 3;

export const USER_ROLES = ["USER", "ADMIN"] as const;
export const ALLERGY_STATUSES = ["YES", "NO", "NOT_SURE"] as const;
export const COMMON_ALLERGENS = [
  "MILK",
  "EGG",
  "PEANUT",
  "TREE_NUT",
  "WHEAT_GLUTEN",
  "SOY",
  "FISH",
  "SHELLFISH",
  "SESAME",
] as const;

export const ALLERGEN_LABELS: Record<(typeof COMMON_ALLERGENS)[number], string> = {
  MILK: "Milk",
  EGG: "Egg",
  PEANUT: "Peanut",
  TREE_NUT: "Tree nuts",
  WHEAT_GLUTEN: "Wheat / gluten",
  SOY: "Soy",
  FISH: "Fish",
  SHELLFISH: "Shellfish",
  SESAME: "Sesame",
};

export const FEEDING_STAGES = [
  "BREAST_OR_FORMULA_ONLY",
  "STARTING_SOLIDS",
  "EXPLORING_TEXTURES",
  "FAMILY_FOODS",
] as const;

export const FEEDING_STAGE_LABELS: Record<(typeof FEEDING_STAGES)[number], string> = {
  BREAST_OR_FORMULA_ONLY: "Breast or formula only",
  STARTING_SOLIDS: "Starting solids",
  EXPLORING_TEXTURES: "Exploring textures",
  FAMILY_FOODS: "Family foods",
};

export const RECIPE_DISCLAIMER =
  "Recipes are general ideas, not medical advice. Always consult your pediatrician before introducing new foods, especially if your baby has allergies or feeding concerns.";
