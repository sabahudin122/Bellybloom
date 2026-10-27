import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authorization";
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const sessionUser = await requireUser();
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        favorites: {
          include: { recipe: true },
        },
        generatedRecipes: true,
        posts: true,
        comments: true,
        postLikes: true,
        reportsFiled: true,
        babies: {
          include: {
            allergies: true,
            foodLogs: true,
            mealPlans: true,
            recipeRejections: true,
          },
        },
      },
    });
    return new NextResponse(JSON.stringify({ exportedAt: new Date(), user }, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="bellybloom-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
