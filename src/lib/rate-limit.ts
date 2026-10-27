import { prisma } from "@/lib/db";
import { AuthorizationError } from "@/lib/authorization";

export async function enforceRateLimit(
  userId: string,
  action: string,
  limit: number,
  windowMinutes: number,
) {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);
  const count = await prisma.rateLimitEvent.count({
    where: { userId, action, createdAt: { gte: since } },
  });

  if (count >= limit) {
    throw new AuthorizationError("Please wait before trying that again.", 429);
  }

  await prisma.rateLimitEvent.create({ data: { userId, action } });
}
