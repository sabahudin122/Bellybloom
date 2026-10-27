"use client";

import { Activity, Baby, CalendarDays, MessageCircle, Sparkles, Users } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";

type Stats = {
  totalUsers: number;
  activeToday: number;
  active7Days: number;
  active30Days: number;
  babies: number;
  mealPlans: number;
  posts: number;
};

export function AdminAnalytics({ stats, registrations }: { stats: Stats; registrations: Array<{ date: string; users: number }> }) {
  const cards = [
    { label: "Registered users", value: stats.totalUsers, icon: Users, color: "bg-[#ffddd0] text-[#7e3723]" },
    { label: "Active today", value: stats.activeToday, icon: Activity, color: "bg-[#cff4e4] text-[#285f4d]" },
    { label: "Baby profiles", value: stats.babies, icon: Baby, color: "bg-[#dceeff] text-[#34566e]" },
    { label: "Menus generated", value: stats.mealPlans, icon: Sparkles, color: "bg-[#fff0b6] text-[#66531f]" },
    { label: "Forum posts", value: stats.posts, icon: MessageCircle, color: "bg-[#eee4ff] text-[#4f426f]" },
  ];
  return <section><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{cards.map(({ label, value, icon: Icon, color }) => <Card key={label} className="p-5"><span className={`grid size-11 place-items-center rounded-2xl ${color}`}><Icon className="size-5" /></span><p className="mt-5 text-3xl font-black">{value}</p><p className="text-sm font-bold text-[#748095] dark:text-slate-300">{label}</p></Card>)}</div><div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_.6fr]"><Card className="p-6"><div className="flex items-center gap-3"><CalendarDays className="size-5 text-[#d86543]" /><div><h2 className="text-xl font-black">New registrations</h2><p className="text-sm text-[#748095]">Last 30 days</p></div></div><div className="mt-6 h-64" aria-label="New registrations line chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={registrations}><CartesianGrid strokeDasharray="4 4" stroke="#d8dce3" /><XAxis dataKey="date" tick={{ fontSize: 11 }} interval={5} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey="users" stroke="#dd6d4b" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></div></Card><Card className="p-6"><h2 className="text-xl font-black">Active families</h2><div className="mt-6 space-y-5">{[{ label: "Today", value: stats.activeToday }, { label: "Last 7 days", value: stats.active7Days }, { label: "Last 30 days", value: stats.active30Days }].map((item) => <div key={item.label}><div className="flex justify-between text-sm font-black"><span>{item.label}</span><span>{item.value}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#ece9e1] dark:bg-white/10"><div className="h-full rounded-full bg-[#9ee7c7]" style={{ width: `${stats.totalUsers ? Math.max(4, (item.value / stats.totalUsers) * 100) : 0}%` }} /></div></div>)}</div></Card></div></section>;
}
