import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { COMMUNITY_CATEGORIES, COMMUNITY_CATEGORY_LABELS } from "@/lib/community";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = { q?: string; category?: string; sort?: string; page?: string };

export default async function CommunityPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireUser();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const query = params.q?.trim() ?? "";
  const category = COMMUNITY_CATEGORIES.find((item) => item === params.category);
  const where = {
    status: "PUBLISHED",
    ...(category ? { category } : {}),
    ...(query ? { OR: [{ title: { contains: query } }, { body: { contains: query } }] } : {}),
  };
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: { author: { select: { id: true, name: true } }, _count: { select: { comments: true, likes: true } } },
      orderBy: params.sort === "helpful" ? { likes: { _count: "desc" } } : { createdAt: "desc" },
      skip: (page - 1) * 10,
      take: 10,
    }),
    prisma.post.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / 10));

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-black uppercase tracking-[.16em] text-[#dd6d4b]">Parent-to-parent space</p><h1 className="mt-1 text-4xl font-black tracking-[-.05em]">Bellybloom Community</h1><p className="mt-3 max-w-2xl text-[#748095] dark:text-slate-300">Ask, share, and offer a little support. Community posts are not medical advice.</p></div><Link href="/community/new" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#ff936b] px-6 text-sm font-black text-[#26354c]"><Plus className="size-4" />New post</Link></div>
      <form className="mt-8 grid gap-3 rounded-3xl bg-white p-4 dark:bg-white/5 md:grid-cols-[2fr_1fr_1fr_auto]"><label className="relative"><span className="sr-only">Search posts</span><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#8993a5]" /><input name="q" defaultValue={query} placeholder="Search conversations" className="min-h-12 w-full rounded-2xl border border-[#26354c]/15 bg-white pl-11 pr-4 font-bold text-[#26354c] dark:border-white/15 dark:bg-[#18243a] dark:text-white" /></label><select name="category" defaultValue={category ?? ""} className="min-h-12 rounded-2xl border border-[#26354c]/15 bg-white px-4 font-bold text-[#26354c] dark:border-white/15 dark:bg-[#18243a] dark:text-white"><option value="">All categories</option>{COMMUNITY_CATEGORIES.map((item) => <option key={item} value={item}>{COMMUNITY_CATEGORY_LABELS[item]}</option>)}</select><select name="sort" defaultValue={params.sort ?? "newest"} className="min-h-12 rounded-2xl border border-[#26354c]/15 bg-white px-4 font-bold text-[#26354c] dark:border-white/15 dark:bg-[#18243a] dark:text-white"><option value="newest">Newest</option><option value="helpful">Most hugged</option></select><button className="min-h-12 rounded-full bg-[#26354c] px-6 text-sm font-black text-white">Filter</button></form>
      <div className="mt-7 space-y-4">{posts.map((post) => <Link key={post.id} href={`/community/${post.id}`} className="block"><Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_45px_rgba(38,53,76,.12)] sm:p-6"><div className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#cdb4ff] text-sm font-black text-[#3f3462]">{initials(post.author.name)}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge>{COMMUNITY_CATEGORY_LABELS[post.category as keyof typeof COMMUNITY_CATEGORY_LABELS] ?? post.category}</Badge>{post.ageStageTag && <Badge className="bg-[#dceeff] text-[#34566e]">{post.ageStageTag}</Badge>}</div><h2 className="mt-3 text-xl font-black leading-7">{post.title}</h2><p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-[#68758a] dark:text-slate-300">{post.body}</p><div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-bold text-[#8993a4]"><span>{post.author.name.split(" ")[0]} · {formatDistanceToNow(post.createdAt, { addSuffix: true })}</span><span className="flex items-center gap-1"><MessageCircle className="size-3.5" />{post._count.comments}</span><span className="flex items-center gap-1"><Heart className="size-3.5" />{post._count.likes}</span></div></div></div></Card></Link>)}{posts.length === 0 && <Card className="p-10 text-center"><MessageCircle className="mx-auto size-10 text-[#d86543]" /><h2 className="mt-4 text-2xl font-black">No conversations found</h2><p className="mt-2 text-[#748095]">Try another filter or start a new post.</p></Card>}</div>
      {pages > 1 && <nav className="mt-7 flex items-center justify-center gap-2" aria-label="Community pages">{Array.from({ length: pages }, (_, index) => index + 1).map((pageNumber) => <Link key={pageNumber} href={`/community?page=${pageNumber}${query ? `&q=${encodeURIComponent(query)}` : ""}${category ? `&category=${category}` : ""}`} className={`grid size-11 place-items-center rounded-full text-sm font-black ${pageNumber === page ? "bg-[#26354c] text-white" : "bg-white text-[#526079] dark:bg-white/5 dark:text-white"}`}>{pageNumber}</Link>)}</nav>}
    </main>
  );
}
