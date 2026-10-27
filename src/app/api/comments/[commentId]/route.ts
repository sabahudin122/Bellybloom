import { NextResponse } from "next/server";
import { z } from "zod";
import { communityContentIssue } from "@/lib/community";
import { apiError, assertSameOrigin } from "@/lib/api";
import { AuthorizationError, requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/db";

const updateSchema = z.object({
  body: z.string().trim().min(2).max(2000).refine((value) => !communityContentIssue(value), {
    message: "Please revise this comment.",
  }),
});

async function ownedComment(userId: string, commentId: string) {
  const comment = await prisma.comment.findFirst({ where: { id: commentId, authorId: userId } });
  if (!comment) throw new AuthorizationError("Comment was not found.", 404);
  return comment;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { commentId } = await params;
    const comment = await ownedComment(user.id, commentId);
    const input = updateSchema.parse(await request.json());
    const updated = await prisma.comment.update({ where: { id: comment.id }, data: { body: input.body } });
    return NextResponse.json({ comment: updated });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { commentId } = await params;
    const comment = await ownedComment(user.id, commentId);
    await prisma.comment.delete({ where: { id: comment.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
