"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
  Crown,
  Flame,
  Gift,
  Loader2,
  Medal,
  Rocket,
  ShieldCheck,
  Swords,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/lib/store";
import { useApiQuery } from "@/lib/use-api-query";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
//  Types — match /api/iscarb/challenges response
// ─────────────────────────────────────────────────────────────────────────────
interface Challenge {
  id: string;
  company: string;
  sector: string;
  title: string;
  brief: string;
  difficulty: string; // "beginner" | "intermediate" | "advanced"
  reward: string;
  deadline: string; // ISO date
  status: string; // "open" | "closed" | "judging"
  skills: string[];
  teamCount: number;
  totalParticipants: number;
}
interface ChallengesResponse {
  challenges: Challenge[];
}

interface StudentBrief {
  id: string;
  name: string;
  program: string;
  readinessScore: number;
}
interface StudentsResponse {
  students: StudentBrief[];
}

interface TeamMember {
  id: string;
  role: string;
  student?: { id: string; name: string; program?: string };
}
interface ChallengeTeam {
  id: string;
  name: string;
  submission?: string | null;
  members: TeamMember[];
  challenge?: { id: string; title: string; company: string };
}
interface SubmitResponse {
  team: ChallengeTeam;
}

// Local fallback (in case API is offline) — keeps the demo presentable.
const FALLBACK_CHALLENGES: Challenge[] = [
  {
    id: "fb-1",
    company: "Saudi Aramco",
    sector: "Energy",
    title: "Predictive maintenance for downstream pumps",
    brief:
      "Reduce unplanned downtime on a downstream refinery pump fleet by building a predictive maintenance model from SCADA + vibration sensor logs.",
    difficulty: "advanced",
    reward: "SAR 25,000 + fast-track interview",
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 18).toISOString(),
    status: "open",
    skills: ["Time-series ML", "Sensor fusion", "MLOps", "HSE compliance"],
    teamCount: 4,
    totalParticipants: 11,
  },
  {
    id: "fb-2",
    company: "stc",
    sector: "Telecom",
    title: "5G network-slicing orchestrator proof-of-concept",
    brief:
      "Prototype a slicing orchestrator that allocates 5G network slices for industrial IoT with guaranteed latency under varying load.",
    difficulty: "intermediate",
    reward: "SAR 18,000 + stc bootcamp seat",
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 9).toISOString(),
    status: "open",
    skills: ["5G network slicing", "Kubernetes", "Latency budgeting", "SLO engineering"],
    teamCount: 2,
    totalParticipants: 6,
  },
  {
    id: "fb-3",
    company: "Al Rajhi Bank",
    sector: "Banking",
    title: "AML false-positive reducer for cross-border wires",
    brief:
      "Cut the AML alert false-positive rate on cross-border wires by 30% while preserving SAMA-mandated recall.",
    difficulty: "advanced",
    reward: "SAR 22,000 + Al Rajhi internship",
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    status: "open",
    skills: ["AML analytics", "Graph ML", "SAMA compliance", "Model audit"],
    teamCount: 3,
    totalParticipants: 9,
  },
  {
    id: "fb-4",
    company: "SDAIA",
    sector: "Government",
    title: "PDPL-aware data sharing sandbox",
    brief:
      "Build a sandbox that lets two ministries share a dataset under PDPL constraints with auditable consent and redaction.",
    difficulty: "intermediate",
    reward: "SAR 15,000 + SDAIA mentorship",
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString(),
    status: "open",
    skills: ["PDPL engineering", "Differential privacy", "Audit logging", "Consent UX"],
    teamCount: 1,
    totalParticipants: 4,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  ArenaView
// ─────────────────────────────────────────────────────────────────────────────
export function ArenaView() {
  const { data: challengesData, isLoading: challengesLoading, error: challengesError } =
    useApiQuery<ChallengesResponse>(["challenges"], "/api/iscarb/challenges");
  const { data: studentsData, isLoading: studentsLoading } =
    useApiQuery<StudentsResponse>(["students"], "/api/iscarb/students");

  const challenges = challengesData?.challenges?.length
    ? challengesData.challenges
    : FALLBACK_CHALLENGES;
  const students = studentsData?.students ?? [];

  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [submittedTeams, setSubmittedTeams] = useState<ChallengeTeam[]>([]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Header totalOpen={challenges.filter((c) => c.status === "open").length} />

      {/* ── Why this matters ─────────────────────────────────────────────── */}
      <Card className="mb-6 overflow-hidden border-iscarb-green/25 shadow-brand">
        <div className="bg-brand-mesh">
          <CardContent className="relative grid gap-4 py-5 md:grid-cols-[auto_1fr] md:items-center">
            <div className="grid-dots pointer-events-none absolute inset-0 opacity-15" />
            <div className="relative flex size-12 items-center justify-center rounded-xl bg-iscarb-gold-soft text-iscarb-gold-dark shadow-gold">
              <Swords className="size-6" />
            </div>
            <div className="relative">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-iscarb-gold-dark">
                Why this matters
              </div>
              <div className="mt-1 font-display text-lg font-bold text-iscarb-ink dark:text-white sm:text-xl">
                Real problems from real employers.{" "}
                <span className="text-gradient-brand">Solve one and skip the interview line.</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Every challenge on this board is sourced from a Saudi employer with an open mandate.
                Form a team, submit a working solution, and your artefact becomes your interview.
              </p>
            </div>
          </CardContent>
        </div>
      </Card>

      {challengesError && (
        <div className="alert-iron mb-6 rounded-lg p-3 text-xs text-destructive">
          Could not load live challenges — showing the local challenge board.
        </div>
      )}

      {/* ── Challenge grid ───────────────────────────────────────────────── */}
      {challengesLoading ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <Card className="mb-6 border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No open challenges right now. Check back tomorrow — employers post new briefs weekly.
          </CardContent>
        </Card>
      ) : (
        <motion.div
          className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          {challenges.map((c) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              onOpen={() => setActiveChallenge(c)}
            />
          ))}
        </motion.div>
      )}

      {/* ── Leaderboard placeholder ──────────────────────────────────────── */}
      <LeaderboardPlaceholder submittedTeams={submittedTeams} />

      {/* ── Submit dialog ────────────────────────────────────────────────── */}
      <SubmitDialog
        challenge={activeChallenge}
        students={students}
        studentsLoading={studentsLoading}
        onClose={() => setActiveChallenge(null)}
        onSubmitted={(team) => {
          setSubmittedTeams((prev) => [team, ...prev]);
          setActiveChallenge(null);
        }}
      />

      {/* ── Footer discipline memo ──────────────────────────────────────── */}
      <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-iscarb-gold/30 bg-iscarb-gold-soft/40 p-4">
        <div className="flex items-start gap-3">
          <Flame className="mt-0.5 size-5 text-iscarb-gold-dark" />
          <div>
            <div className="text-sm font-semibold text-iscarb-ink dark:text-white">
              A challenge is not homework. It is a job interview you can win tonight.
            </div>
            <div className="text-xs text-muted-foreground">
              Submit by the deadline or forfeit the slot. No late entries, no extensions.
            </div>
          </div>
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          <div className="font-arabic text-sm font-bold text-iscarb-gold-dark" dir="rtl">
            نهاية كل الأعذار
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            The end of all excuses
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────────────────────────────────────
function Header({ totalOpen }: { totalOpen: number }) {
  return (
    <div className="mb-6">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-iscarb-green">
        Corporate Challenge Arena
      </div>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-iscarb-ink dark:text-white sm:text-4xl">
        Win a job before you{" "}
        <span className="text-gradient-brand">apply for one.</span>
      </h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        Open briefs from Saudi employers. Each challenge ships with a reward, a deadline, and an
        interview fast-track. Form a team, ship the artefact, and let the work do the talking.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px]">
        <span className="font-arabic text-muted-foreground" dir="rtl">
          ساحة تحديات الشركات
        </span>
        <Badge variant="outline" className="border-iscarb-green/30 text-iscarb-green">
          <Swords className="size-3" /> {totalOpen} open now
        </Badge>
      </div>
    </div>
  );
}

function ChallengeCard({
  challenge,
  onOpen,
}: {
  challenge: Challenge;
  onOpen: () => void;
}) {
  const difficulty = (challenge.difficulty ?? "intermediate").toLowerCase();
  const diffMeta = DIFFICULTY_META[difficulty] ?? DIFFICULTY_META.intermediate;
  const daysLeft = daysUntil(challenge.deadline);
  const isOpen = challenge.status === "open";
  const initials = challenge.company
    .replace(/[^A-Za-z0-9 ]/g, "")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
      }}
    >
      <Card
        className={cn(
          "group flex h-full cursor-pointer flex-col border-iscarb-green/15 transition-all hover:border-iscarb-green/40 hover:shadow-brand",
          !isOpen && "opacity-60",
        )}
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        aria-label={`Open challenge: ${challenge.title}`}
      >
        <CardContent className="flex h-full flex-col gap-3 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="flex size-11 items-center justify-center rounded-xl font-display text-base font-bold text-white shadow-brand"
                style={{ background: "linear-gradient(135deg,#00B4D8 0%,#1E8A5A 60%,#FFB700 100%)" }}
                aria-hidden
              >
                {initials || challenge.company[0]?.toUpperCase()}
              </div>
              <div>
                <div className="font-display text-sm font-bold text-iscarb-ink dark:text-white">
                  {challenge.company}
                </div>
                <Badge variant="outline" className="mt-0.5 border-iscarb-cyan/30 text-[10px] text-iscarb-cyan">
                  {challenge.sector}
                </Badge>
              </div>
            </div>
            <Badge
              className={cn("shrink-0 text-[10px]", diffMeta.cls)}
              title={`Difficulty: ${difficulty}`}
            >
              {diffMeta.label}
            </Badge>
          </div>

          <div>
            <div className="font-display text-base font-bold leading-snug text-iscarb-ink dark:text-white">
              {challenge.title}
            </div>
            <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{challenge.brief}</p>
          </div>

          {/* Skills chips */}
          <div className="flex flex-wrap gap-1.5">
            {challenge.skills.slice(0, 4).map((s, i) => {
              const palette = [
                "border-iscarb-green/30 bg-iscarb-green-soft text-iscarb-green",
                "border-iscarb-cyan/30 bg-iscarb-cyan-soft text-iscarb-cyan-dark",
                "border-iscarb-gold/40 bg-iscarb-gold-soft text-iscarb-gold-dark",
                "border-iscarb-teal/30 bg-iscarb-cyan-soft text-iscarb-teal",
              ];
              return (
                <Badge
                  key={s + i}
                  variant="outline"
                  className={cn("border text-[10px]", palette[i % palette.length])}
                >
                  {s}
                </Badge>
              );
            })}
            {challenge.skills.length > 4 && (
              <Badge variant="outline" className="border-border/60 text-[10px] text-muted-foreground">
                +{challenge.skills.length - 4}
              </Badge>
            )}
          </div>

          <div className="mt-auto space-y-2 border-t border-border/60 pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-iscarb-gold-dark">
                <Gift className="size-3.5" />
                <span className="font-semibold">{challenge.reward}</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5" />
                {challenge.teamCount} teams · {challenge.totalParticipants} solvers
              </span>
              <span
                className={cn(
                  "flex items-center gap-1 font-semibold",
                  daysLeft < 0
                    ? "text-destructive"
                    : daysLeft <= 5
                      ? "text-iscarb-gold-dark"
                      : "text-iscarb-green",
                )}
              >
                <CalendarClock className="size-3.5" />
                {daysLeft < 0
                  ? "closed"
                  : daysLeft === 0
                    ? "closes today"
                    : `${daysLeft}d left`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SubmitDialog({
  challenge,
  students,
  studentsLoading,
  onClose,
  onSubmitted,
}: {
  challenge: Challenge | null;
  students: StudentBrief[];
  studentsLoading: boolean;
  onClose: () => void;
  onSubmitted: (team: ChallengeTeam) => void;
}) {
  const [teamName, setTeamName] = useState("");
  const [submission, setSubmission] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state DURING RENDER whenever the dialog opens for a new challenge —
  // the React-recommended alternative to a setState-in-effect cascade.
  const challengeKey = challenge?.id ?? null;
  const [lastChallengeKey, setLastChallengeKey] = useState(challengeKey);
  if (challengeKey !== lastChallengeKey) {
    setLastChallengeKey(challengeKey);
    if (challengeKey) {
      setTeamName("");
      setSubmission("");
      setSelectedIds([]);
      setError(null);
      setSubmitting(false);
    }
  }

  function toggleStudent(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleSubmit() {
    if (!challenge) return;
    if (teamName.trim().length < 2) {
      setError("Team name must be at least 2 characters.");
      return;
    }
    if (selectedIds.length === 0) {
      setError("Pick at least one student for the team (the first is the lead).");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/iscarb/challenges/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          challengeId: challenge.id,
          teamName: teamName.trim(),
          studentIds: selectedIds,
          submission: submission.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? `Submission failed (${res.status})`);
      }
      const json = (await res.json()) as SubmitResponse;
      onSubmitted(json.team);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  const isOpen = challenge?.status === "open";
  return (
    <Dialog open={!!challenge} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl overflow-hidden p-0">
        {challenge && (
          <>
            <DialogHeader className="border-b border-border/60 bg-brand-mesh px-6 py-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-iscarb-cyan/30 text-iscarb-cyan">
                  {challenge.company} · {challenge.sector}
                </Badge>
                <Badge
                  className={cn(
                    "text-[10px]",
                    (DIFFICULTY_META[(challenge.difficulty ?? "").toLowerCase()] ??
                      DIFFICULTY_META.intermediate).cls,
                  )}
                >
                  {(DIFFICULTY_META[(challenge.difficulty ?? "").toLowerCase()] ??
                    DIFFICULTY_META.intermediate).label}
                </Badge>
                {!isOpen && (
                  <Badge variant="outline" className="border-destructive/40 text-destructive">
                    {challenge.status}
                  </Badge>
                )}
              </div>
              <DialogTitle className="mt-2 font-display text-xl font-bold text-iscarb-ink dark:text-white">
                {challenge.title}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {challenge.brief}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 px-6 py-4">
                {/* Meta strip */}
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-lg border border-iscarb-gold/40 bg-iscarb-gold-soft/60 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-iscarb-gold-dark">
                      Reward
                    </div>
                    <div className="text-xs font-semibold text-iscarb-ink dark:text-white">
                      {challenge.reward}
                    </div>
                  </div>
                  <div className="rounded-lg border border-iscarb-cyan/30 bg-iscarb-cyan-soft/40 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-iscarb-cyan-dark">
                      Deadline
                    </div>
                    <div className="text-xs font-semibold text-iscarb-ink dark:text-white">
                      {formatDate(challenge.deadline)} · {daysUntil(challenge.deadline)}d left
                    </div>
                  </div>
                  <div className="rounded-lg border border-iscarb-green/30 bg-iscarb-green-soft/40 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-iscarb-green">
                      Required skills
                    </div>
                    <div className="text-xs font-semibold text-iscarb-ink dark:text-white">
                      {challenge.skills.length} skills
                    </div>
                  </div>
                </div>

                {/* Skills chips */}
                <div className="flex flex-wrap gap-1.5">
                  {challenge.skills.map((s, i) => {
                    const palette = [
                      "border-iscarb-green/30 bg-iscarb-green-soft text-iscarb-green",
                      "border-iscarb-cyan/30 bg-iscarb-cyan-soft text-iscarb-cyan-dark",
                      "border-iscarb-gold/40 bg-iscarb-gold-soft text-iscarb-gold-dark",
                      "border-iscarb-teal/30 bg-iscarb-cyan-soft text-iscarb-teal",
                    ];
                    return (
                      <Badge
                        key={s + i}
                        variant="outline"
                        className={cn("border text-[10px]", palette[i % palette.length])}
                      >
                        {s}
                      </Badge>
                    );
                  })}
                </div>

                <Separator />

                {/* Form */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-iscarb-green">
                    <Rocket className="size-3.5" />
                    Form a team & submit
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="team-name" className="text-xs">
                      Team name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="team-name"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. iSCARB A-Team"
                      disabled={submitting || !isOpen}
                      maxLength={48}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="submission" className="text-xs">
                      Submission note (optional — link, abstract, or one-paragraph approach)
                    </Label>
                    <Textarea
                      id="submission"
                      value={submission}
                      onChange={(e) => setSubmission(e.target.value)}
                      placeholder="One paragraph on how your team will attack this. Link to repo / deck if available."
                      disabled={submitting || !isOpen}
                      rows={3}
                      maxLength={600}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-xs">
                      Team members <span className="text-destructive">*</span>{" "}
                      <span className="text-muted-foreground">
                        (first picked = team lead)
                      </span>
                    </Label>
                    {studentsLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : students.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                        No students available. Seed the database first.
                      </div>
                    ) : (
                      <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border border-border/60 p-2 scrollbar-iscarb">
                        {students.map((s, i) => {
                          const checked = selectedIds.includes(s.id);
                          const isLead = selectedIds[0] === s.id;
                          return (
                            <label
                              key={s.id}
                              className={cn(
                                "flex cursor-pointer items-center gap-3 rounded-md border p-2 transition-all",
                                checked
                                  ? "border-iscarb-green/40 bg-iscarb-green-soft/60"
                                  : "border-transparent hover:bg-accent",
                              )}
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => toggleStudent(s.id)}
                                disabled={submitting || !isOpen}
                                aria-label={`Select ${s.name}`}
                              />
                              <Avatar className="size-7">
                                <AvatarFallback className="bg-iscarb-cyan-soft text-[10px] font-bold text-iscarb-cyan">
                                  {s.name
                                    .split(" ")
                                    .map((p) => p[0])
                                    .slice(0, 2)
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="truncate text-xs font-semibold text-iscarb-ink dark:text-white">
                                  {s.name}
                                </div>
                                <div className="truncate text-[10px] text-muted-foreground">
                                  {s.program} · readiness {s.readinessScore}
                                </div>
                              </div>
                              {isLead && (
                                <Badge className="bg-iscarb-gold text-[10px] text-white">
                                  <Crown className="size-3" />
                                  Lead
                                </Badge>
                              )}
                              {i === 0 && !isLead && (
                                <span className="text-[10px] text-muted-foreground">first = lead</span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="alert-iron rounded-lg p-3 text-xs text-destructive">
                      <div className="font-semibold">Could not submit.</div>
                      <div className="text-destructive/80">{error}</div>
                    </div>
                  )}

                  {!isOpen && (
                    <div className="alert-iron rounded-lg p-3 text-xs text-destructive">
                      This challenge is <span className="font-semibold">{challenge.status}</span> —
                      no new teams can be registered.
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="border-t border-border/60 bg-muted/30 px-6 py-3">
              <Button variant="ghost" onClick={onClose} disabled={submitting}>
                <X className="size-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !isOpen}
                className="bg-iscarb-green text-white shadow-brand hover:bg-iscarb-green-dark"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
                {submitting ? "Submitting…" : "Form team & submit"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LeaderboardPlaceholder({
  submittedTeams,
}: {
  submittedTeams: ChallengeTeam[];
}) {
  return (
    <Card className="mb-6 border-iscarb-gold/30 shadow-sm">
      <CardHeader className="border-b border-border/60 pb-4">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Medal className="size-4 text-iscarb-gold-dark" />
            Leaderboard
          </span>
          <Badge variant="secondary" className="bg-iscarb-gold-soft text-iscarb-gold-dark">
            {submittedTeams.length} submission{submittedTeams.length === 1 ? "" : "s"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="mb-3 text-xs text-muted-foreground">
          Scores are published by the employer once the challenge closes. Teams you register in this
          session appear below in real time — the leaderboard is sorted by submission recency until
          the official scoring window opens.
        </p>
        {submittedTeams.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
            <Trophy className="mx-auto size-7 text-iscarb-gold" />
            <div className="mt-2 text-sm font-semibold text-iscarb-ink dark:text-white">
              No teams registered yet from this session.
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Open a challenge and form a team — your submission shows up here instantly.
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {submittedTeams.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3"
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold",
                    i === 0
                      ? "bg-iscarb-gold text-white"
                      : i === 1
                        ? "bg-iscarb-cyan text-white"
                        : i === 2
                          ? "bg-iscarb-green text-white"
                          : "bg-muted text-muted-foreground",
                  )}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-semibold text-iscarb-ink dark:text-white">
                    {t.name}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {t.challenge?.title ?? "Challenge"} · {t.challenge?.company ?? ""}
                    {" · "}
                    {t.members.length} member{t.members.length === 1 ? "" : "s"}
                  </div>
                </div>
                <Badge variant="outline" className="border-iscarb-green/30 text-iscarb-green">
                  <CheckCircle2 className="size-3" />
                  Registered
                </Badge>
              </motion.div>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3.5 text-iscarb-cyan" />
          All submissions are time-stamped and auditable. Late entries are rejected at the API.
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Local helpers
// ─────────────────────────────────────────────────────────────────────────────
const DIFFICULTY_META: Record<string, { label: string; cls: string }> = {
  beginner: { label: "Beginner", cls: "bg-iscarb-green-soft text-iscarb-green" },
  intermediate: { label: "Intermediate", cls: "bg-iscarb-cyan-soft text-iscarb-cyan-dark" },
  advanced: { label: "Advanced", cls: "bg-iscarb-gold-soft text-iscarb-gold-dark" },
};

function daysUntil(iso: string): number {
  if (!iso) return 0;
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return 0;
  const now = Date.now();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// Tiny inline Separator (avoid extra import if we already use the ui one).
function Separator({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-border/60", className)} />;
}

export default ArenaView;
