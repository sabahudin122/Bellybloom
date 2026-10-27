import { NextResponse } from "next/server";
import { apiError, assertSameOrigin } from "@/lib/api";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { postSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const posts = await prisma.post.findMany({
      where: { status: "PUBLISHED" },
      include: { author: { select: { id: true, name: true } }, _count: { select: { comments: true, likes: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 12,
      take: 12,
    });
    return NextResponse.json({ posts, page });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    await enforceRateLimit(user.id, "CREATE_POST", 5, 10);
    const input = postSchema.parse(await request.json());
    const post = await prisma.post.create({
      data: {
        authorId: user.id,
        title: input.title,
        body: input.body,
        category: input.category,
        ageStageTag: input.ageStageTag || null,
      },
    });
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
