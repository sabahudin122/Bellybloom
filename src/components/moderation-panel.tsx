"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EyeOff, RotateCcw, ShieldCheck, Trash2, UserRoundX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ReportItem = {
  id: string;
  reason: string;
  details: string | null;
  createdAt: string;
  reporter: { name: string };
  post: { id: string; title: string; body: string; status: string; author: { id: string; name: string } } | null;
  comment: { id: string; body: string; status: string; author: { id: string; name: string } } | null;
};

type UserItem = { id: string; name: string; email: string; status: string; role: string };

export function ModerationPanel({ initialReports, initialUsers }: { initialReports: ReportItem[]; initialUsers: UserItem[] }) {
  const router = useRouter();
  const [reports, setReports] = useState(initialReports);
  const [users, setUsers] = useState(initialUsers);
  const [message, setMessage] = useState("");
  const [pendingKey, setPendingKey] = useState("");

  async function moderate(targetType: "POST" | "COMMENT" | "REPORT", targetId: string, action: "HIDE" | "RESTORE" | "DELETE" | "RESOLVE" | "DISMISS") {
    if (action === "DELETE" && !window.confirm("Permanently delete this content?")) return;
    const key = `${targetType}-${targetId}-${action}`;
    setPendingKey(key); setMessage("");
    const response = await fetch("/api/admin/moderate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ targetType, targetId, action, notes: "Reviewed in the admin moderation queue." }) });
    const result = await response.json();
    if (!response.ok) setMessage(result.error ?? "Moderation action failed.");
    else {
      setMessage("Moderation action saved to the audit trail.");
      if (targetType === "REPORT" && (action === "RESOLVE" || action === "DISMISS")) setReports((current) => current.filter((report) => report.id !== targetId));
      if (targetType !== "REPORT" && action === "DELETE") setReports((current) => current.filter((report) => (targetType === "POST" ? report.post?.id : report.comment?.id) !== targetId));
      if (targetType !== "REPORT" && (action === "HIDE" || action === "RESTORE")) setReports((current) => current.map((report) => ({ ...report, post: targetType === "POST" && report.post?.id === targetId ? { ...report.post, status: action === "HIDE" ? "HIDDEN" : "PUBLISHED" } : report.post, comment: targetType === "COMMENT" && report.comment?.id === targetId ? { ...report.comment, status: action === "HIDE" ? "HIDDEN" : "PUBLISHED" } : report.comment })));
      router.refresh();
    }
    setPendingKey("");
  }

  async function changeUserStatus(user: UserItem) {
    const status = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    if (status === "SUSPENDED" && !window.confirm(`Suspend ${user.name}?`)) return;
    const response = await fetch(`/api/admin/users/${user.id}/status`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status, notes: "Changed from the moderation dashboard." }) });
    const result = await response.json();
    if (!response.ok) setMessage(result.error ?? "Could not update this user.");
    else setUsers((current) => current.map((item) => item.id === user.id ? { ...item, status } : item));
  }

  return (
    <div className="space-y-8">
      {message && <p className="rounded-2xl bg-[#eff8ff] p-4 text-sm font-bold text-[#456279] dark:bg-[#a8d8ff]/10 dark:text-slate-200" role="status">{message}</p>}
      <section><div className="flex items-center justify-between"><h2 className="text-2xl font-black">Open reports</h2><Badge>{reports.length} waiting</Badge></div><div className="mt-4 space-y-4">{reports.length === 0 ? <Card className="p-8 text-center font-bold text-[#748095]">The moderation queue is clear.</Card> : reports.map((report) => { const target = report.post ?? report.comment; const targetType = report.post ? "POST" : "COMMENT"; if (!target) return null; return <Card key={report.id} className="p-6"><div className="flex flex-wrap items-center gap-2"><Badge className="bg-[#ffddd0] text-[#7e3723]">{report.reason.toLowerCase().replaceAll("_", " ")}</Badge><span className="text-xs font-bold text-[#8791a4]">Reported by {report.reporter.name} · {new Date(report.createdAt).toLocaleString()}</span></div><h3 className="mt-4 font-black">{report.post?.title ?? `Comment by ${report.comment?.author.name}`}</h3><p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-[#657187] dark:text-slate-300">{target.body}</p>{report.details && <p className="mt-3 rounded-xl bg-[#f7f5ef] p-3 text-xs dark:bg-white/5">Reporter note: {report.details}</p>}<div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={Boolean(pendingKey)} onClick={() => moderate(targetType, target.id, target.status === "HIDDEN" ? "RESTORE" : "HIDE")}>{target.status === "HIDDEN" ? <RotateCcw className="size-4" /> : <EyeOff className="size-4" />}{target.status === "HIDDEN" ? "Restore" : "Hide"}</Button><Button size="sm" variant="danger" disabled={Boolean(pendingKey)} onClick={() => moderate(targetType, target.id, "DELETE")}><Trash2 className="size-4" />Delete</Button><Button size="sm" variant="mint" disabled={Boolean(pendingKey)} onClick={() => moderate("REPORT", report.id, "RESOLVE")}><ShieldCheck className="size-4" />Resolve</Button><Button size="sm" variant="ghost" disabled={Boolean(pendingKey)} onClick={() => moderate("REPORT", report.id, "DISMISS")}>Dismiss</Button></div></Card>; })}</div></section>
      <section><h2 className="text-2xl font-black">User access</h2><div className="mt-4 overflow-hidden rounded-3xl border border-[#26354c]/8 bg-white dark:border-white/10 dark:bg-white/5"><div className="divide-y divide-[#26354c]/8 dark:divide-white/10">{users.map((user) => <div key={user.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black">{user.name} {user.role === "ADMIN" && <Badge>admin</Badge>}</p><p className="text-sm text-[#748095]">{user.email}</p></div><Button size="sm" variant={user.status === "ACTIVE" ? "outline" : "mint"} disabled={user.role === "ADMIN"} onClick={() => changeUserStatus(user)}><UserRoundX className="size-4" />{user.status === "ACTIVE" ? "Suspend" : "Unsuspend"}</Button></div>)}</div></div></section>
    </div>
  );
}
