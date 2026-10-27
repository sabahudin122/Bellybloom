"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Meal } from "@/lib/schemas";

export function MealFavoriteButton({ babyId, meal }: { babyId: string; meal: Meal }) {
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    setPending(true); setError("");
    const response = await fetch("/api/favorites", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ babyId, meal }) });
    const result = await response.json();
    if (response.ok) setSaved(true);
    else setError(result.error ?? "Could not save this meal.");
    setPending(false);
  }
  return <div><Button type="button" variant="ghost" size="sm" onClick={save} disabled={pending || saved}><Heart className="size-3.5" fill={saved ? "currentColor" : "none"} />{saved ? "Saved" : pending ? "Saving..." : "Save"}</Button>{error && <p className="mt-1 text-xs font-bold text-red-700" role="alert">{error}</p>}</div>;
}
