import { NextResponse } from "next/server";
import { apiError, assertSameOrigin } from "@/lib/api";
import { AuthorizationError, requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { postSchema } from "@/lib/schemas";

async function ownedPost(userId: string, postId: string) {
  const post = await prisma.post.findFirst({ where: { id: postId, authorId: userId } });
  if (!post) throw new AuthorizationError("Post was not found.", 404);
  return post;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { postId } = await params;
    const post = await ownedPost(user.id, postId);
    const input = postSchema.parse(await request.json());
    const updated = await prisma.post.update({
      where: { id: post.id },
      data: {
        title: input.title,
        body: input.body,
        category: input.category,
        ageStageTag: input.ageStageTag || null,
      },
    });
    return NextResponse.json({ post: updated });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { postId } = await params;
    const post = await ownedPost(user.id, postId);
    await prisma.post.delete({ where: { id: post.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
