"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CheckCircle2, Flag, Heart, MessageCircle, Pencil, Reply, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { initials } from "@/lib/utils";

type CommentItem = {
  id: string;
  parentId: string | null;
  authorId: string;
  body: string;
  isBestAnswer: boolean;
  createdAt: string;
  author: { id: string; name: string };
};

function ReportControl({ postId, commentId }: { postId?: string; commentId?: string }) {
  const [status, setStatus] = useState("");
  async function report() {
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ postId, commentId, reason: "OTHER", details: "Submitted from the community report control." }),
    });
    const result = await response.json();
    setStatus(response.ok ? "Reported for moderator review." : result.error ?? "Could not submit report.");
  }
  return <div><Button type="button" variant="ghost" size="sm" onClick={report}><Flag className="size-3.5" />Report</Button>{status && <p className="mt-1 text-xs font-bold text-[#7a6470]" role="status">{status}</p>}</div>;
}

export function CommunityThread({
  postId,
  postAuthorId,
  currentUserId,
  initialComments,
  initialLiked,
  initialLikeCount,
}: {
  postId: string;
  postAuthorId: string;
  currentUserId: string;
  initialComments: CommentItem[];
  initialLiked: boolean;
  initialLikeCount: number;
}) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, CommentItem[]>();
    for (const comment of comments) map.set(comment.parentId, [...(map.get(comment.parentId) ?? []), comment]);
    return map;
  }, [comments]);

  async function toggleLike() {
    const response = await fetch(`/api/posts/${postId}/likes`, { method: "POST" });
    const result = await response.json();
    if (response.ok) { setLiked(result.liked); setLikeCount(result.count); }
  }

  async function addComment() {
    if (body.trim().length < 2) return;
    setPending(true); setError("");
    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body, parentId: replyTo?.id ?? null }),
    });
    const result = await response.json();
    if (!response.ok) setError(result.error ?? "Could not add comment.");
    else { setComments((current) => [...current, { ...result.comment, createdAt: result.comment.createdAt }]); setBody(""); setReplyTo(null); }
    setPending(false);
  }

  async function saveComment(commentId: string) {
    const response = await fetch(`/api/comments/${commentId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ body: editingBody }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error ?? "Could not update comment."); return; }
    setComments((current) => current.map((comment) => comment.id === commentId ? { ...comment, body: result.comment.body } : comment));
    setEditingId(null);
  }

  async function deleteComment(commentId: string) {
    if (!window.confirm("Delete this comment and its replies?")) return;
    const response = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    if (response.ok) {
      const remove = new Set([commentId]);
      let changed = true;
      while (changed) { changed = false; for (const comment of comments) if (comment.parentId && remove.has(comment.parentId) && !remove.has(comment.id)) { remove.add(comment.id); changed = true; } }
      setComments((current) => current.filter((comment) => !remove.has(comment.id)));
    }
  }

  async function markBest(commentId: string) {
    const response = await fetch(`/api/comments/${commentId}/best`, { method: "POST" });
    if (response.ok) setComments((current) => current.map((comment) => ({ ...comment, isBestAnswer: comment.id === commentId })));
  }

  async function deletePost() {
    if (!window.confirm("Delete this post and all comments?")) return;
    const response = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    if (response.ok) { router.push("/community"); router.refresh(); }
  }

  function renderComment(comment: CommentItem, depth = 0): React.ReactNode {
    const own = comment.authorId === currentUserId;
    return <div key={comment.id} className={depth ? "ml-5 border-l-2 border-[#cdb4ff]/40 pl-4 sm:ml-10" : ""}><article className={`rounded-3xl border p-5 ${comment.isBestAnswer ? "border-[#6bc9a6] bg-[#effaf5] dark:bg-[#9ee7c7]/10" : "border-[#26354c]/8 bg-white dark:border-white/10 dark:bg-white/5"}`}><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#cdb4ff] text-sm font-black text-[#3f3462]">{initials(comment.author.name)}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong>{comment.author.name.split(" ")[0]}</strong><span className="text-xs font-bold text-[#8a94a5]">{new Date(comment.createdAt).toLocaleString()}</span>{comment.isBestAnswer && <Badge className="bg-[#9ee7c7] text-[#285f4d]"><CheckCircle2 className="mr-1 size-3" />Best answer</Badge>}</div>{editingId === comment.id ? <div className="mt-3"><Textarea value={editingBody} onChange={(event) => setEditingBody(event.target.value)} /><div className="mt-2 flex gap-2"><Button size="sm" onClick={() => saveComment(comment.id)}>Save</Button><Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button></div></div> : <p className="mt-3 whitespace-pre-wrap leading-7 text-[#56647a] dark:text-slate-300">{comment.body}</p>}<div className="mt-3 flex flex-wrap items-start gap-1"><Button type="button" variant="ghost" size="sm" onClick={() => { setReplyTo(comment); setBody(""); }}><Reply className="size-3.5" />Reply</Button>{own && <><Button type="button" variant="ghost" size="sm" onClick={() => { setEditingId(comment.id); setEditingBody(comment.body); }}><Pencil className="size-3.5" />Edit</Button><Button type="button" variant="ghost" size="sm" onClick={() => deleteComment(comment.id)}><Trash2 className="size-3.5" />Delete</Button></>}{postAuthorId === currentUserId && !comment.isBestAnswer && <Button type="button" variant="ghost" size="sm" onClick={() => markBest(comment.id)}><CheckCircle2 className="size-3.5" />Best answer</Button>}{!own && <ReportControl commentId={comment.id} />}</div></div></div></article><div className="mt-3 space-y-3">{(childrenByParent.get(comment.id) ?? []).map((child) => renderComment(child, depth + 1))}</div></div>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2"><Button type="button" variant={liked ? "peach" : "outline"} onClick={toggleLike}><Heart className="size-4" fill={liked ? "currentColor" : "none"} />{likeCount} hugs</Button>{postAuthorId === currentUserId ? <><Link href={`/community/${postId}/edit`} className="inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-extrabold text-[#526079] hover:bg-[#26354c]/7"><Pencil className="size-4" />Edit post</Link><Button variant="ghost" onClick={deletePost}><Trash2 className="size-4" />Delete post</Button></> : <ReportControl postId={postId} />}</div>
      <section className="mt-8"><div className="flex items-center gap-2"><MessageCircle className="size-5 text-[#d86543]" /><h2 className="text-2xl font-black">Conversation</h2></div><div className="mt-4 rounded-3xl bg-[#f7f5ef] p-5 dark:bg-white/5">{replyTo && <div className="mb-3 flex items-center justify-between rounded-2xl bg-[#eee4ff] px-4 py-2 text-sm font-bold text-[#4f426f]"><span>Replying to {replyTo.author.name.split(" ")[0]}</span><button onClick={() => setReplyTo(null)}>Cancel</button></div>}<Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder={replyTo ? "Write a thoughtful reply..." : "Add to the conversation..."} /><div className="mt-3"><Button type="button" variant="mint" disabled={pending} onClick={addComment}>{pending ? "Posting..." : replyTo ? "Post reply" : "Post comment"}</Button></div>{error && <p className="mt-3 text-sm font-bold text-red-700" role="alert">{error}</p>}</div><div className="mt-6 space-y-4">{(childrenByParent.get(null) ?? []).map((comment) => renderComment(comment))}{comments.length === 0 && <p className="rounded-3xl border border-dashed border-[#26354c]/15 p-8 text-center text-sm font-bold text-[#788499]">Be the first to reply.</p>}</div></section>
    </div>
  );
}
