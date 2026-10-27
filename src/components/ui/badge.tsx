import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full bg-[#f1eee7] px-3 py-1 text-xs font-extrabold text-[#536078] dark:bg-white/10 dark:text-slate-200",
        className,
      )}
      {...props}
    />
  );
}
