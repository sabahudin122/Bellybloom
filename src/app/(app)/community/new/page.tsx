import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CommunityPostForm } from "@/components/community-post-form";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/authorization";

export default async function NewCommunityPostPage() {
  await requireUser();
  return <main className="mx-auto max-w-4xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10"><Link href="/community" className="inline-flex items-center gap-2 text-sm font-black text-[#657187]"><ArrowLeft className="size-4" />Community</Link><h1 className="mt-6 text-4xl font-black tracking-[-.05em]">Start a conversation</h1><Card className="mt-6 p-6 sm:p-8"><CommunityPostForm /></Card></main>;
}
