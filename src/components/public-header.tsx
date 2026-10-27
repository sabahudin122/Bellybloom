import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";

export async function PublicHeader() {
  const session = await getServerSession(authOptions);
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
      <Logo />
      <nav className="hidden items-center gap-7 text-sm font-bold text-[#56637a] md:flex dark:text-slate-300">
        <Link href="/age-guide" className="hover:text-[#f17f5a]">Age guide</Link>
        <Link href="/recipes" className="hover:text-[#f17f5a]">Recipes</Link>
        <Link href="/#safety" className="hover:text-[#f17f5a]">Safety</Link>
      </nav>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {session ? (
          <Link href="/dashboard" className={buttonVariants({ variant: "primary", size: "sm" })}>Dashboard</Link>
        ) : (
          <>
            <Link href="/login" className="hidden px-3 text-sm font-extrabold text-[#46536a] sm:block dark:text-slate-200">Log in</Link>
            <Link href="/register" className={buttonVariants({ variant: "peach", size: "sm" })}>Join free</Link>
          </>
        )}
      </div>
    </header>
  );
}
