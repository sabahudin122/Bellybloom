"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COMMUNITY_CATEGORIES, COMMUNITY_CATEGORY_LABELS } from "@/lib/community";

const schema = z.object({
  title: z.string().trim().min(5, "Use at least 5 characters.").max(120),
  body: z.string().trim().min(20, "Add a little more detail.").max(5000),
  category: z.enum(COMMUNITY_CATEGORIES),
  ageStageTag: z.string().trim().max(80),
});

type Values = z.infer<typeof schema>;

export function CommunityPostForm({ postId, initialValues }: { postId?: string; initialValues?: Values }) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: initialValues ?? { title: "", body: "", category: "GENERAL_CHAT", ageStageTag: "" },
  });

  async function submit(values: Values) {
    const response = await fetch(postId ? `/api/posts/${postId}` : "/api/posts", {
      method: postId ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = await response.json();
    if (!response.ok) {
      setError("root", { message: result.error ?? "Could not save this post." });
      return;
    }
    router.push(`/community/${result.post.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <div><Label htmlFor="title">Title</Label><Input id="title" placeholder="What would you like to ask or share?" {...register("title")} />{errors.title && <p className="mt-1 text-xs font-bold text-red-700">{errors.title.message}</p>}</div>
      <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="category">Category</Label><select id="category" className="min-h-12 w-full rounded-2xl border border-[#26354c]/15 bg-white px-4 font-bold text-[#26354c] dark:border-white/15 dark:bg-[#18243a] dark:text-white" {...register("category")}>{COMMUNITY_CATEGORIES.map((category) => <option key={category} value={category}>{COMMUNITY_CATEGORY_LABELS[category]}</option>)}</select></div><div><Label htmlFor="ageStageTag">Age-stage tag (optional)</Label><Input id="ageStageTag" placeholder="e.g. 8–10 months" {...register("ageStageTag")} /></div></div>
      <div><Label htmlFor="body">Post</Label><Textarea id="body" className="min-h-52" placeholder="Share context without posting private medical or identifying information." {...register("body")} />{errors.body && <p className="mt-1 text-xs font-bold text-red-700">{errors.body.message}</p>}</div>
      <p className="rounded-2xl bg-[#eff8ff] p-4 text-sm leading-6 text-[#48647a] dark:bg-[#a8d8ff]/10 dark:text-slate-300">Community posts are peer conversation, not medical advice. Avoid sharing identifying health information and contact your pediatrician about feeding, allergy, or health concerns.</p>
      {errors.root && <p className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700" role="alert">{errors.root.message}</p>}
      <Button type="submit" variant="peach" disabled={isSubmitting}>{isSubmitting ? "Saving..." : postId ? "Save changes" : "Publish post"}</Button>
    </form>
  );
}
