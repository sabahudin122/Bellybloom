import { ModerationPanel } from "@/components/moderation-panel";
import { AdminAnalytics } from "@/components/admin-analytics";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireAdmin();
  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [reports, users, recentActions, totalUsers, activeToday, active7Days, active30Days, babies, mealPlans, posts, recentUsers] = await Promise.all([
    prisma.report.findMany({
      where: { status: "OPEN" },
      include: {
        reporter: { select: { name: true } },
        post: { include: { author: { select: { id: true, name: true } } } },
        comment: { include: { author: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({ select: { id: true, name: true, email: true, status: true, role: true }, orderBy: { createdAt: "desc" }, take: 40 }),
    prisma.moderationAction.count(),
    prisma.user.count(),
    prisma.user.count({ where: { lastActiveAt: { gte: today } } }),
    prisma.user.count({ where: { lastActiveAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { lastActiveAt: { gte: thirtyDaysAgo } } }),
    prisma.baby.count(),
    prisma.mealPlan.count(),
    prisma.post.count(),
    prisma.user.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { createdAt: true } }),
  ]);
  const registrationCounts = new Map<string, number>();
  for (const user of recentUsers) {
    const key = user.createdAt.toISOString().slice(0, 10);
    registrationCounts.set(key, (registrationCounts.get(key) ?? 0) + 1);
  }
  const registrations = Array.from({ length: 30 }, (_, offset) => {
    const date = new Date(today); date.setDate(date.getDate() - (29 - offset));
    const key = date.toISOString().slice(0, 10);
    return { date: key.slice(5), users: registrationCounts.get(key) ?? 0 };
  });
  const serializedReports = reports.map((report) => ({
    id: report.id,
    reason: report.reason,
    details: report.details,
    createdAt: report.createdAt.toISOString(),
    reporter: report.reporter,
    post: report.post ? { id: report.post.id, title: report.post.title, body: report.post.body, status: report.post.status, author: report.post.author } : null,
    comment: report.comment ? { id: report.comment.id, body: report.comment.body, status: report.comment.status, author: report.comment.author } : null,
  }));
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-black uppercase tracking-[.16em] text-[#dd6d4b]">Administrator · {admin.name}</p><h1 className="mt-1 text-4xl font-black tracking-[-.05em]">Admin dashboard</h1><p className="mt-3 text-[#748095] dark:text-slate-300">Usage analytics and community moderation in one reviewable workspace.</p></div><Link href="/admin/content" className="inline-flex min-h-11 items-center rounded-full bg-[#26354c] px-6 text-sm font-black text-white">Manage guidance & recipes</Link></div><div className="mt-8"><AdminAnalytics stats={{ totalUsers, activeToday, active7Days, active30Days, babies, mealPlans, posts }} registrations={registrations} /></div><div className="mt-12"><p className="mb-6 text-xs font-bold text-[#8993a4]">{recentActions} moderation actions in the audit trail.</p><ModerationPanel initialReports={serializedReports} initialUsers={users} /></div></main>;
}
