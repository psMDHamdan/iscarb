"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Compass,
  Flame,
  Loader2,
  Quote,
  Send,
  Swords,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useI18n } from "@/lib/i18n";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { useFetch } from "@/hooks/use-fetch";

// ─────────────────────────────────────────────────────────────────────────────
//  Types — /api/iscarb/agents
// ─────────────────────────────────────────────────────────────────────────────
interface AgentDTO {
  id: string;
  studentId: string;
  studentName: string;
  program: string;
  college: string;
  readinessScore: number;
  name: string; // agent persona name
  persona: "coach" | "challenger" | "scout" | string;
  state: Record<string, unknown>;
  lastNudge: string | null;
  streakDays: number;
  updatedAt: string;
}
interface AgentsResponse {
  agents: AgentDTO[];
}

interface NudgeResponse {
  studentId: string;
  persona: string;
  nudge: string;
  model?: string;
  latencyMs?: number;
  source?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Persona legend
// ─────────────────────────────────────────────────────────────────────────────
const PERSONAS = {
  challenger: {
    label: "Challenger",
    labelAr: "التحدّي",
    motto: "The end of all excuses",
    mottoAr: "نهاية كل الأعذار",
    blurb:
      "Strict, no-excuses voice. Calls out slippage immediately and demands a concrete submission before the day ends.",
    blurbAr:
      "صوتٌ صارمٌ بلا أعذار. يرصد التهاون فوراً ويطالب بتسليمٍ ملموسٍ قبل نهاية اليوم.",
    icon: Swords,
    badgeClass: "border-iscarb-gold/50 bg-iscarb-gold-soft text-iscarb-gold-dark",
    ring: "#FFB700",
    text: "#E0A100",
    glow: "shadow-gold",
    calloutClass: "alert-discipline",
  },
  coach: {
    label: "Coach",
    labelAr: "المرشد",
    motto: "I can, I will",
    mottoAr: "أنا أستطيع، أنا سأفعل",
    blurb:
      "Supportive but firm. Acknowledges momentum, then asks for the next single step — never soft, never vague.",
    blurbAr:
      "داعمٌ لكن حازم. يُقرّ بالزخم، ثم يطلب الخطوة التالية الواحدة — لا لينٌ ولا غموض.",
    icon: Users,
    badgeClass: "border-iscarb-green/40 bg-iscarb-green-soft text-iscarb-green-dark",
    ring: "#1E8A5A",
    text: "#1E8A5A",
    glow: "shadow-brand",
    calloutClass: "border-iscarb-green/30 bg-iscarb-green-soft",
  },
  scout: {
    label: "Scout",
    labelAr: "الكشّاف",
    motto: "Your market window is open",
    mottoAr: "نافذة السوق مفتوحة",
    blurb:
      "Opportunity-focused. Reads live market signals and frames today's work as the door to a specific employer.",
    blurbAr:
      "مُركِّزٌ على الفرص. يقرأ إشارات السوق الحيّة ويصوغ عمل اليوم كبابٍ لصاحب عملٍ محدد.",
    icon: Compass,
    badgeClass: "border-iscarb-cyan/40 bg-iscarb-cyan-soft text-iscarb-cyan-dark",
    ring: "#00B4D8",
    text: "#00B4D8",
    glow: "shadow-brand",
    calloutClass: "border-iscarb-cyan/30 bg-iscarb-cyan-soft",
  },
} as const;

type PersonaKey = keyof typeof PERSONAS;

function personaOf(p: string): PersonaKey {
  if (p === "challenger" || p === "coach" || p === "scout") return p;
  return "coach";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
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
//  AgentView
// ─────────────────────────────────────────────────────────────────────────────
export function AgentView() {
  const { t, ar, lang } = useI18n();
  const { data, loading, error } = useFetch<AgentsResponse>("/api/iscarb/agents");
  const agents = data?.agents ?? [];

  // Map of studentId → most recent nudge result.
  const [nudges, setNudges] = useState<Record<string, NudgeResponse>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const sendNudge = async (studentId: string) => {
    setBusyId(studentId);
    const pending = notify.generating(lang);
    try {
      const r = await fetch("/api/iscarb/agent/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => null);
        throw new Error(j?.error ?? `Request failed (${r.status})`);
      }
      const result = (await r.json()) as NudgeResponse;
      setNudges((prev) => ({ ...prev, [studentId]: result }));
      pending.dismiss();
      if (result.source && result.source !== "ai") {
        notify.fallback(lang);
      } else {
        notify.ok(
          lang,
          { en: "Nudge sent", ar: "أُرسِل التنبيه" },
          { en: "A fresh nudge was generated.", ar: "تم توليد تنبيهٍ جديد." },
        );
      }
    } catch {
      pending.dismiss();
      notify.fail(lang);
    } finally {
      setBusyId(null);
    }
  };

  const counts = useMemo(() => {
    const c = { challenger: 0, coach: 0, scout: 0 };
    for (const a of agents) c[personaOf(a.persona)]++;
    return c;
  }, [agents]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AgentHeader counts={counts} total={agents.length} />

      {error && (
        <div className="alert-iron mb-6 rounded-lg p-3 text-xs text-destructive">
          {t("agent.err.load")}
        </div>
      )}

      {/* Persona legend */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mb-8"
      >
        <motion.div variants={itemAnim}>
          <Card className="border-iscarb-green/15 bg-iscarb-ink text-white shadow-brand">
            <CardContent className="grid gap-5 pt-0 md:grid-cols-3">
              {(Object.keys(PERSONAS) as PersonaKey[]).map((key) => {
                const p = PERSONAS[key];
                const Icon = p.icon;
                const count = counts[key];
                return (
                  <div key={key} className="flex items-start gap-3">
                    <div
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl ring-1"
                      style={{
                        backgroundColor: `${p.ring}22`,
                        color: p.ring,
                        boxShadow: `0 0 0 1px ${p.ring}55`,
                      }}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-base font-bold">
                          {ar ? p.labelAr : p.label}
                        </span>
                        <span
                          className={cn("text-xs text-white/70", ar ? "" : "font-arabic")}
                          dir={ar ? "ltr" : "rtl"}
                        >
                          {ar ? p.label : p.labelAr}
                        </span>
                        <Badge
                          variant="outline"
                          className="ml-auto border-white/20 text-[10px] text-white/80"
                        >
                          {t(count === 1 ? "agent.countOne" : "agent.count", { n: count })}
                        </Badge>
                      </div>
                      <div
                        className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: p.ring }}
                      >
                        “{ar ? p.mottoAr : p.motto}”
                        <span
                          className={cn("ml-1.5 normal-case tracking-normal text-white/70", ar ? "" : "font-arabic")}
                          dir={ar ? "ltr" : "rtl"}
                        >
                          · {ar ? p.motto : p.mottoAr}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-white/70">
                        {ar ? p.blurbAr : p.blurb}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Agents grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {t("agent.empty")}
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {agents.map((a) => (
            <motion.div key={a.id} variants={itemAnim}>
              <AgentCard
                agent={a}
                nudge={nudges[a.studentId] ?? null}
                busy={busyId === a.studentId}
                onSend={() => sendNudge(a.studentId)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Header
// ─────────────────────────────────────────────────────────────────────────────
function AgentHeader({
  counts,
  total,
}: {
  counts: Record<PersonaKey, number>;
  total: number;
}) {
  const { t, ar } = useI18n();
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mb-8">
      <motion.div variants={itemAnim} className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-iscarb-cyan-soft ring-1 ring-iscarb-cyan/15">
          <Bot className="size-5 text-iscarb-cyan-dark" />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-iscarb-cyan">
            {t("agent.header.eyebrow")}
          </div>
          <div
            className={cn("text-xs text-muted-foreground", ar ? "" : "font-arabic")}
            dir={ar ? "ltr" : "rtl"}
          >
            {ar ? "Multi-Agent System" : "نظام الوكلاء المتعددين"}
          </div>
        </div>
      </motion.div>
      <motion.h1
        variants={itemAnim}
        className="mt-3 font-display text-3xl font-bold tracking-tight text-iscarb-ink dark:text-white sm:text-4xl"
      >
        {t("agent.header.titleLead")}{" "}
        <span className="text-gradient-brand">{t("agent.header.titleHighlight")}</span>
      </motion.h1>
      <motion.p variants={itemAnim} className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
        {t("agent.header.subtitle")}
      </motion.p>
      <motion.div variants={itemAnim} className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        <Badge variant="outline" className="border-iscarb-green/30 text-iscarb-green">
          <Users className="size-3" /> {t("agent.header.active", { n: total })}
        </Badge>
        <Badge variant="outline" className="border-iscarb-gold/40 text-iscarb-gold-dark">
          <Swords className="size-3" /> {t("agent.header.challengers", { n: counts.challenger })}
        </Badge>
        <Badge variant="outline" className="border-iscarb-green/40 text-iscarb-green">
          <Users className="size-3" /> {t("agent.header.coaches", { n: counts.coach })}
        </Badge>
        <Badge variant="outline" className="border-iscarb-cyan/40 text-iscarb-cyan-dark">
          <Compass className="size-3" /> {t("agent.header.scouts", { n: counts.scout })}
        </Badge>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  AgentCard
// ─────────────────────────────────────────────────────────────────────────────
function AgentCard({
  agent,
  nudge,
  busy,
  onSend,
}: {
  agent: AgentDTO;
  nudge: NudgeResponse | null;
  busy: boolean;
  onSend: () => void;
}) {
  const persona = PERSONAS[personaOf(agent.persona)];
  const Icon = persona.icon;
  const displayName = nudge?.nudge ?? agent.lastNudge ?? null;
  const { t } = useI18n();

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-card",
        persona.glow,
      )}
      style={{ borderColor: `${persona.ring}33` }}
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: persona.ring }}
      />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-start justify-between gap-2 text-base">
          <div className="flex items-center gap-3">
            <Avatar className="size-11 border-2" style={{ borderColor: `${persona.ring}55` }}>
              <AvatarFallback
                className="font-display text-sm font-bold"
                style={{
                  backgroundColor: `${persona.ring}22`,
                  color: persona.ring,
                }}
              >
                {initials(agent.studentName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-display text-base font-bold leading-tight text-iscarb-ink dark:text-white">
                {agent.studentName}
              </div>
              <div className="text-[11px] text-muted-foreground">{agent.program}</div>
            </div>
          </div>
          <Badge className={cn("border", persona.badgeClass)} variant="outline">
            <Icon className="size-3" /> {persona.label}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 p-2.5">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-iscarb-ink text-iscarb-gold">
              <Bot className="size-3.5" />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("agent.card.agent")}
              </div>
              <div className="text-xs font-semibold text-iscarb-ink dark:text-white">
                {agent.name}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="flex items-center gap-1 font-display text-base font-bold text-iscarb-gold-dark">
                <Flame className="size-3.5" />
                {agent.streakDays}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                {t("agent.card.streak")}
              </div>
            </div>
            <div className="text-center">
              <div
                className="font-display text-base font-bold"
                style={{ color: persona.ring }}
              >
                {agent.readinessScore}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                {t("agent.card.readiness")}
              </div>
            </div>
          </div>
        </div>

        {/* Last nudge / fresh nudge display */}
        <AnimatePresence mode="wait">
          {displayName ? (
            <motion.div
              key={displayName.slice(0, 32) + (nudge ? "-fresh" : "-last")}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "rounded-lg border p-3",
                persona.calloutClass,
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <div
                  className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: persona.text }}
                >
                  <Quote className="size-3" />
                  {nudge ? t("agent.card.fresh") : t("agent.card.last")}
                </div>
                {nudge?.source && (
                  <span className="text-[9px] text-muted-foreground">
                    {nudge.source === "ai" ? "AI" : "fallback"}
                    {nudge.model ? ` · ${nudge.model}` : ""}
                  </span>
                )}
              </div>
              <p
                className="font-arabic text-sm leading-relaxed text-iscarb-ink dark:text-white"
                dir="rtl"
              >
                {displayName}
              </p>
            </motion.div>
          ) : (
            <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-3 text-center text-[11px] text-muted-foreground">
              {t("agent.card.noNudge")}
            </div>
          )}
        </AnimatePresence>

        <Button
          onClick={onSend}
          disabled={busy}
          className="w-full"
          style={{
            backgroundColor: persona.ring,
            color: persona.ring === "#FFB700" ? "#0E2A22" : "#FFFFFF",
          }}
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" /> {t("agent.card.generating")}
            </>
          ) : (
            <>
              <Send className="size-4" /> {t("agent.card.send")}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default AgentView;
