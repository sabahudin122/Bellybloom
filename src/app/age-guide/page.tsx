import type { Metadata } from "next";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Age guide" };
export const dynamic = "force-dynamic";

export default async function AgeGuidePage() {
  const [stages, sources, rules] = await Promise.all([
    prisma.ageStage.findMany({ where: { active: true }, include: { source: true }, orderBy: { sortOrder: "asc" } }),
    prisma.safetySource.findMany({ where: { status: "ACTIVE" }, orderBy: { organization: "asc" } }),
    prisma.safetyRule.findMany({ where: { active: true }, include: { source: true }, orderBy: { code: "asc" } }),
  ]);
  return (
    <main className="min-h-screen bg-[#fffaf1] dark:bg-[#101a2b]">
      <PublicHeader />
      <section className="page-shell pb-20 pt-12">
        <div className="max-w-3xl"><Badge className="bg-[#cff4e4] text-[#28614f]"><ShieldCheck className="mr-1.5 size-4" />Versioned guidance</Badge><h1 className="mt-5 text-4xl font-black tracking-[-.05em] text-[#26354c] sm:text-6xl dark:text-white">One age, one clear stage</h1><p className="mt-5 text-lg leading-8 text-[#6d788d] dark:text-slate-300">Ranges use completed months, with an inclusive lower boundary and exclusive upper boundary. Guidance is shown with its source and review record; it is general information, not medical advice.</p></div>
        <div className="mt-12 space-y-5">
          {stages.map((stage, index) => (
            <Card key={stage.id} className="overflow-hidden">
              <div className="grid lg:grid-cols-[.32fr_.68fr]"><div className={`${["bg-[#dceeff]", "bg-[#ffddd0]", "bg-[#cff4e4]", "bg-[#eee4ff]", "bg-[#fff0b6]", "bg-[#d7f0e5]"][index % 6]} p-7 text-[#26354c]`}><span className="text-4xl">{["🍼", "🥄", "🥑", "🍲", "🍓", "🌱"][index % 6]}</span><h2 className="mt-4 text-2xl font-black">{stage.title}</h2><p className="mt-3 text-sm font-bold leading-6">Boundary: [{stage.minAgeMonthsInclusive}, {stage.maxAgeMonthsExclusive ?? "∞"}) completed months</p></div><div className="grid gap-5 p-7 sm:grid-cols-2"><div><p className="text-xs font-black uppercase tracking-wider text-[#dd6d4b]">What this stage means</p><p className="mt-2 leading-7 text-[#68758a] dark:text-slate-300">{stage.summary}</p></div><div><p className="text-xs font-black uppercase tracking-wider text-[#dd6d4b]">Food ideas</p><p className="mt-2 leading-7 text-[#68758a] dark:text-slate-300">{stage.foods}</p></div><div><p className="text-xs font-black uppercase tracking-wider text-[#dd6d4b]">Textures & rhythm</p><p className="mt-2 leading-7 text-[#68758a] dark:text-slate-300">{stage.textures} {stage.mealsPerDay}</p></div><div><p className="text-xs font-black uppercase tracking-wider text-[#dd6d4b]">Avoid & watch</p><p className="mt-2 leading-7 text-[#68758a] dark:text-slate-300">{stage.avoid} {stage.warnings}</p></div><p className="sm:col-span-2 text-xs font-bold text-[#8791a4]">Source: {stage.source.organization} · {stage.source.version} · review record {stage.source.reviewDate.toISOString().slice(0, 10)}</p></div></div>
            </Card>
          ))}
        </div>

        <section className="mt-16"><h2 className="text-3xl font-black tracking-[-.04em]">Active safety rules</h2><div className="mt-6 grid gap-4 md:grid-cols-2">{rules.map((rule) => <Card key={rule.id} className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-[#dd6d4b]">{rule.code}</p><h3 className="mt-1 font-black">{rule.title}</h3></div><Badge>{rule.severity}</Badge></div><p className="mt-3 text-sm leading-6 text-[#6d788d] dark:text-slate-300">{rule.description}</p><p className="mt-4 text-xs font-bold text-[#8791a4]">Ruleset {rule.rulesetVersion} · {rule.source.organization} · reviewed {rule.reviewDate.toISOString().slice(0, 10)}</p></Card>)}</div></section>

        <section className="mt-16 rounded-[2rem] bg-[#26354c] p-7 text-white sm:p-9"><h2 className="text-2xl font-black">Source register</h2><div className="mt-6 space-y-4">{sources.map((source) => <div key={source.id} className="rounded-2xl bg-white/8 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="font-black">{source.title}</h3><p className="mt-1 text-sm text-slate-300">{source.organization} · version {source.version} · review date {source.reviewDate.toISOString().slice(0, 10)}</p></div><a href={source.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-black text-[#9ee7c7]">Open source <ExternalLink className="size-4" /></a></div><p className="mt-3 text-sm leading-6 text-slate-300"><strong className="text-white">Reviewer:</strong> {source.reviewerName}. {source.reviewerNotes}</p></div>)}</div></section>
      </section>
    </main>
  );
}
