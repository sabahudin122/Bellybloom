import Link from "next/link";
import { Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-3 text-[#24334b] dark:text-white", className)}>
      <span className="grid size-11 place-items-center rounded-2xl bg-[#9ee7c7] text-[#183c34] shadow-[0_8px_24px_rgba(80,190,145,.25)]">
        <Sprout className="size-6" strokeWidth={2.4} aria-hidden="true" />
      </span>
      {!compact && (
        <span className="text-xl font-black tracking-[-0.04em]">
          belly<span className="text-[#f17f5a]">bloom</span>
        </span>
      )}
    </Link>
  );
}
