import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CommunityThread } from "@/components/community-thread";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/authorization";
import { COMMUNITY_CATEGORY_LABELS } from "@/lib/community";
import { prisma } from "@/lib/db";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CommunityPostPage({ params }: { params: Promise<{ postId: string }> }) {
  const user = await requireUser();
  const { postId } = await params;
  const post = await prisma.post.findFirst({
    where: { id: postId, OR: [{ status: "PUBLISHED" }, { authorId: user.id }] },
    include: {
      author: { select: { id: true, name: true } },
      comments: { where: { status: "PUBLISHED" }, include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
      _count: { select: { likes: true } },
    },
  });
  if (!post) notFound();
  const liked = await prisma.postLike.findUnique({ where: { userId_postId: { userId: user.id, postId: post.id } } });
  return <main className="mx-auto max-w-5xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10"><Link href="/community" className="inline-flex items-center gap-2 text-sm font-black text-[#657187]"><ArrowLeft className="size-4" />Community</Link><Card className="mt-6 overflow-hidden"><div className="bg-[#26354c] p-7 text-white sm:p-10"><div className="flex flex-wrap gap-2"><Badge className="bg-[#9ee7c7] text-[#285f4d]">{COMMUNITY_CATEGORY_LABELS[post.category as keyof typeof COMMUNITY_CATEGORY_LABELS] ?? post.category}</Badge>{post.ageStageTag && <Badge className="bg-white/10 text-white">{post.ageStageTag}</Badge>}{post.status !== "PUBLISHED" && <Badge className="bg-[#fff0b6] text-[#66531f]">hidden by moderation</Badge>}</div><h1 className="mt-5 text-3xl font-black tracking-[-.045em] sm:text-5xl">{post.title}</h1><div className="mt-5 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#cdb4ff] font-black text-[#3f3462]">{initials(post.author.name)}</span><div><p className="font-black">{post.author.name.split(" ")[0]}</p><p className="text-xs font-bold text-slate-300">{post.createdAt.toLocaleString()}</p></div></div></div><div className="p-7 sm:p-10"><p className="whitespace-pre-wrap text-lg leading-8 text-[#536176] dark:text-slate-200">{post.body}</p><p className="mt-6 rounded-2xl bg-[#eff8ff] p-4 text-sm leading-6 text-[#48647a] dark:bg-[#a8d8ff]/10 dark:text-slate-300">Community content is peer conversation, not medical advice. Contact your pediatrician about feeding, allergy, or health concerns.</p><div className="mt-7"><CommunityThread postId={post.id} postAuthorId={post.authorId} currentUserId={user.id} initialComments={post.comments.map((comment) => ({ id: comment.id, parentId: comment.parentId, authorId: comment.authorId, body: comment.body, isBestAnswer: comment.isBestAnswer, createdAt: comment.createdAt.toISOString(), author: comment.author }))} initialLiked={Boolean(liked)} initialLikeCount={post._count.likes} /></div></div></Card></main>;
}
