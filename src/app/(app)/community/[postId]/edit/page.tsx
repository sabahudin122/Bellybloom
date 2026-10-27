import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CommunityPostForm } from "@/components/community-post-form";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/authorization";
import { COMMUNITY_CATEGORIES } from "@/lib/community";
import { prisma } from "@/lib/db";

export default async function EditCommunityPostPage({ params }: { params: Promise<{ postId: string }> }) {
  const user = await requireUser();
  const { postId } = await params;
  const post = await prisma.post.findFirst({ where: { id: postId, authorId: user.id } });
  if (!post || !COMMUNITY_CATEGORIES.includes(post.category as (typeof COMMUNITY_CATEGORIES)[number])) notFound();
  return <main className="mx-auto max-w-4xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10"><Link href={`/community/${post.id}`} className="inline-flex items-center gap-2 text-sm font-black text-[#657187]"><ArrowLeft className="size-4" />Back to post</Link><h1 className="mt-6 text-4xl font-black tracking-[-.05em]">Edit conversation</h1><Card className="mt-6 p-6 sm:p-8"><CommunityPostForm postId={post.id} initialValues={{ title: post.title, body: post.body, category: post.category as (typeof COMMUNITY_CATEGORIES)[number], ageStageTag: post.ageStageTag ?? "" }} /></Card></main>;
}
