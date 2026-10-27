import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, assertSameOrigin } from "@/lib/api";
import { AuthorizationError, requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { mealSchema } from "@/lib/schemas";
import { parseStringArray } from "@/lib/utils";

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
      include: { baby: true },
    });
    if (!plan) throw new AuthorizationError("Meal plan was not found.", 404);
    const meals = JSON.parse(plan.mealsJson) as unknown[];
    const meal = mealSchema.parse(meals[mealIndex]);
    const servedSlots = JSON.parse(plan.servedSlotsJson) as number[];
    if (servedSlots.includes(mealIndex)) return NextResponse.json({ servedSlots });
    const foods = parseStringArray(plan.baby.foodsIntroduced);
    const additions = meal.ingredients.map((item) => item.name).filter((name) => !foods.some((food) => food.toLocaleLowerCase() === name.toLocaleLowerCase()));
    const updatedSlots = [...servedSlots, mealIndex].sort();
    await prisma.$transaction([
      prisma.foodLog.create({
        data: {
          babyId: plan.babyId,
          foodName: meal.title,
          reaction: "NONE",
          notes: "Marked as served from a Bellybloom meal plan.",
          servedAt: plan.planDate,
        },
      }),
      prisma.baby.update({ where: { id: plan.babyId }, data: { foodsIntroduced: JSON.stringify([...foods, ...additions]) } }),
      prisma.mealPlan.update({ where: { id: plan.id }, data: { servedSlotsJson: JSON.stringify(updatedSlots) } }),
    ]);
    return NextResponse.json({ servedSlots: updatedSlots });
  } catch (error) {
    return apiError(error);
  }
}
