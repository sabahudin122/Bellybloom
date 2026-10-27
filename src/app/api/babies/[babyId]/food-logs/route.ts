import { NextResponse } from "next/server";
import { apiError, assertSameOrigin } from "@/lib/api";
import { getOwnedBaby, requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { foodLogSchema } from "@/lib/schemas";
import { parseStringArray } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ babyId: string }> },
) {
  try {
    const user = await requireUser();
    const { babyId } = await params;
    await getOwnedBaby(user.id, babyId);
    const entries = await prisma.foodLog.findMany({
      where: { babyId },
      orderBy: [{ servedAt: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ entries });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ babyId: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { babyId } = await params;
    const baby = await getOwnedBaby(user.id, babyId);
    const input = foodLogSchema.parse(await request.json());
    const introduced = parseStringArray(baby.foodsIntroduced);
    const alreadyIntroduced = introduced.some(
      (food) => food.toLocaleLowerCase() === input.foodName.toLocaleLowerCase(),
    );

    const [entry] = await prisma.$transaction([
      prisma.foodLog.create({
        data: {
          babyId,
          foodName: input.foodName,
          reaction: input.reaction,
          notes: input.notes || null,
          servedAt: input.servedAt,
        },
      }),
      prisma.baby.update({
        where: { id: babyId },
        data: {
          foodsIntroduced: JSON.stringify(
            alreadyIntroduced ? introduced : [...introduced, input.foodName],
          ),
        },
      }),
    ]);
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
