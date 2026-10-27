import { ShieldCheck } from "lucide-react";
import { RECIPE_DISCLAIMER } from "@/lib/constants";

export function RecipeDisclaimer() {
  return (
    <div className="flex gap-3 rounded-2xl border border-[#f2c87c]/40 bg-[#fff6dc] p-4 text-sm leading-6 text-[#5f543c] dark:border-[#ffe27a]/20 dark:bg-[#ffe27a]/10 dark:text-[#fff1bc]">
      <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <p>{RECIPE_DISCLAIMER}</p>
    </div>
  );
}
