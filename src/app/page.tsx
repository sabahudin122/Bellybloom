import Link from "next/link";
import {
  ArrowRight,
  Baby,
  BookOpenCheck,
  CalendarHeart,
  Check,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { HeroVisual } from "@/components/hero-visual";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const stages = ["Under 6 mo", "6–8 mo", "8–10 mo", "10–12 mo", "12–24 mo", "2+ years"];

export default function Home() {
  return (
    <main className="overflow-hidden">
      <section className="relative min-h-[760px] bg-[#fffaf1] dark:bg-[#101a2b]">
        <div className="absolute -left-32 top-40 size-72 rounded-full bg-[#ffb997]/25 blur-3xl" />
        <div className="absolute -right-24 top-16 size-80 rounded-full bg-[#9ee7c7]/25 blur-3xl" />
        <PublicHeader />
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:pt-16">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#ffb997]/45 bg-white/70 px-4 py-2 text-sm font-extrabold text-[#c35d3c] shadow-sm dark:bg-white/5 dark:text-[#ffb997]">
              <Sparkles className="size-4" /> Safety-first planning for tiny eaters
            </div>
            <h1 className="text-balance text-5xl font-black leading-[.98] tracking-[-0.055em] text-[#24334b] sm:text-6xl lg:text-7xl dark:text-white">
              Happy bellies,
              <span className="relative ml-3 inline-block text-[#ef7f5c]">
                happy mamas
                <svg className="absolute -bottom-3 left-1 w-[96%]" viewBox="0 0 260 18" fill="none" aria-hidden="true">
                  <path d="M5 12C73 2 178 2 255 10" stroke="#9EE7C7" strokeWidth="9" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-8 max-w-xl text-lg font-semibold leading-8 text-[#667087] dark:text-slate-300">
              Age-aware meal ideas, vetted recipes, and calm guidance—organized around your baby&apos;s profile and protected by deterministic safety checks.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className={buttonVariants({ variant: "peach", size: "lg" })}>
                Create your free account <ArrowRight className="size-5" />
              </Link>
              <Link href="/age-guide" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Explore the age guide
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-[#5b687e] dark:text-slate-300">
              {[
                "No solid plans under 6 months",
                "Conservative allergy filtering",
                "No API key required",
              ].map((item) => (
                <span key={item} className="flex items-center gap-2"><Check className="size-4 text-[#2a9b73]" />{item}</span>
              ))}
            </div>
          </div>
          <HeroVisual />
        </div>
      </section>

      <section className="bg-white py-24 dark:bg-[#142036]">
        <div className="page-shell">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-black uppercase tracking-[.18em] text-[#e27350]">Built for real family days</span>
            <h2 className="mt-3 text-4xl font-black tracking-[-.045em] text-[#26354c] sm:text-5xl dark:text-white">A little less guessing at every meal</h2>
            <p className="mt-5 text-lg leading-8 text-[#6d778b] dark:text-slate-300">Create a baby profile once, then get guidance and recipe ideas filtered for age and the allergy information you provide.</p>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              { icon: Baby, color: "bg-[#ffddd0]", title: "Profiles that grow", text: "Exact age, feeding stage, allergies, introduced foods, and dislikes stay together." },
              { icon: CalendarHeart, color: "bg-[#cff4e4]", title: "A calmer daily menu", text: "Breakfast, lunch, dinner, and age-appropriate snacks from vetted or validated recipes." },
              { icon: BookOpenCheck, color: "bg-[#dceeff]", title: "Sources you can inspect", text: "Every guide and safety rule includes a version, review date, source, and reviewer notes." },
            ].map(({ icon: Icon, color, title, text }) => (
              <Card key={title} className="p-7">
                <div className={`grid size-14 place-items-center rounded-2xl ${color} text-[#26354c]`}><Icon className="size-7" /></div>
                <h3 className="mt-6 text-xl font-black text-[#26354c] dark:text-white">{title}</h3>
                <p className="mt-3 leading-7 text-[#6c778b] dark:text-slate-300">{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="safety" className="soft-grid bg-[#f4f8f0] py-24 dark:bg-[#0f192a]">
        <div className="page-shell grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#9ee7c7]/45 px-4 py-2 text-sm font-black text-[#26634f]"><ShieldCheck className="size-4" /> Safety is a gate, not a prompt</span>
            <h2 className="mt-5 text-4xl font-black tracking-[-.045em] text-[#26354c] sm:text-5xl dark:text-white">The model never gets the final say.</h2>
            <p className="mt-5 text-lg leading-8 text-[#68758a] dark:text-slate-300">Generated recipes are checked after generation against structured ingredients, instructions, known allergies, age boundaries, and versioned choking rules. Failed recipes stay hidden and are recorded for review.</p>
            <Link href="/age-guide" className="mt-7 inline-flex items-center gap-2 font-black text-[#d96643]">See every active source and rule <ArrowRight className="size-4" /></Link>
          </div>
          <Card className="overflow-hidden p-3">
            <div className="rounded-[1.35rem] bg-[#26354c] p-6 text-white sm:p-8">
              <p className="text-sm font-black uppercase tracking-[.18em] text-[#9ee7c7]">Validation path</p>
              <div className="mt-6 space-y-3">
                {[
                  "Age stage uses completed months and exclusive upper boundaries",
                  "Known and ‘not sure’ allergy states are filtered conservatively",
                  "Ingredients and instructions are checked against active safety rules",
                  "Unsafe output is rejected, logged, and replaced by a vetted recipe",
                ].map((item, index) => (
                  <div key={item} className="flex gap-4 rounded-2xl bg-white/8 p-4">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#ffe27a] text-sm font-black text-[#26354c]">{index + 1}</span>
                    <p className="font-bold leading-6 text-slate-100">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="bg-[#fffaf1] py-24 dark:bg-[#101a2b]">
        <div className="page-shell text-center">
          <span className="text-sm font-black uppercase tracking-[.18em] text-[#e27350]">One continuous guide</span>
          <h2 className="mt-3 text-4xl font-black tracking-[-.045em] text-[#26354c] dark:text-white">Clear, non-overlapping age stages</h2>
          <div className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {stages.map((stage, index) => (
              <div key={stage} className={`rounded-3xl p-5 ${["bg-[#ffddd0]", "bg-[#cff4e4]", "bg-[#dceeff]", "bg-[#eee4ff]", "bg-[#fff0b6]", "bg-[#d7f0e5]"][index]} text-[#26354c]`}>
                <span className="text-2xl">{["🍼", "🥄", "🥑", "🍲", "🍓", "🌱"][index]}</span>
                <p className="mt-3 text-sm font-black">{stage}</p>
              </div>
            ))}
          </div>
          <Link href="/register" className={buttonVariants({ variant: "primary", size: "lg", className: "mt-10" })}>Start your family space</Link>
        </div>
      </section>

      <footer className="border-t border-[#26354c]/8 bg-white py-10 dark:border-white/10 dark:bg-[#142036]">
        <div className="page-shell flex flex-col items-center justify-between gap-6 sm:flex-row">
          <Logo />
          <p className="max-w-xl text-center text-sm leading-6 text-[#778196] sm:text-right dark:text-slate-400">General guidance only—not medical advice. Feeding and allergy concerns belong with your pediatrician or qualified health professional.</p>
        </div>
      </footer>
    </main>
  );
}
