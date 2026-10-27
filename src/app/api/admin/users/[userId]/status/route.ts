import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, assertSameOrigin } from "@/lib/api";
import { AuthorizationError, requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";

const statusSchema = z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]), notes: z.string().trim().max(500).optional().default("") });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin();
    const { userId } = await params;
    if (userId === admin.id) throw new AuthorizationError("You cannot suspend your own account.", 400);
    const input = statusSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new AuthorizationError("User was not found.", 404);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { status: input.status } }),
      prisma.moderationAction.create({
        data: {
          adminId: admin.id,
          targetType: "USER",
          targetId: user.id,
          action: input.status === "SUSPENDED" ? "SUSPEND" : "UNSUSPEND",
          notes: input.notes || null,
        },
      }),
    ]);
    return NextResponse.json({ ok: true, status: input.status });
  } catch (error) {
    return apiError(error);
  }
}
