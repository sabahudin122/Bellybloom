"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountSettings() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function deleteAccount() {
    if (!password || !window.confirm("Permanently delete your account, baby profiles, meal plans, and related data? This cannot be undone.")) return;
    setPending(true);
    setMessage("");
    const response = await fetch("/api/account", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error ?? "Could not delete the account.");
      setPending(false);
      return;
    }
    await signOut({ callbackUrl: "/" });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[1.75rem] border border-[#26354c]/8 bg-white p-6 shadow-[0_18px_55px_rgba(37,50,74,.08)] sm:p-8 dark:border-white/10 dark:bg-[#172237]">
        <h2 className="text-xl font-black">Export your data</h2>
        <p className="mt-2 max-w-2xl leading-7 text-[#718096] dark:text-slate-300">Download account details, baby and allergy data, diaries, plans, favorites, private recipes, community content, reports, and safety rejection records as JSON.</p>
        <a href="/api/account/export" className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#26354c]/15 bg-white px-5 text-sm font-extrabold text-[#26354c] transition hover:bg-[#f5f3ed] dark:border-white/15 dark:bg-white/5 dark:text-white"><Download className="size-4" />Download my data</a>
      </section>
      <section className="rounded-[1.75rem] border border-red-200 bg-white p-6 shadow-[0_18px_55px_rgba(37,50,74,.08)] sm:p-8 dark:border-red-900/50 dark:bg-[#172237]">
        <h2 className="text-xl font-black text-red-700 dark:text-red-300">Delete account and data</h2>
        <p className="mt-2 max-w-2xl leading-7 text-[#718096] dark:text-slate-300">Deletion removes your account and cascades to owned profiles, diaries, plans, favorites, private recipes, and community data. Enter your password to confirm.</p>
        <div className="mt-5 max-w-sm"><Label htmlFor="delete-password">Current password</Label><Input id="delete-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></div>
        {message && <p className="mt-3 text-sm font-bold text-red-600" role="alert">{message}</p>}
        <Button variant="danger" className="mt-5" disabled={!password || pending} onClick={deleteAccount}><Trash2 className="size-4" />{pending ? "Deleting…" : "Delete my account"}</Button>
      </section>
    </div>
  );
}
