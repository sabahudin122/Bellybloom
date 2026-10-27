import { describe, expect, it } from "vitest";
import { validateRecipeSafety } from "@/lib/safety";
import type { Meal } from "@/lib/schemas";

const safeMeal: Meal = {
  mealType: "BREAKFAST",
  title: "Pear and oat bowl",
  description: "A soft breakfast",
  ingredients: [
    { name: "pear", amount: "1/2" },
    { name: "certified gluten-free oats", amount: "2 tbsp" },
  ],
  instructions: ["Cook until very soft.", "Mash to the baby's current texture."],
  prepMinutes: 10,
  texture: "soft mashed",
  allergenTags: [],
  whyGood: "Offers fruit and grains.",
};

const rules = [
  {
    code: "NO_HONEY_UNDER_12",
    title: "No honey before 12 months",
    termsJson: JSON.stringify(["honey"]),
    minAgeMonthsInclusive: 0,
    maxAgeMonthsExclusive: 12,
    active: true,
  },
  {
    code: "NO_WHOLE_NUTS_UNDER_60",
    title: "Whole nuts are a choking hazard",
    termsJson: JSON.stringify(["whole nuts", "whole peanut"]),
    minAgeMonthsInclusive: 0,
    maxAgeMonthsExclusive: 60,
    active: true,
  },
];

describe("deterministic recipe safety", () => {
  it("filters a known allergen from structured ingredients", () => {
    const meal = {
      ...safeMeal,
      ingredients: [...safeMeal.ingredients, { name: "whole milk yogurt", amount: "2 tbsp" }],
      allergenTags: ["MILK"] as Meal["allergenTags"],
    };
    const result = validateRecipeSafety(meal, {
      completedMonths: 9,
      allergyStatus: "YES",
      knownAllergens: ["MILK"],
    }, rules);
    expect(result.safe).toBe(false);
    expect(result.reasons.join(" ")).toContain("MILK");
  });

  it("treats not-sure allergy status conservatively", () => {
    const meal = {
      ...safeMeal,
      ingredients: [...safeMeal.ingredients, { name: "egg", amount: "1" }],
      allergenTags: ["EGG"] as Meal["allergenTags"],
    };
    expect(validateRecipeSafety(meal, {
      completedMonths: 9,
      allergyStatus: "NOT_SURE",
      knownAllergens: [],
    }, rules).safe).toBe(false);
  });

  it("rejects an unsafe age-forbidden recipe", () => {
    const meal = {
      ...safeMeal,
      ingredients: [...safeMeal.ingredients, { name: "honey", amount: "1 tsp" }],
    };
    const result = validateRecipeSafety(meal, {
      completedMonths: 8,
      allergyStatus: "NO",
      knownAllergens: [],
    }, rules);
    expect(result.safe).toBe(false);
    expect(result.reasons).toContain("NO_HONEY_UNDER_12: No honey before 12 months");
  });

  it("does not produce solid-food approval below six months", () => {
    const result = validateRecipeSafety(safeMeal, {
      completedMonths: 5,
      allergyStatus: "NO",
      knownAllergens: [],
    }, rules);
    expect(result.safe).toBe(false);
  });
});
