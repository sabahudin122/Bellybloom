import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, assertSameOrigin } from "@/lib/api";
import { getOwnedBaby, requireUser } from "@/lib/authorization";
import { SAFETY_RULESET_VERSION } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { createVettedWeeklyPlans } from "@/lib/meal-planner";
import { enforceRateLimit } from "@/lib/rate-limit";

const requestSchema = z.object({
  babyId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    await enforceRateLimit(user.id, "WEEKLY_PLAN", 3, 60);
    const input = requestSchema.parse(await request.json());
    const baby = await getOwnedBaby(user.id, input.babyId);
    const start = new Date(`${input.startDate}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    const existing = await prisma.mealPlan.findMany({
      where: { babyId: baby.id, planDate: { gte: start, lte: end } },
    });
    const existingByDate = new Map(existing.map((plan) => [plan.planDate.toISOString().slice(0, 10), plan]));
    const weeklyPayloads = await createVettedWeeklyPlans(baby);
    const plans = [];

    for (let index = 0; index < 7; index += 1) {
      const planDate = new Date(start);
      planDate.setUTCDate(planDate.getUTCDate() + index);
      const dateKey = planDate.toISOString().slice(0, 10);
      const saved = existingByDate.get(dateKey) ?? await prisma.mealPlan.create({
        data: {
          babyId: baby.id,
          planDate,
          mealsJson: JSON.stringify(weeklyPayloads[index].meals),
          source: "VETTED_WEEKLY",
          rulesetVersion: SAFETY_RULESET_VERSION,
        },
      });
      plans.push({
        ...saved,
        meals: JSON.parse(saved.mealsJson),
        servedSlots: JSON.parse(saved.servedSlotsJson),
      });
    }
    return NextResponse.json({ plans });
  } catch (error) {
    if (error instanceof Error && error.message === "SOLIDS_NOT_AVAILABLE") {
      return NextResponse.json({ error: "Weekly solid-food plans are unavailable below the approved minimum age." }, { status: 422 });
    }
    return apiError(error);
  }
}
