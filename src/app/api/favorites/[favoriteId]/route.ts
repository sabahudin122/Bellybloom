import { NextResponse } from "next/server";
import { apiError, assertSameOrigin } from "@/lib/api";
import { AuthorizationError, requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ favoriteId: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { favoriteId } = await params;
    const favorite = await prisma.favorite.findFirst({
      where: { id: favoriteId, userId: user.id },
      select: { id: true },
    });
    if (!favorite) throw new AuthorizationError("Favorite was not found.", 404);
    await prisma.favorite.delete({ where: { id: favorite.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
