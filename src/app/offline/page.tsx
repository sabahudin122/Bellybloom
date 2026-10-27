import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Logo } from "@/components/logo";

export default function OfflinePage() {
  return <main className="grid min-h-screen place-items-center bg-[#fffaf1] px-5 dark:bg-[#101a2b]"><section className="max-w-lg rounded-[2rem] bg-white p-8 text-center shadow-[0_24px_70px_rgba(38,53,76,.14)] dark:bg-[#172237]"><Logo className="justify-center" /><span className="mx-auto mt-8 grid size-16 place-items-center rounded-3xl bg-[#dceeff] text-[#34566e]"><WifiOff className="size-8" /></span><h1 className="mt-5 text-3xl font-black tracking-[-.045em]">You&apos;re offline</h1><p className="mt-3 leading-7 text-[#69758a] dark:text-slate-300">Reconnect to access private baby profiles, meal plans, community posts, and account data. Bellybloom does not cache those sensitive pages offline.</p><Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#26354c] px-6 text-sm font-black text-white">Try again</Link></section></main>;
}
