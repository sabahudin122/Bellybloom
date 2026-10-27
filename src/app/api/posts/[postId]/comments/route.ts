import { NextResponse } from "next/server";
import { apiError, assertSameOrigin } from "@/lib/api";
import { AuthorizationError, requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { commentSchema } from "@/lib/schemas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    await enforceRateLimit(user.id, "CREATE_COMMENT", 12, 10);
    const { postId } = await params;
    const input = commentSchema.parse(await request.json());
    const post = await prisma.post.findFirst({ where: { id: postId, status: "PUBLISHED" }, select: { id: true } });
    if (!post) throw new AuthorizationError("Post was not found.", 404);
    if (input.parentId) {
      const parent = await prisma.comment.findFirst({
        where: { id: input.parentId, postId, status: "PUBLISHED" },
        select: { id: true },
      });
      if (!parent) throw new AuthorizationError("Reply target was not found.", 404);
    }
    const comment = await prisma.comment.create({
      data: { postId, authorId: user.id, parentId: input.parentId ?? null, body: input.body },
      include: { author: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
