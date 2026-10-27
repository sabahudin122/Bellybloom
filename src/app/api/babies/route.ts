import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authorization";
import { apiError, assertSameOrigin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { babySchema } from "@/lib/schemas";

export async function GET() {
  try {
    const user = await requireUser();
    const babies = await prisma.baby.findMany({
      where: { userId: user.id },
      include: { allergies: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ babies });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const input = babySchema.parse(await request.json());
    const baby = await prisma.baby.create({
      data: {
        userId: user.id,
        name: input.name,
        dateOfBirth: input.dateOfBirth,
        allergyStatus: input.allergyStatus,
        otherAllergies: input.otherAllergies || null,
        feedingStageOverride: input.feedingStageOverride || null,
        foodsIntroduced: JSON.stringify(input.foodsIntroduced),
        foodsDisliked: JSON.stringify(input.foodsDisliked),
        allergies: {
          create: input.allergies.map((allergen) => ({ allergen })),
        },
      },
      include: { allergies: true },
    });
    return NextResponse.json({ baby }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
