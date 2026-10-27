import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, assertSameOrigin } from "@/lib/api";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/db";

const deleteSchema = z.object({ password: z.string().min(1).max(128) });

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const sessionUser = await requireUser();
    const input = deleteSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
    if (!user || !(await compare(input.password, user.passwordHash))) {
      return NextResponse.json({ error: "Password is incorrect." }, { status: 403 });
    }
    await prisma.$transaction([
      prisma.rateLimitEvent.deleteMany({ where: { userId: user.id } }),
      prisma.recipeRejection.deleteMany({ where: { userId: user.id } }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
