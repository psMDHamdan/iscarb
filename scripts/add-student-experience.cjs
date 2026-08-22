/**
 * Add student experience to all 20 slides DETERMINISTICALLY from existing content.
 * No LLM calls needed — builds the student experience card from slide title, bullets, etc.
 *
 * Run with: node scripts/add-student-experience.cjs
 */
const { PrismaClient } = require('@prisma/client');

const PROJECT_ID = 'cmt2kcfwl0036onbbun4sjj88';

function buildStudentExperience(content, slideNo) {
  const title = content.title || '';
  const bullets = content.body?.bullets || [];
  const visibleCopy = content.body?.visibleCopy || '';
  const studentAction = content.body?.studentAction;
  const fn = content.function || '';

  // Build headline from title
  const headline = title.length > 60 ? title.slice(0, 57) + '...' : title;

  // Build hook from title + first bullet
  const hook = visibleCopy
    ? visibleCopy
    : bullets.length > 0
      ? bullets[0]
      : `Let's explore: ${title}`;

  // Build explanation from visible copy + bullets
  const explanation = [visibleCopy, ...bullets].filter(Boolean).join(' ');

  // Build mechanism steps from bullets (if 3+ bullets, they likely describe a process)
  const steps = bullets.length >= 3 ? bullets : [];

  // Build interactive from student action
  const interactive = studentAction?.stem
    ? {
        type: 'poll',
        prompt: studentAction.stem,
        options: studentAction.options || [],
        hints: [
          'Think about what category of problem this is.',
          'Consider the first step in the mechanism.',
          'Almost there — which option matches the causal chain?',
        ],
        reveal: {
          correct: content.notes?.answers?.match(/^[A-C]\)/)?.[0]?.slice(0, 1) || 'A',
          explanation: content.notes?.answers || 'See instructor notes for the full explanation.',
          whyOthersWrong: {},
        },
      }
    : null;

  // Build pitfalls from common misconceptions in the topic
  const pitfalls = fn === 'misconception' && bullets.length > 0
    ? bullets.map(b => ({
        misconception: b,
        whyWrong: `This is a common misunderstanding. The correct understanding is based on the source material.`,
        betterWay: `Review the source material for the correct approach.`,
      }))
    : [];

  return {
    headline,
    hook,
    coreContent: {
      explanation,
      analogy: null,
      diagramDescription: null,
      steps: steps.length > 0 ? steps : undefined,
    },
    interactive,
    commonPitfalls: pitfalls,
    realWorld: null,
  };
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

  console.log(`Processing ${latest.size} slides...`);

  let added = 0;
  let skipped = 0;

  for (const [slideNo, artifact] of latest) {
    const content = artifact.contentJson;

    // Skip if already has student experience
    if (content.studentExperience && content.studentExperience.headline) {
      console.log(`S${String(slideNo).padStart(2, '0')}: Already has student experience - SKIPPING`);
      skipped++;
      continue;
    }

    const studentExp = buildStudentExperience(content, slideNo);

    // Update the artifact
    const updatedContent = { ...content, studentExperience: studentExp };
    await db.lectureSlideArtifact.update({
      where: { id: artifact.id },
      data: { contentJson: updatedContent },
    });

    added++;
    console.log(`S${String(slideNo).padStart(2, '0')}: Added student experience - "${studentExp.headline.slice(0, 50)}"`);
  }

  console.log(`\nDone: ${added} added, ${skipped} skipped`);
  await db.$disconnect();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
