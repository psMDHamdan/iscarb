"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  Building2,
  CalendarDays,
  ChevronLeft,
  ExternalLink,
  Flag,
  Github,
  Globe,
  Medal,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/use-session";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { useFetch } from "@/hooks/use-fetch";
import {
  HACKATHON_STATUSES,
  type HackathonStatus,
  type HackathonPhase,
  type HackathonSummary,
  type HackathonDetailDTO,
  type HackathonTeamDTO,
} from "@/lib/hackathon-data";

const ORGANIZER_ROLES = ["admin", "faculty", "recruiter"];

async function mutate(
  url: string,
  method: "POST" | "PATCH",
  body: unknown,
): Promise<{ ok: boolean; status: number }> {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

const PHASE: Record<HackathonPhase, { en: string; ar: string; cls: string }> = {
  upcoming: { en: "Upcoming", ar: "قادم", cls: "bg-muted text-muted-foreground border border-border" },
  registration: { en: "Registration open", ar: "التسجيل مفتوح", cls: "bg-iscarb-cyan text-white" },
  ongoing: { en: "Ongoing", ar: "جارٍ الآن", cls: "bg-iscarb-green text-white" },
  judging: { en: "Judging", ar: "قيد التحكيم", cls: "bg-iscarb-gold text-iscarb-ink" },
  completed: { en: "Completed", ar: "منتهٍ", cls: "bg-muted text-muted-foreground border border-border" },
};

function fmtDate(iso: string, ar: boolean): string {
  try {
    return new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

// ── main view ────────────────────────────────────────────────────────────────
export function HackathonsView() {
  const { t, ar } = useI18n();
  const { role } = useSession();
  const isOrganizer = ORGANIZER_ROLES.includes(role);

  const listQ = useFetch<{ hackathons: HackathonSummary[] }>("/api/iscarb/hackathons");
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const hackathons = listQ.data?.hackathons ?? [];

  if (selected) {
    return (
      <HackathonDetail
        slug={selected}
        onBack={() => {
          setSelected(null);
          listQ.reload();
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-iscarb-cyan">
            <Rocket className="size-3.5" /> {ar ? "منصة الهاكاثون" : "Hackathon platform"}
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-iscarb-ink dark:text-white sm:text-4xl">
            {ar ? "الهاكاثونات" : "Hackathons"}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {ar
              ? "تنافس في تحديات مدعومة من جهات وطنية وأصحاب عمل — سجّل، كوّن فريقًا، قدّم مشروعك، وتصدّر لوحة الترتيب. فوزك يُضاف إلى ملفّك وسجلّك ومسار التوظيف."
              : "Compete in challenges backed by national bodies and employers — register, form a team, submit a project, and climb the leaderboard. Wins flow into your portfolio, equity ledger and recruiter pipeline."}
          </p>
        </div>
        {isOrganizer && (
          <Button onClick={() => setCreating((v) => !v)} className="gap-1.5">
            <Plus className="size-4" /> {ar ? "هاكاثون جديد" : "New hackathon"}
          </Button>
        )}
      </div>

      {creating && isOrganizer && (
        <CreateHackathonForm
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            listQ.reload();
          }}
        />
      )}

      {listQ.loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : hackathons.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-iscarb-cyan-soft text-iscarb-cyan">
              <Rocket className="size-6" />
            </div>
            <div className="font-display text-lg font-bold text-iscarb-ink dark:text-white">
              {ar ? "لا توجد هاكاثونات بعد" : "No hackathons yet"}
            </div>
            <div className="max-w-md text-sm text-muted-foreground">
              {isOrganizer
                ? ar
                  ? "أنشئ أول هاكاثون لتفتح بابًا جديدًا لاكتساب المواهب."
                  : "Create the first hackathon to open a new talent-acquisition funnel."
                : ar
                  ? "تابع لاحقًا — ستظهر التحديات القادمة هنا."
                  : "Check back soon — upcoming challenges will appear here."}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {hackathons.map((h, i) => (
            <HackathonCard key={h.id} h={h} index={i} onOpen={() => setSelected(h.slug)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── list card ────────────────────────────────────────────────────────────────
function HackathonCard({
  h,
  index,
  onOpen,
}: {
  h: HackathonSummary;
  index: number;
  onOpen: () => void;
}) {
  const { ar } = useI18n();
  const phase = PHASE[h.phase];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Card
        className={cn(
          "h-full cursor-pointer overflow-hidden border-border/60 shadow-sm transition-shadow hover:shadow-brand",
          h.featured && "ring-1 ring-iscarb-gold/40",
        )}
        onClick={onOpen}
      >
        <CardContent className="pt-0">
          <div className="flex items-start justify-between gap-2">
            <Badge className={cn("shrink-0", phase.cls)} variant="secondary">
              {ar ? phase.ar : phase.en}
            </Badge>
            <div className="flex items-center gap-1.5">
              {h.vision2030 && (
                <Badge variant="outline" className="border-iscarb-green/30 text-iscarb-green">
                  <Flag className="size-3" /> 2030
                </Badge>
              )}
              {h.featured && (
                <Badge variant="outline" className="border-iscarb-gold/40 text-iscarb-gold-dark">
                  <Sparkles className="size-3" /> {ar ? "مميّز" : "Featured"}
                </Badge>
              )}
            </div>
          </div>

          <h3 className="mt-2 font-display text-lg font-bold leading-tight text-iscarb-ink dark:text-white">
            {(ar && h.titleAr) || h.title}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="size-3.5 text-iscarb-cyan" /> {h.organizerName} ·{" "}
            {h.format === "virtual"
              ? ar
                ? "عن بُعد"
                : "Virtual"
              : h.format === "hybrid"
                ? ar
                  ? "مدمج"
                  : "Hybrid"
                : ar
                  ? "حضوري"
                  : "In-person"}
          </div>

          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{h.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
            {h.prizePoolSAR > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold text-iscarb-gold-dark">
                <Trophy className="size-3.5" /> {h.prizePoolSAR.toLocaleString()} {ar ? "ر.س" : "SAR"}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Users className="size-3.5 text-iscarb-cyan" /> {h.registrationsCount}{" "}
              {ar ? "مسجّل" : "registered"}
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <CalendarDays className="size-3.5" /> {fmtDate(h.hackathonStart, ar)}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── detail ───────────────────────────────────────────────────────────────────
function HackathonDetail({ slug, onBack }: { slug: string; onBack: () => void }) {
  const { ar, lang } = useI18n();
  const { role } = useSession();
  const isOrganizer = ORGANIZER_ROLES.includes(role);
  const isStudent = role === "student";
  const detailQ = useFetch<HackathonDetailDTO>(
    `/api/iscarb/hackathons/${encodeURIComponent(slug)}`,
  );

  const h = detailQ.data;

  async function act(body: Record<string, unknown>, method: "POST" | "PATCH" = "POST") {
    const r = await mutate(`/api/iscarb/hackathons/${encodeURIComponent(slug)}`, method, body);
    if (r.ok) {
      detailQ.reload();
      return true;
    }
    notify.fail(lang);
    return false;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 gap-1.5 text-muted-foreground">
        <ChevronLeft className={cn("size-4", ar && "rotate-180")} />
        {ar ? "كل الهاكاثونات" : "All hackathons"}
      </Button>

      {detailQ.loading || !h ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* header */}
          <Card className="mb-6 overflow-hidden border-iscarb-cyan/20">
            <div className="bg-brand-mesh px-6 py-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn(PHASE[h.phase].cls)} variant="secondary">
                  {ar ? PHASE[h.phase].ar : PHASE[h.phase].en}
                </Badge>
                {h.vision2030 && (
                  <Badge variant="outline" className="border-iscarb-green/40 bg-white/70 text-iscarb-green">
                    <Flag className="size-3" /> {ar ? "رؤية 2030" : "Vision 2030"}
                  </Badge>
                )}
              </div>
              <h1 className="mt-2 font-display text-2xl font-bold text-iscarb-ink dark:text-white sm:text-3xl">
                {(ar && h.titleAr) || h.title}
              </h1>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="size-4 text-iscarb-cyan" /> {h.organizerName}
              </div>
            </div>
            <CardContent className="pt-0">
              <p className="text-sm text-foreground/90">{h.description}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat icon={<Trophy className="size-4 text-iscarb-gold-dark" />} label={ar ? "الجوائز" : "Prize pool"} value={h.prizePoolSAR > 0 ? `${h.prizePoolSAR.toLocaleString()} ${ar ? "ر.س" : "SAR"}` : "—"} />
                <Stat icon={<Users className="size-4 text-iscarb-cyan" />} label={ar ? "المسجّلون" : "Registered"} value={String(h.registrationsCount)} />
                <Stat icon={<Rocket className="size-4 text-iscarb-green" />} label={ar ? "الفرق" : "Teams"} value={String(h.teamsCount)} />
                <Stat icon={<CalendarDays className="size-4 text-muted-foreground" />} label={ar ? "الانطلاق" : "Starts"} value={fmtDate(h.hackathonStart, ar)} />
              </div>

              {/* timeline */}
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                <span>{ar ? "التسجيل" : "Registration"}: {fmtDate(h.registrationStart, ar)} – {fmtDate(h.registrationEnd, ar)}</span>
                <span>{ar ? "الفعالية" : "Event"}: {fmtDate(h.hackathonStart, ar)} – {fmtDate(h.hackathonEnd, ar)}</span>
                <span>{ar ? "نهاية التحكيم" : "Judging ends"}: {fmtDate(h.judgingEnd, ar)}</span>
              </div>

              {/* participant actions */}
              {isStudent && (
                <ParticipantActions h={h} onAct={act} />
              )}
              {isOrganizer && <OrganizerStatus h={h} onAct={act} />}
            </CardContent>
          </Card>

          {/* leaderboard / teams */}
          <div className="mb-3 flex items-center gap-2">
            <Medal className="size-5 text-iscarb-gold-dark" />
            <h2 className="font-display text-lg font-bold text-iscarb-ink dark:text-white">
              {ar ? "لوحة الترتيب والفرق" : "Leaderboard & teams"}
            </h2>
          </div>

          {h.teams.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                {ar ? "لا فرق بعد. كن أول من يكوّن فريقًا!" : "No teams yet. Be the first to form one!"}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {h.teams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  isMine={h.myTeamId === team.id}
                  isOrganizer={isOrganizer}
                  onAct={act}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 font-display text-lg font-bold text-iscarb-ink dark:text-white">{value}</div>
    </div>
  );
}

// ── participant actions (register / team / submit) ───────────────────────────
function ParticipantActions({
  h,
  onAct,
}: {
  h: HackathonDetailDTO;
  onAct: (body: Record<string, unknown>, method?: "POST" | "PATCH") => Promise<boolean>;
}) {
  const { ar, lang } = useI18n();
  const [teamName, setTeamName] = useState("");
  const [showSubmit, setShowSubmit] = useState(false);
  const [proj, setProj] = useState({ projectTitle: "", projectSummary: "", projectUrl: "", demoUrl: "" });

  const canRegister = h.phase === "registration" || h.phase === "upcoming";

  if (!h.registered) {
    return (
      <div className="mt-4 rounded-lg border border-iscarb-cyan/20 bg-iscarb-cyan-soft/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-iscarb-ink dark:text-white">
            {ar ? "سجّل للمشاركة في هذا الهاكاثون." : "Register to take part in this hackathon."}
          </div>
          <Button
            size="sm"
            disabled={!canRegister}
            onClick={async () => {
              const ok = await onAct({ action: "register" });
              if (ok)
                notify.ok(lang, { en: "Registered!", ar: "تم التسجيل!" }, { en: "You're in. Now form or join a team.", ar: "أنت الآن مسجّل. كوّن فريقًا أو انضم لأحدها." });
            }}
          >
            <UserPlus className="size-4" /> {ar ? "سجّل الآن" : "Register now"}
          </Button>
        </div>
        {!canRegister && (
          <div className="mt-1 text-xs text-muted-foreground">
            {ar ? "التسجيل مغلق لهذا الهاكاثون." : "Registration is closed for this hackathon."}
          </div>
        )}
      </div>
    );
  }

  // Registered but not on a team yet → create or join.
  if (!h.myTeamId) {
    return (
      <div className="mt-4 space-y-3 rounded-lg border border-border/60 bg-muted/30 p-4">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-iscarb-ink dark:text-white">
          <ShieldCheck className="size-4 text-iscarb-green" /> {ar ? "أنت مسجّل" : "You're registered"}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder={ar ? "اسم فريقك الجديد" : "Your new team name"}
            className="sm:max-w-xs"
          />
          <Button
            size="sm"
            disabled={!teamName.trim()}
            onClick={async () => {
              const ok = await onAct({ action: "createTeam", name: teamName.trim() });
              if (ok) {
                setTeamName("");
                notify.ok(lang, { en: "Team created", ar: "تم إنشاء الفريق" });
              }
            }}
          >
            <Plus className="size-4" /> {ar ? "أنشئ فريقًا" : "Create team"}
          </Button>
        </div>
        {h.teams.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {ar
              ? "أو انضم إلى فريق قائم من القائمة أدناه (زر «انضم»)."
              : "…or join an existing team from the list below (the “Join” button)."}
          </div>
        )}
      </div>
    );
  }

  // On a team → can submit a project.
  return (
    <div className="mt-4 rounded-lg border border-iscarb-green/20 bg-iscarb-green-soft/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-iscarb-ink dark:text-white">
          <Users className="size-4 text-iscarb-green" /> {ar ? "أنت في فريق" : "You're on a team"}
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowSubmit((s) => !s)}>
          {ar ? "قدّم / حدّث المشروع" : "Submit / update project"}
        </Button>
      </div>
      {showSubmit && (
        <div className="mt-3 space-y-2">
          <Input
            value={proj.projectTitle}
            onChange={(e) => setProj({ ...proj, projectTitle: e.target.value })}
            placeholder={ar ? "عنوان المشروع *" : "Project title *"}
          />
          <Textarea
            value={proj.projectSummary}
            onChange={(e) => setProj({ ...proj, projectSummary: e.target.value })}
            placeholder={ar ? "ملخّص المشروع" : "Project summary"}
            rows={2}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={proj.projectUrl}
              onChange={(e) => setProj({ ...proj, projectUrl: e.target.value })}
              placeholder="GitHub / repo URL"
            />
            <Input
              value={proj.demoUrl}
              onChange={(e) => setProj({ ...proj, demoUrl: e.target.value })}
              placeholder={ar ? "رابط العرض/الفيديو" : "Demo / video URL"}
            />
          </div>
          <Button
            size="sm"
            disabled={!proj.projectTitle.trim()}
            onClick={async () => {
              const ok = await onAct({ action: "submit", teamId: h.myTeamId, ...proj });
              if (ok) {
                setShowSubmit(false);
                notify.ok(lang, { en: "Project submitted", ar: "تم تقديم المشروع" });
              }
            }}
          >
            {ar ? "حفظ التقديم" : "Save submission"}
          </Button>
        </div>
      )}
    </div>
  );
}

function OrganizerStatus({
  h,
  onAct,
}: {
  h: HackathonDetailDTO;
  onAct: (body: Record<string, unknown>, method?: "POST" | "PATCH") => Promise<boolean>;
}) {
  const { ar, lang } = useI18n();
  const STATUS_LABEL: Record<HackathonStatus, { en: string; ar: string }> = {
    draft: { en: "Draft", ar: "مسوّدة" },
    open: { en: "Open", ar: "مفتوح" },
    ongoing: { en: "Ongoing", ar: "جارٍ" },
    judging: { en: "Judging", ar: "تحكيم" },
    completed: { en: "Completed", ar: "منتهٍ" },
  };
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-iscarb-gold/30 bg-iscarb-gold-soft/20 p-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-iscarb-gold-dark">
        {ar ? "أداة المنظِّم" : "Organizer"} · {ar ? "الحالة" : "Status"}
      </span>
      <Select
        value={h.status}
        onValueChange={async (v) => {
          const ok = await onAct({ action: "status", status: v }, "PATCH");
          if (ok) notify.ok(lang, { en: "Status updated", ar: "تم تحديث الحالة" });
        }}
      >
        <SelectTrigger className="h-8 w-[150px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HACKATHON_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {ar ? STATUS_LABEL[s].ar : STATUS_LABEL[s].en}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ── team card (leaderboard row + organizer scoring) ──────────────────────────
function TeamCard({
  team,
  isMine,
  isOrganizer,
  onAct,
}: {
  team: HackathonTeamDTO;
  isMine: boolean;
  isOrganizer: boolean;
  onAct: (body: Record<string, unknown>, method?: "POST" | "PATCH") => Promise<boolean>;
}) {
  const { ar, lang } = useI18n();
  const [score, setScore] = useState(team.score != null ? String(team.score) : "");
  const [notes, setNotes] = useState("");

  const medal =
    team.rank === 1 ? "text-iscarb-gold-dark" : team.rank === 2 ? "text-slate-400" : team.rank === 3 ? "text-amber-700" : "text-muted-foreground";

  return (
    <Card className={cn("border-border/60", isMine && "ring-1 ring-iscarb-green/40")}>
      <CardContent className="pt-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted font-display text-sm font-bold", medal)}>
              {team.rank != null ? `#${team.rank}` : "—"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold text-iscarb-ink dark:text-white">{team.name}</span>
                {isMine && (
                  <Badge variant="secondary" className="bg-iscarb-green-soft text-iscarb-green">
                    {ar ? "فريقك" : "Your team"}
                  </Badge>
                )}
              </div>
              {team.projectTitle && (
                <div className="mt-0.5 text-xs font-medium text-iscarb-cyan-dark">{team.projectTitle}</div>
              )}
              {team.projectSummary && (
                <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{team.projectSummary}</div>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3" />
                  {team.members.map((m) => m.name).join("، ")}
                </span>
                {team.projectUrl && (
                  <a href={team.projectUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-iscarb-cyan hover:underline">
                    <Github className="size-3" /> {ar ? "المستودع" : "Repo"}
                  </a>
                )}
                {team.demoUrl && (
                  <a href={team.demoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-iscarb-cyan hover:underline">
                    <Globe className="size-3" /> {ar ? "العرض" : "Demo"} <ExternalLink className="size-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {team.score != null && (
              <Badge variant="outline" className="border-iscarb-gold/40 text-iscarb-gold-dark">
                <Award className="size-3" /> {team.score}
              </Badge>
            )}
            {team.prizeWonSAR != null && team.prizeWonSAR > 0 && (
              <span className="text-[11px] font-semibold text-iscarb-gold-dark">
                {team.prizeWonSAR.toLocaleString()} {ar ? "ر.س" : "SAR"}
              </span>
            )}
            {!isMine && !isOrganizer && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={async () => {
                  const ok = await onAct({ action: "joinTeam", teamId: team.id });
                  if (ok) notify.ok(lang, { en: "Joined team", ar: "انضممت للفريق" });
                }}
              >
                {ar ? "انضم" : "Join"}
              </Button>
            )}
          </div>
        </div>

        {isOrganizer && (
          <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-border/60 pt-3">
            <div>
              <label className="text-[10px] text-muted-foreground">{ar ? "الدرجة" : "Score"}</label>
              <Input
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="h-8 w-24 text-xs"
                placeholder="0–100"
              />
            </div>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={ar ? "ملاحظات التحكيم (اختياري)" : "Judge notes (optional)"}
              className="h-8 flex-1 text-xs"
            />
            <Button
              size="sm"
              className="h-8 text-xs"
              disabled={score === "" || Number.isNaN(Number(score))}
              onClick={async () => {
                const ok = await onAct(
                  { action: "score", teamId: team.id, score: Number(score), judgeNotes: notes || undefined },
                  "PATCH",
                );
                if (ok) notify.ok(lang, { en: "Score saved", ar: "تم حفظ الدرجة" });
              }}
            >
              {ar ? "احفظ الدرجة" : "Save score"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── create hackathon (organizer) ─────────────────────────────────────────────
function CreateHackathonForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { ar, lang } = useI18n();
  const [f, setF] = useState({
    title: "",
    titleAr: "",
    description: "",
    organizerName: "",
    format: "virtual",
    location: "",
    prizePoolSAR: "",
    maxTeamSize: "5",
    registrationStart: "",
    registrationEnd: "",
    hackathonStart: "",
    hackathonEnd: "",
    judgingEnd: "",
  });
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const toIso = (v: string) => (v ? new Date(v).toISOString() : undefined);

  const datesFilled =
    f.registrationStart && f.registrationEnd && f.hackathonStart && f.hackathonEnd && f.judgingEnd;
  const valid = f.title.trim() && f.description.trim() && f.organizerName.trim() && datesFilled;

  async function submit() {
    setBusy(true);
    const r = await mutate("/api/iscarb/hackathons", "POST", {
      title: f.title.trim(),
      titleAr: f.titleAr.trim() || undefined,
      description: f.description.trim(),
      organizerName: f.organizerName.trim(),
      format: f.format,
      location: f.location.trim() || undefined,
      prizePoolSAR: f.prizePoolSAR ? Number(f.prizePoolSAR) : 0,
      maxTeamSize: f.maxTeamSize ? Number(f.maxTeamSize) : 5,
      registrationStart: toIso(f.registrationStart),
      registrationEnd: toIso(f.registrationEnd),
      hackathonStart: toIso(f.hackathonStart),
      hackathonEnd: toIso(f.hackathonEnd),
      judgingEnd: toIso(f.judgingEnd),
      status: "open",
    });
    setBusy(false);
    if (r.ok) {
      notify.ok(lang, { en: "Hackathon created", ar: "تم إنشاء الهاكاثون" });
      onCreated();
    } else if (r.status === 409) {
      notify.fail(lang, { en: "A hackathon with that name already exists — tweak the title.", ar: "يوجد هاكاثون بنفس الاسم — غيّر العنوان قليلًا." });
    } else {
      notify.fail(lang, { en: "Check the form — dates must be in order.", ar: "راجع النموذج — يجب ترتيب التواريخ زمنيًا." });
    }
  }

  const dateField = (k: keyof typeof f, label: string) => (
    <div>
      <label className="text-[11px] text-muted-foreground">{label}</label>
      <Input type="datetime-local" value={f[k]} onChange={(e) => set(k, e.target.value)} className="text-xs" />
    </div>
  );

  return (
    <Card className="mb-6 border-iscarb-cyan/30">
      <CardContent className="space-y-3 pt-0">
        <div className="flex items-center gap-2 font-display text-sm font-bold text-iscarb-ink dark:text-white">
          <Rocket className="size-4 text-iscarb-cyan" /> {ar ? "إنشاء هاكاثون" : "Create a hackathon"}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder={ar ? "العنوان (إنجليزي) *" : "Title *"} />
          <Input value={f.titleAr} onChange={(e) => set("titleAr", e.target.value)} placeholder={ar ? "العنوان (عربي)" : "Title (Arabic)"} dir="rtl" />
        </div>
        <Textarea value={f.description} onChange={(e) => set("description", e.target.value)} placeholder={ar ? "الوصف *" : "Description *"} rows={2} />
        <div className="grid gap-2 sm:grid-cols-2">
          <Input value={f.organizerName} onChange={(e) => set("organizerName", e.target.value)} placeholder={ar ? "الجهة المنظِّمة * (مثال: أرامكو)" : "Organizer * (e.g. Aramco)"} />
          <Select value={f.format} onValueChange={(v) => set("format", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="virtual">{ar ? "عن بُعد" : "Virtual"}</SelectItem>
              <SelectItem value="in-person">{ar ? "حضوري" : "In-person"}</SelectItem>
              <SelectItem value="hybrid">{ar ? "مدمج" : "Hybrid"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input type="number" value={f.prizePoolSAR} onChange={(e) => set("prizePoolSAR", e.target.value)} placeholder={ar ? "إجمالي الجوائز (ر.س)" : "Prize pool (SAR)"} />
          <Input type="number" value={f.maxTeamSize} onChange={(e) => set("maxTeamSize", e.target.value)} placeholder={ar ? "أقصى حجم للفريق" : "Max team size"} />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {dateField("registrationStart", ar ? "بداية التسجيل *" : "Reg. start *")}
          {dateField("registrationEnd", ar ? "نهاية التسجيل *" : "Reg. end *")}
          {dateField("hackathonStart", ar ? "بداية الفعالية *" : "Event start *")}
          {dateField("hackathonEnd", ar ? "نهاية الفعالية *" : "Event end *")}
          {dateField("judgingEnd", ar ? "نهاية التحكيم *" : "Judging end *")}
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={submit} disabled={!valid || busy}>
            {busy ? (ar ? "جارٍ الإنشاء…" : "Creating…") : ar ? "إنشاء" : "Create"}
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            {ar ? "إلغاء" : "Cancel"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default HackathonsView;
