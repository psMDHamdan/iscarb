/**
 * Universal Academic Analogies — Keyword-to-Analogy Matching System
 * ==================================================================
 * Maps academic topics to concrete, memorable real-world analogies so the
 * student-facing "Think of It Like This" section always shows a genuine
 * mental model instead of a learning objective or generic filler.
 *
 * Priority: most specific keyword match wins over generic discipline fallback.
 */

export interface AcademicAnalogy {
  id: string;
  topic: string;
  analogy: string;
  framework: string;
  keywords: string[];
}

interface TopicAnalogy {
  keywords: string[];
  analogy: string;
  framework: string;
  topic: string;
}

/**
 * ANALOGY_MAP — priority-ordered: most specific entries first.
 * The resolver picks the entry with the MOST keyword hits in the slide text.
 */
export const ANALOGY_MAP: TopicAnalogy[] = [
  // ── BIOMOLECULES & BIOCHEMISTRY ──────────────────────────────────────
  {
    keywords: ["enzyme kinetics", "michaelis", "km", "vmax", "active site", "inhibitor", "catalysis", "enzyme", "substrate"],
    topic: "Enzymes & Catalysis",
    analogy:
      "An enzyme is like a custom-built keyhole. The substrate is the key that fits it perfectly. Instead of forcing the key, the keyhole grips it in just the right position to lower the energy needed to turn the lock — that's why enzymes speed reactions up without being consumed. An inhibitor is a key that jams the keyhole or bends it so the real key no longer fits.",
    framework: "Key (substrate) → keyhole (active site) → lowered energy → product released; inhibitor = wrong key.",
  },
  {
    keywords: ["protein folding", "amino acid", "polypeptide", "tertiary structure", "secondary structure", "protein structure", "self-assembly", "protein"],
    topic: "Protein Folding & Structure",
    analogy:
      "A protein is like a long string of beads that folds itself into a precise 3D shape. The bead sequence is the amino-acid chain; the folding is driven by weak attractions between beads — some beads are water-repelling and tuck inside, others cling to water and stay outside. Just as a tangled necklace is useless, a protein only works when it folds into its exact functional shape — and one wrong bead (mutation) can make the whole shape collapse.",
    framework: "Sequence → folding forces → 3D shape → function; misfolding = loss of function.",
  },
  {
    keywords: ["dna", "rna", "nucleic acid", "double helix", "base pair", "genome", "replication", "transcription", "translation", "gene"],
    topic: "DNA, RNA & Genetic Information",
    analogy:
      "DNA is like the master blueprint of a cell, stored safely in the nucleus (the office). The double helix is a zipper: each rung is a base pair (A–T, G–C) and the two strands are complementary. When the cell needs to work, it unzips a section and copies it into RNA — a work order that leaves the office and carries instructions to the protein factory (ribosome), where the message is read and a protein is built.",
    framework: "Blueprint (DNA) → copy (RNA) → assembly (protein); base-pairing is the zipper teeth.",
  },
  {
    keywords: ["lipid", "phospholipid", "membrane", "bilayer", "hydrophobic", "hydrophilic", "fatty acid", "amphipathic", "cell membrane"],
    topic: "Lipids & Cell Membranes",
    analogy:
      "A cell membrane is like a double row of bricks with their water-loving heads facing out and their water-fearing tails tucked together inside — two lines of soldiers standing back to back. Water can't squeeze between the bricks, so the membrane forms a barrier. Proteins embedded in the wall act as gates and channels, deciding which molecules enter and leave the cell.",
    framework: "Two layers of amphipathic lipids → selective barrier; embedded proteins = guarded gates.",
  },
  {
    keywords: ["carbohydrate", "glucose", "sugar", "polysaccharide", "starch", "cellulose", "glycolysis", "monosaccharide"],
    topic: "Carbohydrates & Energy",
    analogy:
      "Carbohydrates are like the cell's rechargeable batteries and building beams. Glucose is a single charged battery the cell can spend immediately. Starch and glycogen are stacks of charged batteries — safe energy storage for later. Cellulose is the same bricks welded into rigid beams that give plant cells their strength. The same monomer can make a battery or a beam depending on how it is linked.",
    framework: "Monomer (glucose) → linked chains → energy storage (starch/glycogen) or structure (cellulose).",
  },
  {
    keywords: ["biomolecule", "biomolecules", "macromolecule", "biochemistry", "four biomolecules", "biological molecule"],
    topic: "The Four Biomolecule Families",
    analogy:
      "Think of the four biomolecule families — proteins, lipids, carbohydrates, and nucleic acids — as the four types of LEGO bricks in a living cell. Each brick has a different shape and job: proteins do the work, lipids build the walls, carbohydrates store energy, and nucleic acids carry the instructions. The cell assembles these bricks into everything from membranes to machines.",
    framework: "4 brick types (proteins, lipids, carbs, nucleic acids) → specialized jobs → assembled into living structures.",
  },
  {
    keywords: ["nmr", "spectroscopy", "spectrum", "absorption", "mass spectrometry", "infrared", "resonance"],
    topic: "Spectroscopy & Molecular Analysis",
    analogy:
      "Spectroscopy is like reading a molecule's fingerprint. Just as no two people share a fingerprint, every molecule absorbs light (or responds to magnetic fields) in a unique pattern. You shine energy at the sample, record which wavelengths it absorbs, and match that signature against known fingerprints to identify which molecule you have — without ever opening the container.",
    framework: "Molecule → unique absorption pattern → match to known fingerprint → identity.",
  },
  {
    keywords: ["molecular weight", "molar mass", "mole", "calculation", "calculate"],
    topic: "Molecular Weight Calculations",
    analogy:
      "Calculating molecular weight is like weighing a recipe by its ingredients. A water molecule is one oxygen atom plus two hydrogens — so its mass is the sum of the atomic masses on the ingredient label (16 + 1 + 1 = 18). Add up the atoms, sum their masses, and you know how much one 'serving' of the molecule weighs, which lets you convert between grams and actual numbers of molecules.",
    framework: "Count atoms → sum atomic masses → molecular weight → grams ↔ molecule conversions.",
  },
  {
    keywords: ["equilibrium", "le chatelier", "reversible", "equilibrium constant", "concentration"],
    topic: "Chemical Equilibrium",
    analogy:
      "Equilibrium is like a seesaw with people constantly stepping on and off. The reaction keeps running in both directions, but when the rates of the forward and reverse reactions are equal, the heights of both sides stop changing — the system looks still but is actually in motion. Push one side (add reactants, remove products) and the seesaw rebalances until rates match again.",
    framework: "Forward rate = reverse rate → no net change; stress shifts the balance (Le Chatelier).",
  },

  // ── GENERAL ACADEMIC ──────────────────────────────────────────────────
  {
    keywords: ["assessment", "rubric", "readiness", "mastery", "performance standard", "competency", "bloom", "final"],
    topic: "Assessment & Mastery",
    analogy:
      "Think of this checkpoint like a pilot's pre-flight checklist. Each rubric criterion is one specific check — 'can you explain the mechanism?', 'can you apply it?', 'can you defend your choice?' — and passing each one tells you exactly which skills are flight-ready and which still need practice before takeoff.",
    framework: "Observable criteria → self-check → targeted review → mastery.",
  },
  {
    keywords: ["prior knowledge", "prerequisite", "recall", "activate", "schema", "misconception", "foundation"],
    topic: "Prior Knowledge & Misconceptions",
    analogy:
      "Learning a new concept is like building on a foundation — if the ground floor is cracked or tilted, everything above it wobbles. This step checks what you already know, finds the cracks (misconceptions), and repairs them first, so the new idea has something solid to stand on.",
    framework: "Check existing knowledge → fix misconceptions → build new understanding on solid ground.",
  },
  {
    keywords: ["problem solving", "critical thinking", "decision", "challenge", "trade-off", "evaluate", "diagnose"],
    topic: "Problem Solving & Decision Making",
    analogy:
      "Tackling a hard problem is like a doctor diagnosing a patient: gather the symptoms (data), form hypotheses (possible causes), run the cheapest test that discriminates between them, and only then treat. The best decision isn't the fastest or the safest-sounding one — it's the one that holds up when you trace the mechanism and weigh the trade-offs.",
    framework: "Symptoms → hypotheses → discriminating test → evidence-based decision.",
  },
  {
    keywords: ["real case", "case study", "real-world", "industry", "application", "transfer", "scenario"],
    topic: "Real-World Application & Transfer",
    analogy:
      "Applying a concept to a real case is like learning to drive in a parking lot and then navigating a busy city. The rules are the same, but now you have traffic, pedestrians, and deadlines. The skill is knowing which principle applies, adapting it to constraints you didn't see in the textbook, and justifying each decision under pressure.",
    framework: "Principle → real constraints → adapt → justify → transfer.",
  },
  {
    keywords: ["work", "practice", "guided", "independent", "solve", "exercise", "problem"],
    topic: "Guided & Independent Practice",
    analogy:
      "Practice is like learning a musical piece: first you watch the teacher play it slowly (worked example), then you play along with guidance (guided practice), and finally you perform it alone (independent practice). Each round removes a little support so the skill becomes yours — not just something you recognized when someone else did it.",
    framework: "Watch → guided → independent → fluency through gradual removal of support.",
  },
  {
    keywords: ["mechanism", "how it works", "process", "step", "interact", "function", "workflow"],
    topic: "Mechanism & Process",
    analogy:
      "Understanding a mechanism is like tracing how a package moves through a postal system: it enters at one point, passes through sorting stations, each station adds or removes something, and it exits transformed. The mechanism isn't a single step — it's the ordered chain of interactions, and each link's output becomes the next link's input.",
    framework: "Input → ordered steps → transformations → output; each step depends on the previous one.",
  },
  {
    keywords: ["concept", "core", "principle", "idea", "understand", "define"],
    topic: "Core Concept",
    analogy:
      "A core concept is like the rule of a game: once you know why the rule exists and what happens when you break it, you stop memorizing and start predicting. Anchor the idea to one concrete situation you already know, then ask 'what changes if I vary one part?' — that question turns a definition into understanding.",
    framework: "Rule → why it exists → what breaks it → predict variations.",
  },
];

/** Generic fallback used when no topic keywords match. */
export function buildGenericAnalogy(topicLabel: string): { analogy: string; framework: string } {
  return {
    analogy: `Think of ${topicLabel || "this concept"} like a familiar everyday system: break it into its parts, see how the parts connect, and predict what happens when one part changes. The more relationships you can trace, the more the idea stops being a definition and starts being a tool you can use.`,
    framework: "Parts → connections → change one part → observe the ripple → understanding.",
  };
}

/**
 * Resolves the best-fit analogy for a slide's title + content.
 * Picks the entry with the most keyword hits (ties go to the earlier entry).
 */
export function getAcademicAnalogyForSlide(
  slideTitle?: string,
  slideContent?: string
): { analogy: string; framework: string } {
  const combinedText = `${slideTitle || ""} ${slideContent || ""}`.toLowerCase();

  let best: TopicAnalogy | null = null;
  let bestHits = 0;
  for (const entry of ANALOGY_MAP) {
    const hits = entry.keywords.filter((kw) => combinedText.includes(kw.toLowerCase())).length;
    if (hits > bestHits) {
      bestHits = hits;
      best = entry;
    }
  }

  if (best) {
    return { analogy: best.analogy, framework: best.framework };
  }
  return buildGenericAnalogy(slideTitle);
}
