import { NextResponse } from "next/server";
import { apiError, assertSameOrigin } from "@/lib/api";
import { getOwnedBaby, requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { babySchema } from "@/lib/schemas";

type Context = { params: Promise<{ babyId: string }> };

export async function GET(_: Request, context: Context) {
  try {
    const user = await requireUser();
    const { babyId } = await context.params;
    return NextResponse.json({ baby: await getOwnedBaby(user.id, babyId) });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { babyId } = await context.params;
    await getOwnedBaby(user.id, babyId);
    const input = babySchema.parse(await request.json());

    const baby = await prisma.$transaction(async (tx) => {
      await tx.babyAllergy.deleteMany({ where: { babyId } });
      return tx.baby.update({
        where: { id: babyId },
        data: {
          name: input.name,
          dateOfBirth: input.dateOfBirth,
          allergyStatus: input.allergyStatus,
          otherAllergies: input.otherAllergies || null,
          feedingStageOverride: input.feedingStageOverride || null,
          foodsIntroduced: JSON.stringify(input.foodsIntroduced),
          foodsDisliked: JSON.stringify(input.foodsDisliked),
          allergies: { create: input.allergies.map((allergen) => ({ allergen })) },
        },
        include: { allergies: true },
      });
    });

    return NextResponse.json({ baby });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { babyId } = await context.params;
    await getOwnedBaby(user.id, babyId);
    await prisma.baby.delete({ where: { id: babyId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
