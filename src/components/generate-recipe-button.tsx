"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type Fallback = { id: string; slug: string; title: string; minAgeMonths: number };

export function GenerateRecipeButton({ query, babyId }: { query: string; babyId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fallbacks, setFallbacks] = useState<Fallback[]>([]);

  async function generate() {
    setPending(true);
    setError("");
    setFallbacks([]);
    const response = await fetch("/api/recipes/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, babyId }),
    });
    const result = await response.json();
    if (response.ok) {
      router.push(`/recipes/${result.recipe.slug}?baby=${babyId}`);
      return;
    }
    setError(result.error ?? "A recipe could not be created safely.");
    setFallbacks(result.fallbacks ?? []);
    setPending(false);
  }

  return (
    <div className="rounded-[2rem] bg-[#26354c] p-6 text-white sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="flex items-center gap-2 text-sm font-black text-[#9ee7c7]"><ShieldCheck className="size-4" />Deterministic safety gate</p><h2 className="mt-2 text-2xl font-black">No close vetted match found</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Bellybloom can request one private recipe idea. It is shown only after its ingredients and instructions pass the active age, allergen, and choking rules.</p></div>
        <Button type="button" variant="peach" onClick={generate} disabled={pending}><Sparkles className="size-4" />{pending ? "Checking recipe..." : `Create idea for “${query}”`}</Button>
      </div>
      {error && <div className="mt-5 rounded-2xl bg-white/10 p-4"><p className="font-bold text-[#ffe8df]" role="alert">{error}</p>{fallbacks.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{fallbacks.map((recipe) => <Link key={recipe.id} href={`/recipes/${recipe.slug}`} className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#26354c]">{recipe.title} · {recipe.minAgeMonths}+ months</Link>)}</div>}</div>}
    </div>
  );
}
