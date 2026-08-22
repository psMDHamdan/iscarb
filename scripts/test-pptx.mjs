import { PrismaClient } from '@prisma/client';
import { renderPPTX } from '../src/lib/lecture/renderer/pptx-renderer.js';
import { writeFileSync } from 'fs';

const db = new PrismaClient();

async function main() {
  const artifacts = await db.lectureSlideArtifact.findMany({
    where: { projectId: 'cmt2kcfwl0036onbbun4sjj88' },
    orderBy: [{ slideNo: 'asc' }, { version: 'desc' }],
  });

  // Deduplicate: keep latest version per slide
  const latest = new Map();
  for (const a of artifacts) {
    if (!latest.has(a.slideNo)) latest.set(a.slideNo, a);
  }
  const slides = [...latest.values()].map(a => ({
    slideNo: a.slideNo,
    contentJson: a.contentJson,
  }));

  console.log('Slides:', slides.length);
  console.log('---');

  // Analyze content quality
  for (const s of slides) {
    const c = s.contentJson || {};
    const bullets = c.body?.bullets || [];
    const title = c.title || 'no title';
    const words = c.wordCount || 0;
    const studentExp = c.studentExperience;
    const hasStudentExp = !!studentExp;

    // Check for source-copy patterns
    const allText = [title, ...(c.body?.visibleCopy ? [c.body.visibleCopy] : []), ...bullets].join(' ');
    const hasFigure = /figure\s+\d/i.test(allText);
    const hasTruncation = /\.\.\.\s*$/.test(allText);
    const hasTextbook = /as\s+shown|see\s+figure|table\s+\d/i.test(allText);

    const flags = [];
    if (hasFigure) flags.push('FIGURE_REF');
    if (hasTruncation) flags.push('TRUNCATED');
    if (hasTextbook) flags.push('TEXTBOOK_LANG');

    console.log(`S${String(s.slideNo).padStart(2, '0')}: "${title.slice(0, 50)}" | ${words}w ${bullets.length}b | studentExp:${hasStudentExp ? 'YES' : 'no'} | ${flags.length > 0 ? flags.join(', ') : 'OK'}`);
  }

  // Generate PPTX
  console.log('---');
  const start = Date.now();
  const buffer = await renderPPTX(slides);
  const elapsed = Date.now() - start;

  console.log(`PPTX: ${elapsed}ms, ${(buffer.length / 1024).toFixed(1)}KB`);
  writeFileSync('/tmp/test-lecture.pptx', buffer);
  console.log('Saved: /tmp/test-lecture.pptx');

  await db.$disconnect();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
