"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Meal } from "@/lib/schemas";

type WeeklyPlan = { id: string; planDate: string; meals: Meal[]; source: string };

export function WeeklyPlanner({ babyId }: { babyId: string }) {
  const [plans, setPlans] = useState<WeeklyPlan[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function loadWeek() {
    if (plans.length) { setOpen((value) => !value); return; }
    setPending(true); setError("");
    const startDate = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const response = await fetch("/api/meal-plans/week", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ babyId, startDate }) });
    const result = await response.json();
    if (!response.ok) setError(result.error ?? "Could not create the weekly view.");
    else { setPlans(result.plans); setOpen(true); }
    setPending(false);
  }

  return <section className="mt-8"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-black uppercase tracking-[.16em] text-[#3a9c77]">Seven-day view</p><h2 className="mt-1 text-2xl font-black">Weekly menu</h2><p className="mt-1 text-sm text-[#748095] dark:text-slate-300">Generated on demand from the same age and allergy-filtered vetted catalogue.</p></div><Button variant="outline" onClick={loadWeek} disabled={pending}><CalendarDays className="size-4" />{pending ? "Building week..." : plans.length ? open ? "Hide week" : "Show week" : "Create weekly view"}<ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} /></Button></div>{error && <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700" role="alert">{error}</p>}{open && <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{plans.map((plan) => <Card key={plan.id} className="p-5"><div className="flex items-center justify-between"><h3 className="font-black">{new Date(plan.planDate).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" })}</h3><Badge>{plan.source === "VETTED_WEEKLY" ? "vetted" : plan.source.toLowerCase()}</Badge></div><ul className="mt-4 space-y-2">{plan.meals.map((meal, index) => <li key={`${meal.mealType}-${index}`} className="flex items-start justify-between gap-3 rounded-xl bg-[#f7f5ef] px-3 py-2 text-sm dark:bg-white/5"><span className="font-black capitalize">{meal.mealType.toLowerCase()}</span><span className="text-right text-[#657187] dark:text-slate-300">{meal.title}</span></li>)}</ul></Card>)}</div>}</section>;
}
