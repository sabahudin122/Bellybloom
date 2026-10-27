import { NextResponse } from "next/server";
import { z } from "zod";
import { validateStageSequence } from "@/lib/age";
import { apiError, assertSameOrigin } from "@/lib/api";
import { AuthorizationError, requireAdmin } from "@/lib/authorization";
import { MIN_SOLIDS_AGE_MONTHS } from "@/lib/constants";
import { prisma } from "@/lib/db";

const stageSchema = z.object({
  title: z.string().trim().min(2).max(100),
  minAgeMonthsInclusive: z.number().int().min(0).max(240),
  maxAgeMonthsExclusive: z.number().int().min(1).max(241).nullable(),
  summary: z.string().trim().min(10).max(1200),
  foods: z.string().trim().min(2).max(2000),
  avoid: z.string().trim().min(2).max(2000),
  textures: z.string().trim().min(2).max(1200),
  mealsPerDay: z.string().trim().min(2).max(1200),
  warnings: z.string().trim().min(2).max(2000),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ stageId: string }> },
) {
  try {
    assertSameOrigin(request);
    await requireAdmin();
    const { stageId } = await params;
    const input = stageSchema.parse(await request.json());
    const stages = await prisma.ageStage.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
    const current = stages.find((stage) => stage.id === stageId);
    if (!current) throw new AuthorizationError("Age stage was not found.", 404);
    const candidates = stages.map((stage) => stage.id === stageId ? { minAgeMonthsInclusive: input.minAgeMonthsInclusive, maxAgeMonthsExclusive: input.maxAgeMonthsExclusive } : stage);
    const boundaryCheck = validateStageSequence(candidates);
    if (!boundaryCheck.valid) throw new AuthorizationError(boundaryCheck.error ?? "Invalid age boundaries.", 400);
    const firstStage = [...candidates].sort((first, second) => first.minAgeMonthsInclusive - second.minAgeMonthsInclusive)[0];
    if (firstStage.maxAgeMonthsExclusive !== MIN_SOLIDS_AGE_MONTHS) {
      throw new AuthorizationError(`The approved solid-food minimum must remain ${MIN_SOLIDS_AGE_MONTHS} completed months.`, 400);
    }
    const source = await prisma.safetySource.findFirst({ where: { id: current.sourceId, status: "ACTIVE" }, select: { id: true } });
    if (!source) throw new AuthorizationError("The stage's reviewed source is not active.", 409);
    const stage = await prisma.ageStage.update({ where: { id: current.id }, data: input });
    return NextResponse.json({ stage });
  } catch (error) {
    return apiError(error);
  }
}
