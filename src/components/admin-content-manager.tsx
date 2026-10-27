"use client";

import { useState } from "react";
import { BookOpen, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Stage = { id: string; title: string; minAgeMonthsInclusive: number; maxAgeMonthsExclusive: number | null; summary: string; foods: string; avoid: string; textures: string; mealsPerDay: string; warnings: string; source: { organization: string; version: string; reviewDate: string; reviewerNotes: string } };
type Recipe = { id: string; sourceId: string; title: string; slug: string; description: string; mealType: string; ingredientsJson: string; instructionsJson: string; prepMinutes: number; texture: string; minAgeMonths: number; maxAgeMonthsExclusive: number | null; allergenTagsJson: string; whyGood: string };
type Source = { id: string; organization: string; version: string; reviewDate: string; reviewerNotes: string };

const emptyRecipe = (sourceId = "") => ({ sourceId, title: "", slug: "", description: "", mealType: "BREAKFAST", ingredientsText: "", instructionsText: "", prepMinutes: "15", texture: "soft mashed", minAgeMonths: "6", maxAgeMonthsExclusive: "", allergenText: "", whyGood: "" });

function draftFromRecipe(recipe: Recipe) {
  const ingredients = JSON.parse(recipe.ingredientsJson) as Array<{ name: string; amount: string }>;
  return { sourceId: recipe.sourceId, title: recipe.title, slug: recipe.slug, description: recipe.description, mealType: recipe.mealType, ingredientsText: ingredients.map((item) => `${item.name} | ${item.amount}`).join("\n"), instructionsText: (JSON.parse(recipe.instructionsJson) as string[]).join("\n"), prepMinutes: String(recipe.prepMinutes), texture: recipe.texture, minAgeMonths: String(recipe.minAgeMonths), maxAgeMonthsExclusive: recipe.maxAgeMonthsExclusive == null ? "" : String(recipe.maxAgeMonthsExclusive), allergenText: (JSON.parse(recipe.allergenTagsJson) as string[]).join(", "), whyGood: recipe.whyGood };
}

export function AdminContentManager({ initialStages, initialRecipes, sources }: { initialStages: Stage[]; initialRecipes: Recipe[]; sources: Source[] }) {
  const [stages, setStages] = useState(initialStages);
  const [stageId, setStageId] = useState(initialStages[0]?.id ?? "");
  const [stageDraft, setStageDraft] = useState<Stage | undefined>(initialStages[0]);
  const [recipes, setRecipes] = useState(initialRecipes);
  const [recipeId, setRecipeId] = useState("new");
  const [recipeDraft, setRecipeDraft] = useState(emptyRecipe(sources[0]?.id));
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  function chooseStage(id: string) { setStageId(id); setStageDraft(stages.find((stage) => stage.id === id)); setMessage(""); }
  function chooseRecipe(id: string) { setRecipeId(id); setRecipeDraft(id === "new" ? emptyRecipe(sources[0]?.id) : draftFromRecipe(recipes.find((recipe) => recipe.id === id)!)); setMessage(""); }

  async function saveStage() {
    if (!stageDraft) return;
    setPending(true); setMessage("");
    const payload = { title: stageDraft.title, minAgeMonthsInclusive: Number(stageDraft.minAgeMonthsInclusive), maxAgeMonthsExclusive: stageDraft.maxAgeMonthsExclusive == null ? null : Number(stageDraft.maxAgeMonthsExclusive), summary: stageDraft.summary, foods: stageDraft.foods, avoid: stageDraft.avoid, textures: stageDraft.textures, mealsPerDay: stageDraft.mealsPerDay, warnings: stageDraft.warnings };
    const response = await fetch(`/api/admin/age-stages/${stageDraft.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) setMessage(result.error ?? "Could not save age stage.");
    else { setStages((current) => current.map((stage) => stage.id === result.stage.id ? { ...stage, ...result.stage } : stage)); setMessage("Age stage saved with boundary validation."); }
    setPending(false);
  }

  async function saveRecipe() {
    setPending(true); setMessage("");
    const ingredients = recipeDraft.ingredientsText.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => { const [name, ...amountParts] = line.split("|"); return { name: name.trim(), amount: amountParts.join("|").trim() }; });
    const payload = { sourceId: recipeDraft.sourceId, title: recipeDraft.title, slug: recipeDraft.slug, description: recipeDraft.description, mealType: recipeDraft.mealType, ingredients, instructions: recipeDraft.instructionsText.split("\n").map((line) => line.trim()).filter(Boolean), prepMinutes: Number(recipeDraft.prepMinutes), texture: recipeDraft.texture, minAgeMonths: Number(recipeDraft.minAgeMonths), maxAgeMonthsExclusive: recipeDraft.maxAgeMonthsExclusive ? Number(recipeDraft.maxAgeMonthsExclusive) : null, allergenTags: recipeDraft.allergenText.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean), whyGood: recipeDraft.whyGood };
    const response = await fetch(recipeId === "new" ? "/api/admin/recipes" : `/api/admin/recipes/${recipeId}`, { method: recipeId === "new" ? "POST" : "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) setMessage(`${result.error ?? "Could not save recipe."}${result.reasons?.length ? ` ${result.reasons.join(" ")}` : ""}`);
    else { setRecipes((current) => recipeId === "new" ? [...current, result.recipe] : current.map((recipe) => recipe.id === result.recipe.id ? result.recipe : recipe)); setRecipeId(result.recipe.id); setRecipeDraft(draftFromRecipe(result.recipe)); setMessage("Recipe passed deterministic safety review and was saved."); }
    setPending(false);
  }

  async function deleteRecipe() {
    if (recipeId === "new" || !window.confirm("Delete this vetted recipe?")) return;
    const response = await fetch(`/api/admin/recipes/${recipeId}`, { method: "DELETE" });
    if (response.ok) { setRecipes((current) => current.filter((recipe) => recipe.id !== recipeId)); chooseRecipe("new"); setMessage("Recipe deleted."); }
  }

  return <div className="space-y-10">{message && <p className="rounded-2xl bg-[#eff8ff] p-4 text-sm font-bold text-[#456279] dark:bg-[#a8d8ff]/10 dark:text-slate-200" role="status">{message}</p>}<section><div className="flex items-center gap-3"><BookOpen className="size-5 text-[#d86543]" /><div><h2 className="text-2xl font-black">Age guide editor</h2><p className="text-sm text-[#748095]">Edits retain the stage&apos;s versioned reviewed source and cannot create overlaps, gaps, or a solids minimum below 6 months.</p></div></div>{stageDraft && <Card className="mt-5 p-6"><select value={stageId} onChange={(event) => chooseStage(event.target.value)} className="min-h-12 w-full rounded-2xl border border-[#26354c]/15 bg-white px-4 font-bold dark:bg-[#18243a]">{stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.title}</option>)}</select><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><Label>Title</Label><Input value={stageDraft.title} onChange={(event) => setStageDraft({ ...stageDraft, title: event.target.value })} /></div><div className="grid grid-cols-2 gap-3"><div><Label>Min inclusive</Label><Input type="number" value={stageDraft.minAgeMonthsInclusive} onChange={(event) => setStageDraft({ ...stageDraft, minAgeMonthsInclusive: Number(event.target.value) })} /></div><div><Label>Max exclusive</Label><Input type="number" value={stageDraft.maxAgeMonthsExclusive ?? ""} onChange={(event) => setStageDraft({ ...stageDraft, maxAgeMonthsExclusive: event.target.value ? Number(event.target.value) : null })} /></div></div>{(["summary", "foods", "avoid", "textures", "mealsPerDay", "warnings"] as const).map((field) => <div key={field} className="sm:col-span-2"><Label>{field.replace(/([A-Z])/g, " $1")}</Label><Textarea value={stageDraft[field]} onChange={(event) => setStageDraft({ ...stageDraft, [field]: event.target.value })} /></div>)}</div><p className="mt-4 text-xs font-bold text-[#8791a4]">Source: {stageDraft.source.organization} · {stageDraft.source.version} · reviewed {new Date(stageDraft.source.reviewDate).toLocaleDateString()}</p><Button className="mt-5" variant="mint" onClick={saveStage} disabled={pending}><Save className="size-4" />Save stage</Button></Card>}</section><section><h2 className="text-2xl font-black">Vetted recipe catalogue</h2><p className="mt-1 text-sm text-[#748095]">Each create or update is blocked unless structured content passes the active deterministic rules.</p><Card className="mt-5 p-6"><select value={recipeId} onChange={(event) => chooseRecipe(event.target.value)} className="min-h-12 w-full rounded-2xl border border-[#26354c]/15 bg-white px-4 font-bold dark:bg-[#18243a]"><option value="new">+ New recipe</option>{recipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.title}</option>)}</select><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><Label>Title</Label><Input value={recipeDraft.title} onChange={(event) => setRecipeDraft({ ...recipeDraft, title: event.target.value })} /></div><div><Label>Slug</Label><Input value={recipeDraft.slug} onChange={(event) => setRecipeDraft({ ...recipeDraft, slug: event.target.value })} /></div><div className="sm:col-span-2"><Label>Description</Label><Textarea value={recipeDraft.description} onChange={(event) => setRecipeDraft({ ...recipeDraft, description: event.target.value })} /></div><div><Label>Source</Label><select value={recipeDraft.sourceId} onChange={(event) => setRecipeDraft({ ...recipeDraft, sourceId: event.target.value })} className="min-h-12 w-full rounded-2xl border border-[#26354c]/15 bg-white px-4 font-bold dark:bg-[#18243a]">{sources.map((source) => <option key={source.id} value={source.id}>{source.organization} · {source.version}</option>)}</select></div><div><Label>Meal type</Label><select value={recipeDraft.mealType} onChange={(event) => setRecipeDraft({ ...recipeDraft, mealType: event.target.value })} className="min-h-12 w-full rounded-2xl border border-[#26354c]/15 bg-white px-4 font-bold dark:bg-[#18243a]">{["BREAKFAST", "LUNCH", "DINNER", "SNACK"].map((meal) => <option key={meal}>{meal}</option>)}</select></div><div><Label>Prep minutes</Label><Input type="number" value={recipeDraft.prepMinutes} onChange={(event) => setRecipeDraft({ ...recipeDraft, prepMinutes: event.target.value })} /></div><div><Label>Texture</Label><Input value={recipeDraft.texture} onChange={(event) => setRecipeDraft({ ...recipeDraft, texture: event.target.value })} /></div><div><Label>Minimum months</Label><Input type="number" value={recipeDraft.minAgeMonths} onChange={(event) => setRecipeDraft({ ...recipeDraft, minAgeMonths: event.target.value })} /></div><div><Label>Maximum months exclusive</Label><Input type="number" value={recipeDraft.maxAgeMonthsExclusive} onChange={(event) => setRecipeDraft({ ...recipeDraft, maxAgeMonthsExclusive: event.target.value })} /></div><div className="sm:col-span-2"><Label>Ingredients — one “name | amount” per line</Label><Textarea className="min-h-32" value={recipeDraft.ingredientsText} onChange={(event) => setRecipeDraft({ ...recipeDraft, ingredientsText: event.target.value })} /></div><div className="sm:col-span-2"><Label>Instructions — one step per line</Label><Textarea className="min-h-32" value={recipeDraft.instructionsText} onChange={(event) => setRecipeDraft({ ...recipeDraft, instructionsText: event.target.value })} /></div><div><Label>Allergen tags (comma separated codes)</Label><Input value={recipeDraft.allergenText} onChange={(event) => setRecipeDraft({ ...recipeDraft, allergenText: event.target.value })} /></div><div><Label>Why it is included</Label><Textarea value={recipeDraft.whyGood} onChange={(event) => setRecipeDraft({ ...recipeDraft, whyGood: event.target.value })} /></div></div><div className="mt-5 flex gap-2"><Button variant="mint" onClick={saveRecipe} disabled={pending}><Save className="size-4" />Save recipe</Button>{recipeId !== "new" && <Button variant="danger" onClick={deleteRecipe}><Trash2 className="size-4" />Delete</Button>}</div></Card></section></div>;
}
