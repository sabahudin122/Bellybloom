import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const account = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, role: true, status: true } });
  if (!account || account.status !== "ACTIVE") redirect("/login?error=account-unavailable");
  return <AppShell name={account.name} role={account.role}>{children}</AppShell>;
}
