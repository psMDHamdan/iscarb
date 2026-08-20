"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Footprints, Compass, Target, Briefcase, MessageSquareText,
  GraduationCap, FileText, Loader2, Check, Plus, Award, Building2,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { useIscarbFetch, iscarbMutate } from "@/lib/use-iscarb-fetch";
import { RoadmapHero } from "@/components/iscarb/RoadmapHero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Shared client data layer (was a per-view copy; now centralised).
const useJSON = useIscarbFetch;
const postJSON = iscarbMutate;

const L = (ar: boolean, en: string, arr: string) => (ar ? arr : en);

export function JourneyView() {
  const { ar } = useI18n();
  const { selectedStudentId } = useApp();
  const sid = selectedStudentId;

  // Honor a deep-link from the roadmap "next step" (e.g. jump straight to Skills).
  const [defaultTab, setDefaultTab] = useState("discover");
  useEffect(() => {
    try {
      const t = sessionStorage.getItem("iscarb:journeyTab");
      if (t) {
        setDefaultTab(t);
        sessionStorage.removeItem("iscarb:journeyTab");
      }
    } catch {
      /* ignore */
    }
  }, []);

  if (!sid) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
          {L(ar, "Select a student to view their journey.", "اختر طالباً لعرض رحلته.")}
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-iscarb-green-soft text-iscarb-green">
          <Footprints className="size-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-iscarb-ink dark:text-white">
            {L(ar, "Journey & Growth", "الرحلة والنمو")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {L(ar, "From the day you enter university until you graduate — every step feeds your profile.", "من يوم دخولك الجامعة حتى تخرّجك — كل خطوة تغذّي ملفّك.")}
          </p>
        </div>
      </div>

      <RoadmapHero compact />

      <Tabs defaultValue={defaultTab} className="mt-5 w-full">
        <TabsList className="mb-4 flex w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="discover"><Compass className="mr-1 size-3.5" />{L(ar, "Discover", "استكشف")}</TabsTrigger>
          <TabsTrigger value="skills"><Target className="mr-1 size-3.5" />{L(ar, "Skills", "المهارات")}</TabsTrigger>
          <TabsTrigger value="internships"><Briefcase className="mr-1 size-3.5" />{L(ar, "Internships", "التدريب")}</TabsTrigger>
          <TabsTrigger value="interview"><MessageSquareText className="mr-1 size-3.5" />{L(ar, "Interview", "المقابلة")}</TabsTrigger>
          <TabsTrigger value="grad"><GraduationCap className="mr-1 size-3.5" />{L(ar, "Graduation", "التخرّج")}</TabsTrigger>
          <TabsTrigger value="cv"><FileText className="mr-1 size-3.5" />{L(ar, "CV", "السيرة")}</TabsTrigger>
        </TabsList>

        <TabsContent value="discover"><DiscoverTab sid={sid} ar={ar} /></TabsContent>
        <TabsContent value="skills">
          {/* Explore (qualitative funnel) + Build (quantitative level) in one place. */}
          <div className="space-y-4">
            <SkillsTab sid={sid} ar={ar} />
            <TrackerTab sid={sid} ar={ar} />
          </div>
        </TabsContent>
        <TabsContent value="internships"><InternshipsTab sid={sid} ar={ar} /></TabsContent>
        <TabsContent value="interview"><InterviewTab sid={sid} ar={ar} /></TabsContent>
        <TabsContent value="grad"><GraduationTab sid={sid} ar={ar} /></TabsContent>
        <TabsContent value="cv"><CvTab sid={sid} ar={ar} /></TabsContent>
      </Tabs>
    </div>
  );
}

// ── Career Discovery ──
interface CareerCard {
  id: string; titleEn: string; titleAr: string; employer: string; sector: string; cluster: string;
  dayInLifeEn: string; dayInLifeAr: string; skills: string[]; salaryRangeSAR: string | null; demandIndex: number; interest: string | null;
}
function DiscoverTab({ sid, ar }: { sid: string; ar: boolean }) {
  const { data, setData } = useJSON<{ cards: CareerCard[] }>(`/api/iscarb/career-discovery?studentId=${sid}`);
  const save = async (cardId: string, status: string) => {
    await postJSON("/api/iscarb/career-discovery", { studentId: sid, cardId, status });
    setData((d) => d ? { cards: d.cards.map((c) => c.id === cardId ? { ...c, interest: status } : c) } : d);
  };
  if (!data) return <Loading />;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.cards.map((c) => (
        <Card key={c.id} className="border-iscarb-cyan/20">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base">{ar ? c.titleAr : c.titleEn}</CardTitle>
              <Badge variant="secondary" className="bg-iscarb-cyan-soft text-iscarb-cyan-dark">{c.demandIndex}</Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Building2 className="size-3" />{c.employer} · {c.sector}</div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{ar ? c.dayInLifeAr : c.dayInLifeEn}</p>
            <div className="flex flex-wrap gap-1">{c.skills.map((s) => <Badge key={s} variant="outline" className="text-[11px]">{s}</Badge>)}</div>
            {c.salaryRangeSAR && <div className="text-xs font-medium text-iscarb-green">{c.salaryRangeSAR} {L(ar, "SAR/mo", "ريال/شهر")}</div>}
            <div className="flex gap-2">
              <Button size="sm" variant={c.interest === "target" ? "default" : "outline"} onClick={() => save(c.id, "target")}>
                {c.interest === "target" ? <Check className="mr-1 size-3.5" /> : <Target className="mr-1 size-3.5" />}{L(ar, "Set as target", "اجعلها هدفاً")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => save(c.id, "saved")}>{L(ar, "Save", "حفظ")}</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Skills Explorer ──
interface Exp { id: string; skillName: string; status: string }
function SkillsTab({ sid, ar }: { sid: string; ar: boolean }) {
  const [tick, setTick] = useState(0);
  const { data } = useJSON<{ explorations: Exp[]; suggestions: { skillName: string; sscoCode: string | null }[] }>(`/api/iscarb/skills-explorer?studentId=${sid}`, tick);
  const act = async (skillName: string, advance: boolean, sscoCode?: string | null) => {
    await postJSON("/api/iscarb/skills-explorer", { studentId: sid, skillName, advance, sscoCode });
    setTick((t) => t + 1);
  };
  if (!data) return <Loading />;
  const order = ["discovered", "interested", "learning", "demonstrated"];
  const color: Record<string, string> = { discovered: "#94A3B8", interested: "#00B4D8", learning: "#FFB700", demonstrated: "#1E8A5A" };
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">{L(ar, "Skills you're building", "المهارات التي تبنيها")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {data.explorations.length === 0 && <p className="text-sm text-muted-foreground">{L(ar, "Pick a suggested skill to start.", "اختر مهارة مقترحة للبدء.")}</p>}
          {data.explorations.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 p-2">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ background: color[e.status] }} />
                <span className="text-sm font-medium">{e.skillName}</span>
                <Badge variant="outline" className="text-[10px]">{L(ar, e.status, e.status)}</Badge>
              </div>
              {e.status !== "demonstrated" && (
                <Button size="sm" variant="ghost" onClick={() => act(e.skillName, true)}>
                  {L(ar, "Advance", "تقدّم")} →
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">{L(ar, "Suggested for your target", "مقترحة لهدفك")}</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {data.suggestions.map((s) => (
            <Button key={s.skillName} size="sm" variant="outline" onClick={() => act(s.skillName, false, s.sscoCode)}>
              <Plus className="mr-1 size-3.5" />{s.skillName}
            </Button>
          ))}
          {data.suggestions.length === 0 && <p className="text-sm text-muted-foreground">{L(ar, "You're exploring all suggested skills.", "أنت تستكشف كل المهارات المقترحة.")}</p>}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Skill Builder Tracker ──
interface SkillProg { id: string; skillName: string; currentLevel: number; targetLevel: number; recommendation: string; gap: number }
function TrackerTab({ sid, ar }: { sid: string; ar: boolean }) {
  const [tick, setTick] = useState(0);
  const { data } = useJSON<{ skills: SkillProg[]; practiceTypes: string[] }>(`/api/iscarb/skill-tracker?studentId=${sid}`, tick);
  const [newSkill, setNewSkill] = useState("");
  const log = async (skillName: string, activityType: string) => {
    await postJSON("/api/iscarb/skill-tracker", { studentId: sid, skillName, activityType });
    setTick((t) => t + 1);
  };
  if (!data) return <Loading />;
  const recColor: Record<string, string> = { "needs-practice": "#E11D48", "on-track": "#FFB700", mastered: "#1E8A5A" };
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{L(ar, "Skill progress", "تقدّم المهارات")}</CardTitle>
        <div className="flex gap-2 pt-2">
          <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder={L(ar, "Add a skill…", "أضف مهارة…")} className="h-9 max-w-xs" />
          <Button size="sm" disabled={!newSkill.trim()} onClick={() => { log(newSkill.trim(), "course"); setNewSkill(""); }}>
            <Plus className="mr-1 size-3.5" />{L(ar, "Add", "أضف")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.skills.length === 0 && <p className="text-sm text-muted-foreground">{L(ar, "No tracked skills yet.", "لا مهارات متتبَّعة بعد.")}</p>}
        {data.skills.map((s) => (
          <div key={s.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{s.skillName}</span>
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]" style={{ color: recColor[s.recommendation] }}>{L(ar, s.recommendation, s.recommendation)}</Badge>
                <span className="text-xs text-muted-foreground">{Math.round(s.currentLevel)}/{Math.round(s.targetLevel)}</span>
              </span>
            </div>
            <Progress value={(s.currentLevel / (s.targetLevel || 100)) * 100} className="h-2" />
            <div className="flex flex-wrap gap-1 pt-0.5">
              {["course", "project", "challenge"].map((p) => (
                <Button key={p} size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => log(s.skillName, p)}>
                  + {L(ar, p, p)}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Internships ──
interface Intern { id: string; employer: string; role: string; status: string; evaluationScore: number | null; startDate: string; skills: string[] }
function InternshipsTab({ sid, ar }: { sid: string; ar: boolean }) {
  const [tick, setTick] = useState(0);
  const { data } = useJSON<{ internships: Intern[] }>(`/api/iscarb/internships?studentId=${sid}`, tick);
  const [form, setForm] = useState({ employer: "", role: "" });
  const add = async () => {
    if (!form.employer.trim() || !form.role.trim()) return;
    await postJSON("/api/iscarb/internships", { studentId: sid, employer: form.employer, role: form.role, startDate: new Date().toISOString() });
    setForm({ employer: "", role: "" });
    setTick((t) => t + 1);
  };
  const complete = async (id: string) => {
    await postJSON("/api/iscarb/internships", { id, action: "complete", evaluationScore: 88 }, "PATCH");
    setTick((t) => t + 1);
  };
  if (!data) return <Loading />;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{L(ar, "Internship log", "سجل التدريب")}</CardTitle>
        <p className="text-xs text-muted-foreground">{L(ar, "Completing an internship adds it to your portfolio and raises your equity.", "إكمال التدريب يضيفه لملفّك ويرفع قيمتك.")}</p>
        <div className="grid gap-2 pt-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input value={form.employer} onChange={(e) => setForm({ ...form, employer: e.target.value })} placeholder={L(ar, "Employer", "جهة العمل")} className="h-9" />
          <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder={L(ar, "Role", "الدور")} className="h-9" />
          <Button size="sm" onClick={add}><Plus className="mr-1 size-3.5" />{L(ar, "Log", "سجّل")}</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.internships.length === 0 && <p className="text-sm text-muted-foreground">{L(ar, "No internships logged.", "لا تدريبات مسجَّلة.")}</p>}
        {data.internships.map((i) => (
          <div key={i.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 p-3">
            <div>
              <div className="text-sm font-medium">{i.role} — {i.employer}</div>
              <div className="text-xs text-muted-foreground">{new Date(i.startDate).toLocaleDateString(ar ? "ar-SA" : "en-US")} · {L(ar, i.status, i.status)}{i.evaluationScore != null ? ` · ${Math.round(i.evaluationScore)}/100` : ""}</div>
            </div>
            {i.status === "ongoing" ? (
              <Button size="sm" variant="outline" onClick={() => complete(i.id)}>{L(ar, "Mark complete", "إكمال")}</Button>
            ) : (
              <Badge className="bg-iscarb-green-soft text-iscarb-green-dark"><Check className="mr-1 size-3" />{L(ar, "In portfolio", "في الملف")}</Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Interview Prep — now a first-class destination (see InterviewPrepView) ──
interface IPrep { readiness: number; targetTitle: string | null }
function InterviewTab({ sid, ar }: { sid: string; ar: boolean }) {
  const { setView } = useApp();
  const { data } = useJSON<IPrep>(`/api/iscarb/interview-prep?studentId=${sid}`);
  return (
    <Card className="border-iscarb-green/20 bg-iscarb-green-soft/20">
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-iscarb-green-soft text-iscarb-green">
          <MessageSquareText className="size-6" />
        </div>
        <div>
          <div className="font-display text-lg font-bold text-iscarb-ink dark:text-white">
            {L(ar, "Interview Simulator", "محاكي المقابلات")}
          </div>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {L(ar, "Company-aware practice questions (Aramco, stc, SABIC, NEOM) and your readiness score now live in their own space.", "أسئلة تدريب مخصَّصة للشركات (أرامكو، stc، سابك، نيوم) وجاهزيتك الآن في مساحتها الخاصة.")}
          </p>
        </div>
        {data && data.readiness > 0 && (
          <Badge variant="outline" className="border-iscarb-green/40 text-iscarb-green-dark">
            {L(ar, `Current readiness: ${Math.round(data.readiness)}/100`, `الجاهزية الحالية: ${Math.round(data.readiness)}/100`)}
          </Badge>
        )}
        <Button onClick={() => setView("interview-prep")} className="bg-iscarb-green text-white hover:bg-iscarb-green-dark">
          {L(ar, "Open Interview Simulator", "افتح محاكي المقابلات")}
        </Button>
      </CardContent>
    </Card>
  );
}

// ── CV & LinkedIn — now a first-class destination (see CvLinkedInView) ──
function CvTab({ ar }: { sid: string; ar: boolean }) {
  const { setView } = useApp();
  return (
    <Card className="border-iscarb-cyan/20 bg-iscarb-cyan-soft/20">
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-iscarb-cyan-soft text-iscarb-cyan-dark">
          <FileText className="size-6" />
        </div>
        <div>
          <div className="font-display text-lg font-bold text-iscarb-ink dark:text-white">
            {L(ar, "CV & LinkedIn", "السيرة الذاتية و LinkedIn")}
          </div>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {L(ar, "Your ATS-ready CV now has a LinkedIn-optimized sibling, both built from your live portfolio.", "سيرتك الذاتية المتوافقة مع ATS لها الآن شقيقة محسَّنة لـ LinkedIn، وكلتاهما مبنيّتان من ملفّك الحيّ.")}
          </p>
        </div>
        <Button onClick={() => setView("cv-builder")} className="bg-iscarb-cyan text-white hover:bg-iscarb-cyan-dark">
          {L(ar, "Open CV & LinkedIn", "افتح السيرة الذاتية و LinkedIn")}
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Graduation Checklist ──
interface GItem { key: string; labelEn: string; labelAr: string; required: boolean; met: boolean; detail: string }
function GraduationTab({ sid, ar }: { sid: string; ar: boolean }) {
  const { data } = useJSON<{ percent: number; items: GItem[]; requiredMet: number; requiredTotal: number }>(`/api/iscarb/graduation?studentId=${sid}`);
  if (!data) return <Loading />;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{L(ar, "Ready to graduate", "الجاهزية للتخرّج")}</CardTitle>
          <Badge className="bg-iscarb-green-soft text-iscarb-green-dark text-sm">{data.percent}%</Badge>
        </div>
        <Progress value={data.percent} className="mt-2 h-2.5" />
        <p className="pt-1 text-xs text-muted-foreground">{data.requiredMet}/{data.requiredTotal} {L(ar, "required milestones met — derived from your real activity.", "متطلباً مكتملاً — مشتقّة من نشاطك الحقيقي.")}</p>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {data.items.map((it) => (
          <div key={it.key} className="flex items-center justify-between gap-2 border-b border-border/40 py-1.5 last:border-0">
            <span className="flex items-center gap-2 text-sm">
              <span className={`flex size-5 items-center justify-center rounded-full ${it.met ? "bg-iscarb-green text-white" : "bg-muted text-muted-foreground"}`}>
                {it.met ? <Check className="size-3" /> : <span className="size-1.5 rounded-full bg-current" />}
              </span>
              <span className={it.met ? "" : "text-muted-foreground"}>{ar ? it.labelAr : it.labelEn}</span>
              {!it.required && <Badge variant="outline" className="text-[9px]">{L(ar, "optional", "اختياري")}</Badge>}
            </span>
            <span className="text-xs text-muted-foreground">{it.detail}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Loading() {
  return <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>;
}

export default JourneyView;
