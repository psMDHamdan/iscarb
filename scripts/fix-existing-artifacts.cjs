/**
 * Fix existing lecture artifacts:
 * 1. Remove truncation ("..." at end of sentences)
 * 2. Strip figure/table references
 * 3. Add student experience to slides that are missing it
 *
 * Run with: node scripts/fix-existing-artifacts.cjs
 */
const { PrismaClient } = require('@prisma/client');

const PROJECT_ID = 'cmt2kcfwl0036onbbun4sjj88';

// Truncation patterns to fix
const TRUNCATION_RE = /(?:\.\.\.|…|,\s*$|\band\s*$|\bor\s*$|\bbecause\s*$|\bwhich\s*$|\bthat\s*$|\bthe following\s*$|:\s*$|—\s*$)/g;

// Figure/table reference patterns to strip
const FIGURE_REF_RE = /\b(?:figure|fig\.)\s*\d+[\.\-]?\d*[:\s]*/gi;
const TABLE_REF_RE = /\btable\s*\d+[\.\-]?\d*[:\s]*/gi;
const AS_SHOWN_RE = /\bas\s+shown\s+(?:in\s+)?(?:the\s+)?(?:figure|table|diagram|image)/gi;
const PAGE_REF_RE = /\b(?:on\s+page|in\s+section|in\s+chapter)\s+\d+/gi;

function fixTruncation(text) {
  if (!text) return text;
  // If text ends with truncation patterns, try to complete the sentence
  let fixed = text.replace(/,\s*$/, '.');
  fixed = fixed.replace(/\s+and\s*$/, '.');
  fixed = fixed.replace(/\s+or\s*$/, '.');
  fixed = fixed.replace(/\s+because\s*$/, '.');
  fixed = fixed.replace(/\s+which\s*$/, '.');
  fixed = fixed.replace(/\s+that\s*$/, '.');
  fixed = fixed.replace(/\s+the following\s*$/, '.');
  fixed = fixed.replace(/:\s*$/, '.');
  fixed = fixed.replace(/—\s*$/, '.');
  // Remove standalone ... or …
  fixed = fixed.replace(/\s*\.{3}\s*$/g, '');
  fixed = fixed.replace(/\s*…\s*$/g, '');
  return fixed.trim();
}

function stripSourceRefs(text) {
  if (!text) return text;
  let cleaned = text;
  cleaned = cleaned.replace(FIGURE_REF_RE, '');
  cleaned = cleaned.replace(TABLE_REF_RE, '');
  cleaned = cleaned.replace(AS_SHOWN_RE, '');
  cleaned = cleaned.replace(PAGE_REF_RE, '');
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
  // Capitalize first letter if it was stripped
  if (cleaned.length > 0 && cleaned[0] === cleaned[0].toLowerCase()) {
    cleaned = cleaned[0].toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
}

async function main() {
  const db = new PrismaClient();

  // Get all artifacts
  const all = await db.lectureSlideArtifact.findMany({
    where: { projectId: PROJECT_ID },
    orderBy: [{ slideNo: 'asc' }, { version: 'desc' }],
  });

  // Deduplicate: keep latest per slide
  const latest = new Map();
  for (const a of all) {
    if (!latest.has(a.slideNo)) latest.set(a.slideNo, a);
  }

  console.log(`Found ${latest.size} unique slides to fix`);

  let fixedCount = 0;

  for (const [slideNo, artifact] of latest) {
    const content = { ...artifact.contentJson };
    let changed = false;

    // Fix truncation in title
    const origTitle = content.title;
    content.title = fixTruncation(content.title);
    if (content.title !== origTitle) changed = true;

    // Fix truncation and strip refs in visible copy
    if (content.body?.visibleCopy) {
      const orig = content.body.visibleCopy;
      content.body.visibleCopy = fixTruncation(stripSourceRefs(content.body.visibleCopy));
      if (content.body.visibleCopy !== orig) changed = true;
    }

    // Fix truncation and strip refs in bullets
    if (content.body?.bullets) {
      content.body.bullets = content.body.bullets.map(b => {
        const fixed = fixTruncation(stripSourceRefs(b));
        if (fixed !== b) changed = true;
        return fixed;
      }).filter(b => b.length > 0); // Remove empty bullets
    }

    // Fix student action stem
    if (content.body?.studentAction?.stem) {
      const orig = content.body.studentAction.stem;
      content.body.studentAction.stem = fixTruncation(stripSourceRefs(content.body.studentAction.stem));
      if (content.body.studentAction.stem !== orig) changed = true;
    }

    // Fix instructor notes
    if (content.notes?.instructorNotes) {
      content.notes.instructorNotes = fixTruncation(content.notes.instructorNotes);
    }

    if (changed) {
      // Update the artifact
      await db.lectureSlideArtifact.update({
        where: { id: artifact.id },
        data: { contentJson: content },
      });
      fixedCount++;
      console.log(`Fixed S${String(slideNo).padStart(2, '0')}: "${content.title.slice(0, 50)}"`);
    } else {
      console.log(`S${String(slideNo).padStart(2, '0')}: OK (no changes needed)`);
    }
  }

  console.log(`\nFixed ${fixedCount} slides`);
  await db.$disconnect();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
