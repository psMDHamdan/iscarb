'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ChevronDown,
  Sparkles,
  BrainCircuit,
  ShieldCheck,
  BarChart3,
  Plug,
  GraduationCap,
  Users,
  Briefcase,
  Layers,
  Activity,
  MessageSquare,
  Network,
  Globe,
  Route,
  HeartPulse,
  Check,
  X,
  Quote
} from 'lucide-react';
import { Reveal, MagneticButton, GrainOverlay } from '@/components/iscarb/landing';

/** Static hero preview of the scored Employability Exam report. */
function HeroReportPreview() {
  const dimensions = [
    { label: 'Core Professionalism', score: 82, icon: Users },
    { label: 'Business & Digital', score: 74, icon: Plug },
    { label: 'Job-Fit (Technical)', score: 79, icon: Briefcase },
    { label: 'Growth Potential', score: 71, icon: Activity },
  ];

  return (
    <div
      className="relative w-full max-w-[400px] mx-auto"
      aria-hidden="true"
    >
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-emerald-400/20 via-teal-300/10 to-transparent blur-2xl" />

      <div className="rounded-2xl sm:rounded-3xl border border-emerald-500/25 bg-white/90 backdrop-blur-2xl shadow-[0_20px_60px_-20px_rgba(5,150,105,0.35)] overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-emerald-100 bg-emerald-50/80 px-5 py-3.5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#059669]">
              Sample report
            </p>
            <p className="text-sm font-bold text-slate-900 truncate">
              Employability Profile
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[10px] font-bold text-[#047857]">
            4 dimensions
          </span>
        </div>

        <div className="px-5 pt-6 pb-5 flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
          <div className="relative flex size-[7.25rem] shrink-0 items-center justify-center rounded-full border-[6px] border-emerald-100 bg-gradient-to-b from-white to-emerald-50 shadow-inner">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  'conic-gradient(#059669 0 278deg, #d1fae5 278deg 360deg)',
                mask: 'radial-gradient(farthest-side, transparent calc(100% - 10px), #000 calc(100% - 9px))',
                WebkitMask:
                  'radial-gradient(farthest-side, transparent calc(100% - 10px), #000 calc(100% - 9px))',
              }}
            />
            <div className="relative text-center leading-none">
              <div className="text-3xl font-black tabular-nums text-slate-900">78</div>
              <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                / 100
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left space-y-1.5">
            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#047857]">
              Strong readiness
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Composite score after 47 scenario questions — AI-scored against named rubrics.
            </p>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-3.5">
          {dimensions.map((d) => (
            <div key={d.label} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <d.icon className="size-3.5 shrink-0 text-[#059669]" />
                  <span className="text-[11px] font-semibold text-slate-800 truncate">
                    {d.label}
                  </span>
                </div>
                <span className="text-[11px] font-bold tabular-nums text-slate-900">
                  {d.score}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-emerald-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#059669] to-[#0d9488]"
                  style={{ width: `${d.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-emerald-100 bg-slate-50/80 px-5 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
            <ShieldCheck className="size-3.5 text-[#059669]" />
            Rubric-anchored · STAR · Framework-linked
          </div>
          <span className="text-[10px] font-bold text-[#059669] whitespace-nowrap">
            After you finish
          </span>
        </div>
      </div>
    </div>
  );
}

function GlowingButton({
  children,
  href,
  primary = false,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  href?: string;
  primary?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <MagneticButton
      href={href}
      onClick={onClick}
      variant={primary ? 'primary' : 'ghost'}
      className={className}
    >
      {children}
    </MagneticButton>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  arabicSubtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  arabicSubtitle?: string;
}) {
  return (
    <div className="max-w-4xl mx-auto text-center mb-10 sm:mb-16 space-y-3 sm:space-y-4 px-1">
      {eyebrow && (
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-50/80 backdrop-blur-md px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[#059669] shadow-sm">
            <Sparkles size={14} className="text-[#059669] shrink-0" />
            {eyebrow}
          </span>
        </Reveal>
      )}
      <Reveal delay={0.1}>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-display font-black tracking-tight text-slate-900 leading-tight">
          {title}
        </h2>
      </Reveal>
      {arabicSubtitle && (
        <Reveal delay={0.15}>
          <p className="text-base sm:text-lg md:text-xl font-arabic font-bold text-[#059669]/80 tracking-wide">
            {arabicSubtitle}
          </p>
        </Reveal>
      )}
      {subtitle && (
        <Reveal delay={0.2}>
          <div className="text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed font-normal max-w-3xl mx-auto">
            {subtitle}
          </div>
        </Reveal>
      )}
    </div>
  );
}

function FAQAccordion({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-emerald-500/20 bg-white/75 backdrop-blur-2xl rounded-2xl overflow-hidden hover:border-emerald-500/50 hover:shadow-lg shadow-[0_8px_32px_rgba(5,150,105,0.05)]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full p-4 sm:p-6 text-left font-bold text-sm sm:text-base md:text-lg text-slate-900 flex items-center justify-between gap-3 sm:gap-4 min-h-12 touch-manipulation cursor-pointer hover:bg-emerald-50/95"
      >
        <span className="pr-2">{q}</span>
        <ChevronDown
          className={`size-5 text-[#059669] shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-4 sm:px-6 pb-5 sm:pb-6 text-slate-600 leading-relaxed text-sm md:text-base border-t border-emerald-100/60 pt-4">
          {a}
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const [activeStory, setActiveStory] = useState(0);

  const stories = [
    {
      tab: 'Employability Exam',
      title: 'Taking the Employability Exam',
      subtitle: 'Live today — 47 scenario-based questions across four dimensions, then a personalized report.',
      comingSoon: false,
      body: [
        'You sign in and open the Employability Exam. No long personality quiz — you move straight into workplace scenarios tied to four scored sections.',
        'Most questions are multiple-choice scenarios (for example: how you would handle an upset client or a digital-security decision). You choose the response that best matches what you would do.',
        'AI scores each answer against a named rubric. Scoring takes time — it is not instant — and when you finish, your personalized four-dimension report is prepared for you to review.',
        'Your profile shows where you stand across Core Professionalism, Business & Digital Literacy, Job-Fit (Technical), and Growth Potential — a scored map, not a vibe.'
      ],
      icon: Briefcase
    },
    {
      tab: 'Resume Badges',
      title: 'How Competency Badging Will Change Your Resume Conversation',
      subtitle: 'Coming soon — verified proof anchored to a standard.',
      comingSoon: true,
      body: [
        'Competency & Badging will convert verified exam performance into named competency badges recruiters can trust.',
        'In an interview, you will be able to walk through scored scenarios with exact rubric points instead of scrambling for a half-fitting story.',
        'Badges will be rehearsal for the conversation — not just icons on a profile.',
        'This journey module is not live yet; today you get your scored Employability Exam report.'
      ],
      icon: ShieldCheck
    },
    {
      tab: 'Career Paths',
      title: 'Discovering a Career Path You Hadn\'t Considered',
      subtitle: 'Coming soon — paths grounded in demonstrated evidence.',
      comingSoon: true,
      body: [
        'Career Explorer will open populated with your Employability Exam profile and related signals — without a new preference quiz.',
        'It will surface expected paths and adjacent options with a clear evidence chain.',
        'Gap maps will show what to build next.',
        'This journey module is not live yet; today your four-dimension report is the foundation.'
      ],
      icon: Route
    },
    {
      tab: 'Night Before Interview',
      title: 'Portfolio Builder, the Night Before an Interview',
      subtitle: 'Coming soon — a portfolio that stays current.',
      comingSoon: true,
      body: [
        'Portfolio Builder will organize your exam results and related work into a presentable link.',
        'You will spend minutes highlighting relevant pieces instead of rebuilding from scratch.',
        'This journey module is not live yet.',
        'For this launch, use your Employability Exam report as your scored evidence pack.'
      ],
      icon: Layers
    },
    {
      tab: 'Wellbeing Intervention',
      title: 'A Rough Semester, Caught Early',
      subtitle: 'Coming soon — wellness signals alongside career growth.',
      comingSoon: true,
      body: [
        'Wellbeing Tracker will watch for strain patterns and offer gentle campus guidance.',
        'The goal is early intervention before burnout costs a semester.',
        'This journey module is not live yet.',
        'Today the live product is the Employability Exam and its report.'
      ],
      icon: HeartPulse
    },
    {
      tab: '11pm AI Guidance',
      title: '11pm, AI Assistant, No Office Hours in Sight',
      subtitle: 'Coming soon — context-aware guidance from your profile.',
      comingSoon: true,
      body: [
        'AI Assistant will use your exam profile and rubric gaps to suggest targeted preparation.',
        'Advising sessions can then start from what you already know you need.',
        'This journey module is not live yet.',
        'Today, review your generated report after you finish the exam.'
      ],
      icon: MessageSquare
    }
  ];

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-[#FAFBFB] text-slate-800 antialiased selection:bg-[#059669] selection:text-white">
      <GrainOverlay />

      {/* Rich Arabic Calligraphy Glass Watermarks */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-[0.04] z-0 overflow-hidden select-none">
        <h1 className="text-[20vw] font-arabic font-black text-[#059669] whitespace-nowrap -rotate-6 filter drop-shadow-[0_10px_20px_rgba(5,150,105,0.2)]">
          وَقُل رَّبِّ زِدْنِي عِلْمًا
        </h1>
      </div>
      <div className="fixed -bottom-20 -right-20 pointer-events-none opacity-[0.03] z-0 overflow-hidden select-none hidden sm:block">
        <h2 className="text-[14vw] font-arabic font-black text-[#0f766e] whitespace-nowrap rotate-12">
          إسكارب — منصة الجاهزية
        </h2>
      </div>

      {/* Floating Ultra Glass Nav */}
      <nav className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 sm:px-4 pt-3 sm:pt-5">
        <div className="flex w-full max-w-6xl items-center justify-between gap-2 sm:gap-4 rounded-full border border-emerald-500/20 bg-white/80 px-3 sm:px-5 py-2.5 sm:py-3 shadow-[0_8px_32px_rgba(5,150,105,0.08)] backdrop-blur-2xl">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 group min-w-0 shrink-0">
            <img
              src="/iscarb-mark.png?v=4"
              alt="iSCARB"
              width={36}
              height={36}
              className="h-8 w-8 sm:h-9 sm:w-9 object-contain shrink-0"
            />
            <div className="flex flex-col min-w-0 leading-none">
              <span className="font-display text-lg sm:text-xl font-extrabold tracking-tight">
                <span className="text-[#0F7B8A]">i</span>
                <span className="text-[#0E6C3C]">SCARB</span>
              </span>
              <span className="text-[9px] font-arabic font-bold text-[#059669]/80 leading-tight hidden sm:block mt-0.5">
                إسكارب
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <GlowingButton href="/signup" className="!text-xs sm:!text-sm !pl-3 sm:!pl-5">
              Sign Up
            </GlowingButton>
            <GlowingButton href="/login" primary className="!text-xs sm:!text-sm !pl-3 sm:!pl-5">
              <span className="sm:hidden">Sign In</span>
              <span className="hidden sm:inline">Sign In</span>
            </GlowingButton>
          </div>
        </div>
      </nav>

      <main className="relative z-10 flex flex-col pt-24 sm:pt-32 pb-16 sm:pb-24 space-y-16 sm:space-y-24">

        {/* ── 1. HERO SECTION ────────────────────────────────────────────── */}
        <section className="min-h-0 sm:min-h-[85dvh] flex flex-col justify-center px-4 md:px-6 lg:px-8 max-w-7xl mx-auto w-full py-8 sm:py-12">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 text-left space-y-5 sm:space-y-6">
              <Reveal>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-[0.14em] sm:tracking-[0.18em] text-[#059669] max-w-full">
                  <span className="relative flex size-2 shrink-0">
                    <span className="relative inline-flex size-2 rounded-full bg-[#059669]"></span>
                  </span>
                  <span className="leading-snug">Employability Exam is live. The full platform is coming.</span>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <h1 className="font-display text-[1.75rem] leading-[1.15] sm:text-5xl lg:text-6xl font-extrabold sm:leading-[1.12] tracking-tight text-slate-900">
                  Know exactly how ready you are for the job market.{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#059669] to-[#0d9488]">
                    Then get ready faster.
                  </span>
                </h1>
              </Reveal>

              <Reveal delay={0.2}>
                <p className="text-sm sm:text-base md:text-lg leading-relaxed text-slate-600 font-normal max-w-2xl">
                  Most students graduate with a transcript and a guess. iSCARB replaces the guess with a real, AI-scored Employability Exam — 47 scenario-based questions across four dimensions, followed by a personalized report after you finish. The exam is live right now. Eight more journey modules on the path to becoming job-ready are on the way.
                </p>
              </Reveal>

              <Reveal delay={0.3}>
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 [&_button]:w-full sm:[&_button]:w-auto">
                  <GlowingButton href="#what-ready-means" primary>
                    Explore the Employability Exam
                  </GlowingButton>
                  <GlowingButton href="#journey">See How It Works</GlowingButton>
                </div>
              </Reveal>

              <Reveal delay={0.4}>
                <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 border-t border-emerald-500/20">
                  {[
                    { title: '47 Scenario Questions', icon: Briefcase },
                    { title: '4-Dimension Profile', icon: BarChart3 },
                    { title: 'Framework Anchored', icon: ShieldCheck },
                    { title: 'Bilingual Assessment', icon: Globe },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-start gap-1 p-3 rounded-xl bg-white/75 backdrop-blur-2xl border border-emerald-500/20 shadow-sm hover:border-emerald-500/40 hover:shadow-md"
                    >
                      <stat.icon className="size-5 text-[#059669]" />
                      <span className="text-[11px] sm:text-xs font-bold text-slate-800 leading-snug">
                        {stat.title}
                      </span>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Sample employability report preview */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end px-1 sm:px-0 order-first lg:order-none mb-2 lg:mb-0">
              <Reveal delay={0.2}>
                <HeroReportPreview />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── 2. THE PROBLEM (AGITATION SECTION) ───────────────────────── */}
        <section id="problem" className="py-8 sm:py-12 px-4 max-w-6xl mx-auto w-full">
          <SectionHeading
            eyebrow="The Problem"
            arabicSubtitle="مشكلة الجاهزية المهنية في سوق العمل"
            title="The job market doesn't care about your GPA. It cares if you're ready."
          />
          <div className="space-y-5 sm:space-y-6 text-slate-700 text-sm sm:text-base md:text-lg leading-relaxed bg-white/80 backdrop-blur-2xl p-5 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl border border-emerald-500/20 shadow-[0_12px_40px_rgba(5,150,105,0.08)]">
            <p>
              Here's the uncomfortable truth nobody tells you in your first three years of university: grades measure whether you can pass a course. They don't measure whether you can walk into a real workplace and handle what it throws at you. A 3.8 GPA tells an employer you're good at exams. It says almost nothing about whether you can de-escalate an angry client, choose the right project methodology under pressure, spot a phishing email before it costs the company money, or write a SQL query that doesn't quietly corrupt the data.
            </p>
            <p>
              Most students find this out the hard way — in an interview, three questions in, when the recruiter asks something that isn't on any syllabus. Or worse, they find out after they're hired, in the first ninety days, when "book smart" and "job ready" turn out to be two very different things.
            </p>
            <p>
              The traditional system was never built to catch this gap. Career centers run generic workshops. Personality quizzes generate feel-good labels that don't map to anything an employer actually screens for. Resume templates tell you how to format bullet points, not whether you have the substance behind them. None of it is measured. None of it is scored. None of it tells you, specifically, what to fix.
            </p>

            <div className="p-4 sm:p-6 rounded-2xl bg-emerald-50/80 backdrop-blur-md border-l-4 border-[#059669] font-bold text-slate-900 text-base sm:text-lg">
              iSCARB exists because "you'll figure it out" is not a strategy, and a GPA is not an Employability Exam result.
            </div>

            <div id="what-ready-means" className="pt-8 border-t border-emerald-100/60 space-y-6 scroll-mt-28">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                What &quot;ready&quot; actually means
              </h3>
              <p className="text-slate-600">
                The Employability Exam is not a personality quiz and not a GPA substitute. It scores you across four sections that map to what employers actually evaluate — whether they say it out loud or not. Each section has a clear purpose:
              </p>
              <div className="grid sm:grid-cols-2 gap-6 pt-2">
                {[
                  {
                    title: 'Core Professionalism',
                    purpose: 'Workplace judgment under pressure',
                    icon: Users,
                    desc: 'Purpose: measure how you communicate, take ownership, and handle conflict in real scenarios — not how well you describe soft skills on a resume.',
                  },
                  {
                    title: 'Business & Digital Literacy',
                    purpose: 'How work actually gets done',
                    icon: Plug,
                    desc: 'Purpose: check whether you understand how a business makes money and can operate the digital tools a modern workplace runs on.',
                  },
                  {
                    title: 'Job-Fit (Technical)',
                    purpose: 'Field-specific competence',
                    icon: Briefcase,
                    desc: 'Purpose: score the technical skills tied to your discipline — the ones an employer in your field will actually test you on.',
                  },
                  {
                    title: 'Growth Potential',
                    purpose: 'Coachability and improvement',
                    icon: Activity,
                    desc: 'Purpose: see whether you can take feedback and improve visibly, or whether you stall when the work gets hard.',
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-5 sm:p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-emerald-500/20 hover:border-emerald-500/50 shadow-sm hover:shadow-md"
                  >
                    <item.icon className="size-7 text-[#059669] mb-3" />
                    <h4 className="text-base font-bold text-slate-900 mb-1">
                      {item.title}
                    </h4>
                    <p className="text-xs font-semibold text-[#059669] mb-2">
                      {item.purpose}
                    </p>
                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. HOW iSCARB WORKS (PLATFORM OVERVIEW) ───────────────────── */}
        <section id="journey" className="py-12 px-4 max-w-6xl mx-auto w-full">
          <SectionHeading
            eyebrow="Platform Overview"
            arabicSubtitle="نظام ممكن ومتكامل للمناهج والمهارات"
            title="Scored today. Connected platform next."
            subtitle="What is live now: take the Employability Exam, get AI-scored results, and open a personalized four-dimension report. Later journey modules on your job-ready path (badges, career paths, portfolio, and more) build on that same foundation."
          />
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                num: '01',
                title: 'Grade',
                desc: "Each answer is evaluated against a named rubric and professional framework — not vague AI encouragement. Criteria are visible in your feedback.",
              },
              {
                num: '02',
                title: 'Assemble',
                desc: 'Individual question scores roll up into four dimension scores and a composite Employability Exam profile.',
              },
              {
                num: '03',
                title: 'Deliver',
                desc: 'After you finish, a personalized report is generated with dimension scores, feedback, and development guidance you can review.',
              },
            ].map((step, i) => (
              <div
                key={i}
                className="relative p-6 sm:p-8 rounded-3xl bg-white/75 backdrop-blur-2xl border border-emerald-500/20 shadow-[0_8px_32px_rgba(5,150,105,0.06)] hover:shadow-xl hover:border-emerald-500/40 group overflow-hidden"
              >
                <span className="text-4xl font-black text-emerald-600/20 mb-4 block font-mono">
                  {step.num}
                </span>
                <h4 className="text-xl font-bold text-slate-900 mb-2">
                  {step.title}
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. FEATURE MODULES — FULL DETAIL ────────────────────────────── */}
        <section id="modules" className="py-12 px-4 max-w-6xl mx-auto w-full space-y-12">
          <SectionHeading
            eyebrow="Your Job-Ready Journey"
            title="Nine modules on the path to becoming job-ready"
            subtitle="These journey modules are the stages of your improvement path through iSCARB — not the exam questions. Journey module 1 (the Employability Exam) is live; the rest are on the roadmap."
          />

          {/* Journey module 1 - Detailed Live Card */}
          <div className="p-6 sm:p-8 md:p-12 rounded-3xl bg-gradient-to-br from-emerald-900 to-[#047857] text-white shadow-2xl relative overflow-hidden space-y-5 sm:space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-200 border border-emerald-300/30">
                <span className="size-2 rounded-full bg-emerald-400"></span>
                🟢 LIVE NOW
              </span>
              <span className="text-xs font-mono text-emerald-200">
                Journey module 1 of 9
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black">
              JOURNEY MODULE 1 — Employability Exam
            </h3>
            <p className="text-base sm:text-xl text-emerald-100 font-medium italic">
              "Am I ready for a real job in my field, or am I about to find out the hard way that I'm not?"
            </p>
            <h4 className="text-lg sm:text-2xl font-bold text-white">
              Stop guessing whether you're ready. Take the Employability Exam and get a scored, defensible report.
            </h4>

            <div className="grid md:grid-cols-2 gap-6 text-sm text-emerald-100/90 border-y border-emerald-600/40 py-6">
              <div className="space-y-2">
                <h5 className="font-bold text-white">The Old Way</h5>
                <p className="leading-relaxed opacity-90">
                  You graduate, apply, interview, and somewhere in that process discover if you actually had the skills. No rehearsal. No feedback loop.
                </p>
              </div>
              <div className="space-y-2">
                <h5 className="font-bold text-white">The iSCARB Way</h5>
                <p className="leading-relaxed opacity-90">
                  You take the Employability Exam before it matters: 47 scenario-based questions (primarily multiple choice) scored by AI against named rubrics such as STAR and Cialdini. When you finish, a personalized four-dimension report is generated.
                </p>
              </div>
            </div>

            <div className="pt-2 [&_button]:w-full sm:[&_button]:w-auto">
              <GlowingButton href="/assessment/employability" primary>
                Start the Employability Exam
              </GlowingButton>
            </div>
          </div>

          {/* Journey modules 2 through 9 */}
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                num: 'JOURNEY MODULE 2',
                title: 'Academic & Course Management',
                status: '🔜 Coming Soon',
                question: "Why does my coursework feel completely disconnected from my career prep?",
                headline: 'Your transcript, finally working for your career instead of sitting next to it.',
                desc: 'Connects directly into your Employability Exam and competency record. Every course grade automatically deepens your employability picture.',
                icon: GraduationCap,
              },
              {
                num: 'JOURNEY MODULE 3',
                title: 'Competency & Badging',
                status: '🔜 Coming Soon',
                question: "How do I prove I actually have a skill, instead of just typing it on a resume?",
                headline: "Turn 'I know how to do this' into 'here's the proof, verified.'",
                desc: 'Converts your verified performance into named competency badges backed by rubric-graded evidence recruiters can trust.',
                icon: ShieldCheck,
              },
              {
                num: 'JOURNEY MODULE 4',
                title: 'Career Explorer',
                status: '🔜 Coming Soon',
                question: "What careers fit who I am — not what a 90-second quiz decided?",
                headline: 'Career paths grounded in evidence, not a guess dressed up as a quiz result.',
                desc: 'Matches career paths based on your actual performance data across all 4 employability dimensions.',
                icon: Route,
              },
              {
                num: 'JOURNEY MODULE 5',
                title: 'Portfolio Builder',
                status: '🔜 Coming Soon',
                question: "I know I should have a portfolio, but I never have time to build one.",
                headline: 'A portfolio that keeps itself current, so you focus on the work.',
                desc: 'Auto-populates your Employability Exam results, competency badges, and coursework into a presentable, structured portfolio.',
                icon: Layers,
              },
              {
                num: 'JOURNEY MODULE 6',
                title: 'Community',
                status: '🔜 Coming Soon',
                question: "Is everyone else figuring this out with a support system I don't have?",
                headline: "You're not supposed to do this by yourself. Now you don't have to.",
                desc: 'Connects you with peers on the same journey and industry mentors who have already crossed your finish line.',
                icon: Network,
              },
              {
                num: 'JOURNEY MODULE 7',
                title: 'Wellbeing Tracker',
                status: '🔜 Coming Soon',
                question: "Why does every career program act like burnout doesn't exist?",
                headline: 'Readiness isn\'t just what you know. It\'s whether you can sustain the pace.',
                desc: 'Tracks wellness alongside career growth to catch strain early while it is still manageable.',
                icon: HeartPulse,
              },
              {
                num: 'JOURNEY MODULE 8',
                title: 'AI Assistant',
                status: '🔜 Coming Soon',
                question: "I have a question at 11pm and no one is available until Monday.",
                headline: 'An answer whenever you need one — no appointment required.',
                desc: 'Context-aware AI with full knowledge of your profile to give specific guidance when you need it.',
                icon: MessageSquare,
              },
              {
                num: 'JOURNEY MODULE 9',
                title: 'Knowledge Graph',
                status: '🔜 Coming Soon',
                question: "How does everything I'm doing actually connect into the big picture?",
                headline: 'See the whole map. Not just the piece directly in front of you.',
                desc: 'Visual, interactive layer powered by 2,800+ RDF triples linking your academic and career footprint.',
                icon: BrainCircuit,
              },
            ].map((mod, i) => (
              <div
                key={i}
                className="p-6 sm:p-8 rounded-3xl bg-white/75 backdrop-blur-2xl border border-emerald-500/20 shadow-[0_8px_32px_rgba(5,150,105,0.06)] hover:shadow-xl hover:border-emerald-500/40 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <mod.icon className="size-8 text-[#059669]" />
                    <span className="text-xs font-bold text-slate-500 bg-emerald-50/80 border border-emerald-200/60 px-3 py-1 rounded-full">
                      {mod.status}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-emerald-600 font-bold">
                    {mod.num}
                  </span>
                  <h4 className="text-xl font-bold text-slate-900">
                    {mod.title}
                  </h4>
                  <p className="text-xs text-slate-500 italic">"{mod.question}"</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {mod.headline}
                  </p>
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 5. NARRATIVE WALKTHROUGHS SECTION (7b & 7f) ────────────────── */}
        <section id="stories" className="py-12 px-4 max-w-6xl mx-auto w-full space-y-12">
          <SectionHeading
            eyebrow="A Day In Your Journey"
            arabicSubtitle="حالات استخدام واقعية في حياتك اليومية"
            title="How iSCARB Works in Real Life"
            subtitle="One walkthrough is live today — the Employability Exam. The other tabs preview journey modules on your job-ready path that are coming soon."
          />

          {/* Interactive Story Tabs */}
          <div className="bg-white/80 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-emerald-500/20 p-4 sm:p-6 md:p-10 shadow-[0_12px_40px_rgba(5,150,105,0.08)] space-y-6 sm:space-y-8">
            <div className="flex gap-2 border-b border-emerald-100/80 pb-4 overflow-x-auto scrollbar-none -mx-1 px-1 snap-x">
              {stories.map((story, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveStory(i)}
                  className={`px-3 sm:px-4 py-2 text-xs md:text-sm font-bold rounded-full whitespace-nowrap shrink-0 snap-start touch-manipulation min-h-10 cursor-pointer border ${
                    activeStory === i
                      ? 'bg-[#059669] text-white border-[#059669] shadow-sm hover:bg-[#047857] hover:border-[#047857]'
                      : 'bg-emerald-50/70 text-slate-700 border-emerald-200/60 hover:bg-emerald-100 hover:border-emerald-300 hover:text-[#047857]'
                  }`}
                >
                  {story.tab}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                {(() => {
                  const Icon = stories[activeStory].icon;
                  return <Icon className="size-8 sm:size-10 text-[#059669] shrink-0 mt-0.5 sm:mt-0" />;
                })()}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {stories[activeStory].comingSoon ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        Coming Soon
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Live Now
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-slate-900 leading-snug">
                    {stories[activeStory].title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#059669] font-medium mt-1">
                    {stories[activeStory].subtitle}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 sm:gap-6 pt-2">
                {stories[activeStory].body.map((para, i) => (
                  <div
                    key={i}
                    className="p-4 sm:p-5 rounded-2xl bg-white/70 backdrop-blur-xl border border-emerald-500/20 text-xs md:text-sm text-slate-700 leading-relaxed space-y-2 shadow-sm hover:border-emerald-500/40 hover:shadow-md"
                  >
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 text-[#059669] font-bold font-mono text-xs">
                      Step {i + 1}
                    </span>
                    <p>{para}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. WHY WE BUILT THIS (7e) ─────────────────────────────────── */}
        <section className="py-12 px-4 max-w-5xl mx-auto w-full">
          <div className="p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl bg-emerald-950 text-white shadow-xl space-y-5 sm:space-y-6 relative overflow-hidden">
            <Quote className="absolute top-6 right-6 size-16 sm:size-24 text-emerald-900/40 pointer-events-none" />
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-700 bg-emerald-900/60 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-300">
              Why We Built This
            </span>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
              The problem we kept seeing, over and over.
            </h3>
            <div className="space-y-4 text-emerald-100/90 text-sm md:text-base leading-relaxed">
              <p>
                Talk to enough recent graduates and a pattern shows up fast: the ones who struggled in their first year on the job weren't, in most cases, the ones with the worst grades. They were the ones who had never been tested — really tested, with feedback, under something resembling real workplace conditions — on the things that actually show up in the first ninety days.
              </p>
              <p>
                How to handle a frustrated stakeholder. How to make a defensible call under ambiguity. How to know when to ask for help versus when to push through.
              </p>
              <p>
                Universities are exceptional at teaching content. They're structurally not built to simulate the specific, messy, situational judgment calls that make up most of what "being good at your job" actually means day to day.
              </p>
              <p className="text-white font-bold border-l-4 border-emerald-400 pl-4 py-1">
                iSCARB was built to close that gap before it becomes expensive — to give students a real, scored, low-stakes environment to encounter exactly the kind of situations that used to be a surprise.
              </p>
            </div>
          </div>
        </section>

        {/* ── 7. TRUST & CREDIBILITY SECTION ────────────────────────────── */}
        <section id="trust" className="py-16 px-4 bg-emerald-50/40 backdrop-blur-md border-y border-emerald-500/20">
          <div className="max-w-6xl mx-auto space-y-12">
            <SectionHeading
              eyebrow="Trust & Calibration"
              arabicSubtitle="معايرة دقيقة وموثوقية مكفولة"
              title="Is this actually reliable, or another EdTech promise?"
              subtitle="Fair question. Here's exactly what's under the hood, with no rounding up."
            />
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Rubric-driven AI scoring',
                  desc: 'Answers are scored against named professional frameworks and visible rubric criteria — not vague encouragement. A deterministic fallback scorer runs if AI services are unavailable.',
                },
                {
                  title: 'Framework-anchored, always',
                  desc: "Built on named professional frameworks such as STAR, Cialdini principles, Agile-vs-Waterfall criteria, and field-specific technical rubrics.",
                },
                {
                  title: 'Built as real infrastructure',
                  desc: 'Runs on hundreds of database models and API routes, with ontology/RDF infrastructure behind the scenes for the connected platform roadmap.',
                },
                {
                  title: 'Regionally grounded',
                  desc: 'The Employability Exam supports Arabic and English with RTL. Job-Fit content is oriented to regional professional contexts including Vision 2030-aligned domains.',
                },
                {
                  title: 'Privacy taken seriously',
                  desc: 'Designed with Saudi Personal Data Protection Law (PDPL) requirements in mind, including careful handling of AI scoring inputs.',
                },
                {
                  title: 'Never blocked by vendor outage',
                  desc: 'A deterministic, rubric-driven fallback scorer takes over automatically if AI services are unavailable so scoring can continue.',
                },
              ].map((trust, i) => (
                <div
                  key={i}
                  className="p-5 sm:p-6 rounded-2xl bg-white/75 backdrop-blur-2xl border border-emerald-500/20 shadow-[0_8px_32px_rgba(5,150,105,0.05)] hover:border-emerald-500/50 hover:shadow-md"
                >
                  <h4 className="text-base font-bold text-slate-900 mb-2">
                    {trust.title}
                  </h4>
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                    {trust.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 9. COMPARISON TABLE (7c) ────────────────────────────────────── */}
        <section id="comparison" className="py-12 sm:py-16 px-4 max-w-5xl mx-auto w-full space-y-8">
          <SectionHeading
            eyebrow="Comparison"
            arabicSubtitle="مقارنة منهجية إسكارب مع النموذج التقليدي"
            title="What you're used to vs. What iSCARB does instead"
          />
          <div className="bg-white/80 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-emerald-500/20 shadow-[0_12px_40px_rgba(5,150,105,0.08)] overflow-hidden">
            <div className="hidden sm:grid grid-cols-2 border-b border-emerald-100 bg-emerald-50/60 p-4 font-bold text-sm text-slate-900">
              <div>What students are used to</div>
              <div className="text-[#059669]">What iSCARB does instead</div>
            </div>
            {[
              ['A GPA that measures exam performance, not workplace readiness', 'A four-dimension Employability Exam built on real workplace scenarios'],
              ['Career quizzes based on self-reported preferences', 'Scored performance across Core, Business & Digital, Job-Fit, and Growth'],
              ['Unscored soft-skill claims on a resume', 'Per-criterion feedback tied to a named professional framework'],
              ['Finding out you were unprepared only after an interview', 'A low-stakes exam before it matters, with a report generated when you finish'],
              ['Vague feedback like "keep practicing"', 'Dimension scores, bands, and development guidance in your personalized report'],
              ['Guessing which workplace skills you actually have', '47 scenario-based questions (primarily MCQ) scored against rubrics'],
            ].map(([oldWay, newWay], i) => (
              <div
                key={i}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-0 p-4 text-xs md:text-sm border-b border-emerald-100/60 last:border-0 hover:bg-emerald-50/40"
              >
                <div className="text-slate-600 flex items-start gap-2 sm:pr-2">
                  <X className="size-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="sm:hidden block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Used to</span>
                    <span>{oldWay}</span>
                  </div>
                </div>
                <div className="text-slate-900 font-medium flex items-start gap-2 sm:pl-2">
                  <Check className="size-4 text-[#059669] shrink-0 mt-0.5" />
                  <div>
                    <span className="sm:hidden block text-[10px] font-bold uppercase tracking-wider text-[#059669] mb-1">iSCARB</span>
                    <span>{newWay}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 10. OBJECTION HANDLING (7d) ─────────────────────────────────── */}
        <section className="py-16 px-4 max-w-5xl mx-auto w-full space-y-8">
          <SectionHeading
            eyebrow="Clarifications"
            arabicSubtitle="إجابات حاسمة على الأسئلة والشكوك"
            title="Common Objections Answered"
          />
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                q: '"This sounds like just another AI hype product."',
                a: "Fair skepticism. Scoring applies a specific rubric anchored to named professional frameworks — not vague encouragement. If AI services are down, a deterministic fallback scorer uses the same rubric anchors.",
              },
              {
                q: '"I don\'t have time for another platform to manage."',
                a: 'For this launch you take one live product: the Employability Exam. It is designed as a focused sitting (about 45 minutes for 47 questions), then your report is generated after you finish.',
              },
              {
                q: '"What if I do badly? Does it follow me forever?"',
                a: 'No. Retaking a question supersedes your previous attempt in your profile calculation. The Employability Exam rewards improvement.',
              },
              {
                q: '"Is this replacing my university\'s career services?"',
                a: "No — it gives advising a clearer starting point. Your four-dimension report shows where you stand so sessions can focus on what to improve.",
              },
              {
                q: '"Why trust AI to grade workplace scenarios?"',
                a: 'Because every score is tied to an established framework (such as STAR or Cialdini) already used by human experts. The AI applies that rubric consistently; your full report is prepared after you complete the exam.',
              },
            ].map((obj, i) => (
              <div key={i} className="p-5 sm:p-6 rounded-2xl bg-white/75 backdrop-blur-2xl border border-emerald-500/20 shadow-[0_8px_32px_rgba(5,150,105,0.05)] hover:border-emerald-500/40 hover:shadow-md space-y-2">
                <h4 className="font-bold text-slate-900 text-base">{obj.q}</h4>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">{obj.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 11. EXTENDED FREQUENTLY ASKED QUESTIONS (7 & 7h) ────────────── */}
        <section id="faq" className="py-16 px-4 max-w-4xl mx-auto w-full space-y-8">
          <SectionHeading eyebrow="FAQ" title="Frequently Asked Questions" />
          <div className="space-y-4">
            <FAQAccordion
              q="How long does the Employability Exam actually take?"
              a="About 30 minutes for the full exam — 47 scenario-based questions (primarily multiple choice) across four dimensions. When you finish, your personalized report is generated for review."
            />
            <FAQAccordion
              q="Is the AI scoring actually accurate?"
              a="Scoring applies named professional rubrics and frameworks (such as STAR and Cialdini). It is AI-assisted, not a black-box vibe check, and a deterministic fallback uses the same rubric anchors if AI services are unavailable."
            />
            <FAQAccordion
              q="What happens if the AI grading system is down?"
              a="A deterministic, rubric-based fallback scorer takes over automatically using the same rubric anchors."
            />
            <FAQAccordion
              q="Do I need to finish all 47 questions before I get a score?"
              a="Yes. You need to complete all 47 questions. After you finish the sitting, your personalized four-dimension report is generated with your scores."
            />
            <FAQAccordion
              q="Is my data private and secure?"
              a="Yes. The product is designed with regional Personal Data Protection Law (PDPL) requirements in mind, including careful handling of AI scoring inputs."
            />
            <FAQAccordion
              q="What languages does the platform support?"
              a="The Employability Exam supports Arabic and English, including a right-to-left layout when Arabic is selected."
            />
            <FAQAccordion
              q="Can I retake an Employability Exam question if I improve?"
              a="Yes. Retaking a question supersedes your earlier attempt in your profile calculation."
            />
            <FAQAccordion
              q="Is this built for a specific university or any institution?"
              a="iSCARB is built with multi-tenant infrastructure so institutions can deploy with their own data isolation and configuration as the platform rolls out."
            />
            <FAQAccordion
              q="What if my specialization isn't explicitly listed?"
              a="You choose your specialty when you create your account (or once on your profile if it was missing). Curated Job-Fit tracks cover major fields (CS, Accounting, Cyber, Health, AI, and more). If your major isn't listed, type it freely — we still generate field-appropriate Job-Fit modules. There is no separate specialty step inside the exam."
            />
            <FAQAccordion
              q="How is this different from a standard LMS with a career add-on?"
              a="A standard LMS is built for course delivery. iSCARB's live product measures workplace employability through a scored Employability Exam and a personalized four-dimension report."
            />
          </div>
        </section>

        {/* ── 12. FINAL CALL TO ACTION ────────────────────────────────────── */}
        <section className="py-12 sm:py-16 px-4 max-w-5xl mx-auto w-full text-center">
          <div className="p-8 sm:p-12 md:p-16 rounded-[1.75rem] sm:rounded-[2.5rem] bg-gradient-to-br from-[#059669] to-[#047857] text-white shadow-xl space-y-5 sm:space-y-6">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black">
              Ready to take the Employability Exam?
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-emerald-100 max-w-2xl mx-auto">
              About 45 minutes, 47 questions, four dimensions — then a personalized report after you finish.
            </p>
            <div className="flex justify-center [&_button]:w-full sm:[&_button]:w-auto max-w-sm mx-auto sm:max-w-none">
              <GlowingButton href="/assessment/employability" primary>
                Start the Employability Exam
              </GlowingButton>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 bg-white py-12 text-center text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-center gap-4 text-slate-600 font-medium">
          <Link href="/terms" className="hover:text-[#0E6C3C] transition-colors">
            Terms of Service
          </Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-[#0E6C3C] transition-colors">
            Privacy Policy
          </Link>
        </div>
        <p>© {new Date().getFullYear()} iSCARB Platform. All rights reserved.</p>
        <p className="font-mono text-[11px] text-slate-400">Employability Exam • Bilingual • Regionally Anchored</p>
      </footer>
    </div>
  );
}
