'use client';

/**
 * Landing-page craft primitives (static).
 *
 * Formerly animated with Framer Motion (scroll reveals, magnetic buttons,
 * counters, marquees). Motion has been removed — content renders in its final
 * position immediately. Layout and styling are unchanged.
 */

import type { ReactNode } from 'react';
import Link from 'next/link';

export const EASE = [0.32, 0.72, 0, 1] as const;

/* ── Reveal ─────────────────────────────────────────────────────────────── */
/** Static wrapper — children render immediately (no scroll/entrance motion). */
export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  x?: number;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

/** Kept for API compatibility; no longer animates. */
export const stagger = {
  hidden: {},
  show: {},
};
export const revealItem = {
  hidden: {},
  show: {},
};

/* ── MagneticButton ─────────────────────────────────────────────────────── */
/** Static CTA button/link — color hover only, no magnetic tilt / scale motion. */
export function MagneticButton({
  children,
  className = '',
  href,
  onClick,
  variant = 'primary',
}: {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  variant?: 'primary' | 'ghost';
}) {
  const base =
    'group relative inline-flex items-center justify-center gap-2 sm:gap-3 rounded-full pl-5 sm:pl-6 pr-2 py-2.5 min-h-11 text-sm font-semibold touch-manipulation cursor-pointer';
  const skin =
    variant === 'primary'
      ? 'bg-[#059669] text-white shadow-[0_10px_40px_-12px_rgba(14,108,60,0.55)] hover:bg-[#047857]'
      : 'bg-white text-slate-800 ring-1 ring-slate-200 shadow-sm hover:bg-emerald-50 hover:ring-emerald-200';

  const inner = (
    <>
      <span className="relative z-10 text-center leading-snug">{children}</span>
      <span
        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          variant === 'primary' ? 'bg-white/20 group-hover:bg-white/35' : 'bg-black/5 group-hover:bg-[#059669]/15'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </>
  );

  const cls = `${base} ${skin} ${className}`;

  if (href) {
    const isHash = href.startsWith('#');
    const isInternal = href.startsWith('/') && !href.startsWith('//');
    if (isHash) {
      return (
        <button
          type="button"
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            const el = document.querySelector(href);
            el?.scrollIntoView({ behavior: 'auto', block: 'start' });
            onClick?.(e);
          }}
          className={cls}
        >
          {inner}
        </button>
      );
    }
    if (isInternal) {
      return (
        <Link href={href} onClick={onClick} className="inline-flex">
          <span className={cls}>{inner}</span>
        </Link>
      );
    }
    return (
      <a href={href} className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

/* ── Counter ────────────────────────────────────────────────────────────── */
/** Static final value (no count-up animation). */
export function Counter({
  to,
  suffix = '',
  prefix = '',
  decimals = 0,
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}) {
  return (
    <span>
      {prefix}
      {to.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ── Marquee ────────────────────────────────────────────────────────────── */
/** Static row of items (no infinite scroll). */
export function Marquee({ items, className = '' }: { items: string[]; className?: string }) {
  return (
    <div className={`relative flex flex-wrap justify-center gap-8 ${className}`}>
      {items.map((it, i) => (
        <span
          key={i}
          className="whitespace-nowrap text-sm font-medium uppercase tracking-[0.18em] text-[#5c6570] dark:text-[#7f9a89]"
        >
          {it}
        </span>
      ))}
    </div>
  );
}

/* ── GrainOverlay ───────────────────────────────────────────────────────── */
/** Fixed, pointer-events-none film-grain for a tactile, non-digital surface. */
export function GrainOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] opacity-[0.035] mix-blend-overlay"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}

/* ── useParallax ────────────────────────────────────────────────────────── */
/** No-op parallax hook (API kept; returns zeros / no motion). */
export function useParallax(_strength = 1) {
  return {
    x: { get: () => 0 },
    y: { get: () => 0 },
    onMove: (_e: React.PointerEvent, _el: HTMLElement) => {},
    reset: () => {},
  };
}
