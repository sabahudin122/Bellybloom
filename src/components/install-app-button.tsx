"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallAppButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const handler = (event: Event) => { event.preventDefault(); setPromptEvent(event as InstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setMessage(choice.outcome === "accepted" ? "Bellybloom installation started." : "Installation was dismissed.");
    setPromptEvent(null);
  }
  return <div><Button type="button" variant="mint" onClick={install} disabled={!promptEvent}><Download className="size-4" />{promptEvent ? "Install Bellybloom" : "Install option unavailable"}</Button>{message && <p className="mt-2 text-sm font-bold text-[#667188]" role="status">{message}</p>}<p className="mt-2 text-xs text-[#8791a4]">Supported browsers show the install option after their PWA criteria are met.</p></div>;
}
