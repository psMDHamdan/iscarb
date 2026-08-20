/**
 * AI Visual Learning System — Query Reformulation State Machine
 *
 * Implements autonomous multi-strategy query reformulation across 4 strategies:
 *   1. KEYWORD_MODIFIER_INFUSION: Enriches search with visual keywords (labeled diagram, schematic, vector, cross-section).
 *   2. DOMAIN_SYNONYM_SUBSTITUTION: Translates colloquial or broad terms into precise academic taxonomy.
 *   3. TAXONOMIC_BROADENING: Strips over-restrictive qualifiers to discover broader canonical schematics.
 *   4. CATEGORY_SEARCH_PIVOT: Pivots to Wikimedia Commons category syntax (incategory:Diagrams_of_...).
 *
 * Covers all major educational disciplines: Biology, Physics, Economics, Computer Science, History, Chemistry, Math, Engineering.
 */

import type {
  EducationalSubject,
  ReformulationResult,
  ReformulationStrategy,
  VisualSearchQuery,
} from "./types";

/**
 * Domain-specific visual keyword ontologies
 */
export const SUBJECT_KEYWORD_TAXONOMY: Record<EducationalSubject, string[]> = {
  biology: [
    "anatomical diagram labeled",
    "schematic cross section",
    "biological process pathway",
    "cellular structure vector",
    "physiological mechanism diagram",
  ],
  physics: [
    "schematic circuit diagram",
    "force vector diagram",
    "PV indicator diagram cycle",
    "electromagnetic field lines",
    "thermodynamic process schematic",
  ],
  economics: [
    "economic equilibrium curve graph",
    "macroeconomic flow diagram",
    "supply demand curve chart",
    "market model schematic",
    "production possibilities frontier",
  ],
  computer_science: [
    "data structure diagram nodes",
    "software architecture sequence diagram",
    "algorithm flowchart schematic",
    "network protocol packet flow",
    "neural network architecture layers",
  ],
  history: [
    "historical cartographic route map",
    "territorial expansion map diagram",
    "ancient trade network schematic",
    "civilization chronological timeline map",
    "military battle strategy map",
  ],
  chemistry: [
    "molecular orbital chemical structure",
    "reaction mechanism pathway diagram",
    "crystal lattice unit cell schematic",
    "periodic table electronic configuration",
    "titration curve equilibrium graph",
  ],
  mathematics: [
    "geometric proof theorem diagram",
    "coordinate Cartesian graph function",
    "venn diagram set theory",
    "vector field manifold illustration",
    "topological surface schematic",
  ],
  engineering: [
    "engineering technical blueprint schematic",
    "CAD sectional drawing cross section",
    "block diagram feedback control system",
    "piping and instrumentation diagram P&ID",
    "finite element mesh analysis",
  ],
  general: [
    "explanatory diagram schematic",
    "educational infographic chart",
    "labeled scientific model vector",
    "process workflow diagram",
  ],
};

/**
 * Curated domain synonym dictionaries for standard educational topics
 */
export const TOPIC_DOMAIN_SYNONYMS: Record<string, string[]> = {
  // Biology
  "human heart circulatory system": [
    "cardiovascular blood flow circulation anatomy diagram",
    "cardiac cycle internal anatomy labeled diagram",
    "human heart chambers valves systemic pulmonary circulation",
  ],
  "mitochondria electron transport chain": [
    "mitochondrial oxidative phosphorylation ATP synthase diagram",
    "cellular respiration electron transport chain membrane schematic",
    "inner mitochondrial membrane proton gradient diagram",
  ],
  "photosynthesis light reactions": [
    "chloroplast thylakoid light dependent reactions Calvin cycle diagram",
    "photosystem II and I Z-scheme electron flow schematic",
    "photosynthesis biochemical pathway labeled model",
  ],
  "dna replication fork": [
    "DNA replication fork helicase polymerase Okazaki fragments diagram",
    "semiconservative DNA synthesis leading lagging strand schematic",
  ],
  "mitosis cell division": [
    "stages of mitosis prophase metaphase anaphase telophase diagram",
    "cell cycle mitotic spindle chromosome segregation schematic",
  ],

  // Physics
  "carnot heat engine thermodynamic cycle": [
    "Carnot cycle p-V indicator diagram thermodynamics",
    "Carnot heat engine four-stage reversible cycle schematic",
    "temperature entropy T-s diagram Carnot engine",
  ],
  "lorentz force electromagnetic field": [
    "Lorentz force charged particle magnetic field vector diagram",
    "right hand rule magnetic force velocity field schematic",
    "electromagnetic deflection cycloid trajectory diagram",
  ],
  "optics ray tracing reflection refraction": [
    "geometric optics thin lens ray diagram focal point",
    "Snell law light refraction reflection interface schematic",
    "concave convex mirror ray tracing diagram",
  ],
  "bohr model hydrogen atom": [
    "Bohr model atomic energy levels electron transition diagram",
    "hydrogen emission spectral lines Rydberg formula schematic",
  ],

  // Economics
  "supply and demand market equilibrium": [
    "supply and demand curves equilibrium price quantity chart",
    "microeconomic supply demand intersection shifts graph",
    "market clearing price consumer producer surplus diagram",
  ],
  "is-lm model macroeconomic": [
    "IS-LM model goods money market equilibrium curves graph",
    "Hicks-Hansen IS LM macroeconomic policy shift chart",
  ],
  "circular flow of income": [
    "circular flow of income households firms government financial model",
    "national income economic circular flow matrix diagram",
  ],
  "production possibilities frontier": [
    "production possibility frontier trade-offs opportunity cost curve",
    "PPF concave curve economic efficiency graph",
  ],

  // Computer Science
  "binary search tree data structure": [
    "binary search tree node pointer structure diagram",
    "BST insertion deletion traversal balanced tree schematic",
    "binary tree left right child keys invariant diagram",
  ],
  "tcp ip three-way handshake": [
    "TCP 3-way handshake SYN SYN-ACK ACK sequence diagram",
    "transmission control protocol connection establishment flowchart",
  ],
  "transformer multi-head attention": [
    "transformer architecture multi-head attention self-attention diagram",
    "transformer neural network encoder decoder blocks schematic",
    "scaled dot-product attention query key value vector diagram",
  ],
  "dijkstra shortest path algorithm": [
    "Dijkstra shortest path graph weighted nodes relaxation diagram",
    "greedy graph search algorithm priority queue step diagram",
  ],

  // History
  "silk road ancient trade routes": [
    "Silk Road trade route map Eurasian trade networks Chang'an Mediterranean",
    "ancient Silk Road overland maritime trade routes historical map",
    "Eurasian caravan trading routes Afro-Eurasian connectivity map",
  ],
  "fertile crescent ancient civilization": [
    "Fertile Crescent Mesopotamia Tigris Euphrates ancient civilization map",
    "cradle of civilization Sumer Babylon Levant historical map",
  ],
  "transatlantic triangular trade route": [
    "transatlantic triangular trade route map Atlantic slave trade commodities",
    "triangular trade Europe Africa Americas mercantile map diagram",
  ],
  "roman empire territorial expansion": [
    "Roman Empire territorial expansion provinces Mediterranean map",
    "Pax Romana Roman provinces Augustus Trajan historical map",
  ],
};

/**
 * Returns pedagogical keywords associated with an educational subject
 */
export function getSubjectKeywords(subject: EducationalSubject): string[] {
  return SUBJECT_KEYWORD_TAXONOMY[subject] || SUBJECT_KEYWORD_TAXONOMY.general;
}

/**
 * Finds curated or dynamic domain synonyms for a given topic
 */
export function getDomainSynonyms(topic: string, subject: EducationalSubject): string[] {
  const normalized = topic.toLowerCase().trim();

  for (const [key, synonyms] of Object.entries(TOPIC_DOMAIN_SYNONYMS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return synonyms;
    }
  }

  // Fallback: Combine topic core with subject taxonomy keywords
  const subjectTerms = getSubjectKeywords(subject);
  return subjectTerms.map((term) => `${topic} ${term}`);
}

/**
 * Strategy 1: Infuses high-yield diagrammatic keyword modifiers into the query
 */
export function applyKeywordInfusion(
  query: VisualSearchQuery,
  attempt: number
): string {
  const baseTopic = query.topic.trim();
  const diagramType = query.diagramType || "diagram";

  const modifierSets = [
    `${baseTopic} labeled ${diagramType} schematic vector`,
    `${baseTopic} ${diagramType} illustration cross section`,
    `${baseTopic} educational process ${diagramType} model`,
    `${baseTopic} technical infographic chart schematic`,
  ];

  return modifierSets[attempt % modifierSets.length];
}

/**
 * Strategy 2: Substitutes domain-specific synonyms and academic nomenclature
 */
export function applyDomainSynonymSubstitution(
  query: VisualSearchQuery,
  attempt: number
): string {
  const synonyms = getDomainSynonyms(query.topic, query.subject);
  if (synonyms.length > 0) {
    return synonyms[attempt % synonyms.length];
  }
  // Generic fallback
  return `${query.topic} ${query.subject} scientific diagram`;
}

/**
 * Strategy 3: Taxonomic broadening — strips restrictive qualifiers to discover canonical diagrams
 */
export function applyTaxonomicBroadening(
  query: VisualSearchQuery
): string {
  const words = query.topic.split(/\s+/).filter((w) => w.length > 2);
  // Remove adjectives, numbers, or subclauses
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "in", "of", "to", "for", "with",
    "during", "detailed", "complete", "comprehensive", "simple",
    "advanced", "modern", "ancient", "specific", "overview",
  ]);
  const coreWords = words.filter((w) => !stopWords.has(w.toLowerCase()));

  // Keep first 2-3 core concept words + "diagram"
  const coreConcept = coreWords.slice(0, 3).join(" ");
  return `${coreConcept} diagram`;
}

/**
 * Strategy 4: Direct Wikimedia category search pivot
 */
export function applyCategoryPivot(
  query: VisualSearchQuery
): string {
  const sanitizedTopic = query.topic
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  // Construct search targeting category or subcategory
  return `incategory:"Diagrams of ${query.topic}" OR "${query.topic} diagram"`;
}

/**
 * Main query reformulator state machine
 *
 * Sequence of strategies across retries:
 *   Attempt 1: KEYWORD_MODIFIER_INFUSION
 *   Attempt 2: DOMAIN_SYNONYM_SUBSTITUTION
 *   Attempt 3: TAXONOMIC_BROADENING
 *   Attempt 4+: CATEGORY_SEARCH_PIVOT / Fallback
 */
export function reformulateQuery(
  query: VisualSearchQuery,
  attempt: number,
  previousQueries: string[] = [],
  discardReasons: string[] = []
): ReformulationResult {
  const prevSet = new Set(previousQueries.map((q) => q.toLowerCase().trim()));

  let strategy: ReformulationStrategy;
  let candidateQuery = "";
  let explanation = "";

  // Select strategy based on attempt index and previous discard patterns
  const effectiveAttempt = Math.max(1, attempt);

  if (effectiveAttempt === 1) {
    strategy = "KEYWORD_MODIFIER_INFUSION";
    candidateQuery = applyKeywordInfusion(query, 0);
    explanation = "Infused explicit visual keywords ('labeled schematic vector') to target educational diagrams.";
  } else if (effectiveAttempt === 2) {
    strategy = "DOMAIN_SYNONYM_SUBSTITUTION";
    candidateQuery = applyDomainSynonymSubstitution(query, 0);
    explanation = `Substituted academic domain ontology for subject '${query.subject}'.`;
  } else if (effectiveAttempt === 3) {
    strategy = "TAXONOMIC_BROADENING";
    candidateQuery = applyTaxonomicBroadening(query);
    explanation = "Broadened query to core conceptual noun phrases to eliminate over-restrictive search constraints.";
  } else {
    strategy = "CATEGORY_SEARCH_PIVOT";
    candidateQuery = applyCategoryPivot(query);
    explanation = "Pivoted search syntax to target Wikimedia Commons structured category namespaces.";
  }

  // Deduplication check: if generated query was already tried, fall through backup variants
  if (prevSet.has(candidateQuery.toLowerCase().trim())) {
    const backupSynonyms = getDomainSynonyms(query.topic, query.subject);
    for (const syn of backupSynonyms) {
      if (!prevSet.has(syn.toLowerCase().trim())) {
        candidateQuery = syn;
        strategy = "DOMAIN_SYNONYM_SUBSTITUTION";
        explanation = "Swapped to secondary domain synonym to avoid duplicate query execution.";
        break;
      }
    }

    if (prevSet.has(candidateQuery.toLowerCase().trim())) {
      candidateQuery = `${query.topic} ${query.subject} diagram model`;
    }
  }

  return {
    newQuery: candidateQuery,
    strategy,
    attempt: effectiveAttempt,
    explanation,
  };
}
