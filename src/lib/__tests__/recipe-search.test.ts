import { describe, expect, it } from "vitest";
import { buildRecipeSearchTerms, recipeMatchesQuery } from "@/lib/recipe-search";

const recipe = {
  title: "Carrot and lentil soup",
  description: "A softly blended lunch.",
  ingredientsJson: JSON.stringify([{ name: "carrot", amount: "1 small" }]),
};

describe("recipe search", () => {
  it("expands supported Bosnian/Croatian/Serbian terms", () => {
    expect(buildRecipeSearchTerms("supa od mrkve")).toEqual(
      expect.arrayContaining(["supa", "soup", "mrkve"]),
    );
  });

  it("matches translated recipe terms", () => {
    expect(recipeMatchesQuery(recipe, "supa")).toBe(true);
  });

  it("rejects unrelated recipes", () => {
    expect(recipeMatchesQuery(recipe, "salmon")).toBe(false);
  });
});
