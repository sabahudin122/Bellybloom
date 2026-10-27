import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, assertSameOrigin } from "@/lib/api";
import { getOwnedBaby, requireUser } from "@/lib/authorization";
import { DAILY_REGENERATION_LIMIT, SAFETY_RULESET_VERSION } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { createSafeDailyPlan } from "@/lib/meal-planner";
import { enforceRateLimit } from "@/lib/rate-limit";

const requestSchema = z.object({
  babyId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  regenerate: z.boolean().default(false),
});

function planDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    await enforceRateLimit(user.id, "MEAL_PLAN", 8, 10);
    const input = requestSchema.parse(await request.json());
    const baby = await getOwnedBaby(user.id, input.babyId);
    const date = planDate(input.date);
    const existing = await prisma.mealPlan.findUnique({
      where: { babyId_planDate: { babyId: baby.id, planDate: date } },
    });

    if (existing && !input.regenerate) {
      return NextResponse.json({
        plan: { ...existing, meals: JSON.parse(existing.mealsJson), servedSlots: JSON.parse(existing.servedSlotsJson) },
      });
    }

    if (existing && existing.generationCount >= DAILY_REGENERATION_LIMIT) {
      return NextResponse.json(
        { error: "Today's regeneration limit has been reached." },
        { status: 429 },
      );
    }

    let generated;
    try {
      generated = await createSafeDailyPlan(baby, user.id);
    } catch (error) {
      if (error instanceof Error && error.message === "SOLIDS_NOT_AVAILABLE") {
        return NextResponse.json(
          {
            code: "SOLIDS_NOT_AVAILABLE",
            error: "Solid-food meal plans are not available below the approved minimum age.",
          },
          { status: 422 },
        );
      }
      throw error;
    }

    const plan = await prisma.mealPlan.upsert({
      where: { babyId_planDate: { babyId: baby.id, planDate: date } },
      update: {
        mealsJson: JSON.stringify(generated.payload.meals),
        source: generated.source,
        rulesetVersion: SAFETY_RULESET_VERSION,
        generationCount: { increment: 1 },
      },
      create: {
        babyId: baby.id,
        planDate: date,
        mealsJson: JSON.stringify(generated.payload.meals),
        source: generated.source,
        rulesetVersion: SAFETY_RULESET_VERSION,
      },
    });

    return NextResponse.json({ plan: { ...plan, meals: generated.payload.meals, servedSlots: JSON.parse(plan.servedSlotsJson) } });
  } catch (error) {
    return apiError(error);
  }
}
