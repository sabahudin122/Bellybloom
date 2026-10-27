import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Plus, ChevronRight } from "lucide-react";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { calculateAge } from "@/lib/age";
import { PageHeading } from "@/components/page-heading";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function BabiesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const babies = await prisma.baby.findMany({ where: { userId: session.user.id }, include: { allergies: true }, orderBy: { createdAt: "asc" } });
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <PageHeading eyebrow="Family profiles" title="My babies" description="Age, feeding notes, and allergy information used to personalize safety checks." action={<Link href="/onboarding" className={buttonVariants({ variant: "peach" })}><Plus className="size-4" /> Add a baby</Link>} />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {babies.map((baby, index) => {
          const age = calculateAge(baby.dateOfBirth);
          return <Link href={`/babies/${baby.id}`} key={baby.id}><Card className="group h-full overflow-hidden transition hover:-translate-y-1 hover:shadow-[0_25px_65px_rgba(38,53,76,.13)]"><div className={`${["bg-[#ffddd0]", "bg-[#cff4e4]", "bg-[#dceeff]"][index % 3]} p-6 text-[#26354c]`}><span className="text-5xl" aria-hidden="true">{["🌼", "🌱", "🦋"][index % 3]}</span><h2 className="mt-4 text-2xl font-black">{baby.name}</h2><p className="font-bold">{age.label}</p></div><div className="p-6"><div className="flex flex-wrap gap-2"><Badge>{baby.allergyStatus === "NO" ? "No known allergies" : baby.allergyStatus === "NOT_SURE" ? "Allergies not sure" : `${baby.allergies.length} known allergen${baby.allergies.length === 1 ? "" : "s"}`}</Badge></div><p className="mt-5 flex items-center justify-between font-black text-[#d86543]">Open profile <ChevronRight className="size-5 transition group-hover:translate-x-1" /></p></div></Card></Link>;
        })}
      </div>
      {babies.length === 0 && <Card className="mt-8 p-10 text-center"><p className="text-5xl">🌱</p><h2 className="mt-4 text-xl font-black">Start with one little profile</h2><Link href="/onboarding" className={buttonVariants({ variant: "peach", className: "mt-5" })}>Add your baby</Link></Card>}
    </main>
  );
}
