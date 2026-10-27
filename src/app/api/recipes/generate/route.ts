import { NextResponse } from "next/server";
import { apiError, assertSameOrigin } from "@/lib/api";
import { getOwnedBaby, requireUser } from "@/lib/authorization";
import { enforceRateLimit } from "@/lib/rate-limit";
import { generateSafeSearchRecipe } from "@/lib/recipe-search";
import { recipeSearchSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    await enforceRateLimit(user.id, "RECIPE_SEARCH", 6, 10);
    const input = recipeSearchSchema.parse(await request.json());
    const baby = await getOwnedBaby(user.id, input.babyId);
    const result = await generateSafeSearchRecipe(input.query, baby, user.id);

    if (result.status === "CREATED") {
      return NextResponse.json({ recipe: result.recipe }, { status: 201 });
    }

    const messages = {
      NOT_CONFIGURED: "AI recipe creation is not configured. Choose a vetted recipe instead.",
      REJECTED: "The generated recipe did not pass Bellybloom's safety rules and was not displayed.",
      FAILED: "A recipe could not be created safely. Choose a vetted recipe instead.",
    } as const;
    return NextResponse.json(
      { code: result.status, error: messages[result.status], fallbacks: result.fallbacks },
      { status: result.status === "REJECTED" ? 422 : 503 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "SOLIDS_NOT_AVAILABLE") {
      return NextResponse.json(
        {
          code: "SOLIDS_NOT_AVAILABLE",
          error: "Solid-food recipes are unavailable below the approved minimum age.",
        },
        { status: 422 },
      );
    }
    return apiError(error);
  }
}
