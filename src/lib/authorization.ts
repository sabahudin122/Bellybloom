import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export class AuthorizationError extends Error {
  status: number;

  constructor(message = "You are not allowed to access this resource.", status = 403) {
    super(message);
    this.name = "AuthorizationError";
    this.status = status;
  }
}

export function assertOwnership(authenticatedUserId: string, ownerUserId: string) {
  if (authenticatedUserId !== ownerUserId) {
    throw new AuthorizationError();
  }
}

export function assertRole(role: string, requiredRole: "USER" | "ADMIN") {
  if (requiredRole === "ADMIN" && role !== "ADMIN") {
    throw new AuthorizationError("Administrator access is required.");
  }
}

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthorizationError("Please sign in to continue.", 401);
  }
  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, status: true },
  });
  if (!account) throw new AuthorizationError("Please sign in to continue.", 401);
  if (account.status !== "ACTIVE") {
    throw new AuthorizationError("This account is suspended.", 403);
  }
  return account;
}

export async function requireAdmin() {
  const user = await requireUser();
  assertRole(user.role, "ADMIN");
  return user;
}

export async function getOwnedBaby(userId: string, babyId: string) {
  const baby = await prisma.baby.findFirst({
    where: { id: babyId, userId },
    include: { allergies: true },
  });

  if (!baby) {
    throw new AuthorizationError("Baby profile was not found.", 404);
  }

  return baby;
}
