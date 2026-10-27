import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, assertSameOrigin } from "@/lib/api";
import { AuthorizationError, requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";

const moderationSchema = z.object({
  targetType: z.enum(["POST", "COMMENT", "REPORT"]),
  targetId: z.string().min(1),
  action: z.enum(["HIDE", "RESTORE", "DELETE", "RESOLVE", "DISMISS"]),
  notes: z.string().trim().max(500).optional().default(""),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin();
    const input = moderationSchema.parse(await request.json());

    if (input.targetType === "POST") {
      const post = await prisma.post.findUnique({ where: { id: input.targetId }, select: { id: true } });
      if (!post) throw new AuthorizationError("Post was not found.", 404);
      if (input.action === "DELETE") {
        await prisma.post.delete({ where: { id: post.id } });
      } else if (input.action === "HIDE" || input.action === "RESTORE") {
        await prisma.post.update({
          where: { id: post.id },
          data: { status: input.action === "HIDE" ? "HIDDEN" : "PUBLISHED" },
        });
      } else {
        throw new AuthorizationError("This action is not valid for a post.", 400);
      }
    } else if (input.targetType === "COMMENT") {
      const comment = await prisma.comment.findUnique({ where: { id: input.targetId }, select: { id: true } });
      if (!comment) throw new AuthorizationError("Comment was not found.", 404);
      if (input.action === "DELETE") {
        await prisma.comment.delete({ where: { id: comment.id } });
      } else if (input.action === "HIDE" || input.action === "RESTORE") {
        await prisma.comment.update({
          where: { id: comment.id },
          data: { status: input.action === "HIDE" ? "HIDDEN" : "PUBLISHED" },
        });
      } else {
        throw new AuthorizationError("This action is not valid for a comment.", 400);
      }
    } else {
      if (input.action !== "RESOLVE" && input.action !== "DISMISS") {
        throw new AuthorizationError("This action is not valid for a report.", 400);
      }
      const report = await prisma.report.findUnique({ where: { id: input.targetId }, select: { id: true } });
      if (!report) throw new AuthorizationError("Report was not found.", 404);
      await prisma.report.update({
        where: { id: report.id },
        data: {
          status: input.action === "RESOLVE" ? "RESOLVED" : "DISMISSED",
          reviewerId: admin.id,
          resolution: input.notes || input.action.toLowerCase(),
          reviewedAt: new Date(),
        },
      });
    }

    await prisma.moderationAction.create({
      data: {
        adminId: admin.id,
        targetType: input.targetType,
        targetId: input.targetId,
        action: input.action,
        notes: input.notes || null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
