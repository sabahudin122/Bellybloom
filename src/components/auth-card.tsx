import Link from "next/link";
import { Logo } from "@/components/logo";

export function AuthCard({
  title,
  description,
  alternateText,
  alternateHref,
  alternateLabel,
  children,
}: {
  title: string;
  description: string;
  alternateText: string;
  alternateHref: string;
  alternateLabel: string;
  children: React.ReactNode;
}) {
  return (
    <main className="soft-grid grid min-h-screen place-items-center bg-[#fffaf1] px-4 py-10 dark:bg-[#101a2b]">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center"><Logo className="justify-center" /></div>
        <div className="rounded-[2rem] border border-[#26354c]/10 bg-white p-6 shadow-[0_28px_70px_rgba(38,53,76,.13)] sm:p-8 dark:border-white/10 dark:bg-[#172237]">
          <h1 className="text-3xl font-black tracking-[-.04em] text-[#26354c] dark:text-white">{title}</h1>
          <p className="mt-2 leading-7 text-[#758096] dark:text-slate-300">{description}</p>
          <div className="mt-7">{children}</div>
        </div>
        <p className="mt-6 text-center text-sm font-bold text-[#68758a] dark:text-slate-300">
          {alternateText} <Link href={alternateHref} className="text-[#dc6c49] underline-offset-4 hover:underline">{alternateLabel}</Link>
        </p>
      </div>
    </main>
  );
}
