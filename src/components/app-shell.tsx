"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Baby,
  BookOpen,
  Home,
  Heart,
  LogOut,
  MessageCircle,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn, initials } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/babies", label: "My babies", icon: Baby },
  { href: "/recipes", label: "Recipes", icon: BookOpen },
  { href: "/community", label: "Community", icon: MessageCircle },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/age-guide", label: "Age guide", icon: ShieldCheck },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children, name, role }: { children: React.ReactNode; name?: string | null; role: string }) {
  const pathname = usePathname();
  const activeItems = role === "ADMIN" ? [...items, { href: "/admin", label: "Admin", icon: ShieldCheck }] : items;
  const mobileItems = items.filter((item) => item.href !== "/age-guide");

  return (
    <div className="min-h-screen bg-[#f8f6ef] dark:bg-[#0f192a]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-[#26354c]/8 bg-white p-5 lg:flex dark:border-white/10 dark:bg-[#142036]">
        <Logo className="px-2" />
        <nav className="mt-10 space-y-1.5" aria-label="Main navigation">
          {activeItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return <Link key={href} href={href} className={cn("flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-extrabold transition", active ? "bg-[#fff0e8] text-[#b95031] dark:bg-[#ff936b]/15 dark:text-[#ffc0ab]" : "text-[#667188] hover:bg-[#26354c]/5 dark:text-slate-300 dark:hover:bg-white/5")}><Icon className="size-5" />{label}</Link>;
          })}
        </nav>
        <div className="mt-auto rounded-3xl bg-[#f4f7f1] p-4 dark:bg-white/5">
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-[#cdb4ff] font-black text-[#3f3462]">{initials(name)}</span><div className="min-w-0"><p className="truncate text-sm font-black text-[#26354c] dark:text-white">{name}</p><p className="text-xs font-bold text-[#8490a2]">{role === "ADMIN" ? "Administrator" : "Family account"}</p></div></div>
          <div className="mt-3 flex items-center justify-between"><ThemeToggle /><Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}><LogOut className="size-4" /> Sign out</Button></div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-[#26354c]/8 bg-[#f8f6ef]/90 px-4 backdrop-blur lg:hidden dark:border-white/10 dark:bg-[#0f192a]/90"><Logo /><div className="flex items-center gap-1"><ThemeToggle /><Button variant="ghost" size="icon" aria-label="Sign out" onClick={() => signOut({ callbackUrl: "/" })}><LogOut className="size-5" /></Button></div></header>
      <div className="pb-24 lg:ml-64 lg:pb-0">{children}</div>

      <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-6 rounded-[1.5rem] border border-[#26354c]/10 bg-white/95 p-1.5 shadow-[0_18px_50px_rgba(25,35,50,.18)] backdrop-blur lg:hidden dark:border-white/10 dark:bg-[#172237]/95" aria-label="Mobile navigation">
        {mobileItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return <Link key={href} href={href} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-black", active ? "bg-[#fff0e8] text-[#bd5637] dark:bg-[#ff936b]/15 dark:text-[#ffc0ab]" : "text-[#738096] dark:text-slate-400")}><Icon className="size-5" /><span>{label.replace("My ", "")}</span></Link>;
        })}
      </nav>
    </div>
  );
}
