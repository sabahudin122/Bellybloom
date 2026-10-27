"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2 } from "lucide-react";
import { ALLERGEN_LABELS, COMMON_ALLERGENS, FEEDING_STAGE_LABELS, FEEDING_STAGES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InitialBaby = {
  id: string;
  name: string;
  dateOfBirth: string;
  allergyStatus: string;
  allergies: string[];
  otherAllergies: string;
  feedingStageOverride: string;
  foodsIntroduced: string[];
  foodsDisliked: string[];
};

export function BabyProfileEditor({ baby }: { baby: InitialBaby }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(baby);

  function update<K extends keyof InitialBaby>(key: K, value: InitialBaby[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const response = await fetch(`/api/babies/${baby.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        dateOfBirth: `${form.dateOfBirth}T00:00:00.000Z`,
        allergyStatus: form.allergyStatus,
        allergies: form.allergyStatus === "YES" ? form.allergies : [],
        otherAllergies: form.allergyStatus === "YES" ? form.otherAllergies : "",
        feedingStageOverride: form.feedingStageOverride || null,
        foodsIntroduced: form.foodsIntroduced,
        foodsDisliked: form.foodsDisliked,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error ?? "Could not save changes.");
    } else {
      setMessage("Profile updated.");
      setEditing(false);
      router.refresh();
    }
    setPending(false);
  }

  async function remove() {
    if (!window.confirm(`Delete ${baby.name}'s profile and all related meal plans? This cannot be undone.`)) return;
    setPending(true);
    const response = await fetch(`/api/babies/${baby.id}`, { method: "DELETE" });
    if (!response.ok) {
      const result = await response.json();
      setMessage(result.error ?? "Could not delete the profile.");
      setPending(false);
      return;
    }
    router.push("/babies");
    router.refresh();
  }

  if (!editing) {
    return <div className="flex flex-wrap gap-3"><Button variant="outline" onClick={() => setEditing(true)}>Edit profile</Button><Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={remove} disabled={pending}><Trash2 className="size-4" /> Delete</Button>{message && <p className="basis-full text-sm font-bold text-[#3b745e]">{message}</p>}</div>;
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2"><div><Label>Baby&apos;s name</Label><Input value={form.name} onChange={(event) => update("name", event.target.value)} required /></div><div><Label>Date of birth</Label><Input type="date" value={form.dateOfBirth} max={new Date().toISOString().slice(0, 10)} onChange={(event) => update("dateOfBirth", event.target.value)} required /></div></div>
      <div><Label>Allergy status</Label><div className="grid gap-2 sm:grid-cols-3">{["YES", "NO", "NOT_SURE"].map((status) => <button type="button" key={status} onClick={() => update("allergyStatus", status)} className={`min-h-12 rounded-2xl border px-3 text-sm font-black ${form.allergyStatus === status ? "border-[#ff936b] bg-[#fff0e8] text-[#9d472e] dark:bg-[#ff936b]/15" : "border-[#26354c]/10 dark:border-white/10"}`}>{status === "YES" ? "Yes" : status === "NO" ? "No" : "Not sure"}</button>)}</div></div>
      {form.allergyStatus === "YES" && <div><Label>Known allergens</Label><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{COMMON_ALLERGENS.map((allergen) => { const selected = form.allergies.includes(allergen); return <label key={allergen} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl border px-3 text-sm font-bold ${selected ? "border-[#ff936b] bg-[#fff0e8] dark:bg-[#ff936b]/15" : "border-[#26354c]/10 dark:border-white/10"}`}><input type="checkbox" checked={selected} onChange={() => update("allergies", selected ? form.allergies.filter((item) => item !== allergen) : [...form.allergies, allergen])} />{ALLERGEN_LABELS[allergen]}</label>; })}</div><Input className="mt-3" value={form.otherAllergies} onChange={(event) => update("otherAllergies", event.target.value)} placeholder="Other allergy information" /></div>}
      <div><Label>Feeding stage label</Label><select value={form.feedingStageOverride} onChange={(event) => update("feedingStageOverride", event.target.value)} className="min-h-12 w-full rounded-2xl border border-[#26354c]/15 bg-white px-4 font-bold dark:border-white/15 dark:bg-white/5"><option value="">Use age-based suggestion</option>{FEEDING_STAGES.map((stage) => <option key={stage} value={stage}>{FEEDING_STAGE_LABELS[stage]}</option>)}</select><p className="mt-1 text-xs text-[#7d8799]">This label never overrides recipe safety age.</p></div>
      <div className="grid gap-5 sm:grid-cols-2"><div><Label>Foods introduced</Label><Input value={form.foodsIntroduced.join(", ")} onChange={(event) => update("foodsIntroduced", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} /></div><div><Label>Foods disliked</Label><Input value={form.foodsDisliked.join(", ")} onChange={(event) => update("foodsDisliked", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} /></div></div>
      {message && <p className="rounded-2xl bg-[#f2f7f3] p-3 text-sm font-bold">{message}</p>}
      <div className="flex gap-3"><Button type="submit" variant="peach" disabled={pending}><Save className="size-4" />{pending ? "Saving…" : "Save changes"}</Button><Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button></div>
    </form>
  );
}
