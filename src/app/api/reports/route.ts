import { NextResponse } from "next/server";
import { apiError, assertSameOrigin } from "@/lib/api";
import { AuthorizationError, requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { reportSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    await enforceRateLimit(user.id, "REPORT_CONTENT", 5, 60);
    const input = reportSchema.parse(await request.json());
    if (input.postId) {
      const post = await prisma.post.findUnique({ where: { id: input.postId }, select: { id: true, authorId: true } });
      if (!post) throw new AuthorizationError("Post was not found.", 404);
      if (post.authorId === user.id) throw new AuthorizationError("You cannot report your own post.", 400);
    }
    if (input.commentId) {
      const comment = await prisma.comment.findUnique({ where: { id: input.commentId }, select: { id: true, authorId: true } });
      if (!comment) throw new AuthorizationError("Comment was not found.", 404);
      if (comment.authorId === user.id) throw new AuthorizationError("You cannot report your own comment.", 400);
    }
    const existing = await prisma.report.findFirst({
      where: { reporterId: user.id, postId: input.postId ?? null, commentId: input.commentId ?? null, status: "OPEN" },
    });
    if (existing) return NextResponse.json({ report: existing });
    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        postId: input.postId ?? null,
        commentId: input.commentId ?? null,
        reason: input.reason,
        details: input.details || null,
      },
    });
    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
