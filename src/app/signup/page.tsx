'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Home,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  LogIn,
  User,
  GraduationCap,
  Search,
} from 'lucide-react';
import { setClientProfile } from '@/lib/client-auth';
import { curatedSpecializationLabels } from '@/lib/assessment/catalog';

/** Canonical labels from the registry — values submitted unchanged. */
const CURATED_MAJORS = curatedSpecializationLabels();

/** Shorter labels for the picker grid (submit value stays canonical). */
const DISPLAY_LABEL: Record<string, string> = {
  'Computer Science / IT': 'Computer Science',
  'Accounting / Finance': 'Accounting',
  'Healthcare / Medicine': 'Healthcare',
  'Artificial Intelligence / Data Science': 'AI & Data Science',
};

const MAJOR_GROUPS: { label: string; options: string[] }[] = [
  {
    label: 'Software & Digital',
    options: ['Computer Science / IT', 'Web Development', 'Cybersecurity'],
  },
  {
    label: 'AI & Data',
    options: ['Data Analysis', 'Artificial Intelligence / Data Science'],
  },
  {
    label: 'Business',
    options: [
      'Digital Marketing',
      'Business Development',
      'Project Management',
      'Human Resources',
      'Accounting / Finance',
    ],
  },
  {
    label: 'Healthcare',
    options: ['Healthcare / Medicine', 'Health Management'],
  },
];

function displayMajor(canonical: string) {
  return DISPLAY_LABEL[canonical] ?? canonical;
}

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [otherMode, setOtherMode] = useState(false);
  const [majorQuery, setMajorQuery] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredGroups = useMemo(() => {
    const q = majorQuery.trim().toLowerCase();
    if (!q) return MAJOR_GROUPS;
    return MAJOR_GROUPS.map((g) => ({
      ...g,
      options: g.options.filter((opt) => {
        const label = displayMajor(opt).toLowerCase();
        return label.includes(q) || opt.toLowerCase().includes(q);
      }),
    })).filter((g) => g.options.length > 0);
  }, [majorQuery]);

  const selectMajor = (canonical: string) => {
    setOtherMode(false);
    setSpecialty(canonical);
    setMajorQuery('');
  };

  const enableOther = () => {
    setOtherMode(true);
    if (CURATED_MAJORS.some((m) => m.toLowerCase() === specialty.toLowerCase())) {
      setSpecialty('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!specialty.trim()) {
      setError('Please choose your specialty / major.');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim(),
          specialty: specialty.trim(),
        }),
      });

      const data = (await res.json()) as {
        role?: string;
        landing?: string;
        specialty?: string;
        error?: string;
      };

      if (!res.ok) {
        setError(data.error || 'Signup failed. Please try again.');
        return;
      }

      setClientProfile({
        role: data.role || 'student',
        email: email.trim(),
      });

      window.location.href = data.landing || '/assessment/employability';
    } catch (err) {
      setError('Signup failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh w-full flex flex-col lg:flex-row bg-[#FAFBFB] text-slate-900 selection:bg-[#059669] selection:text-white">
      {/* LEFT: Story panel — desktop only */}
      <div
        className="hidden lg:flex lg:w-1/2 lg:min-h-dvh relative flex-col p-8 xl:p-12 overflow-hidden border-r border-emerald-900/30"
        style={{
          backgroundColor: '#043d2c',
          backgroundImage:
            'linear-gradient(135deg, #042e21 0%, #065f46 55%, #022c22 100%)',
        }}
      >
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <div
            className="w-full max-w-lg rounded-3xl p-6 xl:p-8 text-center shadow-2xl space-y-4"
            style={{
              backgroundColor: 'rgba(2, 44, 34, 0.55)',
              border: '1px solid rgba(255,255,255,0.18)',
            }}
          >
            <div
              className="mx-auto inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.18)',
                border: '1px solid rgba(110, 231, 183, 0.45)',
                color: '#A7F3D0',
              }}
            >
              <ShieldCheck className="size-4" />
              Start Your Employability Journey
            </div>
            <h3 className="text-2xl xl:text-3xl font-black leading-tight" style={{ color: '#FFFFFF' }}>
              Turn &quot;I know this&quot; into verified proof recruiters trust.
            </h3>
            <p className="text-sm xl:text-base leading-relaxed" style={{ color: '#D1FAE5' }}>
              Create your candidate account to unlock 47+ real workplace scenarios and get your 4-dimension employability profile.
            </p>
            <div
              className="mt-2 pt-4 flex flex-wrap items-center justify-center gap-4 xl:gap-6 text-sm font-semibold"
              style={{ borderTop: '1px solid rgba(255,255,255,0.18)', color: '#ECFDF5' }}
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 shrink-0" style={{ color: '#6EE7B7' }} /> Free to Start
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 shrink-0" style={{ color: '#6EE7B7' }} /> Instant Results
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-center text-xs font-mono" style={{ color: '#A7F3D0' }}>
          Bilingual • RTL-First • Aligned to Vision 2030 & PDPL
        </div>
      </div>

      {/* RIGHT: Actions + Form — full width on phone/iPad */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-dvh lg:min-h-0 overflow-y-auto px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8 md:px-10 lg:px-12 relative z-10">
        <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8 max-w-lg mx-auto w-full lg:max-w-none">
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <img
              src="/iscarb-mark.png?v=4"
              alt="iSCARB"
              width={32}
              height={32}
              className="h-8 w-8 sm:h-9 sm:w-9 object-contain shrink-0 pointer-events-none"
            />
            <span className="font-display text-base sm:text-lg font-extrabold tracking-tight">
              <span className="text-[#0F7B8A]">i</span>
              <span className="text-[#0E6C3C]">SCARB</span>
            </span>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-3 sm:px-4 py-2.5 min-h-11 text-xs sm:text-sm font-bold text-slate-800 ring-1 ring-slate-200 shadow-sm hover:bg-emerald-50 hover:ring-emerald-300 hover:text-[#059669] transition-colors touch-manipulation"
          >
            <Home className="size-4 shrink-0" />
            <span>Home</span>
          </Link>
        </div>

        {/* Compact story strip — phone & iPad only */}
        <div
          className="lg:hidden max-w-lg mx-auto w-full mb-4 sm:mb-5 rounded-2xl px-3.5 sm:px-4 py-3 sm:py-3.5 text-center"
          style={{
            backgroundImage: 'linear-gradient(135deg, #042e21 0%, #065f46 55%, #022c22 100%)',
          }}
        >
          <p className="text-sm sm:text-base font-bold text-white leading-snug">
            Turn &quot;I know this&quot; into verified proof recruiters trust.
          </p>
          <p className="mt-1 text-[11px] sm:text-xs text-emerald-100/90 leading-relaxed">
            Free to start · Instant results
          </p>
        </div>

        <div className="flex-1 flex flex-col justify-start sm:justify-center w-full max-w-lg mx-auto lg:max-w-md py-1 sm:py-0">
          <div className="w-full space-y-4 sm:space-y-6 py-5 px-4 sm:py-8 sm:px-8 md:px-10 bg-white/90 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-emerald-500/20 shadow-[0_16px_50px_rgba(5,150,105,0.08)]">
            <div className="space-y-1.5 sm:space-y-2 text-left">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-slate-900 tracking-tight">
                Create Your Account
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Enter your details below to start your employability assessment.
              </p>
            </div>

            {error && (
              <div role="alert" className="rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm p-3.5 sm:p-4 font-medium flex items-start gap-3">
                <span className="mt-1.5 flex size-2 rounded-full bg-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Mohammed Al-Farsi"
                    className="w-full min-h-12 pl-11 sm:pl-12 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-base font-medium focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20 shadow-sm transition-all touch-manipulation"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@iscarb.edu"
                    className="w-full min-h-12 pl-11 sm:pl-12 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-base font-medium focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20 shadow-sm transition-all touch-manipulation"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full min-h-12 pl-11 sm:pl-12 pr-12 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-base font-medium focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20 shadow-sm transition-all touch-manipulation"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 transition-colors touch-manipulation"
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-end justify-between gap-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Specialty / Major
                  </label>
                  {specialty && !otherMode && (
                    <span className="text-[11px] font-semibold text-[#047857] truncate max-w-[55%]">
                      Selected: {displayMajor(specialty)}
                    </span>
                  )}
                </div>

                {!otherMode ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 overflow-hidden">
                    <div className="relative border-b border-slate-200 bg-white">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                      <input
                        type="search"
                        value={majorQuery}
                        onChange={(e) => setMajorQuery(e.target.value)}
                        placeholder="Search majors…"
                        autoComplete="off"
                        className="w-full min-h-11 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-emerald-50/40 touch-manipulation"
                      />
                    </div>

                    <div className="max-h-52 overflow-y-auto overscroll-contain p-2 space-y-2.5">
                      {filteredGroups.length === 0 ? (
                        <p className="px-2 py-4 text-center text-sm text-slate-500">
                          No match — try &quot;Other&quot; below.
                        </p>
                      ) : (
                        filteredGroups.map((group) => (
                          <div key={group.label}>
                            <p className="px-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {group.label}
                            </p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {group.options.map((opt) => {
                                const selected =
                                  !otherMode &&
                                  specialty.toLowerCase() === opt.toLowerCase();
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => selectMajor(opt)}
                                    aria-pressed={selected}
                                    className={`min-h-11 rounded-xl px-2.5 py-2 text-left text-[13px] font-semibold leading-snug transition-colors touch-manipulation cursor-pointer ${
                                      selected
                                        ? 'bg-[#059669] text-white shadow-sm'
                                        : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-emerald-300 hover:text-[#047857]'
                                    }`}
                                  >
                                    <span className="inline-flex items-start gap-1.5">
                                      {selected ? (
                                        <CheckCircle2 className="size-3.5 mt-0.5 shrink-0 opacity-90" />
                                      ) : (
                                        <GraduationCap className="size-3.5 mt-0.5 shrink-0 text-slate-400" />
                                      )}
                                      <span>{displayMajor(opt)}</span>
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="border-t border-slate-200 bg-white px-2 py-2">
                      <button
                        type="button"
                        onClick={enableOther}
                        className="w-full min-h-10 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#059669] transition-colors cursor-pointer touch-manipulation"
                      >
                        My major isn&apos;t listed…
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <GraduationCap className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        required
                        autoFocus
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder="Type your major, e.g. Nursing…"
                        className="w-full min-h-12 pl-11 sm:pl-12 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-base font-medium focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20 shadow-sm transition-all touch-manipulation"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOtherMode(false);
                        setSpecialty('');
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#059669] bg-white px-3.5 py-2 min-h-10 text-xs font-bold text-[#059669] hover:bg-emerald-50 active:scale-[0.98] transition-all cursor-pointer touch-manipulation"
                    >
                      <ArrowLeft className="size-3.5 shrink-0" />
                      Back to suggested majors
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !specialty.trim()}
                className="group w-full min-h-12 py-3.5 sm:py-4 rounded-2xl bg-[#059669] text-white font-bold text-base shadow-lg shadow-[#059669]/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:pointer-events-none touch-manipulation hover:bg-[#047857] hover:shadow-xl hover:shadow-[#059669]/45 hover:-translate-y-1 hover:scale-[1.01] active:translate-y-0 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account & Start</span>
                    <ArrowLeft className="size-5 rotate-180 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="text-sm text-slate-500">Already Have An Account ?</span>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1 rounded-full border border-[#059669] bg-white px-3 py-2 min-h-9 text-xs font-bold text-[#059669] hover:bg-emerald-50 active:scale-[0.98] transition-all touch-manipulation"
              >
                <LogIn className="size-3.5 shrink-0" />
                Sign In
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center text-[11px] sm:text-xs text-slate-400 font-medium pt-5 sm:pt-6 pb-1">
          By signing up, you agree to our{" "}
          <Link href="/terms" className="text-[#0E6C3C] hover:underline font-bold">
            Terms of Service
          </Link>{" "}
          &{" "}
          <Link href="/privacy" className="text-[#0E6C3C] hover:underline font-bold">
            Privacy Policy
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
