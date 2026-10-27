"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ShieldQuestion } from "lucide-react";
import { calculateAge, suggestedFeedingStage } from "@/lib/age";
import {
  ALLERGEN_LABELS,
  COMMON_ALLERGENS,
  FEEDING_STAGE_LABELS,
  FEEDING_STAGES,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AllergyStatus = "YES" | "NO" | "NOT_SURE";

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [allergyStatus, setAllergyStatus] = useState<AllergyStatus>("NOT_SURE");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [otherAllergies, setOtherAllergies] = useState("");
  const [feedingStageOverride, setFeedingStageOverride] = useState("");
  const [foodsIntroduced, setFoodsIntroduced] = useState("");
  const [foodsDisliked, setFoodsDisliked] = useState("");

  const age = useMemo(() => {
    if (!dateOfBirth) return null;
    try {
      return calculateAge(new Date(`${dateOfBirth}T00:00:00.000Z`));
    } catch {
      return null;
    }
  }, [dateOfBirth]);

  const suggestedStage = age ? suggestedFeedingStage(age.completedMonths) : null;
  const stages = [
    { title: "What should we call your baby?", subtitle: "A nickname is perfectly fine." },
    { title: "When was your baby born?", subtitle: "We use completed months for every age boundary." },
    { title: "Any known allergies?", subtitle: "‘Not sure’ is treated conservatively—never as ‘no allergies’." },
    { title: "Where are you in the feeding journey?", subtitle: "We suggest a stage from age, but you can adjust the profile label." },
    { title: "A few helpful food notes", subtitle: "Optional—these help make ideas feel more familiar." },
  ];

  function canContinue() {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return Boolean(age);
    if (step === 2 && allergyStatus === "YES") return allergies.length > 0 || otherAllergies.trim().length > 0;
    return true;
  }

  async function finish() {
    if (!age) return;
    setPending(true);
    setError("");
    const response = await fetch("/api/babies", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        dateOfBirth: `${dateOfBirth}T00:00:00.000Z`,
        allergyStatus,
        allergies: allergyStatus === "YES" ? allergies : [],
        otherAllergies: allergyStatus === "YES" ? otherAllergies : "",
        feedingStageOverride: feedingStageOverride || null,
        foodsIntroduced: foodsIntroduced.split(",").map((item) => item.trim()).filter(Boolean),
        foodsDisliked: foodsDisliked.split(",").map((item) => item.trim()).filter(Boolean),
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "Could not save the profile.");
      setPending(false);
      return;
    }
    router.push(`/dashboard?baby=${result.baby.id}`);
    router.refresh();
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-8 flex gap-2" aria-label={`Step ${step + 1} of ${stages.length}`}>
        {stages.map((_, index) => (
          <span key={index} className={`h-2 flex-1 rounded-full ${index <= step ? "bg-[#ff936b]" : "bg-[#26354c]/10 dark:bg-white/10"}`} />
        ))}
      </div>
      <div className="rounded-[2.2rem] border border-[#26354c]/10 bg-white p-6 shadow-[0_28px_75px_rgba(38,53,76,.13)] sm:p-10 dark:border-white/10 dark:bg-[#172237]">
        <p className="text-sm font-black uppercase tracking-[.18em] text-[#dc6c49]">Step {step + 1} of {stages.length}</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-.04em] text-[#26354c] sm:text-4xl dark:text-white">{stages[step].title}</h1>
        <p className="mt-2 leading-7 text-[#778196] dark:text-slate-300">{stages[step].subtitle}</p>

        <div className="mt-8 min-h-64">
          {step === 0 && <div><Label htmlFor="baby-name">Baby&apos;s name or nickname</Label><Input id="baby-name" value={name} onChange={(event) => setName(event.target.value)} autoFocus maxLength={60} placeholder="e.g. Lana" /></div>}

          {step === 1 && (
            <div>
              <Label htmlFor="birth-date">Date of birth</Label>
              <Input id="birth-date" type="date" value={dateOfBirth} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setDateOfBirth(event.target.value)} />
              {age && <div className="mt-5 rounded-3xl bg-[#dceeff] p-5 text-[#26354c]"><p className="text-sm font-bold">Exact age today</p><p className="mt-1 text-2xl font-black">{age.label}</p><p className="mt-1 text-sm font-semibold">{age.completedMonths} completed months · {age.completedDays} completed days</p></div>}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                {(["YES", "NO", "NOT_SURE"] as const).map((value) => (
                  <button type="button" key={value} onClick={() => { setAllergyStatus(value); if (value !== "YES") setAllergies([]); }} className={`min-h-16 rounded-2xl border p-3 text-sm font-black transition ${allergyStatus === value ? "border-[#ff936b] bg-[#fff0e8] text-[#9d472e] dark:bg-[#ff936b]/15 dark:text-[#ffc4af]" : "border-[#26354c]/12 text-[#58657b] dark:border-white/10 dark:text-slate-300"}`}>
                    {value === "YES" ? "Yes" : value === "NO" ? "No" : "Not sure yet"}
                  </button>
                ))}
              </div>
              {allergyStatus === "YES" && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {COMMON_ALLERGENS.map((allergen) => {
                    const selected = allergies.includes(allergen);
                    return <label key={allergen} className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl border px-3 text-sm font-bold ${selected ? "border-[#ff936b] bg-[#fff0e8] dark:bg-[#ff936b]/15" : "border-[#26354c]/10 dark:border-white/10"}`}><input type="checkbox" className="size-4 accent-[#e27350]" checked={selected} onChange={() => setAllergies((current) => selected ? current.filter((item) => item !== allergen) : [...current, allergen])} />{ALLERGEN_LABELS[allergen]}</label>;
                  })}
                </div>
              )}
              {allergyStatus === "YES" && <div><Label htmlFor="other-allergies">Other allergy information</Label><Input id="other-allergies" value={otherAllergies} onChange={(event) => setOtherAllergies(event.target.value)} maxLength={300} /></div>}
              {allergyStatus === "NOT_SURE" && <div className="flex gap-3 rounded-2xl bg-[#fff6dc] p-4 text-sm leading-6 text-[#63563b]"><ShieldQuestion className="mt-0.5 size-5 shrink-0" /><p>Meal ideas will exclude all common allergens until this status is changed. Bellybloom will not suggest allergy testing or exposure.</p></div>}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {suggestedStage && <div className="rounded-3xl bg-[#cff4e4] p-5 text-[#1e5544]"><p className="text-sm font-bold">Suggested from age</p><p className="mt-1 text-xl font-black">{FEEDING_STAGE_LABELS[suggestedStage]}</p></div>}
              <Label htmlFor="feeding-stage">Profile stage label</Label>
              <select id="feeding-stage" value={feedingStageOverride} onChange={(event) => setFeedingStageOverride(event.target.value)} className="min-h-12 w-full rounded-2xl border border-[#26354c]/15 bg-white px-4 font-bold text-[#26354c] dark:border-white/15 dark:bg-white/5 dark:text-white">
                <option value="">Use age-based suggestion</option>
                {FEEDING_STAGES.map((value) => <option key={value} value={value}>{FEEDING_STAGE_LABELS[value]}</option>)}
              </select>
              <p className="text-xs leading-5 text-[#7d8799] dark:text-slate-400">Editing this label does not override the safety age used by recipes or meal plans.</p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div><Label htmlFor="introduced">Foods already introduced</Label><Input id="introduced" value={foodsIntroduced} onChange={(event) => setFoodsIntroduced(event.target.value)} placeholder="pear, potato, broccoli" /><p className="mt-1 text-xs text-[#7d8799]">Separate foods with commas.</p></div>
              <div><Label htmlFor="disliked">Foods disliked</Label><Input id="disliked" value={foodsDisliked} onChange={(event) => setFoodsDisliked(event.target.value)} placeholder="optional" /></div>
            </div>
          )}
        </div>

        {error && <p className="mb-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700" role="alert">{error}</p>}
        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" disabled={step === 0 || pending} onClick={() => setStep((value) => value - 1)}><ArrowLeft className="size-4" /> Back</Button>
          {step < stages.length - 1 ? (
            <Button type="button" variant="peach" disabled={!canContinue()} onClick={() => setStep((value) => value + 1)}>Continue <ArrowRight className="size-4" /></Button>
          ) : (
            <Button type="button" variant="peach" disabled={pending} onClick={finish}>{pending ? "Saving…" : "Finish profile"} <Check className="size-4" /></Button>
          )}
        </div>
      </div>
    </div>
  );
}
