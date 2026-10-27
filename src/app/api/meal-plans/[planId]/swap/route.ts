import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, assertSameOrigin } from "@/lib/api";
import { AuthorizationError, requireUser } from "@/lib/authorization";
import { DAILY_REGENERATION_LIMIT } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { getSafeVettedMeals } from "@/lib/meal-planner";
import { mealSchema } from "@/lib/schemas";

const requestSchema = z.object({ mealIndex: z.number().int().min(0).max(3) });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ planId: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { planId } = await params;
    const { mealIndex } = requestSchema.parse(await request.json());
    const plan = await prisma.mealPlan.findFirst({
      where: { id: planId, baby: { userId: user.id } },
      include: { baby: { include: { allergies: true } } },
    });
    if (!plan) throw new AuthorizationError("Meal plan was not found.", 404);
    if (plan.generationCount >= DAILY_REGENERATION_LIMIT) {
      return NextResponse.json({ error: "Today's swap and regeneration limit has been reached." }, { status: 429 });
    }
    const meals = (JSON.parse(plan.mealsJson) as unknown[]).map((meal) => mealSchema.parse(meal));
    const current = meals[mealIndex];
    if (!current) throw new AuthorizationError("Meal slot was not found.", 404);
    const safeMeals = await getSafeVettedMeals(plan.baby);
    const alternatives = safeMeals.filter((meal) => meal.mealType === current.mealType && meal.title !== current.title);
    if (alternatives.length === 0) {
      return NextResponse.json({ error: "No different vetted recipe matches this profile right now." }, { status: 409 });
    }
    meals[mealIndex] = alternatives[plan.generationCount % alternatives.length];
    const servedSlots = (JSON.parse(plan.servedSlotsJson) as number[]).filter((index) => index !== mealIndex);
    const updated = await prisma.mealPlan.update({
      where: { id: plan.id },
      data: {
        mealsJson: JSON.stringify(meals),
        servedSlotsJson: JSON.stringify(servedSlots),
        source: "VETTED",
        generationCount: { increment: 1 },
      },
    });
    return NextResponse.json({ plan: { ...updated, meals, servedSlots } });
  } catch (error) {
    return apiError(error);
  }
}
