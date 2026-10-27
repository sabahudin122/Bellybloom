import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-extrabold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffb997]/35 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[#24334b] text-white shadow-[0_10px_25px_rgba(36,51,75,.2)] hover:-translate-y-0.5 hover:bg-[#18253a]",
        peach: "bg-[#ff936b] text-[#25324a] shadow-[0_10px_25px_rgba(255,147,107,.28)] hover:-translate-y-0.5 hover:bg-[#ff8255]",
        mint: "bg-[#9ee7c7] text-[#173a31] hover:bg-[#86dcb6]",
        outline: "border border-[#26354c]/15 bg-white/80 text-[#26354c] hover:bg-white dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10",
        ghost: "text-[#526079] hover:bg-[#26354c]/7 dark:text-slate-200 dark:hover:bg-white/10",
        danger: "bg-red-600 text-white hover:bg-red-700",
      },
      size: {
        default: "min-h-11 px-5",
        sm: "min-h-10 px-4 text-xs",
        lg: "min-h-13 px-7 text-base",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
