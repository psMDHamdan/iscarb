/**
 * Quick script: render PPTX from DB artifacts and analyze quality.
 * Run with: node scripts/test-pptx.cjs
 */
const { PrismaClient } = require('@prisma/client');

async function main() {
  const db = new PrismaClient();

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

  console.log('=== CONTENT ANALYSIS ===');
  console.log('Slides:', slides.length);
  console.log('---');

  let issues = { sourceCopy: 0, truncation: 0, textbook: 0, noStudentExp: 0, lowWords: 0 };

  for (const s of slides) {
    const c = s.contentJson || {};
    const bullets = c.body?.bullets || [];
    const title = c.title || 'no title';
    const words = c.wordCount || 0;
    const hasStudentExp = !!c.studentExperience;

    const allText = [title, c.body?.visibleCopy || '', ...bullets].join(' ');
    const hasFigure = /figure\s+\d/i.test(allText);
    const hasTruncation = /\.\.\.\s*$/.test(allText);
    const hasTextbook = /as\s+shown|see\s+figure|table\s+\d/i.test(allText);

    const flags = [];
    if (hasFigure) { flags.push('FIGURE_REF'); issues.sourceCopy++; }
    if (hasTruncation) { flags.push('TRUNCATED'); issues.truncation++; }
    if (hasTextbook) { flags.push('TEXTBOOK_LANG'); issues.textbook++; }
    if (!hasStudentExp) { flags.push('NO_STUDENT_EXP'); issues.noStudentExp++; }
    if (words < 25) { flags.push('LOW_WORDS'); issues.lowWords++; }

    const hasSteps = c.studentExperience?.coreContent?.steps?.length > 0;
    const hasAnalogy = !!c.studentExperience?.coreContent?.analogy;
    const hasPitfalls = c.studentExperience?.commonPitfalls?.length > 0;
    const hasInteractive = !!c.studentExperience?.interactive?.prompt;

    console.log(
      `S${String(s.slideNo).padStart(2, '0')}: "${title.slice(0, 55)}" | ${words}w ${bullets.length}b | ` +
      `steps:${hasSteps ? 'Y' : 'N'} analogy:${hasAnalogy ? 'Y' : 'N'} ` +
      `pitfall:${hasPitfalls ? 'Y' : 'N'} quiz:${hasInteractive ? 'Y' : 'N'} | ` +
      (flags.length > 0 ? flags.join(', ') : 'OK')
    );
  }

  console.log('---');
  console.log('Issues Summary:', JSON.stringify(issues));

  // Render PPTX
  console.log('\n=== PPTX GENERATION ===');
  const { renderPPTX } = require('../src/lib/lecture/renderer/pptx-renderer');
  const { writeFileSync } = require('fs');

  const start = Date.now();
  const buffer = await renderPPTX(slides);
  const elapsed = Date.now() - start;

  console.log(`Generated in: ${elapsed}ms`);
  console.log(`File size: ${(buffer.length / 1024).toFixed(1)}KB`);
  writeFileSync('/tmp/test-lecture.pptx', buffer);
  console.log('Saved: /tmp/test-lecture.pptx');

  await db.$disconnect();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
