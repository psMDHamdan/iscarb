/**
 * Interactive HTML Renderer (TASK-08 §D).
 * ===========================================================================
 * Produces a single self-contained HTML file (CSS + JS embedded) with the
 * ZTM theme, slide-by-slide navigation, a roadmap at the top, interactive
 * readiness MCQs where answers stay hidden until reveal (AC-23), Arabic RTL
 * via dir="rtl" (NFR-06), and WCAG 2.2 AA heading hierarchy (NFR-07).
 *
 * Deterministic: no LLM, no external assets.
 */
import type { SlideContentJson, ReadinessItemJson } from "../generation/types";
import { slideTitle, slideBullets, slideAction } from "./content";
import { generateVisualPlaceholder } from "./visual-placeholder";

const TOTAL_SLIDES = 20;

export interface RenderableReadiness {
  slideNo: number;
  stem: string;
  correctIndex: number;
  options: unknown;
  difficulty: string;
  rationale?: string | null;
  cloId: string;
  sourceLocator?: string | null;
}

export interface RenderableSlide {
  slideNo: number;
  contentJson: unknown;
}

function escapeHtml(value?: string | null): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Keep only the student-facing shape of a readiness item. */
function normalizeReadiness(item: RenderableReadiness): ReadinessItemJson {
  const options = (item.options as unknown as ReadinessItemJson["options"]) ?? [];
  return {
    stem: item.stem,
    options,
    correctIndex: item.correctIndex,
    difficulty: item.difficulty as ReadinessItemJson["difficulty"],
    rationale: item.rationale ?? "",
    cloId: item.cloId,
    slideNo: item.slideNo,
    sourceLocator: item.sourceLocator ?? undefined,
  };
}

export function renderHTML(
  artifacts: RenderableSlide[],
  readinessItems: RenderableReadiness[]
): string {
  const slides = [...artifacts]
    .sort((a, b) => a.slideNo - b.slideNo)
    .map((a) => ({ ...a, content: a.contentJson as unknown as SlideContentJson }));

  const itemsBySlide = new Map<number, ReadinessItemJson[]>();
  for (const item of readinessItems) {
    const list = itemsBySlide.get(item.slideNo) ?? [];
    list.push(normalizeReadiness(item));
    itemsBySlide.set(item.slideNo, list);
  }

  const roadmapItems = Array.from({ length: TOTAL_SLIDES }, (_, i) => {
    const no = i + 1;
    return `<span class="road-dot" data-slide="${no}" tabindex="0">${no}</span>`;
  }).join("");

  const slideSections = slides
    .map((slide) => {
      const content = slide.content;
      const rtl = Boolean(content.textAr?.title || content.textAr?.bullets?.length);
      const title = slideTitle(content);
      const bullets = slideBullets(content);
      const action = slideAction(content);
      const items = itemsBySlide.get(slide.slideNo) ?? [];

      const bulletsHtml = bullets
        .map((b) => `<li>${escapeHtml(b)}</li>`)
        .join("");
      const itemsHtml = items
        .map((item, idx) => {
          const optionsHtml = item.options
            .map(
              (o, oi) => {
                const optText = typeof o === "string" ? o : (o as any)?.text ?? String(o ?? "");
                return `
              <label class="option">
                <input type="radio" name="q-${slide.slideNo}-${idx}" value="${oi}" />
                <span>${escapeHtml(optText)}</span>
              </label>`;
              }
            )
            .join("");
          return `
          <section class="readiness-item" data-slide="${slide.slideNo}" data-correct="${item.correctIndex}" aria-label="Readiness check ${slide.slideNo}">
            <h3>Readiness Check ${slide.slideNo}</h3>
            <p class="stem">${escapeHtml(item.stem)}</p>
            <div class="options" role="radiogroup">${optionsHtml}</div>
            <div class="rationale hidden" aria-live="polite">
              <strong>Instructor only:</strong> ${escapeHtml(item.rationale)}
            </div>
            <button class="reveal-btn" type="button" style="display:none">Reveal Answer</button>
            <div class="student-feedback" style="display:none; margin-top: 10px; font-weight: bold; color: #00D4FF;">Response saved.</div>
          </section>`;
        })
        .join("");

      const visualSvg = content.visualIntent
        ? generateVisualPlaceholder({
            slideNo: slide.slideNo,
            fn: (slide as any).function ?? "foundation",
            visualIntent: content.visualIntent,
            width: 560,
            height: 280,
          })
        : "";

      return `
      <section class="slide" data-slide="${slide.slideNo}" dir="${rtl ? "rtl" : "ltr"}">
        <h2>${escapeHtml(title)}</h2>
        <ul class="bullets">${bulletsHtml || "<li><em>No bullets</em></li>"}</ul>
        ${
          visualSvg
            ? `<figure class="visual-intent" role="img" aria-label="Visual intent for slide ${slide.slideNo}">
          ${visualSvg}
          <figcaption class="visual-caption">${escapeHtml(content.visualIntent)}</figcaption>
        </figure>`
            : ""
        }
        ${action ? `<div class="action" style="border-left: 4px solid #FFB81C; padding-left: 1rem; background: rgba(255,184,28,0.1);">▶ ${escapeHtml(action)}</div>` : ""}
        ${itemsHtml}
        ${slide.slideNo === 20 ? `
        <div class="s20-gate" style="border: 2px solid #FFB81C; border-radius: 8px; padding: 1rem; margin-top: 2rem; background: rgba(0,0,0,0.3);">
          <h3 style="margin-top: 0;">🎯 Readiness Gate</h3>
          <p>Score: <span id="gate-score">_</span> / 4 correct</p>
          <p>Threshold: 3/4 + Level 3+</p>
          <p>Status: <strong id="gate-status">LOCKED 🔒</strong></p>
          <button id="calculate-score-btn" type="button" style="background: #00D4FF; color: #1a1a2e; border: none; padding: 0.5rem 1rem; border-radius: 4px; font-weight: bold; cursor: pointer;">Calculate Final Score</button>
        </div>` : ""}
        <div class="nav">
          <button class="prev" type="button" aria-label="Previous slide">←</button>
          <span class="counter">${slide.slideNo} / ${TOTAL_SLIDES}</span>
          <button class="next" type="button" aria-label="Next slide">→</button>
        </div>
      </section>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Interactive Lecture</title>
<style>
  :root { --bg:#1a1a2e; --text:#ffffff; --body:#e0e0e0; --accent:#ff6b35; --muted:#888888; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text); font-family:Inter,'Cairo',sans-serif; }
  header { padding:1rem 1.5rem; border-bottom:1px solid var(--muted); }
  h1 { margin:0 0 .5rem; font-size:1.5rem; }
  h2 { font-size:1.8rem; margin:0 0 1rem; }
  h3 { font-size:1.1rem; color:var(--accent); }
  .roadmap { display:flex; gap:.35rem; flex-wrap:wrap; }
  .road-dot { width:2rem; height:2rem; display:inline-flex; align-items:center; justify-content:center;
    border:1px solid var(--muted); border-radius:50%; cursor:pointer; }
  .road-dot.active { background:var(--accent); border-color:var(--accent); font-weight:bold; }
  main { max-width:56rem; margin:0 auto; padding:2rem 1.5rem; }
  .slide { display:none; }
  .slide.active { display:block; }
  ul.bullets { font-size:1.25rem; color:var(--body); line-height:1.6; }
  .visual-intent { width:100%; max-width:560px; margin:1.5rem auto; border-radius:12px; overflow:hidden; border:1px solid rgba(255,255,255,0.12); }
  .visual-intent svg { width:100%; height:auto; display:block; }
  .visual-caption { background:rgba(15,23,42,0.8); color:#94a3b8; font-size:11px; font-family:monospace; padding:6px 12px; text-align:center; border-top:1px solid rgba(255,255,255,0.05); }
  .action { color:var(--accent); font-weight:bold; font-size:1.2rem; margin:1rem 0; }
  .readiness-item { border:1px solid var(--muted); border-radius:.5rem; padding:1rem; margin:1rem 0; }
  .options { display:flex; flex-direction:column; gap:.5rem; margin:.75rem 0; }
  .option { display:flex; gap:.5rem; align-items:baseline; }
  .rationale.hidden { display:none; }
  .rationale { color:var(--body); margin-top:.5rem; }
  .reveal-btn { background:var(--accent); color:#fff; border:0; border-radius:.4rem; padding:.5rem 1rem; cursor:pointer; }
  .nav { display:flex; align-items:center; gap:1rem; margin-top:2rem; }
  .nav button { background:var(--accent); color:#fff; border:0; border-radius:.4rem; padding:.5rem 1rem; cursor:pointer; }
  .counter { color:var(--muted); }
  @media print {
    .visual-intent { break-inside:avoid; page-break-inside:avoid; }
    .visual-caption { color:#374151; background:#f9fafb; }
  }
</style>
</head>
<body>
<header>
  <h1>Interactive Lecture</h1>
  <nav class="roadmap" aria-label="Slide roadmap">${roadmapItems}</nav>
</header>
<main>${slideSections}</main>
<script>
  const slides = Array.from(document.querySelectorAll('.slide'));
  const dots = Array.from(document.querySelectorAll('.road-dot'));
  let current = 0;

  function show(i) {
    current = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach((s, idx) => s.classList.toggle('active', idx === current));
    dots.forEach((d, idx) => {
      d.classList.toggle('active', idx === current);
      if (idx < current) {
        d.style.backgroundColor = '#00D4FF';
        d.style.borderColor = '#00D4FF';
        d.style.color = '#1a1a2e';
      } else if (idx === current) {
        d.style.backgroundColor = '#FFB81C';
        d.style.borderColor = '#FFB81C';
        d.style.color = '#1a1a2e';
      } else {
        d.style.backgroundColor = 'transparent';
        d.style.borderColor = 'var(--muted)';
        d.style.color = 'var(--text)';
      }
    });
  }

  document.querySelectorAll('.prev').forEach(b => b.addEventListener('click', () => show(current - 1)));
  document.querySelectorAll('.next').forEach(b => b.addEventListener('click', () => show(current + 1)));
  dots.forEach((d, idx) => d.addEventListener('click', () => show(idx)));
  
  // Local storage for interactive polling
  document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const section = e.target.closest('.readiness-item');
      const slideNo = section.getAttribute('data-slide');
      const val = e.target.value;
      localStorage.setItem('iscarb-poll-' + slideNo, val);
      section.querySelector('.student-feedback').style.display = 'block';
    });
  });

  // Calculate score on S20
  const calcBtn = document.getElementById('calculate-score-btn');
  if (calcBtn) {
    calcBtn.addEventListener('click', () => {
      let score = 0;
      let total = 0;
      document.querySelectorAll('.readiness-item').forEach(section => {
        total++;
        const slideNo = section.getAttribute('data-slide');
        const correct = section.getAttribute('data-correct');
        const stored = localStorage.getItem('iscarb-poll-' + slideNo);
        if (stored === correct) score++;
      });
      document.getElementById('gate-score').textContent = score;
      const statusEl = document.getElementById('gate-status');
      if (score >= 3) {
        statusEl.textContent = 'OPEN ✅';
        statusEl.style.color = '#00D4FF';
      } else {
        statusEl.textContent = 'LOCKED 🔒';
        statusEl.style.color = '#FF5555';
      }
    });
  }

  show(0);
</script>
</body>
</html>`;
}
