"use client";

import { useState } from "react";
import { Check, Clock3, RefreshCw, Repeat2, ShieldCheck, Sparkles, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RecipeDisclaimer } from "@/components/recipe-disclaimer";
import type { Meal } from "@/lib/schemas";
import { MealFavoriteButton } from "@/components/meal-favorite-button";

type Plan = {
  id: string;
  source: string;
  generationCount: number;
  rulesetVersion: string;
  meals: Meal[];
  servedSlots: number[];
};

const mealColors: Record<string, string> = {
  BREAKFAST: "bg-[#fff0b6]",
  LUNCH: "bg-[#cff4e4]",
  DINNER: "bg-[#dceeff]",
  SNACK: "bg-[#eee4ff]",
};

export function MealPlannerCard({ babyId, initialPlan }: { babyId: string; initialPlan: Plan | null }) {
  const [plan, setPlan] = useState(initialPlan);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState("");

  async function generate(regenerate = false) {
    setPending(true);
    setError("");
    const localDate = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const response = await fetch("/api/meal-plans/today", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ babyId, date: localDate, regenerate }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "Could not create today's menu.");
      setPending(false);
      return;
    }
    setPlan(result.plan);
    setPending(false);
  }

  async function markServed(mealIndex: number) {
    if (!plan) return;
    setPendingAction(`serve-${mealIndex}`); setError("");
    const response = await fetch(`/api/meal-plans/${plan.id}/serve`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mealIndex }) });
    const result = await response.json();
    if (!response.ok) setError(result.error ?? "Could not mark this meal as served.");
    else setPlan({ ...plan, servedSlots: result.servedSlots });
    setPendingAction("");
  }

  async function swapMeal(mealIndex: number) {
    if (!plan) return;
    setPendingAction(`swap-${mealIndex}`); setError("");
    const response = await fetch(`/api/meal-plans/${plan.id}/swap`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mealIndex }) });
    const result = await response.json();
    if (!response.ok) setError(result.error ?? "Could not swap this meal.");
    else setPlan(result.plan);
    setPendingAction("");
  }

  return (
    <section aria-labelledby="today-menu-heading">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[.16em] text-[#dd6d4b]">Daily planner</p>
          <h2 id="today-menu-heading" className="mt-1 text-2xl font-black tracking-[-.035em] text-[#26354c] dark:text-white">Today&apos;s menu</h2>
        </div>
        {plan && <Button variant="outline" onClick={() => generate(true)} disabled={pending || plan.generationCount >= 3}><RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} /> Regenerate {plan.generationCount}/3</Button>}
      </div>

      {!plan ? (
        <Card className="overflow-hidden">
          <div className="grid gap-6 p-7 sm:grid-cols-[1fr_auto] sm:items-center">
            <div><span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#ffe27a] text-[#26354c]"><Sparkles className="size-6" /></span><h3 className="mt-4 text-xl font-black text-[#26354c] dark:text-white">A fresh menu, safety-checked for this profile</h3><p className="mt-2 max-w-2xl leading-7 text-[#6f7b91] dark:text-slate-300">With no OpenAI key, Bellybloom automatically builds the menu from vetted recipes. With a key, generated recipes must still pass the same deterministic rules.</p></div>
            <Button variant="peach" size="lg" onClick={() => generate(false)} disabled={pending}>{pending ? "Creating menu…" : "Create today’s menu"}</Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plan.meals.map((meal, mealIndex) => (
            <Card key={`${meal.mealType}-${meal.title}-${mealIndex}`} className="flex flex-col overflow-hidden">
              <div className={`${mealColors[meal.mealType] ?? "bg-[#f0eee8]"} p-5 text-[#26354c]`}>
                <div className="flex items-center justify-between gap-3"><Badge className="bg-white/70 text-[#26354c]">{meal.mealType.toLowerCase()}</Badge><span className="flex items-center gap-1 text-xs font-black"><Clock3 className="size-3.5" />{meal.prepMinutes} min</span></div>
                <div className="mt-7 text-4xl" aria-hidden="true">{meal.mealType === "BREAKFAST" ? "🥣" : meal.mealType === "LUNCH" ? "🥕" : meal.mealType === "DINNER" ? "🍲" : "🍐"}</div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-black leading-6 text-[#26354c] dark:text-white">{meal.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#748095] dark:text-slate-300">{meal.description}</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#637087] dark:text-slate-400"><Utensils className="size-4" />{meal.texture}</div>
                <details className="mt-5 rounded-2xl bg-[#f7f5ef] p-3 text-sm dark:bg-white/5">
                  <summary className="cursor-pointer font-black text-[#344158] dark:text-white">View recipe</summary>
                  <div className="mt-3 space-y-3 text-[#657187] dark:text-slate-300">
                    <ul className="space-y-1">{meal.ingredients.map((item) => <li key={`${item.name}-${item.amount}`}>• {item.amount} {item.name}</li>)}</ul>
                    <ol className="space-y-2">{meal.instructions.map((item, index) => <li key={item}><strong>{index + 1}.</strong> {item}</li>)}</ol>
                    <p className="rounded-xl bg-white p-3 text-xs leading-5 dark:bg-white/5"><strong>Why it fits:</strong> {meal.whyGood}</p>
                  </div>
                </details>
                <div className="mt-auto flex flex-wrap items-center gap-1 pt-4">
                  <MealFavoriteButton babyId={babyId} meal={meal} />
                  <Button type="button" variant="ghost" size="sm" onClick={() => markServed(mealIndex)} disabled={pendingAction === `serve-${mealIndex}` || plan.servedSlots.includes(mealIndex)}><Check className="size-3.5" />{plan.servedSlots.includes(mealIndex) ? "Served" : "Mark served"}</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => swapMeal(mealIndex)} disabled={Boolean(pendingAction) || plan.generationCount >= 3}><Repeat2 className="size-3.5" />{pendingAction === `swap-${mealIndex}` ? "Swapping..." : "Swap"}</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {error && <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700" role="alert">{error}</p>}
      {plan && <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold text-[#748095] dark:text-slate-400"><span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-[#2a9b73]" />Ruleset {plan.rulesetVersion}</span><span>Source: {plan.source === "AI" ? "AI, then deterministic validation" : "vetted catalogue fallback"}</span></div>}
      <div className="mt-5"><RecipeDisclaimer /></div>
    </section>
  );
}
