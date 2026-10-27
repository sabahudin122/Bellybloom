"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookHeart, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  foodName: z.string().trim().min(1, "Enter a food name.").max(120),
  reaction: z.enum(["NONE", "MILD", "REACTION"]),
  notes: z.string().trim().max(500),
  servedAt: z.string().min(1, "Choose a date."),
});

type FormValues = z.infer<typeof formSchema>;
type DiaryEntry = {
  id: string;
  foodName: string;
  reaction: string;
  notes: string | null;
  servedAt: string;
};

const reactionLabels: Record<string, string> = {
  NONE: "No reaction logged",
  MILD: "Mild concern noted",
  REACTION: "Reaction noted",
};

export function FoodDiary({ babyId, initialEntries }: { babyId: string; initialEntries: DiaryEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      foodName: "",
      reaction: "NONE",
      notes: "",
      servedAt: new Date().toISOString().slice(0, 10),
    },
  });

  async function addEntry(values: FormValues) {
    setError("");
    const response = await fetch(`/api/babies/${babyId}/food-logs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "Could not save this diary entry.");
      return;
    }
    setEntries((current) => [{ ...result.entry, servedAt: result.entry.servedAt }, ...current]);
    reset({
      foodName: "",
      reaction: "NONE",
      notes: "",
      servedAt: new Date().toISOString().slice(0, 10),
    });
  }

  async function deleteEntry(entryId: string) {
    setDeletingId(entryId);
    setError("");
    const response = await fetch(`/api/babies/${babyId}/food-logs/${entryId}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "Could not delete this diary entry.");
    } else {
      setEntries((current) => current.filter((entry) => entry.id !== entryId));
    }
    setDeletingId(null);
  }

  return (
    <Card className="mt-6 p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <BookHeart className="size-5 text-[#d86543]" />
        <div><h2 className="text-xl font-black">Food diary</h2><p className="text-sm text-[#748095] dark:text-slate-300">Keep a private timeline of foods served and observations.</p></div>
      </div>
      <form onSubmit={handleSubmit(addEntry)} className="mt-6 grid gap-4 rounded-3xl bg-[#f7f5ef] p-5 dark:bg-white/5 sm:grid-cols-2">
        <div><Label htmlFor="foodName">Food</Label><Input id="foodName" placeholder="e.g. mashed pear" {...register("foodName")} />{errors.foodName && <p className="mt-1 text-xs font-bold text-red-700">{errors.foodName.message}</p>}</div>
        <div><Label htmlFor="servedAt">Date served</Label><Input id="servedAt" type="date" max={new Date().toISOString().slice(0, 10)} {...register("servedAt")} /></div>
        <div><Label htmlFor="reaction">Observation</Label><select id="reaction" className="min-h-12 w-full rounded-2xl border border-[#26354c]/15 bg-white px-4 font-bold text-[#26354c] dark:border-white/15 dark:bg-[#18243a] dark:text-white" {...register("reaction")}><option value="NONE">No reaction logged</option><option value="MILD">Mild concern noted</option><option value="REACTION">Reaction noted</option></select></div>
        <div><Label htmlFor="notes">Notes (optional)</Label><Textarea id="notes" placeholder="Texture, amount, or anything you noticed" {...register("notes")} /></div>
        <div className="sm:col-span-2"><Button type="submit" variant="mint" disabled={isSubmitting}><Plus className="size-4" />{isSubmitting ? "Saving..." : "Add diary entry"}</Button></div>
      </form>
      {error && <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700" role="alert">{error}</p>}
      <p className="mt-4 text-xs leading-5 text-[#788499] dark:text-slate-400">This diary records observations only and does not diagnose a reaction. Contact your pediatrician about allergy or feeding concerns.</p>
      <div className="mt-7 space-y-3">
        {entries.length === 0 ? <div className="rounded-2xl border border-dashed border-[#26354c]/15 p-6 text-center text-sm font-bold text-[#788499]">No foods logged yet.</div> : entries.map((entry) => (
          <article key={entry.id} className="flex gap-4 rounded-2xl border border-[#26354c]/8 bg-white p-4 dark:border-white/10 dark:bg-white/5">
            <span className="mt-1 size-3 shrink-0 rounded-full bg-[#9ee7c7] ring-4 ring-[#9ee7c7]/25" />
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-black">{entry.foodName}</h3><p className="text-xs font-bold text-[#8993a4]">{new Date(entry.servedAt).toLocaleDateString()}</p></div><Badge className={entry.reaction === "REACTION" ? "bg-[#ffddd0] text-[#7e3723]" : entry.reaction === "MILD" ? "bg-[#fff0b6] text-[#66531f]" : ""}>{reactionLabels[entry.reaction] ?? entry.reaction}</Badge></div>{entry.notes && <p className="mt-3 text-sm leading-6 text-[#69758a] dark:text-slate-300">{entry.notes}</p>}</div>
            <Button type="button" variant="ghost" size="icon" aria-label={`Delete ${entry.foodName} diary entry`} disabled={deletingId === entry.id} onClick={() => deleteEntry(entry.id)}><Trash2 className="size-4" /></Button>
          </article>
        ))}
      </div>
    </Card>
  );
}
