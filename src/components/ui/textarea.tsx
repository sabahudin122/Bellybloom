import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full resize-y rounded-2xl border border-[#26354c]/15 bg-white px-4 py-3 text-[15px] text-[#26354c] outline-none transition placeholder:text-[#8791a4] focus:border-[#ff936b] focus:ring-4 focus:ring-[#ffb997]/25 dark:border-white/15 dark:bg-white/5 dark:text-white",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
