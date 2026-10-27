import { NextResponse } from "next/server";
import { apiError, assertSameOrigin } from "@/lib/api";
import { AuthorizationError, getOwnedBaby, requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { foodLogSchema } from "@/lib/schemas";

async function getOwnedEntry(userId: string, babyId: string, entryId: string) {
  await getOwnedBaby(userId, babyId);
  const entry = await prisma.foodLog.findFirst({ where: { id: entryId, babyId } });
  if (!entry) throw new AuthorizationError("Diary entry was not found.", 404);
  return entry;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ babyId: string; entryId: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { babyId, entryId } = await params;
    const entry = await getOwnedEntry(user.id, babyId, entryId);
    const input = foodLogSchema.parse(await request.json());
    const updated = await prisma.foodLog.update({
      where: { id: entry.id },
      data: {
        foodName: input.foodName,
        reaction: input.reaction,
        notes: input.notes || null,
        servedAt: input.servedAt,
      },
    });
    return NextResponse.json({ entry: updated });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ babyId: string; entryId: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { babyId, entryId } = await params;
    const entry = await getOwnedEntry(user.id, babyId, entryId);
    await prisma.foodLog.delete({ where: { id: entry.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
