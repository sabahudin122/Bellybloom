import { NextResponse } from "next/server";
import { apiError, assertSameOrigin } from "@/lib/api";
import { AuthorizationError, requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { commentId } = await params;
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: { select: { id: true, authorId: true } } },
    });
    if (!comment || comment.post.authorId !== user.id) {
      throw new AuthorizationError("Only the post author can choose a best answer.", 403);
    }
    await prisma.$transaction([
      prisma.comment.updateMany({ where: { postId: comment.postId }, data: { isBestAnswer: false } }),
      prisma.comment.update({ where: { id: comment.id }, data: { isBestAnswer: true } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
