"use client";

import { useState, useCallback } from "react";
import {
  MessagesSquare, ThumbsUp, Reply, Plus, Loader2, GraduationCap,
  Building2, Calendar, Check, X, Send, Sparkles,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { useIscarbFetch, iscarbMutate } from "@/lib/use-iscarb-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Shared client data layer (was a per-view copy; now centralised).
const useJSON = useIscarbFetch;
const postJSON = iscarbMutate;
const L = (ar: boolean, en: string, arr: string) => (ar ? arr : en);

const ROLE_COLOR: Record<string, string> = {
  student: "#00B4D8", alumni: "#1E8A5A", faculty: "#7C3AED", recruiter: "#B8860B",
};

export function CommunityView() {
  const { ar } = useI18n();
  const { selectedStudentId } = useApp();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-iscarb-cyan-soft text-iscarb-cyan-dark">
          <MessagesSquare className="size-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-iscarb-ink dark:text-white">
            {L(ar, "Community & Mentors", "المجتمع والإرشاد")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {L(ar, "Learn alongside Saudi peers, alumni, and professionals from Aramco, stc, SDAIA and more.", "تعلّم مع أقرانك السعوديين والخرّيجين ومحترفين من أرامكو وstc وسدايا وغيرها.")}
          </p>
        </div>
      </div>

      <Tabs defaultValue="forum" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="forum"><MessagesSquare className="mr-1 size-3.5" />{L(ar, "Community", "المجتمع")}</TabsTrigger>
          <TabsTrigger value="mentors"><GraduationCap className="mr-1 size-3.5" />{L(ar, "Mentorship", "الإرشاد")}</TabsTrigger>
        </TabsList>
        <TabsContent value="forum"><Forum ar={ar} /></TabsContent>
        <TabsContent value="mentors"><Mentors ar={ar} sid={selectedStudentId} /></TabsContent>
      </Tabs>
    </div>
  );
}

// ── Forum ──
interface Post {
  id: string; authorName: string; authorRole: string; category: string; title: string; content: string;
  tags: string[]; upvotes: number; replyCount: number;
  replies: { id: string; authorName: string; authorRole: string; content: string }[];
}
function Forum({ ar }: { ar: boolean }) {
  const [tick, setTick] = useState(0);
  const [cat, setCat] = useState<string | null>(null);
  const { data } = useJSON<{ categories: string[]; posts: Post[] }>(`/api/iscarb/community${cat ? `?category=${cat}` : ""}`, tick);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState({ title: "", content: "", category: "career-advice" });
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const submitPost = async () => {
    if (!draft.title.trim() || !draft.content.trim()) return;
    await postJSON("/api/iscarb/community", { action: "post", ...draft, authorRole: "student" });
    setDraft({ title: "", content: "", category: "career-advice" });
    setComposing(false);
    setTick((t) => t + 1);
  };
  const upvote = async (postId: string) => { await postJSON("/api/iscarb/community", { action: "upvote", postId }); setTick((t) => t + 1); };
  const submitReply = async (postId: string) => {
    if (!replyText.trim()) return;
    await postJSON("/api/iscarb/community", { action: "reply", postId, content: replyText, authorRole: "student" });
    setReplyText(""); setReplyTo(null); setTick((t) => t + 1);
  };

  if (!data) return <Loading />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={cat === null ? "default" : "outline"} onClick={() => setCat(null)}>{L(ar, "All", "الكل")}</Button>
        {data.categories.map((c) => (
          <Button key={c} size="sm" variant={cat === c ? "default" : "outline"} onClick={() => setCat(c)}>{L(ar, c, c)}</Button>
        ))}
        <div className="ml-auto">
          <Button size="sm" onClick={() => setComposing((v) => !v)}><Plus className="mr-1 size-3.5" />{L(ar, "New post", "منشور جديد")}</Button>
        </div>
      </div>

      {composing && (
        <Card className="border-iscarb-cyan/30">
          <CardContent className="space-y-2 p-4">
            <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder={L(ar, "Title", "العنوان")} />
            <Textarea value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} placeholder={L(ar, "Share something useful…", "شارك شيئاً مفيداً…")} rows={3} />
            <div className="flex flex-wrap items-center gap-2">
              {data.categories.map((c) => (
                <Button key={c} size="sm" variant={draft.category === c ? "default" : "ghost"} className="h-7 text-[11px]" onClick={() => setDraft({ ...draft, category: c })}>{L(ar, c, c)}</Button>
              ))}
              <Button size="sm" className="ml-auto" onClick={submitPost}><Send className="mr-1 size-3.5" />{L(ar, "Post", "نشر")}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {data.posts.map((p) => (
        <Card key={p.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base">{p.title}</CardTitle>
              <Badge variant="outline" className="shrink-0 text-[10px]">{L(ar, p.category, p.category)}</Badge>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium" style={{ color: ROLE_COLOR[p.authorRole] ?? "inherit" }}>{p.authorName}</span>
              <Badge variant="secondary" className="text-[9px]">{L(ar, p.authorRole, p.authorRole)}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{p.content}</p>
            {p.tags.length > 0 && <div className="flex flex-wrap gap-1">{p.tags.map((t) => <Badge key={t} variant="outline" className="text-[10px]">#{t}</Badge>)}</div>}
            <div className="flex items-center gap-3 text-sm">
              <button onClick={() => upvote(p.id)} className="inline-flex items-center gap-1 text-muted-foreground hover:text-iscarb-green">
                <ThumbsUp className="size-3.5" /> {p.upvotes}
              </button>
              <button onClick={() => setReplyTo(replyTo === p.id ? null : p.id)} className="inline-flex items-center gap-1 text-muted-foreground hover:text-iscarb-cyan-dark">
                <Reply className="size-3.5" /> {p.replyCount}
              </button>
            </div>
            {p.replies.length > 0 && (
              <div className="space-y-1.5 border-l-2 border-border/50 pl-3">
                {p.replies.map((r) => (
                  <div key={r.id} className="text-sm">
                    <span className="font-medium" style={{ color: ROLE_COLOR[r.authorRole] ?? "inherit" }}>{r.authorName}: </span>
                    <span className="text-muted-foreground">{r.content}</span>
                  </div>
                ))}
              </div>
            )}
            {replyTo === p.id && (
              <div className="flex gap-2">
                <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder={L(ar, "Write a reply…", "اكتب رداً…")} className="h-9" />
                <Button size="sm" onClick={() => submitReply(p.id)}><Send className="size-3.5" /></Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Mentorship ──
interface MentorMatch { matchScore: number; sscoScore: number; expertiseScore: number }
interface Mentor { id: string; name: string; employer: string; title: string; expertise: string[]; bio: string | null; match?: MentorMatch | null }
interface Session { id: string; topic: string; scheduledAt: string; status: string; mentor: { name: string; employer: string; title: string } }

function matchBadgeClass(score: number): string {
  if (score >= 70) return "bg-iscarb-green text-white";
  if (score >= 40) return "bg-iscarb-cyan-soft text-iscarb-cyan-dark";
  return "bg-muted text-muted-foreground";
}

function Mentors({ ar, sid }: { ar: boolean; sid: string | null }) {
  const [tick, setTick] = useState(0);
  const { data } = useJSON<{ mentors: Mentor[]; sessions: Session[]; matched: boolean }>(sid ? `/api/iscarb/mentorship?studentId=${sid}` : `/api/iscarb/mentorship`, tick);
  const book = useCallback(async (mentorId: string, topic: string) => {
    if (!sid) return;
    await postJSON("/api/iscarb/mentorship", { action: "book", mentorId, studentId: sid, topic });
    setTick((t) => t + 1);
  }, [sid]);
  const update = async (sessionId: string, action: string) => {
    await postJSON("/api/iscarb/mentorship", { action, sessionId, rating: action === "complete" ? 5 : undefined });
    setTick((t) => t + 1);
  };
  if (!data) return <Loading />;
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="grid gap-4 sm:grid-cols-2">
        {data.matched && (
          <p className="sm:col-span-2 text-xs text-muted-foreground">
            <Sparkles className="mr-1 inline size-3 text-iscarb-gold-dark" />
            {L(ar, "Sorted by fit to your target occupation and skills.", "مرتَّبون حسب توافقهم مع مهنتك المستهدفة ومهاراتك.")}
          </p>
        )}
        {data.mentors.map((m) => (
          <Card key={m.id} className={m.match && m.match.matchScore >= 70 ? "border-iscarb-green/40" : undefined}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{m.name}</CardTitle>
                {m.match != null && (
                  <Badge className={matchBadgeClass(m.match.matchScore)}>{m.match.matchScore}% {L(ar, "fit", "توافق")}</Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Building2 className="size-3" />{m.title} · {m.employer}</div>
            </CardHeader>
            <CardContent className="space-y-3">
              {m.bio && <p className="text-sm text-muted-foreground">{m.bio}</p>}
              <div className="flex flex-wrap gap-1">{m.expertise.map((e) => <Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>)}</div>
              <div className="flex flex-wrap gap-1.5">
                {["career-advice", "technical", "interview-prep"].map((tp) => (
                  <Button key={tp} size="sm" variant="outline" className="h-7 text-[11px]" disabled={!sid} onClick={() => book(m.id, tp)}>
                    <Calendar className="mr-1 size-3" />{L(ar, tp, tp)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="h-fit">
        <CardHeader className="pb-3"><CardTitle className="text-base">{L(ar, "Your sessions", "جلساتك")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {!sid && <p className="text-sm text-muted-foreground">{L(ar, "Select a student to book.", "اختر طالباً للحجز.")}</p>}
          {sid && data.sessions.length === 0 && <p className="text-sm text-muted-foreground">{L(ar, "No sessions yet.", "لا جلسات بعد.")}</p>}
          {data.sessions.map((s) => (
            <div key={s.id} className="rounded-lg border border-border/50 p-2.5">
              <div className="text-sm font-medium">{s.mentor.name}</div>
              <div className="text-xs text-muted-foreground">{L(ar, s.topic, s.topic)} · {new Date(s.scheduledAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}</div>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">{L(ar, s.status, s.status)}</Badge>
                {s.status === "scheduled" && (
                  <>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => update(s.id, "complete")}><Check className="mr-0.5 size-3" />{L(ar, "Done", "تمّت")}</Button>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => update(s.id, "cancel")}><X className="mr-0.5 size-3" />{L(ar, "Cancel", "إلغاء")}</Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Loading() {
  return <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>;
}

export default CommunityView;
