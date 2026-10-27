import { PageHeading } from "@/components/page-heading";
import { AccountSettings } from "@/components/account-settings";
import { InstallAppButton } from "@/components/install-app-button";

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <PageHeading eyebrow="Privacy & control" title="Settings" description="Bellybloom uses child age, feeding notes, and allergy data only to provide and safety-check the requested features. It is never sent to the browser as a secret or used to train a model by this application." />
      <section className="mt-8 rounded-[1.75rem] border border-[#26354c]/8 bg-white p-6 shadow-[0_18px_55px_rgba(37,50,74,.08)] sm:p-8 dark:border-white/10 dark:bg-[#172237]"><h2 className="text-xl font-black">Installable app</h2><p className="mt-2 mb-5 max-w-2xl leading-7 text-[#718096] dark:text-slate-300">Install Bellybloom for a standalone app experience. Private profiles and API responses are never cached by the service worker.</p><InstallAppButton /></section>
      <div className="mt-8"><AccountSettings /></div>
    </main>
  );
}
