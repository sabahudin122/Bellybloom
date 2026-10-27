"use client";

import { useRouter } from "next/navigation";

export function BabySwitcher({ babies, selectedId }: { babies: Array<{ id: string; name: string }>; selectedId: string }) {
  const router = useRouter();
  return (
    <label className="flex min-h-12 items-center gap-2 rounded-2xl border border-[#26354c]/10 bg-white px-4 text-sm font-black text-[#26354c] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white">
      <span className="text-lg" aria-hidden="true">🌱</span>
      <span className="sr-only">Selected baby</span>
      <select value={selectedId} onChange={(event) => router.push(`/dashboard?baby=${event.target.value}`)} className="min-w-0 bg-transparent outline-none">
        {babies.map((baby) => <option key={baby.id} value={baby.id}>{baby.name}</option>)}
      </select>
    </label>
  );
}
