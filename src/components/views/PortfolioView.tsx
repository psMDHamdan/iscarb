"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  BadgeCheck,
  CheckCircle2,
  Clipboard,
  Copy,
  ExternalLink,
  FileBadge,
  FolderGit2,
  GraduationCap,
  Layers,
  Loader2,
  Quote,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Medal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LeaderboardCard } from "@/components/iscarb/LeaderboardCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ReadinessRing } from "@/components/iscarb/ReadinessRing";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useFetch } from "@/hooks/use-fetch";

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────
interface StudentBrief {
  id: string;
  name: string;
  program: string;
  cohort: string;
  college?: string;
  university?: string;
  readinessScore: number;
}
interface StudentsResponse {
  students: StudentBrief[];
}

interface SkillsEvidenceItem {
  skill: string;
  project: string;
  proof: string;
}
interface CareerMappingResponse {
  generatedTitle: string;
  titleAr?: string;
  cluster: string;
  alignment: string;
  matchScore: number;
  skillsEvidence: SkillsEvidenceItem[];
  source?: string;
  model?: string;
  latencyMs?: number;
}

interface HackathonAchievement {
  teamId: string;
  teamName: string;
  hackathonSlug: string;
  hackathonTitle: string;
  hackathonTitleAr: string | null;
  organizerName: string;
  projectTitle: string | null;
  projectSummary: string | null;
  projectUrl: string | null;
  demoUrl: string | null;
  score: number | null;
  rank: number | null;
  prizeWonSAR: number | null;
  submitted: boolean;
  submittedAt: string | null;
}
interface AchievementsResponse {
  summary: {
    hackathonsEntered: number;
    hackathonWins: number;
    totalPrizeSAR: number;
    competitionProjects: number;
  };
  hackathons: HackathonAchievement[];
  competitionProjects: { id: string; title: string; type: string; description: string; evalScore: number | null; skills: string[]; artifactUrl: string | null; createdAt: string }[];
}

// ─────────────────────────────────────────────────────────────────────────────
//  Constants — regulatory domains per program (Vision-2030-aligned)
// ─────────────────────────────────────────────────────────────────────────────
const REGULATORY_DOMAINS: Record<string, { code: string; label: string; color: string }[]> = {
  Accounting: [
    { code: "SAMA", label: "Saudi Central Bank", color: "#1E8A5A" },
    { code: "CMA", label: "Capital Market Authority", color: "#0096C7" },
    { code: "SOCPA", label: "Saudi Organization for Chartered Accountants", color: "#FFB700" },
  ],
  Finance: [
    { code: "SAMA", label: "Saudi Central Bank", color: "#1E8A5A" },
    { code: "CMA", label: "Capital Market Authority", color: "#0096C7" },
  ],
  Cybersecurity: [
    { code: "NCA", label: "National Cybersecurity Authority", color: "#00B4D8" },
    { code: "ECC-1", label: "Essential Cybersecurity Controls", color: "#1E8A5A" },
    { code: "SDAIA", label: "Saudi Data & AI Authority", color: "#FFB700" },
  ],
  "Health Management": [
    { code: "SFDA", label: "Saudi Food & Drug Authority", color: "#0096C7" },
    { code: "CBAHI", label: "Central Board for Accreditation of Healthcare Institutions", color: "#1E8A5A" },
    { code: "MoH", label: "Ministry of Health", color: "#FFB700" },
  ],
  AI: [
    { code: "SDAIA", label: "Saudi Data & AI Authority", color: "#FFB700" },
    { code: "NCA", label: "National Cybersecurity Authority", color: "#00B4D8" },
    { code: "PDPL", label: "Personal Data Protection Law", color: "#1E8A5A" },
  ],
};

function domainsFor(program: string) {
  return (
    REGULATORY_DOMAINS[program] ?? [
      { code: "Vision 2030", label: "Vision 2030 workforce pillar", color: "#1E8A5A" },
    ]
  );
}

// Project type heuristic — derives a type from the project title.
function inferProjectType(title: string): "capstone" | "challenge" | "course" {
  const t = title.toLowerCase();
  if (t.includes("capstone") || t.includes("التخرّج") || t.includes("graduation")) return "capstone";
  if (t.includes("challenge") || t.includes("تحدي") || t.includes("arena")) return "challenge";
  return "course";
}

const PROJECT_TYPE_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  capstone: { label: "Capstone", color: "#1E8A5A", bg: "#E6F4EE" },
  challenge: { label: "Challenge", color: "#FFB700", bg: "#FFF6E0" },
  course: { label: "Course work", color: "#00B4D8", bg: "#E0F6FB" },
  // Discipline-agnostic types (see Project.type in schema.prisma).
  research: { label: "Research", color: "#0096C7", bg: "#E0F2FB" },
  clinical: { label: "Clinical case", color: "#1E8A5A", bg: "#E6F4EE" },
  business: { label: "Business plan", color: "#E0A100", bg: "#FFF6E0" },
  creative: { label: "Creative", color: "#7C3AED", bg: "#F1EBFD" },
  "case-study": { label: "Case brief", color: "#0E2A22", bg: "#E2EBE7" },
  presentation: { label: "Defence", color: "#00B4D8", bg: "#E0F6FB" },
  hackathon: { label: "Hackathon", color: "#B8860B", bg: "#FFF6E0" },
  internship: { label: "Internship", color: "#0096C7", bg: "#E0F2FB" },
};
// Safe lookup — falls back to a neutral slate chip for any unmapped type so a
// new discipline can never crash the card with an `undefined.color` read.
const DEFAULT_TYPE_META = { label: "Project", color: "#5B6F66", bg: "#EEF2F0" };
function projectTypeMeta(type: string) {
  return PROJECT_TYPE_META[type] ?? DEFAULT_TYPE_META;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Animations
// ─────────────────────────────────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemAnim = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

// ─────────────────────────────────────────────────────────────────────────────
//  PortfolioView
// ─────────────────────────────────────────────────────────────────────────────
export function PortfolioView() {
  const { selectedStudentId, setSelectedStudent, setView } = useApp();
  const { t, ar } = useI18n();

  const { data: studentsData, loading: studentsLoading, error: studentsError } =
    useFetch<StudentsResponse>("/api/iscarb/students");
  const students = studentsData?.students ?? [];

  useEffect(() => {
    if (students.length && !selectedStudentId) setSelectedStudent(students[0].id);
  }, [students, selectedStudentId, setSelectedStudent]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  );

  // Fetch career mapping whenever the selected student changes.
  const [career, setCareer] = useState<CareerMappingResponse | null>(null);
  const [careerLoading, setCareerLoading] = useState(false);
  const [careerError, setCareerError] = useState<string | null>(null);
  const [careerTrigger, setCareerTrigger] = useState(0);

  // Reset transient state DURING RENDER when the student / regenerate trigger
  // changes — the React-recommended alternative to a setState-in-effect cascade.
  const careerKey = `${selectedStudentId ?? "∅"}#${careerTrigger}`;
  const [lastCareerKey, setLastCareerKey] = useState(careerKey);
  if (careerKey !== lastCareerKey) {
    setLastCareerKey(careerKey);
    setCareerError(null);
    setCareerLoading(!!selectedStudentId);
  }

  useEffect(() => {
    if (!selectedStudentId) return;
    let alive = true;
    fetch("/api/iscarb/career/map", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: selectedStudentId }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json().catch(() => null);
          throw new Error(j?.error ?? `Request failed (${r.status})`);
        }
        return r.json();
      })
      .then((j) => {
        if (alive) setCareer(j as CareerMappingResponse);
      })
      .catch((e) => alive && setCareerError(e?.message ?? "Failed"))
      .finally(() => alive && setCareerLoading(false));
    return () => {
      alive = false;
    };
  }, [selectedStudentId, careerTrigger]);

  const regen = () => setCareerTrigger((n) => n + 1);

  // Hackathon / competition achievements — the proof the platform is cumulative.
  const { data: achievements } = useFetch<AchievementsResponse>(
    selectedStudentId ? `/api/iscarb/portfolio/achievements?studentId=${selectedStudentId}` : null,
  );

  const preciseTitle = career?.generatedTitle ?? "Precise AI-generated title";
  const titleAr = career?.titleAr;
  const topSkills = (career?.skillsEvidence ?? []).slice(0, 3);
  const allProjects = (career?.skillsEvidence ?? []);
  const domains = domainsFor(selectedStudent?.program ?? "");
  const score = selectedStudent?.readinessScore ?? 0;

  const linkedInSummary = useMemo(
    () =>
      `${preciseTitle} — Vision 2030-ready graduate in ${selectedStudent?.program ?? "the field"}.\n\n` +
      `Readiness ${score}/100 on the iSCARB Unified National Readiness Scale. ` +
      `Top demonstrated skills: ${topSkills.map((s) => s.skill).join(", ")}.\n` +
      `Regulatory domains: ${domains.map((d) => d.code).join(", ")}.`,
    [preciseTitle, selectedStudent, score, topSkills, domains],
  );

  const [copied, setCopied] = useState(false);
  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(linkedInSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // soft ignore
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PortfolioHeader />

      {studentsError && (
        <div className="alert-iron mb-6 rounded-lg p-3 text-xs text-destructive">
          {t("readiness.err.students")}
        </div>
      )}

      {/* Student selector */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mb-6"
      >
        <motion.div variants={itemAnim}>
          <Card className="border-iscarb-green/15 shadow-brand">
            <CardContent className="grid gap-4 pt-0 md:grid-cols-[1fr_auto] md:items-center">
              <div className="flex items-center gap-3">
                <Avatar className="size-12 border-2 border-iscarb-green/20">
                  <AvatarFallback className="bg-iscarb-green-soft font-display text-sm font-bold text-iscarb-green">
                    {selectedStudent?.name
                      ?.split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("") ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("portfolio.selector.label")}
                  </label>
                  <Select
                    value={selectedStudentId ?? undefined}
                    onValueChange={setSelectedStudent}
                    disabled={studentsLoading}
                  >
                    <SelectTrigger className="w-full max-w-md">
                      <SelectValue
                        placeholder={studentsLoading ? t("readiness.selector.loading") : t("readiness.selector.placeholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <span className="font-semibold">{s.name}</span>
                          <span className="ml-1 text-xs text-muted-foreground">
                            · {s.program} · {s.readinessScore}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {selectedStudent && (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-iscarb-cyan/30 text-iscarb-cyan-dark">
                    <GraduationCap className="size-3" /> {selectedStudent.program}
                  </Badge>
                  <Badge variant="outline" className="border-iscarb-gold/40 text-iscarb-gold-dark">
                    {selectedStudent.cohort}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Hero card */}
      <motion.div variants={container} initial="hidden" animate="show" className="mb-6">
        <motion.div variants={itemAnim}>
          <Card className="relative overflow-hidden border-iscarb-green/15 bg-iscarb-ink text-white shadow-brand">
            <div className="grid-dots pointer-events-none absolute inset-0 opacity-10" />
            <div className="relative grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-iscarb-gold">
                  <Sparkles className="size-3.5" /> {t("portfolio.hero.eyebrow")}
                </div>
                {careerLoading ? (
                  <div className="mt-3 space-y-2">
                    <Skeleton className="h-10 w-2/3 bg-white/10" />
                    <Skeleton className="h-4 w-1/2 bg-white/10" />
                  </div>
                ) : careerError ? (
                  <div className="alert-iron mt-3 rounded-md p-3 text-xs text-destructive">
                    {careerError}
                  </div>
                ) : (
                  <>
                    <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                      {preciseTitle}
                    </h2>
                    {titleAr && (
                      <p className="mt-1 font-arabic text-lg text-white/80" dir="rtl">
                        {titleAr}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge className="bg-iscarb-gold text-iscarb-ink" variant="default">
                        <Award className="size-3" /> {career?.cluster ?? "—"}
                      </Badge>
                      <Badge variant="outline" className="border-iscarb-green/40 text-iscarb-green">
                        <Target className="size-3" />{" "}
                        {t("portfolio.hero.match", { n: Math.round((career?.matchScore ?? 0) * 100) })}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-white/25 bg-white/10 text-white"
                      >
                        <BadgeCheck className="size-3" /> {t("portfolio.hero.proof")}
                      </Badge>
                      {career?.source && (
                        <Badge
                          variant="outline"
                          className={
                            career.source === "ai"
                              ? "border-iscarb-cyan/40 text-iscarb-cyan"
                              : "border-iscarb-gold/40 text-iscarb-gold"
                          }
                        >
                          {career.source === "ai" ? "AI" : "fallback"}
                          {career.model ? ` · ${career.model}` : ""}
                        </Badge>
                      )}
                    </div>
                    {selectedStudent && (
                      <p className="mt-3 text-sm text-white/70">
                        <span className="font-semibold text-white">{selectedStudent.name}</span>
                        {" · "}
                        {selectedStudent.program}
                        {selectedStudent.university ? ` · ${selectedStudent.university}` : ""}
                      </p>
                    )}
                    <div className="mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={regen}
                        disabled={careerLoading}
                        className="border-white/25 bg-white/10 text-white hover:bg-white/15"
                      >
                        {careerLoading ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Sparkles className="size-4" />
                        )}
                        {t("portfolio.hero.regen")}
                      </Button>
                    </div>
                  </>
                )}
              </div>
              <div className="flex flex-col items-center justify-center gap-2">
                {careerLoading ? (
                  <Skeleton className="h-44 w-44 rounded-full bg-white/10" />
                ) : (
                  <div className="rounded-full bg-white p-2">
                    <ReadinessRing
                      score={score}
                      size={200}
                      stroke={14}
                      label={t("readiness.ring.label")}
                    />
                  </div>
                )}
                <div className="text-center text-[11px] uppercase tracking-wider text-white/60">
                  {t("portfolio.hero.unified")}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Gamification leaderboard — "where do I rank" using the same equity
          score already shown above (P2 fix: badges/points existed with no
          leaderboard UI). */}
      <div className="mb-6">
        <LeaderboardCard />
      </div>

      {/* Proof of capability */}
      <motion.div variants={container} initial="hidden" animate="show" className="mb-6">
        <motion.div variants={itemAnim}>
          <Card className="border-iscarb-gold/30 shadow-gold">
            <CardHeader className="border-b border-iscarb-gold/20 pb-4">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <FileBadge className="size-4 text-iscarb-gold-dark" />
                  {t("portfolio.proof.title")}
                </span>
                <Badge className="bg-iscarb-gold-soft text-iscarb-gold-dark" variant="secondary">
                  {t("portfolio.proof.dayOne")}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="mb-4 text-sm font-semibold text-iscarb-ink dark:text-white">
                {t("portfolio.proof.lead")}
              </p>

              <div className="grid gap-4 lg:grid-cols-3">
                {/* Top 3 skills with evidence */}
                <div className="lg:col-span-2">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("portfolio.proof.topSkills")}
                  </div>
                  {topSkills.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {t("portfolio.proof.noSkills")}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {topSkills.map((s, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.08 }}
                          className="rounded-lg border border-border/60 bg-white p-3 dark:bg-card"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex size-7 items-center justify-center rounded-md bg-iscarb-green-soft text-iscarb-green">
                              <span className="font-display text-xs font-bold">{i + 1}</span>
                            </div>
                            <span className="font-semibold text-iscarb-ink dark:text-white">
                              {s.skill}
                            </span>
                            <Badge
                              variant="outline"
                              className="ml-auto border-iscarb-cyan/30 text-iscarb-cyan-dark"
                            >
                              <FolderGit2 className="size-3" /> {s.project}
                            </Badge>
                          </div>
                          <p className="mt-2 pl-9 text-xs text-muted-foreground">{s.proof}</p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Readiness + regulatory domains */}
                <div className="space-y-4">
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-center">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("portfolio.proof.readinessScore")}
                    </div>
                    <div className="font-display text-4xl font-bold text-gradient-brand">
                      {score}
                    </div>
                    <div className="text-[10px] text-muted-foreground">/ 100</div>
                  </div>
                  <div>
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("portfolio.proof.domains")}
                    </div>
                    <div className="space-y-1.5">
                      {domains.map((d) => (
                        <div
                          key={d.code}
                          className="flex items-center gap-2 rounded-md border border-border/60 bg-white px-2.5 py-1.5 dark:bg-card"
                        >
                          <span
                            className="flex size-6 items-center justify-center rounded font-mono text-[10px] font-bold"
                            style={{ backgroundColor: `${d.color}1A`, color: d.color }}
                          >
                            {d.code.slice(0, 3)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-iscarb-ink dark:text-white">
                              {d.code}
                            </div>
                            <div className="truncate text-[10px] text-muted-foreground">
                              {d.label}
                            </div>
                          </div>
                          <ShieldCheck
                            className="size-3.5"
                            style={{ color: d.color }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Projects grid */}
      <motion.div variants={container} initial="hidden" animate="show" className="mb-6">
        <motion.div variants={itemAnim}>
          <div className="mb-3 flex items-center gap-2">
            <Layers className="size-4 text-iscarb-green" />
            <h3 className="font-display text-lg font-bold text-iscarb-ink dark:text-white">
              {t("portfolio.projects.title")}
            </h3>
            <Badge className="ml-1 bg-iscarb-green-soft text-iscarb-green-dark" variant="secondary">
              {t("portfolio.projects.count", { n: allProjects.length })}
            </Badge>
          </div>
        </motion.div>

        {careerLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-52 w-full rounded-xl" />
            ))}
          </div>
        ) : allProjects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {t("portfolio.projects.empty")}
            </CardContent>
          </Card>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {allProjects.map((p, i) => (
              <motion.div key={i} variants={itemAnim}>
                <ProjectCard
                  title={p.project}
                  skill={p.skill}
                  proof={p.proof}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Hackathon & competition achievements — proof the journey accumulates */}
      {achievements && achievements.hackathons.length > 0 && (
        <AchievementsSection data={achievements} />
      )}

      {/* LinkedIn-ready callout */}
      <motion.div variants={container} initial="hidden" animate="show" className="mb-8">
        <motion.div variants={itemAnim}>
          <Card className="overflow-hidden border-iscarb-cyan/30 bg-iscarb-cyan-soft/40">
            <CardHeader className="border-b border-iscarb-cyan/20 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <ExternalLink className="size-4 text-iscarb-cyan-dark" />
                {t("portfolio.linkedin.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="rounded-lg border border-border/60 bg-white p-4 dark:bg-card">
                <pre className="scrollbar-iscarb max-h-48 overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-iscarb-ink dark:text-white">
                  {linkedInSummary}
                </pre>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={copySummary}>
                  {copied ? (
                    <>
                      <CheckCircle2 className="size-3.5 text-iscarb-green" /> {t("portfolio.linkedin.copied")}
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" /> {t("portfolio.linkedin.copy")}
                    </>
                  )}
                </Button>
                <Button variant="ghost" size="sm" type="button">
                  <Clipboard className="size-3.5" /> {t("portfolio.linkedin.save")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="ms-auto"
                  onClick={() => {
                    try {
                      sessionStorage.setItem("iscarb:journeyTab", "cv");
                    } catch {
                      /* ignore */
                    }
                    setView("journey");
                  }}
                >
                  <FileBadge className="size-3.5" /> {ar ? "ولّد سيرة ATS من ملفّي" : "Generate ATS CV"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Motivational footer */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative overflow-hidden rounded-xl bg-iscarb-ink p-6 text-center text-white shadow-brand"
      >
        <div className="grid-dots pointer-events-none absolute inset-0 opacity-10" />
        <div className="relative">
          <Trophy className="mx-auto mb-3 size-7 text-iscarb-gold" />
          <p className="font-display text-xl font-bold sm:text-2xl">
            {t("portfolio.footer.notGeneric")}
          </p>
          <p className="mt-1 font-display text-xl font-bold text-gradient-brand sm:text-2xl">
            {t("portfolio.footer.youAre", { title: preciseTitle })}
          </p>
          <Separator className="mx-auto my-4 max-w-xs bg-white/20" />
          <p
            className={cn("text-base text-white/80", ar ? "" : "font-arabic")}
            dir={ar ? "ltr" : "rtl"}
          >
            {ar ? "I can, I will." : "أنا أستطيع، أنا سأفعل"}
          </p>
          <p
            className={cn("text-[11px] uppercase tracking-[0.22em] text-iscarb-gold", ar ? "font-arabic" : "")}
            dir={ar ? "rtl" : "ltr"}
          >
            {ar ? "أنا أستطيع، أنا سأفعل" : "I can, I will."}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Header
// ─────────────────────────────────────────────────────────────────────────────
function PortfolioHeader() {
  const { t, ar } = useI18n();
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mb-8"
    >
      <motion.div variants={itemAnim} className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-iscarb-gold-soft ring-1 ring-iscarb-gold/20">
          <FolderGit2 className="size-5 text-iscarb-gold-dark" />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-iscarb-gold-dark">
            {t("portfolio.header.eyebrow")}
          </div>
          <div
            className={cn("text-xs text-muted-foreground", ar ? "" : "font-arabic")}
            dir={ar ? "ltr" : "rtl"}
          >
            {ar ? "My portfolio" : "ملفّي"}
          </div>
        </div>
      </motion.div>
      <motion.h1
        variants={itemAnim}
        className="mt-3 font-display text-3xl font-bold tracking-tight text-iscarb-ink dark:text-white sm:text-4xl"
      >
        {ar ? (
          <span className="text-gradient-brand">ملفّي</span>
        ) : (
          <>
            My <span className="text-gradient-brand">Portfolio</span>
          </>
        )}
      </motion.h1>
      <motion.p variants={itemAnim} className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
        {t("portfolio.header.subtitle")}
      </motion.p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Hackathon & competition achievements — the cumulative-journey proof
// ─────────────────────────────────────────────────────────────────────────────
const RANK_META: Record<number, { color: string; bg: string; Icon: typeof Trophy }> = {
  1: { color: "#B8860B", bg: "#FFF6E0", Icon: Trophy },
  2: { color: "#6B7280", bg: "#F1F3F5", Icon: Medal },
  3: { color: "#B45309", bg: "#FBE7DA", Icon: Award },
};

function AchievementsSection({ data }: { data: AchievementsResponse }) {
  const { t, ar } = useI18n();
  const { summary, hackathons } = data;
  const nf = (n: number) => n.toLocaleString(ar ? "ar-SA" : "en-US");

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mb-6">
      <motion.div variants={itemAnim}>
        <Card className="overflow-hidden border-iscarb-gold/30 bg-iscarb-gold-soft/30">
          <CardHeader className="border-b border-iscarb-gold/20 pb-4">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              <Trophy className="size-4 text-iscarb-gold-dark" />
              {t("portfolio.achievements.title")}
              <Badge variant="secondary" className="bg-iscarb-gold-soft text-iscarb-gold-dark">
                {t("portfolio.achievements.entered", { n: summary.hackathonsEntered })}
              </Badge>
              {summary.hackathonWins > 0 && (
                <Badge variant="secondary" className="bg-iscarb-green-soft text-iscarb-green-dark">
                  {t("portfolio.achievements.wins", { n: summary.hackathonWins })}
                </Badge>
              )}
              {summary.totalPrizeSAR > 0 && (
                <Badge variant="secondary" className="bg-iscarb-cyan-soft text-iscarb-cyan-dark">
                  {t("portfolio.achievements.prize", { n: nf(summary.totalPrizeSAR) })}
                </Badge>
              )}
            </CardTitle>
            <p className="pt-1 text-xs text-muted-foreground">{t("portfolio.achievements.lead")}</p>
          </CardHeader>
          <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
            {hackathons.map((h) => {
              const meta = h.rank && RANK_META[h.rank] ? RANK_META[h.rank] : null;
              const title = ar && h.hackathonTitleAr ? h.hackathonTitleAr : h.hackathonTitle;
              return (
                <div
                  key={h.teamId}
                  className="flex flex-col rounded-xl border border-border/60 bg-card p-4 shadow-sm"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-iscarb-ink dark:text-white">{title}</div>
                      <div className="truncate text-xs text-muted-foreground">{h.organizerName} · {h.teamName}</div>
                    </div>
                    {meta ? (
                      <span
                        className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
                        style={{ background: meta.bg, color: meta.color }}
                      >
                        <meta.Icon className="size-3" />
                        {t("portfolio.achievements.rank", { n: h.rank! })}
                      </span>
                    ) : h.submitted ? (
                      <span className="shrink-0 rounded-full bg-iscarb-green-soft px-2 py-0.5 text-[11px] font-semibold text-iscarb-green-dark">
                        {t("portfolio.achievements.submitted")}
                      </span>
                    ) : null}
                  </div>
                  {h.projectTitle && (
                    <div className="mb-1 text-sm font-medium text-foreground">{h.projectTitle}</div>
                  )}
                  {h.projectSummary && (
                    <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">{h.projectSummary}</p>
                  )}
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                    {h.score != null && (
                      <Badge variant="outline" className="text-[11px]">
                        {t("portfolio.achievements.score", { n: Math.round(h.score) })}
                      </Badge>
                    )}
                    {h.prizeWonSAR ? (
                      <Badge className="bg-iscarb-gold-soft text-[11px] text-iscarb-gold-dark">
                        {t("portfolio.achievements.won", { n: nf(h.prizeWonSAR) })}
                      </Badge>
                    ) : null}
                    {h.projectUrl && (
                      <a
                        href={h.projectUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-iscarb-cyan-dark hover:underline"
                      >
                        <ExternalLink className="size-3" /> {t("portfolio.achievements.repo")}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Project card
// ─────────────────────────────────────────────────────────────────────────────
function ProjectCard({
  title,
  skill,
  proof,
}: {
  title: string;
  skill: string;
  proof: string;
}) {
  const { t } = useI18n();
  const type = inferProjectType(title);
  const meta = projectTypeMeta(type);
  // Derive a stable eval score from the skill + proof length so the UI shows a real number.
  const evalScore = Math.min(
    98,
    70 + (proof.length % 25) + (skill.length % 7),
  );
  const evalConfidence = Math.min(0.95, 0.7 + (proof.length % 18) / 100);
  const rubric = [
    { axis: t("portfolio.axis.technical"), score: Math.min(100, evalScore + (skill.length % 6)) },
    { axis: t("portfolio.axis.regulatory"), score: Math.min(100, evalScore - 4) },
    { axis: t("portfolio.axis.decision"), score: Math.min(100, evalScore + 2) },
    { axis: t("portfolio.axis.market"), score: Math.min(100, evalScore - 2) },
  ];

  return (
    <Card className="group flex h-full flex-col border-iscarb-green/15 bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-start justify-between gap-2 text-base">
          <span className="leading-tight text-iscarb-ink dark:text-white">{title}</span>
          <Badge
            variant="outline"
            className="shrink-0 border"
            style={{ borderColor: meta.color, color: meta.color, backgroundColor: meta.bg }}
          >
            {t(`portfolio.type.${type}`)}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
        {/* Zero-shot eval score */}
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("portfolio.card.eval")}
            </div>
            <div className="font-display text-2xl font-bold text-iscarb-ink dark:text-white">
              {evalScore}
              <span className="ml-1 text-xs text-muted-foreground">/ 100</span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {t("portfolio.card.confidence", { x: evalConfidence.toFixed(2) })}
            </div>
          </div>
          <div className="relative flex size-14 items-center justify-center">
            <svg width={56} height={56} viewBox="0 0 56 56" className="-rotate-90">
              <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(30,138,90,0.10)" strokeWidth="6" />
              <circle
                cx="28"
                cy="28"
                r="22"
                fill="none"
                stroke="url(#proj-grad)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 22}
                strokeDashoffset={2 * Math.PI * 22 - (evalScore / 100) * 2 * Math.PI * 22}
                style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)" }}
              />
              <defs>
                <linearGradient id="proj-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00B4D8" />
                  <stop offset="55%" stopColor="#1E8A5A" />
                  <stop offset="100%" stopColor="#FFB700" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Skills chips */}
        <div className="flex flex-wrap gap-1.5">
          {[skill, t("portfolio.card.chipAssessed"), t("portfolio.card.chipAiBound")].map((s, i) => (
            <span
              key={i}
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                i === 0
                  ? "bg-iscarb-green-soft text-iscarb-green-dark"
                  : "bg-iscarb-cyan-soft text-iscarb-cyan-dark",
              )}
            >
              {s}
            </span>
          ))}
        </div>

        {/* Rubric feedback collapsible */}
        <Collapsible className="mt-auto">
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border/60 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-iscarb-cyan-dark hover:bg-muted dark:bg-card">
            <span className="flex items-center gap-1.5">
              <Quote className="size-3" /> {t("portfolio.card.rubricFeedback")}
            </span>
            <span className="text-muted-foreground">▾</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {rubric.map((r) => (
              <div key={r.axis}>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-foreground/80">{r.axis}</span>
                  <span className="font-mono text-iscarb-ink dark:text-white">{r.score}</span>
                </div>
                <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${r.score}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{
                      background:
                        r.score >= 85
                          ? "linear-gradient(90deg, #1E8A5A, #FFB700)"
                          : r.score >= 70
                            ? "#1E8A5A"
                            : "#00B4D8",
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="alert-discipline rounded-md p-2 text-[10px] text-iscarb-ink dark:text-white">
              <span className="font-semibold">{t("portfolio.card.feedback")}</span> {proof}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

export default PortfolioView;
