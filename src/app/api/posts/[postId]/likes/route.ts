import { NextResponse } from "next/server";
import { apiError, assertSameOrigin } from "@/lib/api";
import { AuthorizationError, requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { postId } = await params;
    const post = await prisma.post.findFirst({ where: { id: postId, status: "PUBLISHED" }, select: { id: true } });
    if (!post) throw new AuthorizationError("Post was not found.", 404);
    const existing = await prisma.postLike.findUnique({
      where: { userId_postId: { userId: user.id, postId } },
    });
    if (existing) {
      await prisma.postLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.postLike.create({ data: { userId: user.id, postId } });
    }
    const count = await prisma.postLike.count({ where: { postId } });
    return NextResponse.json({ liked: !existing, count });
  } catch (error) {
    return apiError(error);
  }
}
