/**
 * iSCARB Employability Assessment — MODULE CATALOG
 * ===========================================================================
 * Faithful encoding of the Skills Assessment Platform Module Catalog (V1.0),
 * adapted into iSCARB and made DOMAIN-AGNOSTIC.
 *
 * Two parts:
 *   1. UNIVERSAL_MODULES — full 47-module catalog (M01–M47). The LIVE assessment
 *      set always starts from these 47 modules. Specialty Job-Fit is swapped into
 *      that set (never appended), so every specialty serves exactly 47 questions.
 *
 *      V1_UNIVERSAL_MODULE_CODES / v1UniversalModules() are DEAD / test-only
 *      leftovers from an older 12+3=15 pilot design — NOT used by the live API.
 *
 *   2. JOB-FIT RESOLUTION — single registry (JOBFIT_TRACKS): exactly 3 modules
 *      per specialization via catalog codes (L3 tracks / CS/IT composed track) or
 *      curated blueprints, else deterministic generateGenericJobFit(). No second
 *      routing path. The AI engine can additionally generate CLO-grounded modules;
 *      this catalog is the always-on fallback.
 *
 * PURITY: imports only from framework.ts. No zod / prisma / next / server-only.
 * ===========================================================================
 */
import type {
  AssessmentModuleSpec,
  DimensionId,
  FewShotAnchor,
  RubricCriterion,
} from "./framework";
import catalogTranslations from "@/data/catalog-translations.json";

// ─────────────────────────────────────────────────────────────────────────────
//  Saudi regulatory anchors per specialization (reuses iSCARB's domain grounding)
// ─────────────────────────────────────────────────────────────────────────────

export interface RegulatorAnchor {
  /** short authority codes for the prompt / Job-Fit grounding */
  authorities: string[];
  /** Vision-2030 / sector cluster label */
  cluster: string;
  /** one-line alignment note */
  alignment: string;
}

const GENERIC_REGULATOR: RegulatorAnchor = {
  authorities: ["Vision 2030", "NQF", "ETEC"],
  cluster: "National Workforce",
  alignment: "Aligned to Vision 2030 human-capability pillars and the NQF.",
};

/**
 * Maps a normalised specialization keyword to its Saudi regulatory anchor.
 * Lookup is substring-based so "Clinical Nursing", "Health Informatics" etc.
 * all resolve to the health anchor without an exhaustive list.
 */
const REGULATOR_RULES: { match: RegExp; anchor: RegulatorAnchor }[] = [
  {
    match: /account|audit|finance|bank|invest|wealth|treasur/i,
    anchor: {
      authorities: ["SAMA", "CMA", "SOCPA"],
      cluster: "Financial Services",
      alignment:
        "Aligned to Vision 2030 Financial Sector Development Program; SAMA/CMA supervision and SOCPA standards.",
    },
  },
  {
    match: /cyber|security|soc|infosec|network defen/i,
    anchor: {
      authorities: ["NCA", "SDAIA", "CITC"],
      cluster: "Cybersecurity",
      alignment: "Aligned to the National Cybersecurity Strategy and NCA ECC-1 controls.",
    },
  },
  {
    match: /health|clinic|nurs|medic|pharma|hospital|patient/i,
    anchor: {
      authorities: ["CBAHI", "SFDA", "MoH"],
      cluster: "Healthcare Quality",
      alignment: "Aligned to the Health Sector Transformation Program; CBAHI and SFDA standards.",
    },
  },
  {
    match: /\bai\b|artificial intelligence|data scien|machine learning|analytic|big data/i,
    anchor: {
      authorities: ["SDAIA", "NSDAI", "PDPL"],
      cluster: "AI & Data",
      alignment:
        "Aligned to the National Strategy for Data & AI (NSDAI); SDAIA AI Ethics 2.0 and the PDPL.",
    },
  },
  {
    match: /human resource|\bhr\b|talent|recruit|people ops/i,
    anchor: {
      authorities: ["HRSD", "GOSI", "Qiwa"],
      cluster: "Human Capital",
      alignment: "Aligned to MHRSD policy: Nitaqat (Saudisation), Qiwa contracting and GOSI.",
    },
  },
  {
    match: /law|legal|shariah|compliance|govern/i,
    anchor: {
      authorities: ["MoJ", "SDAIA", "Board of Grievances"],
      cluster: "Legal & Governance",
      alignment: "Aligned to Saudi legal practice and the national regulatory framework.",
    },
  },
  {
    match: /market|brand|advertis|seo|growth marketing|communications/i,
    anchor: {
      authorities: ["CITC", "GAMI", "Vision 2030"],
      cluster: "Digital Economy",
      alignment: "Aligned to the Digital Economy agenda and CITC content/advertising norms.",
    },
  },
  {
    match: /engineer|civil|mechanical|electric|industrial|construct/i,
    anchor: {
      authorities: ["Saudi Council of Engineers", "SASO", "MOMRAH"],
      cluster: "Engineering & Infrastructure",
      alignment: "Aligned to Vision 2030 giga-projects; SCE practice and SASO standards.",
    },
  },
  {
    match: /educat|teach|pedagog|curricul/i,
    anchor: {
      authorities: ["ETEC", "NCAAA", "MoE"],
      cluster: "Education",
      alignment: "Aligned to ETEC/NCAAA quality standards and MoE policy.",
    },
  },
  {
    match: /web|software|comput|program|developer|\bit\b|information tech/i,
    anchor: {
      authorities: ["SDAIA", "NCA", "CITC"],
      cluster: "Software & Digital",
      alignment: "Aligned to the Digital Government agenda; SDAIA data rules and NCA controls.",
    },
  },
];

export function resolveRegulator(specialization: string): RegulatorAnchor {
  const rule = REGULATOR_RULES.find((r) => r.match.test(specialization));
  return rule ? rule.anchor : GENERIC_REGULATOR;
}

/** Canonical lower-kebab key for a specialization. */
export function normalizeSpec(specialization: string): string {
  return specialization.trim().toLowerCase().replace(/[\s/]+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ─────────────────────────────────────────────────────────────────────────────
//  Module builder (keeps the universal specs DRY)
// ─────────────────────────────────────────────────────────────────────────────

function mod(
  spec: Omit<
    AssessmentModuleSpec,
    "passThreshold" | "validationEnabled" | "modelTag" | "temperature" | "generated" | "specialization"
  > &
    Partial<
      Pick<AssessmentModuleSpec, "passThreshold" | "validationEnabled" | "modelTag" | "temperature" | "specialization" | "generated">
    >,
): AssessmentModuleSpec {
  return {
    passThreshold: 60,
    validationEnabled: false,
    systemId: "ai-eval-001",
    modelTag: process.env.OPENAI_CHAT_MODEL || "openai/gpt-oss-20b",
    version: "2.1.0",
    temperature: 0.2,
    specialization: null,
    generated: false,
    ...spec,
  };
}

const anchor = (response: string, score: number, feedback: string): FewShotAnchor => ({
  response,
  score,
  feedback,
});

// ═════════════════════════════════════════════════════════════════════════════
//  1. UNIVERSAL MODULES  (apply to every specialization)
// ═════════════════════════════════════════════════════════════════════════════

const _UNIVERSAL_MODULES: AssessmentModuleSpec[] = [
  // ── Core Professionalism (25%) ──────────────────────────────────────────────
  mod({
    code: "M01",
    title: "Strategic Communication",
    titleAr: "التواصل الاستراتيجي",
    dimension: "core_professionalism",
    level: "L1-A",
    framework: "Jakobson's communication model + Carl Rogers' active listening",
    focus: "Delivering a complex or difficult message clearly to a non-technical audience.",
    saudiContext:
      "Protect leadership's standing; frame the bug as a managed, low-drama situation rather than an admission of fault.",
    scenario:
      "You are the project manager for a new mobile application named ConnectApp. After months of work, the launch has been a success, but your technical team has just identified a bug: some users on older smartphone models are experiencing slowness. The fix will be deployed within 48 hours. You must inform the management team (who are not technical) about the situation.",
    instructions:
      "Write an email to the management team to inform them of the situation. Your email should be clear, reassure them that the problem is being managed, and specify the next steps, all in a concise manner.",
    estimateMinutes: 20,
    rubric: [
      { criterion: "structural_clarity", weight: 25, descriptor: "Bottom line up front: subject, context, action, next steps." },
      { criterion: "audience_adaptation", weight: 25, descriptor: "Technical jargon explained or avoided for a non-technical reader." },
      { criterion: "emotional_management", weight: 25, descriptor: "Reassuring, proactive tone rather than alarmist." },
      { criterion: "pragmatic_effectiveness", weight: 25, descriptor: "Next steps and the 48-hour timeline are clear." },
    ],
    fewShot: [
      anchor(
        "Subject: Critical Production Issue, ConnectApp. Team, we have detected a regression in the rendering pipeline causing severe latency on legacy device APIs. This is a significant defect that slipped through QA. I am escalating to engineering for a hotfix ASAP. We will need to discuss how this happened.",
        30,
        "The message alarms a non-technical audience and offers no clear timeline. Heavy jargon and blame-oriented framing work against reassurance.",
      ),
      anchor(
        "Subject: Update on ConnectApp, minor issue being fixed. Hi team, I wanted to update you on ConnectApp. After the successful launch, we found that some users on older phone models are experiencing slower performance. Our technical team is already working on it and a fix will be released within 48 hours. I will keep you posted. Best regards.",
        58,
        "Clear, calm and jargon-free with a stated timeline, but it does not scope the impact, reassure on data/security, confirm no action is needed, or commit to a follow-up checkpoint.",
      ),
      anchor(
        "Subject: ConnectApp, performance issue on older devices, fix scheduled within 48h. Hi everyone, good news first: the launch has gone well and adoption is strong. We have identified one issue I want you aware of: a subset of users on older smartphone models are seeing slower load times. The cause is understood, it does not affect data or security, and the rest of the user base is unaffected. The team has already prepared a fix that will be deployed within 48 hours after testing. No action is needed on your side. I will send a short confirmation once the fix is live, and we will add a check to catch this device category earlier in future releases. Happy to answer any questions.",
        86,
        "A strategic, well-structured message: good news first, a scoped issue, cause, reassurance, a clear timeline, an explicit no-action-needed line, a follow-up commitment, and a preventive measure.",
      ),
    ],
  }),
  mod({
    code: "M02",
    title: "Critical Thinking & Problem-Solving",
    titleAr: "التفكير الناقد وحل المشكلات",
    dimension: "core_professionalism",
    level: "L1-A",
    framework: "Six Sigma DMAIC + Ishikawa root-cause analysis",
    focus: "Structured problem solving under operational pressure.",
    saudiContext:
      "Diagnosing systemic causes rather than blaming the courier aligns with face-saving norms; negative findings are best framed as optimisation opportunities.",
    scenario:
      "You are a consultant for UrbanEat (tech logistics). The average delivery time has increased by 25% due to a system efficiency issue. Management is unsure of the root cause. Your mission: apply the five phases of the DMAIC methodology to diagnose the problem and propose a structured action plan.",
    instructions:
      "Write an action plan structured into five phases. DEFINE: reformulate the problem. MEASURE: list three KPIs to track. ANALYZE: use an Ishikawa approach to identify root causes (e.g. app latency, courier routing). IMPROVE: propose concrete solutions. CONTROL: how will you monitor stability?",
    estimateMinutes: 30,
    rubric: [
      { criterion: "define", weight: 15, descriptor: "Precision of the problem statement." },
      { criterion: "measure", weight: 15, descriptor: "Relevance of the data and KPIs selected." },
      { criterion: "analyze", weight: 30, descriptor: "Depth of root-cause analysis, not just symptoms." },
      { criterion: "improve", weight: 30, descriptor: "Realism of the proposed solutions." },
      { criterion: "control", weight: 10, descriptor: "Viability of the monitoring plan." },
    ],
    fewShot: [
      anchor(
        "The delivery times went up because the couriers are too slow. We should hire more couriers and tell them to hurry up. We can check next month if it gets better.",
        34,
        "The answer blames individuals rather than the system, the exact failure mode the module screens against. There are no KPIs, no Ishikawa structure, and the monitoring plan is vague.",
      ),
      anchor(
        "DEFINE: average delivery time has risen 25% on the UrbanEat platform; target is a return to baseline within four weeks without adding courier headcount cost. MEASURE: median delivery time by zone and hour, order-to-dispatch latency, and courier idle-to-transit ratio. ANALYZE (Ishikawa across Technology / Method / Environment / People): dispatch-algorithm latency and routing-API slowdowns; batching rules pairing non-adjacent orders; peak-hour traffic in specific zones; onboarding of new couriers unfamiliar with zones. Prioritise by data rather than assuming the courier is at fault. IMPROVE: retune batching to geographic clusters, cache routing for high-frequency corridors, stagger promotions to flatten peaks; pilot in two zones first. CONTROL: track the three KPIs on a weekly control chart with an alert at +10% over baseline; review after the two-zone pilot before full rollout.",
        88,
        "A disciplined DMAIC pass: a measurable problem statement, relevant KPIs, a multi-branch Ishikawa that resists the blame-the-courier shortcut, realistic and piloted improvements, and a control plan with a defined threshold.",
      ),
    ],
  }),
  mod({
    code: "M03",
    title: "Teamwork & Conflict Resolution",
    titleAr: "العمل الجماعي وحل النزاعات",
    dimension: "core_professionalism",
    level: "L1-A",
    framework: "Thomas-Kilmann Conflict Mode Instrument (TKI)",
    focus: "Conflict resolution inside a technical team.",
    saudiContext:
      "Private consensus-building, rather than public debate, is strongly aligned with Saudi workplace norms and is rewarded here.",
    scenario:
      "You are the project manager for project Alpha. Your team has just finished an important feature and you want to deploy it next Tuesday. Chloe, the lead developer, is firmly against this: she has identified risks of minor bugs and would prefer an extra week of testing to deliver a perfect version. The tension is palpable.",
    instructions:
      "1. Choose the conflict-management style (Thomas-Kilmann model) you believe is most appropriate. 2. Write the exact message you would send to Chloe to resolve this.",
    estimateMinutes: 15,
    rubric: [
      { criterion: "situational_analysis", weight: 30, descriptor: "Relevance of the chosen style (Collaborating / Compromising)." },
      { criterion: "practical_application", weight: 40, descriptor: "Effectiveness of the message in resolving the deadlock." },
      { criterion: "active_listening", weight: 30, descriptor: "Validates the developer's quality concerns." },
    ],
    fewShot: [
      anchor(
        "Style: Competing. Message: 'Chloe, I appreciate the concern but the decision is made. We deploy Tuesday, we do not have time for another week. Please make sure it is ready.'",
        30,
        "Choosing a Competing (forcing) style against a senior peer raising a legitimate quality risk damages trust and does not resolve the concern. The message dismisses rather than engages.",
      ),
      anchor(
        "Style: Collaborating, moving to Compromising if needed. Message: 'Hi Chloe, thanks for flagging this, you know the codebase better than anyone and I would rather hear the risk now than after release. Could we list the specific failure modes you are worried about and triage them into release-blockers vs fast-follow fixes? If the blockers can be covered by targeted tests and a staged rollout to 10% of users by Tuesday, we ship to that cohort and hold full rollout until we have a clean day of metrics. If you still see a blocker we cannot cover, I will back a short delay. Does that work as a way to protect both quality and the timeline?'",
        87,
        "Correct collaborative style with a compromise fallback, a concrete mechanism (triage, staged rollout, conditional delay), and explicit validation of the developer's concern.",
      ),
    ],
  }),
  mod({
    code: "M04",
    title: "Adaptability & Resilience",
    titleAr: "القدرة على التكيّف والمرونة",
    dimension: "core_professionalism",
    level: "L1-A",
    framework: "Kübler-Ross Change Curve (organisational adaptation)",
    focus: "Managing a sudden change of scope or technology stack.",
    saudiContext: "The pivot should be communicated upward with deference, stabilising stakeholder confidence without alarm.",
    scenario:
      "You are in charge of a critical launch scheduled in 7 days. This morning, a major twist: the primary platform/API you rely on has announced a breaking change (algorithm update) that renders your current strategy obsolete. The launch cannot be postponed.",
    instructions:
      "Write a detailed action plan explaining how you react, pivot your strategy, and ensure the launch succeeds in 7 days despite this obstacle.",
    estimateMinutes: 20,
    rubric: [
      { criterion: "problem_diagnosis", weight: 20, descriptor: "Did they assess impact before acting?" },
      { criterion: "proactivity", weight: 20, descriptor: "Focus on solutions rather than complaint." },
      { criterion: "risk_management", weight: 20, descriptor: "Realism of the pivot plan." },
      { criterion: "communication", weight: 20, descriptor: "Transparency with stakeholders." },
      { criterion: "mindset", weight: 20, descriptor: "Constructive attitude (Decision phase) vs denial." },
    ],
    fewShot: [
      anchor(
        "This is a disaster and honestly not our fault, the platform changed everything at the last minute. We should push the launch back until they sort it out, there is no way to be ready in 7 days with this.",
        33,
        "The response sits in the denial/blame zone of the change curve and proposes postponing a launch that cannot be postponed. There is no impact assessment and no pivot.",
      ),
      anchor(
        "First, scope the blast radius: confirm today which features break under the API change and which still work. Second, pivot: switch the affected flow to the supported replacement endpoint, or a temporary cached/manual fallback for launch, and schedule the full migration as a week-2 fast-follow. Third, protect the date: cut any non-essential feature touching the broken API from the v1 scope so the core experience ships clean. Fourth, communicate today what changed, what ships on time, and what moves to the fast-follow. The launch holds on the committed date with a slightly reduced but stable scope.",
        88,
        "Impact is assessed before action, the pivot is concrete and realistic, scope is protected, and stakeholders are informed early. The mindset is squarely in the constructive Decision phase.",
      ),
    ],
  }),
  // ── Level 1A additions (M05–M06) ──────────────────────────────────────────

  mod({
    code: "M05",
    title: "Emotional Intelligence",
    titleAr: "الذكاء العاطفي",
    dimension: "core_professionalism",
    level: "L1-A",
    framework: "Goleman EI (Emotional Intelligence)",
    focus: "Recognising a colleague's distress signals and responding with empathic leadership.",
    saudiContext:
      "Addressing a colleague's distress privately and with sensitivity aligns with Saudi cultural norms around face-saving and collective harmony.",
    scenario:
      "You are a team leader at a mid-sized company. During a routine project meeting, you notice that one of your most reliable team members, Sara, has been unusually quiet, is missing small deadlines, and seemed close to tears when minor criticism was raised. You have a one-on-one meeting with her scheduled this afternoon.",
    instructions:
      "Describe how you would approach the one-on-one meeting with Sara. Address: how you recognise and name the signals you observed (self-awareness), how you would demonstrate genuine empathy during the conversation, what social skills you would use to keep the conversation safe and constructive, and how you would regulate your own emotions if the conversation becomes uncomfortable.",
    estimateMinutes: 20,
    rubric: [
      { criterion: "self_awareness", weight: 25, descriptor: "Identifies and names the specific behavioural signals observed in Sara." },
      { criterion: "empathy", weight: 25, descriptor: "Demonstrates perspective-taking and validates Sara's experience." },
      { criterion: "social_skills", weight: 25, descriptor: "Uses active listening, open questions, and a psychologically safe approach." },
      { criterion: "self_regulation", weight: 25, descriptor: "Manages own discomfort or surprise without projecting it onto Sara." },
    ],
    fewShot: [
      anchor(
        "I would ask Sara why she has been off lately and tell her she needs to get back on track. She is letting the team down and that is not acceptable.",
        28,
        "The response is task-focused and confrontational; it shows no empathy and is likely to cause the colleague to shut down rather than open up. There is no evidence of self-awareness, active listening, or emotional regulation.",
      ),
      anchor(
        "I would start by creating a relaxed, private setting. I would open with: 'Sara, I really value our work together and I have noticed you seem to have a lot on your plate lately. I just wanted to check in, how are you doing?' I would then listen without interrupting. If she shares something difficult, I would validate her feelings — 'That sounds really hard, thank you for telling me' — before moving to any discussion of work. I would stay calm even if she becomes emotional, reminding myself that my role at that moment is to support, not to fix immediately. Only after she feels heard would I gently ask if there is anything I can do to help manage the workload.",
        88,
        "Strong on all four dimensions: signals are inferred tactfully, empathy is shown through open questions and validation, social skills are evident in the private safe framing and active listening, and self-regulation is explicitly described as staying calm and not rushing to fix.",
      ),
    ],
  }),
  mod({
    code: "M06",
    title: "Professionalism & Ethics",
    titleAr: "الاحترافية والأخلاقيات",
    dimension: "core_professionalism",
    level: "L1-A",
    framework: "Business ethics frameworks (stakeholder theory, deontological reasoning)",
    focus: "Discovering a minor compliance breach before a client audit.",
    saudiContext:
      "Raising compliance concerns upward should be framed as protecting the organisation's reputation and relationships, not as an accusation; confidentiality of the process matters.",
    scenario:
      "You are a junior analyst at a consulting firm. While preparing a client presentation, you discover that a colleague, a senior analyst, has used an outdated version of a regulatory dataset and the figures in the deck are technically incorrect, though only by a small margin. A client audit is scheduled for tomorrow morning.",
    instructions:
      "Describe your action plan: identify the ethical and professional risks, explain how you would approach the conversation with your colleague and/or manager, and propose what should be done before the audit.",
    estimateMinutes: 20,
    rubric: [
      { criterion: "risk_identification", weight: 34, descriptor: "Identifies both the compliance risk (incorrect data) and the reputational risk for the firm." },
      { criterion: "ethical_reasoning", weight: 33, descriptor: "Articulates why correcting the error is the right course of action, not just expedient." },
      { criterion: "action_plan", weight: 33, descriptor: "Proposes a realistic, timely action to correct the error while preserving professional relationships." },
    ],
    fewShot: [
      anchor(
        "The margin of error is small so it probably won't matter. I wouldn't say anything to avoid making trouble for my colleague the night before a big audit.",
        27,
        "Choosing silence in the face of a known inaccuracy is an ethical failure: it prioritises personal comfort over the client's right to accurate data and the firm's integrity. The response shows no risk identification and no ethical reasoning.",
      ),
      anchor(
        "The risks are clear: presenting incorrect data — even by a small margin — in a regulated context exposes the firm to reputational and legal liability, and undermines client trust. Ethically, honesty and accuracy are non-negotiable professional standards regardless of the inconvenience of the timing. My action plan: first, I would approach my colleague privately and calmly — 'I noticed the dataset may be an older version; I wanted to flag it before tomorrow so we can protect the firm and the client.' If the colleague is unreachable or resistant, I would escalate to the engagement manager tonight. The correction itself is small so it should be fixable before the audit. The way to raise it is as a risk-mitigation step, not as blame.",
        90,
        "Both risks are identified clearly, the ethical reasoning goes beyond 'rules say so' to explain the underlying principle, and the action plan is timely, relationship-aware, and constructive.",
      ),
    ],
  }),

  // ── Level 1B additions (M07–M15) ───────────────────────────────────────────

  mod({
    code: "M07",
    title: "Emotional Intelligence Advanced",
    titleAr: "الذكاء العاطفي المتقدم",
    dimension: "core_professionalism",
    level: "L1-B",
    framework: "Applied social psychology (social identity theory, conflict de-escalation)",
    focus: "Defusing a cross-functional conflict between two senior colleagues.",
    saudiContext:
      "Intervening between senior colleagues calls for indirect, face-saving framing; direct confrontation is rarely appropriate in a hierarchy-sensitive environment.",
    scenario:
      "You are a mid-level manager. Two senior department heads, Khalid (Operations) and Layla (Product), have stopped communicating directly after a dispute over resource allocation. Their teams are starting to take sides and a cross-functional project is at risk. You have been asked by the VP to help resolve the situation without making it a formal HR matter.",
    instructions:
      "Describe how you would approach this situation. Address: how you read the underlying dynamics (situational reading), how you manage your own emotional state while engaging two people more senior than you (emotional regulation), and what specific intervention steps you would take to de-escalate the conflict and restore working communication (intervention quality).",
    estimateMinutes: 25,
    rubric: [
      { criterion: "situational_reading", weight: 30, descriptor: "Accurately diagnoses the conflict type and the social dynamics at play." },
      { criterion: "emotional_regulation", weight: 30, descriptor: "Describes managing own emotions and neutrality when dealing with senior stakeholders." },
      { criterion: "intervention_quality", weight: 40, descriptor: "A realistic, face-saving, step-by-step de-escalation plan that restores communication." },
    ],
    fewShot: [
      anchor(
        "I would call a meeting with both of them, put the issues on the table and ask them to sort it out professionally. They are both adults.",
        30,
        "A direct confrontation with no face-saving framing is likely to entrench positions. There is no situational reading, no attention to the power dynamics, and the 'sort it out' framing offers no structured path to resolution.",
      ),
      anchor(
        "Situational reading: this is a status and resource conflict that has become personal; both parties likely feel their authority was not respected. The teams mirroring their managers suggests the conflict has spread laterally. I would meet each person separately first to understand their perspective without the other present, validating their concerns privately before any joint step. Emotional regulation: I would remind myself that my role is facilitator, not judge, and resist any pressure to take a side. If the conversation gets heated I would slow it down with neutral questions. Intervention: after the individual meetings, I would identify one concrete shared goal (the project's success) and propose a structured, low-stakes joint working session focused on that goal rather than the past dispute. I would frame the outreach as 'the VP wants the project to succeed and I think a brief alignment session would help' — connecting it to organisational goals rather than the personal conflict.",
        90,
        "Strong situational diagnosis, explicit self-management strategy, and a realistic, face-saving intervention path that uses separate meetings before a joint one and anchors the resolution in a shared goal.",
      ),
    ],
  }),

  mod({
    code: "M08",
    title: "Ethical Context Integration",
    titleAr: "الالتزام الأخلاقي المهني",
    dimension: "core_professionalism",
    level: "L1-B",
    framework: "Business ethics and professional integrity",
    focus: "Resolving a quality vs deadline dilemma.",
    saudiContext:
      "Pushing back is best framed as a policy or quality constraint rather than an accusation, preserving the manager's standing while protecting the work.",
    scenario:
      "Your team is about to miss a critical client deadline. Your manager tells you to cut some corners on the quality-control process to deliver on time, adding that we can fix bugs later. You know this creates a high risk of technical debt and security flaws.",
    instructions:
      "Describe your action plan: what are the ethical/technical risks, how do you approach the conversation with your manager, and what alternative solutions do you propose?",
    estimateMinutes: 15,
    rubric: [
      { criterion: "risk_analysis", weight: 33, descriptor: "Identification of long-term technical and reputational risks." },
      { criterion: "courage", weight: 33, descriptor: "Willingness to challenge the unsafe directive." },
      { criterion: "solution_orientation", weight: 34, descriptor: "Proposing viable compromises (e.g. phased delivery)." },
    ],
    fewShot: [
      anchor(
        "If the manager says to skip QC, I will do it, he is the boss and it is his call. We can fix the bugs later like he said.",
        31,
        "The answer capitulates to an unsafe directive without analysing the risk or proposing an alternative. Fixing bugs later is the very plan that creates the exposure.",
      ),
      anchor(
        "Risks: shipping unverified code to a client risks security flaws and defects that are far costlier to fix post-release and that damage trust; it also adds technical debt that slows the next releases. Conversation: I would raise it privately, framed around the shared goal, 'I want us to hit the date too; here is the risk if we ship unverified, and here is how we protect both the date and quality.' Alternatives: phased delivery of the fully-tested core on time with the remainder on a short follow-up; risk-based QC that concentrates testing on the highest-risk, security-sensitive paths rather than skipping it; transparency with the client on a brief, controlled timeline if needed.",
        88,
        "Clear long-term risk analysis, a respectful but firm challenge to the directive, and several viable compromises that protect the deadline where it matters without accepting uncontrolled risk.",
      ),
    ],
  }),
  mod({
    code: "M09",
    title: "Job Search & Market Analysis",
    titleAr: "البحث عن عمل وتحليل السوق",
    dimension: "core_professionalism",
    level: "L1-B",
    framework: "Push vs Pull job search strategies / hidden job market theory",
    focus: "Planning a structured job-search strategy for a 2025 Saudi graduate.",
    saudiContext:
      "The Saudi graduate job market relies heavily on relationships and internal referrals; a strategy that includes wasta-neutral networking and awareness of HRSD/Qiwa portals is more credible than one that relies solely on online applications.",
    scenario:
      "You are a 2025 Saudi graduate with a degree in Business Administration. You have been applying to advertised roles online for two months with limited success. A career advisor tells you that up to 70% of roles are never publicly advertised — the 'hidden job market'. You have four weeks to refresh your strategy.",
    instructions:
      "Write a structured job-search plan for the next four weeks. Address: what the hidden job market means and how you would access it, which specific channels and platforms you would use and why, and how you would build or activate a professional network in the Saudi context.",
    estimateMinutes: 20,
    rubric: [
      { criterion: "market_awareness", weight: 35, descriptor: "Demonstrates understanding of push vs pull search and the hidden job market concept." },
      { criterion: "channel_strategy", weight: 35, descriptor: "Identifies a realistic mix of channels (LinkedIn, Jadarat, HRSD portal, sector events, alumni networks)." },
      { criterion: "networking_approach", weight: 30, descriptor: "Proposes a concrete, culturally appropriate networking plan for the Saudi market." },
    ],
    fewShot: [
      anchor(
        "I will keep applying on LinkedIn and Bayt every day and hope something comes up. I will also update my CV.",
        28,
        "The strategy is entirely reactive and limited to two advertised-job platforms. There is no awareness of the hidden job market, no channel diversity, and no networking plan.",
      ),
      anchor(
        "Market awareness: the hidden job market means most vacancies are filled by referral before being advertised. To access it I shift from purely reactive (responding to posts) to proactive (reaching decision-makers directly). Channel strategy: I will use LinkedIn for direct outreach to hiring managers in my target sector, Jadarat and the HRSD portal for government-linked opportunities, and company career pages for direct applications. I will also identify two sector events (LEAP, a local business chamber) to attend in person. Networking: I will reach out to five alumni from my university who are working in target companies, asking for a 20-minute informational conversation — not a job ask — and follow up with a personalised note. I will also ask professors for introductions where appropriate. This mix balances digital presence with relationship-building that fits the Saudi professional context.",
        89,
        "Demonstrates clear understanding of push vs pull and the hidden market, proposes a multi-channel strategy grounded in Saudi-specific platforms, and outlines a concrete, relationship-appropriate networking plan.",
      ),
    ],
  }),
  mod({
    code: "M10",
    title: "Application Tools: CV & Cover Letter",
    titleAr: "أدوات التقديم: السيرة الذاتية وخطاب التقديم",
    dimension: "core_professionalism",
    level: "L1-B",
    framework: "AIDA (Attention, Interest, Desire, Action) + Bridge model for cover letters",
    focus: "Writing a targeted cover letter paragraph for a specific job posting.",
    saudiContext:
      "A cover letter in the Saudi market should be formal in register and connect personal goals to organisational and national development objectives where genuine.",
    scenario:
      "You are applying for a 'Marketing Analyst — Digital Campaigns' role at a Saudi fintech company. The job posting emphasises: data-driven decision making, experience with Google Analytics or similar tools, and Arabic/English bilingual communication. You have completed a Google Analytics certification, worked on a university campaign project that generated a 40% increase in event attendance, and are bilingual.",
    instructions:
      "Write a single cover letter opening paragraph (4–6 sentences) that hooks the reader (Attention), builds interest with your relevant background (Interest), creates desire by connecting your skills to the role's requirements (Desire), and ends with a clear call to action (Action).",
    estimateMinutes: 20,
    rubric: [
      { criterion: "attention_hook", weight: 25, descriptor: "Opens with a compelling, specific hook rather than a generic opener." },
      { criterion: "interest_value", weight: 25, descriptor: "Introduces relevant credentials and experience concisely." },
      { criterion: "desire_fit", weight: 25, descriptor: "Explicitly bridges the candidate's skills to the role's stated requirements." },
      { criterion: "action_cta", weight: 25, descriptor: "Closes with a clear, confident call to action." },
    ],
    fewShot: [
      anchor(
        "Dear Hiring Manager, I am writing to apply for the Marketing Analyst position at your company. I am a recent graduate with a degree in Marketing and I believe I would be a good fit for this role. I am hardworking and eager to learn. I look forward to hearing from you.",
        26,
        "The opener is completely generic and could apply to any role. There is no evidence, no specific connection to the job requirements, and the call to action is passive. The AIDA model is absent.",
      ),
      anchor(
        "A 40% lift in event attendance from a targeted digital campaign is not luck — it is what happens when data meets creative strategy, and it is what I want to bring to your marketing team. With a Google Analytics certification and hands-on experience running bilingual campaigns (Arabic and English), I have built exactly the analytical-creative skill set your Digital Campaigns Analyst role calls for. I am drawn to this fintech role specifically because data-driven decisions are central to the mandate, not an afterthought. I would welcome the opportunity to discuss how my background fits your team's next campaign cycle.",
        91,
        "The hook is specific and metrics-driven (Attention), the certification and bilingual experience create Interest, the fintech data mandate is directly bridged (Desire), and the final sentence is a confident, action-oriented close. Strong AIDA execution.",
      ),
    ],
  }),
  mod({
    code: "M11",
    title: "Interview Mastery",
    titleAr: "إتقان المقابلات",
    dimension: "core_professionalism",
    level: "L1-B",
    framework: "STAR method (Situation, Task, Action, Result)",
    focus: "Behavioural interview answers.",
    saudiContext:
      "For Saudi graduates entering the workforce, the Action should show tactful initiative and respectful disagreement rather than challenging hierarchy.",
    scenario: "Interview question: tell me about a time you had to work under intense pressure to meet a tight deadline.",
    instructions: "Write your answer using the STAR structure (Situation, Task, Action, Result).",
    estimateMinutes: 15,
    rubric: [
      { criterion: "structure", weight: 40, descriptor: "Clear Situation, Task, Action, Result separation." },
      { criterion: "action_focus", weight: 30, descriptor: "Focus on what the candidate personally did." },
      { criterion: "result", weight: 30, descriptor: "A quantified or clearly stated outcome." },
    ],
    fewShot: [
      anchor(
        "I work well under pressure. There was a project that was due soon and it was stressful but the team pulled through and we got it done in the end. I am good with deadlines.",
        30,
        "There is no STAR structure, the answer speaks in we rather than I, and the result is vague. It asserts a quality instead of demonstrating it.",
      ),
      anchor(
        "Situation: in my final-year project, a client demo was moved up by a week, leaving five days for a module that normally takes two. Task: as the developer responsible for the data integration, I had to deliver a working, tested version in time. Action: I broke the work into daily milestones, moved two non-essential features to a fast-follow, paired with a teammate for early code review, and automated the test runs so I could focus on the integration logic. Result: we delivered the demo on time, it ran without errors, the client approved the next phase, and the automated tests were reused by the team afterwards.",
        90,
        "Clean STAR separation, a strong focus on the candidate's own actions, and a clear, partly quantified result. A model behavioural answer.",
      ),
    ],
  }),
  mod({
    code: "M12",
    title: "Networking & Personal Branding",
    titleAr: "التواصل المهني والعلامة الشخصية",
    dimension: "core_professionalism",
    level: "L1-B",
    framework: "Social network theory (structural holes, weak ties) + personal branding",
    focus: "Building a LinkedIn presence and making a cold outreach in the Saudi market.",
    saudiContext:
      "In the Saudi professional context, cold outreach is more effective when it references a shared connection, a shared institution, or a shared national goal; transactional messages that lead with 'I am looking for a job' are significantly less effective.",
    scenario:
      "You are a recent Saudi graduate looking for your first role in data analytics. Your LinkedIn profile is sparse (profile photo, degree, one internship listed). You have identified a senior data analyst at a Saudi bank who you would like to approach for an informational conversation.",
    instructions:
      "Address two parts: Part 1 — describe the three most important improvements you would make to your LinkedIn profile before reaching out. Part 2 — write the exact cold outreach message you would send to the senior analyst.",
    estimateMinutes: 20,
    rubric: [
      { criterion: "profile_clarity", weight: 30, descriptor: "Identifies concrete, high-impact profile improvements (headline, summary, skills, portfolio evidence)." },
      { criterion: "outreach_quality", weight: 40, descriptor: "The message is personalised, concise, clear on the ask, and does not open with a job request." },
      { criterion: "personal_brand", weight: 30, descriptor: "The overall strategy builds a coherent, credible professional identity." },
    ],
    fewShot: [
      anchor(
        "I would complete my profile and then send a message saying: Hi, I am looking for a job in data analytics and I would like to connect with you.",
        27,
        "The profile improvement advice is vague and non-specific. The outreach message opens with a job request, which is the most common mistake in cold outreach and dramatically reduces response rates.",
      ),
      anchor(
        "Profile improvements: (1) Rewrite the headline from 'Student' to 'Data Analytics Graduate | SQL · Python · Power BI' so I appear in relevant searches. (2) Add a professional summary that states my focus area, my internship outcome (e.g. reduced reporting time by 30%), and what I am looking for next. (3) Add a Projects section with a brief description of a capstone or university dataset project, linking to GitHub or a dashboard where possible. Outreach message: 'Hi [Name], I came across your profile while researching data analytics roles in Saudi banking — your work on [specific project/article they shared] was exactly the kind of applied analytics I am aiming to develop. I am a recent graduate who just completed an internship where I built dashboards in Power BI for [company type]. Would you be open to a 20-minute virtual chat? I am genuinely curious how you developed your expertise in this area and any advice you have for someone starting out. No ask beyond your time and perspective. Thank you either way.'",
        90,
        "Three concrete, high-impact profile changes; an outreach message that is personalised with a specific reference, clear on the ask, not a job request, and respectful of the recipient's time.",
      ),
    ],
  }),
  mod({
    code: "M13",
    title: "Negotiation & Contracting",
    titleAr: "التفاوض وإبرام العقود",
    dimension: "core_professionalism",
    level: "L1-B",
    framework: "BATNA (Best Alternative to a Negotiated Agreement) / integrative negotiation",
    focus: "Negotiating salary and contract terms for a first job offer that is slightly below expectations.",
    saudiContext:
      "In the Saudi job market, salary negotiation is expected but must be done with respect; referencing market data and framing the ask around value contribution is more effective than direct confrontation or ultimatums.",
    scenario:
      "You have received your first job offer as a junior marketing coordinator at a Saudi retail company. The offered salary is SAR 6,500/month. Based on your research, the market rate for this role in Riyadh is SAR 7,000–8,000. You really want the role, but you feel the offer is below market. The offer also includes no mention of a professional development budget.",
    instructions:
      "Describe your negotiation approach. Address: what your BATNA is and how it affects your strategy, how you would frame your counter-offer in terms of your value and market data rather than personal need, and what outcome — salary or non-salary terms — you would consider a successful agreement.",
    estimateMinutes: 20,
    rubric: [
      { criterion: "batna_awareness", weight: 30, descriptor: "Defines BATNA clearly and uses it to calibrate confidence and limits without bluffing." },
      { criterion: "interest_based_framing", weight: 40, descriptor: "Frames the counter using market data and value contribution, not personal need or ultimatums." },
      { criterion: "agreement_quality", weight: 30, descriptor: "Identifies a realistic, multi-term agreement that meets core interests on both sides." },
    ],
    fewShot: [
      anchor(
        "I really need this job so I will just accept the offer. Maybe I can ask for a raise after six months.",
        28,
        "The response shows no BATNA awareness, no negotiation attempt, and a vague, deferred plan. Accepting without negotiating often sets the salary base for years.",
      ),
      anchor(
        "BATNA: My best alternative right now is a competing offer at SAR 6,800 from a smaller company, or continuing to interview. Knowing this means I can negotiate with confidence but I am not in a position to walk away from a strong offer for a small gap. Strategy: I would ask for a brief call to discuss the offer, then say: 'I am genuinely excited about this role and the team. Based on my research, the market range for this position in Riyadh is SAR 7,000–8,000, and given my internship background in digital campaigns, I was hoping we could discuss a starting salary closer to SAR 7,200. I am also very committed to professional development — would it be possible to include a small learning budget, even SAR 2,000 per year for courses?' Agreement: a successful outcome is SAR 7,000–7,200 with a professional development line, or the original SAR 6,500 with a committed 6-month performance review and the learning budget, since both address my core interests.",
        90,
        "Clear BATNA defined and calibrated correctly, market-data framing with no ultimatum, and a realistic multi-term agreement that identifies acceptable trade-offs on both sides.",
      ),
    ],
  }),
  mod({
    code: "M14",
    title: "Behavioral Preferences (OCEAN)",
    titleAr: "التفضيلات السلوكية — نموذج OCEAN",
    dimension: "core_professionalism",
    level: "L1-B",
    framework: "Big Five OCEAN personality model (Costa & McCrae)",
    focus: "Responding to peer feedback that hints at low Conscientiousness.",
    saudiContext:
      "Receiving critical feedback is an important professional skill; a strong response demonstrates maturity and a growth orientation rather than defensiveness, while maintaining respectful relationships.",
    scenario:
      "As part of a 360-degree feedback exercise at your company, you receive a summary of peer feedback. Several colleagues note: 'Sometimes misses self-imposed deadlines', 'Starts projects enthusiastically but follow-through can be inconsistent', and 'Great ideas but the final execution sometimes needs a push.' These patterns are consistent with lower Conscientiousness in the Big Five model.",
    instructions:
      "Respond to this feedback. Address: how you interpret the feedback in terms of the OCEAN model and what it tells you about your work patterns (self-awareness), what specific, actionable changes you would make to your work habits (growth plan), and how these changes would show up concretely in your daily work or team interactions (workplace application).",
    estimateMinutes: 20,
    rubric: [
      { criterion: "self_awareness", weight: 40, descriptor: "Accurately interprets the feedback through the OCEAN lens without being defensive or dismissive." },
      { criterion: "growth_plan", weight: 35, descriptor: "Proposes specific, realistic habit changes (not vague intentions)." },
      { criterion: "workplace_application", weight: 25, descriptor: "Connects the changes to observable, day-to-day behaviours." },
    ],
    fewShot: [
      anchor(
        "I disagree with this feedback. I always meet external deadlines even if some personal ones slip. The OCEAN model is just a generalisation and does not reflect my real work quality.",
        27,
        "The response is entirely defensive, dismisses the feedback without reflection, and shows no growth orientation. Self-awareness is absent.",
      ),
      anchor(
        "Self-awareness: The feedback points to the Conscientiousness dimension of the OCEAN model — specifically, my tendency to underestimate the time follow-through takes after the initial burst of energy. I recognise this pattern: I am strongest in ideation and initiation, but execution consistency is a genuine development area. Growth plan: I will introduce three concrete habits — (1) breaking projects into weekly milestones at the start, not just a final deadline; (2) a Friday 15-minute review to check what was promised vs delivered that week; (3) sharing my milestone plan with my manager or a peer to create light external accountability. Workplace application: my colleagues should see a shift within one month: fewer items slipping from my commitments list, and clearer, earlier communication if I need to renegotiate a self-set deadline. I will also ask for a brief check-in after 60 days to see if the pattern has visibly improved.",
        91,
        "Clear, non-defensive interpretation through the OCEAN lens; three specific, actionable habit changes; and observable workplace behavioural shifts with a built-in accountability mechanism.",
      ),
    ],
  }),
  mod({
    code: "M15",
    title: "Professional Resilience & Wellbeing at Work",
    titleAr: "المرونة المهنية والرفاهية في بيئة العمل",
    dimension: "core_professionalism",
    level: "L1-B",
    framework: "Occupational resilience (Challenge Appraisal, Social Support, Recovery)",
    focus: "Maintaining performance and wellbeing under sustained work pressure.",
    saudiContext:
      "Saudi workplaces often involve ambitious Vision 2030 delivery timelines and long project cycles. Graduates who can manage stress constructively and support team wellbeing are consistently rated as high-potential hires by Saudi employers.",
    scenario:
      "You have been working on a high-priority project for eight weeks. The deadline was extended twice, a key team member resigned, and you are now covering their tasks in addition to your own. Your manager has just told you the client expects a final deliverable in five days. You feel mentally exhausted and notice that two colleagues seem similarly drained.",
    instructions:
      "1. Describe two concrete actions you would take to protect the quality of your own work over the next five days. 2. Explain how you would support your two colleagues without adding to your own burden. 3. After the deadline, what one recovery practice would you recommend to the team and why?",
    estimateMinutes: 12,
    rubric: [
      { criterion: "self_regulation", weight: 40, descriptor: "Names specific, realistic personal strategies (time-boxing, sleep hygiene, priority triage) rather than generic advice. Avoids 'just work harder' framing." },
      { criterion: "peer_support", weight: 35, descriptor: "Proposes bounded, sustainable support (check-ins, task micro-delegation) that does not increase their own overload. Shows empathy without codependency." },
      { criterion: "recovery_insight", weight: 25, descriptor: "Suggests an evidence-anchored recovery practice (structured debrief, planned rest day, retrospective) with a clear rationale tied to sustained performance." },
    ],
    fewShot: [
      anchor(
        "I would just push through and get it done. That is what professionalism means. For my colleagues I would tell them to focus and not complain. After the deadline we can relax.",
        22,
        "Response shows no self-regulation strategy, dismisses peer wellbeing, and offers no meaningful recovery practice. Framing 'just push through' is counterproductive and does not demonstrate professional resilience.",
      ),
      anchor(
        "To protect my work quality I would triage tasks into must-complete and can-defer, then time-box each must-complete item to avoid decision fatigue — I know my concentration degrades after three hours of deep work without a break, so I would schedule two 90-minute focus blocks and one shorter block each day, with hard stops. For colleagues, I would spend ten minutes with each one at the start of the day to identify their single biggest blocker, offer to take one specific, bounded task off each person if I genuinely have capacity, and explicitly normalise asking for help. I would not take on open-ended support that creates a second deadline for me. After the project, I would propose a structured one-hour team retrospective — not to assign blame, but to name what drained us and agree one change for the next sprint. Research on occupational recovery consistently shows that psychological detachment from work combined with a structured sense-making conversation reduces prolonged stress more effectively than unplanned time off.",
        88,
        "Response demonstrates concrete self-regulation (time-boxing, focus blocks, cognitive load awareness), bounded peer support with a clear limit on personal overhead, and an evidence-anchored recovery intervention with a cited rationale. Tone is professional, Saudi-context-appropriate (collective framing), and avoids martyrdom or dismissiveness.",
      ),
    ],
  }),
  // ── Business & Digital Literacy (20%) ───────────────────────────────────────
  mod({
    code: "M16",
    title: "Project Management Fundamentals",
    titleAr: "أساسيات إدارة المشاريع",
    dimension: "business_digital",
    level: "L2",
    framework: "Agile vs Waterfall (Agile Manifesto, Scrum)",
    focus: "Methodology selection and justification.",
    saudiContext:
      "A sophisticated candidate reads soft signals; an 'Inshallah' on a deadline may signal a soft refusal that calls for a face-saving follow-up rather than escalation.",
    scenario:
      "A startup, QuickPlate, wants to create a new mobile app. The market is competitive and user preferences change quickly. They want a basic version in 3 months and then iterate based on feedback.",
    instructions: "1. Which methodology is appropriate: Agile or Waterfall? 2. Justify your choice in 2 to 3 sentences.",
    estimateMinutes: 10,
    rubric: [
      { criterion: "methodology_choice", weight: 40, descriptor: "Agile = 40 pts; Waterfall = 0 pts.", gate: true },
      { criterion: "justification_quality", weight: 60, descriptor: "Looks for iteration, user feedback, uncertainty." },
    ],
    fewShot: [
      anchor(
        "Waterfall. It is more organised because you plan everything up front, so the team knows exactly what to build over the three months.",
        35,
        "Waterfall is the wrong fit for fast-changing requirements and an MVP-then-iterate brief. The justification is coherent but argues for the wrong approach and ignores iteration.",
      ),
      anchor(
        "Agile (Scrum). The market is competitive and preferences change quickly, so requirements are uncertain; Agile lets the team ship a basic version, gather user feedback, and iterate in short sprints rather than locking scope up front. Waterfall would force big decisions before we have real user data. The 3-month MVP then iterate goal is essentially an Agile/MVP approach by definition.",
        92,
        "Correct choice with a justification that hits the key markers: iteration, user feedback, and uncertainty, plus a sound contrast with Waterfall.",
      ),
    ],
  }),
  // ── Level 2 additions (M17, M20) ──────────────────────────────────────────
  mod({
    code: "M17",
    title: "Data Literacy & Chart Interpretation",
    titleAr: "محو الأمية البيانية وتفسير الرسوم البيانية",
    dimension: "business_digital",
    level: "L2",
    framework: "Data synthesis + face-saving framing",
    focus: "Reading a business chart and communicating insight diplomatically to a non-technical manager.",
    saudiContext:
      "Presenting negative findings should be framed as optimisation opportunities; data should support, not embarrass, the decision-maker.",
    scenario:
      "You are presenting at a weekly business review. The slide shows a bar chart comparing website traffic over 6 months. The chart has two trend lines: one for mobile traffic (declining 15%) and one for desktop traffic (growing 8%). Your manager, who is not data-literate, asks: 'What does this chart tell us and what should we do?'",
    instructions:
      "Write your response to the manager. Address: what the chart shows, the key insight or business implication of the two trends, and how you would communicate the recommended action diplomatically.",
    estimateMinutes: 20,
    rubric: [
      { criterion: "chart_reading", weight: 35, descriptor: "Accurately describes both trend lines and their direction/magnitude." },
      { criterion: "insight_extraction", weight: 35, descriptor: "Identifies the business implication of the diverging trends (mobile vs desktop shift)." },
      { criterion: "communication", weight: 30, descriptor: "Frames the recommended action diplomatically, treating the findings as an optimisation opportunity." },
    ],
    fewShot: [
      anchor(
        "The chart shows mobile is going down and desktop is going up. We should fix the mobile site.",
        25,
        "The chart reading is partially correct but superficial — it states the direction without quantifying the trends or explaining what they mean for the business. The recommendation is blunt with no diplomatic framing or context for the manager.",
      ),
      anchor(
        "The chart tracks two audience segments over the past six months. Mobile traffic has declined by 15%, while desktop traffic has grown by 8%, so overall the desktop channel is gaining relative share. The key insight is that our current mobile experience may not be meeting user expectations at a time when most digital growth is mobile-first — this is an optimisation opportunity worth acting on before the gap widens. I would suggest we treat this as a prioritisation signal: commission a quick UX review of the mobile journey this quarter, while continuing to invest in what is clearly working on desktop. This positions us to recapture the mobile audience without disrupting a channel that is performing well.",
        88,
        "Both trend lines are read accurately with magnitudes stated; the business implication — a mobile experience gap at odds with mobile-first growth — is clearly articulated; and the recommendation is framed as an opportunity with a concrete, phased action plan that protects the manager's standing.",
      ),
    ],
  }),
  mod({
    code: "M18",
    title: "AI in the Workplace",
    titleAr: "الذكاء الاصطناعي في بيئة العمل",
    dimension: "business_digital",
    level: "L2",
    framework: "Generative-AI principles and data ethics",
    focus: "Responsible and effective use of generative AI at work.",
    saudiContext:
      "Default AI output is blunt and Western in tone; a strong candidate prompts for deference to hierarchy and collective benefit, and avoids sending personal data to foreign AI servers, consistent with the Saudi PDPL and SDAIA AI Ethics 2.0.",
    scenario:
      "Your manager asks you to draft a client-facing email and summarise a confidential internal report using generative AI. Organisation policy requires using the approved internal AI tool for work content; under the Saudi Personal Data Protection Law (PDPL), personal or confidential data must not be sent to foreign AI servers. The tools are fast but sometimes produce confident errors.",
    instructions:
      "1. Name one capability and one limitation of generative AI relevant here. 2. State the key precaution before sending the AI-drafted email and before pasting the confidential report — explicitly address the approved internal AI tool and the PDPL rule against sending personal data to foreign AI servers. 3. Briefly, how would you prompt the tool so the email tone fits a hierarchical, relationship-sensitive client?",
    estimateMinutes: 15,
    rubric: [
      { criterion: "ai_literacy", weight: 35, descriptor: "Identifies a real capability and a real limitation (e.g. hallucination)." },
      { criterion: "risk_data_privacy", weight: 35, descriptor: "Fact-checks output; does not paste confidential/personal data into an external tool." },
      { criterion: "prompt_quality", weight: 30, descriptor: "Prompts for a respectful, hierarchy-aware, collective-benefit tone." },
    ],
    fewShot: [
      anchor(
        "AI is great, it can write the email and summarise the report instantly. I would just use whatever it gives me, it is usually right.",
        35,
        "The answer treats AI output as reliable, names no limitation, and would paste a confidential report into an external tool with no fact-check. It misses both the hallucination and data-privacy risks.",
      ),
      anchor(
        "Capability: AI drafts and summarises quickly. Limitation: it hallucinates, producing confident but wrong statements, so its output is a draft, not a source of truth. Precaution: fact-check the email against the real facts before sending; do not paste the confidential report into an external or foreign tool — summarise only non-sensitive points, or use the approved internal AI tool, since PDPL forbids sending personal data to foreign AI servers. Prompt: 'Draft a polite, respectful email for a senior client; emphasise collective benefit and defer to their judgement; avoid blunt or demanding phrasing.'",
        90,
        "Correctly separates capability from the hallucination limitation, protects confidential data under PDPL / approved-internal-tool policy, insists on fact-checking, and prompts for a hierarchy-aware, face-saving tone.",
      ),
    ],
  }),
  mod({
    code: "M19",
    title: "Cybersecurity Awareness",
    titleAr: "الوعي بالأمن السيبراني",
    dimension: "business_digital",
    level: "L2",
    framework: "Cialdini's psychology of influence (social engineering)",
    focus: "Phishing and social-engineering detection.",
    saudiContext:
      "Authority-based pressure is especially potent in hierarchical cultures; verification up the chain must be done respectfully but firmly, without simply complying.",
    scenario:
      "Scenario 3, the CEO's unusual request. You get an email from jane.doe.ceo@gmail.com asking you to buy gift cards urgently because she is in a meeting.",
    instructions: "Is this safe or phishing? Explain the red flags.",
    estimateMinutes: 10,
    rubric: [
      { criterion: "identification", weight: 50, descriptor: "Must identify the message as phishing (pass/fail gate).", gate: true },
      { criterion: "reasoning", weight: 50, descriptor: "Must cite external domain + urgency + financial request, and a verification step." },
    ],
    fewShot: [
      anchor(
        "It looks like it is from the CEO and it is urgent, so I would buy the gift cards quickly to help and confirm with her afterwards.",
        15,
        "The candidate fails the core gate by treating a textbook business-email-compromise scam as legitimate. Urgency and authority are read as reasons to comply rather than as red flags.",
      ),
      anchor(
        "Phishing. Red flags: the request comes from an external free domain (gmail.com), not the CEO's corporate address; it combines authority with urgency (Cialdini) to bypass scrutiny; it asks for gift cards, the classic untraceable business-email-compromise pattern; and it pushes for quick, private action. Action: do not buy or reply with codes; verify through a known channel (call or message the CEO directly) and report to IT/security.",
        96,
        "Correct identification and a complete set of red flags (domain, authority plus urgency, gift-card pattern), with the right action: verify out-of-band and report.",
      ),
    ],
  }),

  mod({
    code: "M20",
    title: "Business Fundamentals",
    titleAr: "أساسيات الأعمال",
    dimension: "business_digital",
    level: "L2",
    framework: "SWOT analysis + ROI modelling",
    focus: "Evaluating a business decision using SWOT and simple ROI reasoning.",
    saudiContext:
      "Business analysis in the Saudi context should connect decisions to the Vision 2030 framework where relevant; digital transformation and local market understanding are valued.",
    scenario:
      "A small Saudi retail business is considering doubling its social media advertising budget from SAR 10,000 to SAR 20,000 per month. Last month's SAR 10,000 campaign generated SAR 45,000 in attributable sales. The owner asks you to evaluate whether the increase is worth it.",
    instructions:
      "Provide a brief business analysis. Address: a SWOT analysis of the advertising expansion decision, a simple ROI calculation and interpretation, and your recommendation with reasoning.",
    estimateMinutes: 20,
    rubric: [
      { criterion: "swot_quality", weight: 40, descriptor: "Covers at least two of the four SWOT quadrants with relevant, specific points for this decision." },
      { criterion: "roi_logic", weight: 40, descriptor: "Calculates the current ROI correctly and applies the logic to evaluate the proposed doubling." },
      { criterion: "recommendation", weight: 20, descriptor: "Gives a clear, reasoned recommendation that integrates the SWOT and ROI findings." },
    ],
    fewShot: [
      anchor(
        "The business should double the budget because more advertising means more sales. The current campaign is working so spending more will bring more customers.",
        30,
        "There is no SWOT analysis and no ROI calculation. The reasoning is anecdotal — assuming linear returns without evidence — and ignores potential weaknesses, threats, or capacity constraints. The recommendation lacks analytical grounding.",
      ),
      anchor(
        "SWOT: Strengths — the current campaign has a proven ROI of 350% ((45,000 − 10,000) / 10,000 × 100), demonstrating that social media works for this business. Opportunities — doubling spend could reach a larger addressable audience while the market is growing and competitors may be underinvesting. Weaknesses — the business may lack the operational capacity (inventory, staff) to fulfil a sudden doubling in demand, and returns may not scale linearly if the audience is already partially saturated. Threats — the Saudi digital advertising market is competitive; higher spend may inflate CPCs without a proportional sales lift. ROI analysis: current ROI = (SAR 45,000 − SAR 10,000) / SAR 10,000 = 350%. To break even on the additional SAR 10,000, incremental attributable sales would need to exceed SAR 10,000 — achievable, but only if marginal audiences convert at a similar rate. The risk is diminishing returns. Recommendation: proceed with a phased test — increase to SAR 15,000 for one month, measure the incremental sales lift, then decide on the full doubling with real data. This limits downside while capturing the upside if returns hold.",
        89,
        "All four SWOT quadrants are addressed with specific, relevant points; the ROI is calculated correctly and applied to the marginal investment decision; and the recommendation is evidence-based, risk-aware, and actionable with a phased test approach.",
      ),
    ],
  }),

  // ══ Level 3 — Job-Specific Tracks (M21–M38) ══════════════════════════════

  // ── Track A — Digital Marketing ────────────────────────────────────────────
  mod({
    code: "M21",
    title: "SEO/SEA Fundamentals",
    titleAr: "أساسيات تحسين محركات البحث والإعلانات المدفوعة",
    dimension: "job_fit",
    level: "L3-A",
    specialization: "Digital Marketing",
    framework: "Search intent models",
    focus: "Improving organic search performance for a low-CTR landing page.",
    saudiContext: "Arabic keyword variants and localised intent signals matter; include bilingual keyword research.",
    scenario: "You manage a landing page for a Saudi e-commerce company. The page ranks on page 2 for 'buy running shoes online in Riyadh' — 1,200 impressions/month but only 15 clicks (CTR 1.25%). You have been asked to improve organic performance.",
    instructions: "Describe your SEO strategy: keyword refinement, on-page changes, and the metric you would track to measure success.",
    estimateMinutes: 20,
    rubric: [
      { criterion: "keyword_strategy", weight: 35, descriptor: "Identifies long-tail and localised keyword variants; explains search intent alignment." },
      { criterion: "on_page_seo", weight: 35, descriptor: "Covers title tag, meta description, H1, content depth, and internal linking." },
      { criterion: "measurement", weight: 30, descriptor: "Names a specific metric (CTR, ranking position, organic sessions) and a timeframe." },
    ],
    fewShot: [
      anchor(
        "I would add more keywords to the page and buy some ads to get more traffic.",
        28,
        "No distinction between organic SEO and paid ads; no keyword research methodology; no on-page changes; no measurement plan. The response conflates SEO with SEM and offers no actionable strategy.",
      ),
      anchor(
        "Keyword strategy: I would use Google Search Console to identify the queries driving those 1,200 impressions, then expand to related long-tail variants like 'best running shoes for men Riyadh' and 'buy Nike running shoes Saudi Arabia'. I'd also research Arabic equivalents. On-page: rewrite the title tag to include the primary keyword near the front, update the meta description to include a call to action, ensure the H1 matches search intent, add 300 words of relevant body content addressing common buyer questions, and build 2–3 internal links from high-traffic pages. Measurement: track CTR in Search Console and organic sessions in GA4 over 60 days; target CTR above 3% as the success threshold.",
        89,
        "Thorough keyword research methodology, bilingual awareness, specific on-page changes across title/meta/H1/content/links, and a concrete measurement plan with a defined success threshold.",
      ),
    ],
  }),
  mod({
    code: "M22",
    title: "Google Analytics Analysis",
    titleAr: "تحليل بيانات جوجل أناليتيكس",
    dimension: "job_fit",
    level: "L3-A",
    specialization: "Digital Marketing",
    framework: "Performance marketing KPIs",
    focus: "Investigating a sudden one-day traffic spike in GA4.",
    saudiContext: "Check for news or influencer mentions in Arabic channels as a likely cause for Saudi market spikes.",
    scenario: "Monday morning: GA4 shows a 340% traffic spike last Thursday. Organic search +800%, direct traffic flat, paid flat. The spike lasted one day.",
    instructions: "Describe how you would investigate and what you would recommend: how you read the data, likely causes and confirmation steps, recommended action.",
    estimateMinutes: 20,
    rubric: [
      { criterion: "data_reading", weight: 40, descriptor: "Accurately interprets the GA4 data: organic spike, one-day duration, flat other channels." },
      { criterion: "source_analysis", weight: 35, descriptor: "Identifies plausible causes (viral content, backlink, news coverage) and explains how to confirm via Search Console or referral data." },
      { criterion: "recommendation", weight: 25, descriptor: "Proposes a concrete next action based on the identified cause." },
    ],
    fewShot: [
      anchor(
        "Traffic went up a lot on Thursday which is great. We should keep doing what we did.",
        27,
        "No investigation is proposed; the candidate does not attempt to identify the cause. 'Keep doing what we did' is not actionable when the cause is unknown. No use of GA4 or Search Console tools.",
      ),
      anchor(
        "Data reading: organic search drove the spike (+800%) while direct and paid were flat, pointing to an external organic source rather than a campaign. It lasted one day, suggesting a time-bound event rather than a ranking change. Source analysis: I would check Google Search Console to see if a specific query or page drove the traffic. I'd also check the Referrals report for backlinks and search news/social media for the site name or a featured product on that date. A Saudi influencer mention or a news article citing the site are the most likely causes for a one-day organic spike. Recommendation: if a backlink or mention is found, reach out to the source to explore ongoing collaboration; update or republish the landing page that received the traffic to capture future searchers. If no source is identified, monitor for recurrence.",
        90,
        "Correctly reads the data pattern (organic-only, one-day), proposes a multi-tool investigation (Search Console + Referrals + social), names plausible Saudi-context causes, and gives a concrete recommendation tied to the finding.",
      ),
    ],
  }),
  mod({
    code: "M23",
    title: "Product Launch Case Study",
    titleAr: "دراسة حالة إطلاق منتج",
    dimension: "job_fit",
    level: "L3-A",
    specialization: "Digital Marketing",
    framework: "Marketing mix 4P/7P",
    focus: "Writing a 90-day digital launch plan with budget allocation and KPIs.",
    saudiContext: "Include Saudi-specific channels (Snapchat, X/Twitter are dominant in KSA) and localised influencer strategy.",
    scenario: "A Saudi fintech startup is launching a mobile payments app for small business owners. They have a SAR 100,000 marketing budget and want to acquire 5,000 active users in 90 days.",
    instructions: "Write the 90-day digital marketing launch plan: channel mix and budget allocation, high-level timeline with key milestones, three KPIs you would track.",
    estimateMinutes: 25,
    rubric: [
      { criterion: "channel_mix", weight: 35, descriptor: "Allocates budget across relevant channels with justification; includes Saudi-dominant platforms." },
      { criterion: "timeline", weight: 30, descriptor: "Phases the 90 days into logical stages (pre-launch, launch, optimise) with concrete milestones." },
      { criterion: "kpi_setting", weight: 35, descriptor: "Names three specific, measurable KPIs linked to the 5,000 active user goal." },
    ],
    fewShot: [
      anchor(
        "Use social media and Google Ads to reach people. Spend the budget on ads. Track downloads.",
        29,
        "No channel breakdown, no budget allocation, no timeline, and only one vague metric (downloads). The response shows no understanding of launch planning or performance marketing.",
      ),
      anchor(
        "Channel mix: Snapchat and Instagram for awareness (SAR 35,000 — dominant platforms for SME owners in KSA), Google UAC for app installs (SAR 25,000), micro-influencer partnerships in the SME/finance space (SAR 20,000), and content + WhatsApp Business outreach (SAR 20,000). Timeline: Days 1–14 pre-launch — tease campaign, influencer seeding, App Store optimisation; Days 15–45 launch sprint — full paid activation, PR push; Days 46–90 optimisation — cut underperforming channels, scale winners, referral programme. KPIs: (1) Cost per Activated User target SAR 20 (SAR 100K ÷ 5,000), (2) D7 retention rate target 40%, (3) App store rating target 4.2+.",
        90,
        "Specific channel allocation with Saudi platform awareness, a phased timeline with named milestones, and three concrete KPIs directly tied to the 5,000 active user goal — including a cost-per-user target derived from the budget.",
      ),
    ],
  }),

  // ── Track B — Business Development ─────────────────────────────────────────
  mod({
    code: "M24",
    title: "The Sales Cycle",
    titleAr: "دورة المبيعات — إطار BANT",
    dimension: "job_fit",
    level: "L3-B",
    specialization: "Business Development",
    framework: "BANT framework (Budget, Authority, Need, Timeline)",
    focus: "Qualifying an inbound lead using the four BANT dimensions.",
    saudiContext: "In the Saudi B2B context, establishing personal rapport before qualification questions is important; abrupt BANT interrogation can feel transactional.",
    scenario: "An inbound lead calls your SaaS company. She is a department head at a mid-sized Saudi company, frustrated with their current CRM, looking at a few options. You have 15 minutes on the call.",
    instructions: "Write what you would ask or say to qualify the lead using BANT: Budget, Authority, Need, Timeline.",
    estimateMinutes: 20,
    rubric: [
      { criterion: "budget_probe", weight: 25, descriptor: "Asks about budget range or current spend without being blunt; anchors the conversation." },
      { criterion: "authority_check", weight: 25, descriptor: "Identifies whether she is the decision-maker or needs to involve others." },
      { criterion: "need_discovery", weight: 25, descriptor: "Uncovers the specific pain with the current CRM using open questions." },
      { criterion: "timeline_probe", weight: 25, descriptor: "Establishes when they want to be live with a new solution." },
    ],
    fewShot: [
      anchor(
        "I would ask if they have budget and when they want to start.",
        30,
        "Only two of four BANT dimensions are touched and both are asked bluntly. No rapport-building, no need discovery, and no authority check. Asking about budget immediately without context is likely to put the lead off.",
      ),
      anchor(
        "I'd open by thanking her for reaching out and asking a quick open question: 'What's been the biggest frustration with your current CRM?' — that surfaces the need naturally. Then: Authority: 'When a decision like this moves forward, who else is typically involved in the sign-off?' Budget: 'Just so I can point you to the right plan, do you have a ballpark in mind — are we thinking more in the SAR 500-1,000/month range or higher?' Need: follow up on her frustration with specific probes: 'Is it the reporting, the user adoption, or something else?' Timeline: 'If this turned out to be a good fit, what kind of timeline would you be working toward?' — ending with next steps: 'I'd love to schedule a 30-minute demo with the right people from your side — does next week work?'",
        91,
        "All four BANT dimensions are covered with natural, non-interrogative phrasing; need is surfaced first before budget; authority is probed diplomatically; and the call ends with a clear next step.",
      ),
    ],
  }),
  mod({
    code: "M25",
    title: "CRM Management Simulation",
    titleAr: "محاكاة إدارة علاقات العملاء",
    dimension: "job_fit",
    level: "L3-B",
    specialization: "Business Development",
    framework: "Sales funnel / pipeline management",
    focus: "Logging a discovery call outcome and managing the follow-up in a CRM pipeline.",
    saudiContext: "In Saudi B2B sales, a value-add touchpoint (a useful article, a Ramadan greeting) between call and follow-up is effective and culturally expected.",
    scenario: "You just completed a discovery call with Ahmed Al-Rasheed at Horizon Tech. He is interested but said 'we need to discuss budget internally — call me back in two weeks'. Your pipeline stages: Prospect, Qualified, Proposal, Negotiation, Closed-Won/Lost.",
    instructions: "Describe what you would log in the CRM and what follow-up actions to schedule: information and deal stage update, timing and nature of follow-up, pipeline stage decision.",
    estimateMinutes: 20,
    rubric: [
      { criterion: "data_entry_quality", weight: 40, descriptor: "Logs call outcome, contact details, pain points surfaced, budget status, and next action with a date." },
      { criterion: "follow_up_logic", weight: 35, descriptor: "Plans a value-add touchpoint before the two-week call and a confirmation call on the agreed date." },
      { criterion: "pipeline_update", weight: 25, descriptor: "Moves the deal to Qualified with a note on the internal budget discussion; does not advance prematurely to Proposal." },
    ],
    fewShot: [
      anchor(
        "I would move the deal to Qualified and call him back in two weeks.",
        28,
        "Minimal CRM logging — no call notes, no pain points, no contact details. The follow-up plan is only the mandatory callback with no interim touchpoint. Pipeline update is correct but undocumented.",
      ),
      anchor(
        "CRM log: Contact — Ahmed Al-Rasheed, Horizon Tech, department head. Call outcome: warm, interested, key pain = reporting limitations in current CRM. Budget: under internal review, decision in ~2 weeks. Next action: follow-up call 14 days from today. Stage: move to Qualified — need confirmed, authority identified, budget in discussion. Follow-up plan: Day 5 — send a short case study relevant to their industry with a personal note ('Thought this might be useful while you review internally'). Day 14 — call as agreed, open with 'How did the budget discussion go?' not a pitch. Pipeline: set to Qualified with a note 'Budget approval pending — do not move to Proposal until confirmed.' Flag for review if no response by Day 16.",
        92,
        "Detailed, structured CRM entry covering all key fields; a two-touchpoint follow-up plan with a value-add in week 1 and a well-framed call in week 2; correct pipeline stage with a guard against premature advancement.",
      ),
    ],
  }),
  mod({
    code: "M26",
    title: "Negotiation Role-Play",
    titleAr: "تمثيل دور التفاوض",
    dimension: "job_fit",
    level: "L3-B",
    specialization: "Business Development",
    framework: "Value-based selling",
    focus: "Handling a price objection from an existing client using value reframing.",
    saudiContext: "Relationships are paramount in Saudi B2B; a long-term framing ('protecting our partnership') lands better than purely transactional counter-offers.",
    scenario: "You are in a renewal negotiation with an existing Saudi logistics client. They want a 20% price reduction, citing a cheaper competitor quote. Your product demonstrably saves them SAR 150,000/year in operational costs. You cannot discount more than 10%.",
    instructions: "Describe your negotiation approach: value reframing, response to the price objection, closing strategy.",
    estimateMinutes: 20,
    rubric: [
      { criterion: "value_framing", weight: 40, descriptor: "Anchors the conversation on the SAR 150K savings ROI before discussing price." },
      { criterion: "objection_handling", weight: 35, descriptor: "Acknowledges the competitor quote without dismissing it; reframes the comparison on total cost of ownership." },
      { criterion: "close_strategy", weight: 25, descriptor: "Proposes a realistic path to agreement within the 10% discount ceiling." },
    ],
    fewShot: [
      anchor(
        "I would offer them a 10% discount and hope they accept.",
        30,
        "Immediately concedes the maximum discount without any value reframing or objection handling. This leaves no room to manoeuvre and signals the original price was inflated. No close strategy beyond the discount offer.",
      ),
      anchor(
        "Value framing: I'd open by anchoring on ROI — 'Before we talk numbers, I want to make sure we're comparing the right things. Last year our platform saved Horizon Logistics SAR 150,000 in operational costs — that's a 5x return on the current contract value. A 20% reduction would save you SAR 30,000 on paper, but it's worth asking what the competitor's solution would cost you in implementation, migration, and lost efficiency.' Objection handling: 'I respect that you've had a competitive offer — that's smart procurement. What I'd ask is: do we know the competitor's total cost of ownership over 24 months, including onboarding and any operational disruption?' Close strategy: 'What I can do is a 7% reduction on renewal combined with a 24-month term, which locks in your rate and gives me the forecast stability to justify it internally. Does that protect the partnership and give you something to bring back to finance?'",
        91,
        "Strong ROI anchor before any price discussion, a sophisticated total-cost-of-ownership reframe for the competitor comparison, and a close that offers a modest discount in exchange for a longer term — protecting both margin and the relationship.",
      ),
    ],
  }),

  // ── Track C — Project Management ───────────────────────────────────────────
  mod({
    code: "M27",
    title: "Advanced Agile",
    titleAr: "أجايل المتقدم — إطار سكرم",
    dimension: "job_fit",
    level: "L3-C",
    specialization: "Project Management",
    framework: "Scrum framework + Agile Manifesto",
    focus: "Responding correctly to a mid-sprint scope change request from senior leadership.",
    saudiContext: "Hierarchy pressure is real; the Scrum Master must protect the team's sprint integrity while framing the refusal to senior management respectfully.",
    scenario: "Day 4 of a 2-week sprint. The team has completed 60% of the sprint backlog. The Product Owner rushes in: the CEO wants a high-priority new feature added to the current sprint.",
    instructions: "How do you respond? Address: what Agile principles say about mid-sprint scope changes, how you assess the impact on the team and sprint goal, and what you say to the Product Owner and CEO.",
    estimateMinutes: 20,
    rubric: [
      { criterion: "agile_principles", weight: 35, descriptor: "Cites the Agile principle of protecting the sprint; explains why mid-sprint additions undermine predictability." },
      { criterion: "sprint_impact_analysis", weight: 35, descriptor: "Assesses the velocity and sprint goal impact; distinguishes between the new feature's urgency and its sprint-readiness." },
      { criterion: "stakeholder_response", weight: 30, descriptor: "Crafts a respectful, solution-oriented response that defers the feature to the next sprint without dismissing the CEO's priority." },
    ],
    fewShot: [
      anchor(
        "I would add the feature to the sprint because the CEO wants it and we can't say no to the CEO.",
        29,
        "Capitulates to authority without any Agile reasoning. No impact assessment. No stakeholder framing. This is the exact anti-pattern Scrum is designed to prevent.",
      ),
      anchor(
        "Agile principles: the Agile Manifesto values responding to change, but mid-sprint scope additions undermine sprint integrity, team focus, and velocity predictability — Scrum specifically protects the sprint backlog from changes during execution. Sprint impact: adding a new feature at Day 4 with 60% done risks not completing either the original or the new item, ending the sprint with half-done work that delivers zero value. I would assess whether the new feature is truly urgent or just high-priority for the next cycle. Stakeholder response to PO and CEO: 'The team is 60% through a committed sprint and adding scope now risks delivering nothing completely. Here is what I propose: I can place this feature at the top of the backlog so it becomes Sprint 1 priority and ships in 10 days — is that timeline workable? If it is genuinely a production emergency, I can call an extraordinary backlog review, but we'd need to drop something of equal size from this sprint first.' This respects the CEO's priority while protecting the sprint and the team.",
        92,
        "Clear Agile principle citation, rigorous impact reasoning (half-done = zero delivered value), and a respectful, solution-oriented stakeholder response with a concrete alternative timeline.",
      ),
    ],
  }),
  mod({
    code: "M28",
    title: "PM Tool Simulation",
    titleAr: "محاكاة أداة إدارة المشاريع — المسار الحرج",
    dimension: "job_fit",
    level: "L3-C",
    specialization: "Project Management",
    framework: "Critical Path Method (CPM)",
    focus: "Identifying the critical path and project duration from a simple network diagram.",
    saudiContext: "Technical module; culturally neutral evaluation.",
    scenario: "A project has these activities: A takes 3 days. A must finish before B (2 days) and C (4 days) can start. Both B and C must finish before D (3 days) can start.",
    instructions: "Identify the critical path, state the minimum project duration in days, and define what 'float' means in this context.",
    estimateMinutes: 20,
    rubric: [
      { criterion: "cpm_identification", weight: 50, descriptor: "Correctly identifies A→C→D as the critical path (10 days); traces all paths.", gate: true },
      { criterion: "duration_calculation", weight: 30, descriptor: "States the correct minimum project duration: 10 days." },
      { criterion: "float_explanation", weight: 20, descriptor: "Defines float as the amount of time an activity can be delayed without delaying the project; states B has 2 days of float." },
    ],
    fewShot: [
      anchor(
        "The critical path is A-B-D which takes 8 days.",
        28,
        "Incorrect critical path — selects the shorter path (A-B-D = 8 days) instead of the longest (A-C-D = 10 days). The critical path is by definition the longest path, which determines the minimum project duration. No float explanation.",
      ),
      anchor(
        "Paths: A→B→D = 3+2+3 = 8 days. A→C→D = 3+4+3 = 10 days. Critical path: A→C→D = 10 days (the longest path, which sets the minimum project duration). Float: Activity B has 2 days of float — it can be delayed up to 2 days without pushing the project finish date. Float is the amount of time a non-critical activity can slip without causing a delay to the overall project completion. If any activity on the critical path (A, C, or D) is delayed, the project is delayed by the same amount.",
        96,
        "Both paths correctly calculated, critical path correctly identified as the longest (10 days), float correctly computed for B (2 days), and float concept clearly and accurately defined.",
      ),
    ],
  }),
  mod({
    code: "M29",
    title: "Crisis Management",
    titleAr: "إدارة الأزمات",
    dimension: "job_fit",
    level: "L3-C",
    specialization: "Project Management",
    framework: "Crisis communication matrix",
    focus: "Managing a supplier failure that threatens an imminent product launch.",
    saudiContext: "Escalation to leadership should be early, calm, and solution-oriented; presenting a plan alongside the problem is critical in a Saudi hierarchical context.",
    scenario: "Two weeks before a product launch, your primary supplier announces they cannot fulfil the component order due to a factory fire. No alternative suppliers are approved. A one-week delay is possible but incurs significant contract penalties.",
    instructions: "Write your crisis response plan covering: situation diagnosis, stakeholder communication plan, and your contingency plan.",
    estimateMinutes: 25,
    rubric: [
      { criterion: "crisis_diagnosis", weight: 30, descriptor: "Assesses the impact (scope, financial, contractual) before reacting; identifies the constraint (no approved alternatives)." },
      { criterion: "stakeholder_comms", weight: 40, descriptor: "Defines who is told what and when: internal leadership, client, and contract party; tone is solution-oriented not alarmist." },
      { criterion: "contingency_plan", weight: 30, descriptor: "Proposes a realistic path forward: emergency supplier approval, partial launch, contractual renegotiation." },
    ],
    fewShot: [
      anchor(
        "I would tell the team we have a problem and start looking for another supplier.",
        30,
        "No impact assessment, no structured communication plan, and only a vague action ('look for a supplier') with no timeline or process. Fails all three rubric criteria.",
      ),
      anchor(
        "Crisis diagnosis: immediate impact — launch delayed minimum 1 week, contract penalty triggered, no approved fallback. Constraint: no pre-qualified alternative. Priority actions in first 24 hours: (1) confirm delay duration with legal/contracts team, (2) activate emergency supplier qualification process. Stakeholder comms: Internal — brief leadership today with impact + options, not just the problem. Client — notify within 24 hours: 'We have identified a supply disruption; our contingency plan is underway and we will confirm revised timeline by [date].' Framing is proactive, not apologetic. Contracts — legal review of penalty clauses and force majeure applicability. Contingency plan: (1) fast-track approval of 2–3 alternative suppliers in parallel; (2) evaluate partial launch with available inventory if components allow a reduced-scope release; (3) negotiate penalty waiver or reduction with client given supplier force majeure; (4) implement dual-source policy post-crisis to prevent recurrence.",
        91,
        "Structured diagnosis before action, tiered stakeholder communication with specific framing for each audience, and a realistic multi-option contingency plan including contractual and supply-chain recovery steps.",
      ),
    ],
  }),

  // ── Track D — Data Analysis ─────────────────────────────────────────────────
  mod({
    code: "M30",
    title: "SQL & Statistics",
    titleAr: "لغة SQL والإحصاء",
    dimension: "job_fit",
    level: "L3-D",
    specialization: "Data Analysis",
    framework: "Relational algebra (SQL joins) + descriptive statistics",
    focus: "Choosing the correct SQL JOIN type to preserve all rows from the left table.",
    saudiContext: "Technical module; evaluation is culturally neutral.",
    scenario: "You have two tables: Customers and Orders. You want a list of ALL customers, including those who have never placed an order (order info should be NULL for those).",
    instructions: "Which SQL JOIN type should you use? Explain why.",
    estimateMinutes: 10,
    rubric: [
      { criterion: "correctness", weight: 50, descriptor: "Must select LEFT JOIN (or RIGHT JOIN depending on table order).", gate: true },
      { criterion: "explanation", weight: 50, descriptor: "Must explain that INNER JOIN would exclude customers with zero orders." },
    ],
    fewShot: [
      anchor(
        "Use an INNER JOIN on Customers and Orders so you match them up and get the list.",
        30,
        "INNER JOIN returns only matched rows, so it excludes exactly the customers the question asks for — those with no orders. The reasoning about matching is sound but applied to the wrong join type.",
      ),
      anchor(
        "LEFT JOIN (Customers LEFT JOIN Orders). A LEFT JOIN keeps every row from the left table (Customers) and fills the order columns with NULL where there is no match. INNER JOIN would drop customers who never ordered because it returns only matched rows. Example: SELECT c.*, o.* FROM Customers c LEFT JOIN Orders o ON c.id = o.customer_id;",
        96,
        "Correct join, a precise explanation of NULL-filling, the right contrast with INNER JOIN, and a working example query.",
      ),
    ],
  }),
  mod({
    code: "M31",
    title: "Spreadsheet Test",
    titleAr: "اختبار جداول البيانات",
    dimension: "job_fit",
    level: "L3-D",
    specialization: "Data Analysis",
    framework: "Tabular data modelling",
    focus: "Writing a lookup formula to join two tables in a spreadsheet.",
    saudiContext: "Technical module; evaluation is culturally neutral.",
    scenario: "Table 1 (Sheet1) columns: Order_ID, Customer_ID, Amount. Table 2 (Sheet2) columns: Customer_ID, Customer_Name, Region. You need to add Customer_Name to Table 1.",
    instructions: "Write the formula you would use in a new column in Table 1, justify why you chose it, and name one alternative method.",
    estimateMinutes: 20,
    rubric: [
      { criterion: "formula_correctness", weight: 50, descriptor: "Writes a syntactically correct VLOOKUP or INDEX-MATCH that returns Customer_Name from Sheet2." },
      { criterion: "approach_justification", weight: 30, descriptor: "Explains why the formula works — exact match, column index, lookup column." },
      { criterion: "alternative_awareness", weight: 20, descriptor: "Names a valid alternative: INDEX-MATCH, XLOOKUP, or a Power Query merge." },
    ],
    fewShot: [
      anchor(
        "Use VLOOKUP on Customer_ID to get the name.",
        28,
        "Correct direction but no formula syntax, no justification of the parameters (column index, exact match), and no alternative. Without the actual formula this is not actionable.",
      ),
      anchor(
        "Formula: =VLOOKUP(B2, Sheet2!$A:$B, 2, FALSE). B2 is the Customer_ID to look up; Sheet2!$A:$B is the lookup range covering Customer_ID and Customer_Name; 2 returns the second column (Customer_Name); FALSE forces an exact match. Justification: VLOOKUP scans the first column of the lookup range for the Customer_ID and returns the value from column 2 — this correctly joins the two tables. Alternative: INDEX-MATCH is more robust because it is not column-order dependent: =INDEX(Sheet2!$B:$B, MATCH(B2, Sheet2!$A:$A, 0)). XLOOKUP is also valid in Excel 365.",
        93,
        "Correct formula with full syntax, clear parameter explanation, correct exact-match flag, and two valid alternatives with reasons.",
      ),
    ],
  }),
  mod({
    code: "M32",
    title: "Data Mini-Project",
    titleAr: "مشروع بيانات مصغّر",
    dimension: "job_fit",
    level: "L3-D",
    specialization: "Data Analysis",
    framework: "Data-Driven Decision Making (DDDM)",
    focus: "Outlining a structured three-step analysis of a 30-day sales dataset.",
    saudiContext: "Connect the insight to a business action that aligns with the manager's goals; framing findings as optimisation opportunities is more effective than presenting problems.",
    scenario: "A retail manager gives you 30 days of daily sales data: Date, Store_ID, Product_Category, Units_Sold, Revenue, Promotion_Flag. She asks: 'Tell me something actionable from this data.'",
    instructions: "Outline a three-step analysis: define the business question, describe your data cleaning and exploration approach, and state one specific actionable insight you would likely find.",
    estimateMinutes: 25,
    rubric: [
      { criterion: "question_definition", weight: 30, descriptor: "States a clear, testable business question that the dataset can answer." },
      { criterion: "methodology", weight: 40, descriptor: "Describes realistic data cleaning steps and exploratory analysis techniques." },
      { criterion: "insight_quality", weight: 30, descriptor: "Derives one specific, actionable insight tied to the dataset columns; frames it as a recommendation." },
    ],
    fewShot: [
      anchor(
        "I would look at the data and find the best-selling product.",
        29,
        "No defined question, no methodology, and 'best-selling product' is a surface observation rather than an actionable insight. The dataset's Promotion_Flag and multi-store structure are ignored entirely.",
      ),
      anchor(
        "Question: Do promotions generate a positive ROI — i.e., do promoted days produce enough incremental revenue to justify the discount cost? Methodology: (1) Check for missing values in Revenue and Units_Sold columns; standardise Date format. (2) Create a binary flag for Promotion_Flag if not already present. (3) Group by Store_ID × Promotion_Flag and compute average daily revenue and units sold for each combination. (4) Compare promoted vs non-promoted days per store and per category using a simple mean comparison or bar chart. Insight: Promotions in Category A drive +40% revenue but only +8% units, suggesting customers trade up rather than buy more — recommendation: shift promotions from broad discounts to bundle deals that increase basket size rather than just trade-up in Category A.",
        91,
        "A clear, testable business question; realistic cleaning and grouping methodology using the dataset's own columns; and a specific, nuanced insight (revenue vs units uplift divergence) that leads to a concrete recommendation.",
      ),
    ],
  }),

  // ── Track E — Human Resources ──────────────────────────────────────────────
  mod({
    code: "M33",
    title: "Labor Law Fundamentals (KSA)",
    titleAr: "أساسيات نظام العمل السعودي",
    dimension: "job_fit",
    level: "L3-E",
    specialization: "Human Resources",
    framework: "Saudi Labor Law: Nitaqat, Qiwa, GOSI, EOSB",
    focus: "Advising on Saudization compliance obligations when hiring expatriates.",
    saudiContext: "Nitaqat classifications change frequently; advice must note the need to verify current thresholds with HRSD. Qiwa contract authentication is mandatory for all employment contracts.",
    scenario: "A Saudi company currently has 50 employees (40 Saudi nationals, 10 expatriates). They want to hire 10 more expatriate workers. HR asks your advice on Saudization obligations.",
    instructions: "Advise the company. Address: what Nitaqat category they are in and what hiring 10 more expatriates means for compliance, what GOSI and Qiwa obligations apply to the new hires, and your overall recommendation.",
    estimateMinutes: 20,
    rubric: [
      { criterion: "nitaqat_accuracy", weight: 35, descriptor: "Calculates current Saudization rate correctly; identifies the likely Nitaqat band; assesses the impact of hiring 10 more expatriates on the rate and band." },
      { criterion: "gosi_qiwa_knowledge", weight: 35, descriptor: "States that all employees (Saudi and non-Saudi) must be registered with GOSI; mentions Qiwa contract authentication as mandatory." },
      { criterion: "compliance_advice", weight: 30, descriptor: "Gives a clear, actionable recommendation that balances the business need with compliance risk." },
    ],
    fewShot: [
      anchor(
        "They can hire whoever they want as long as they register them with the government.",
        28,
        "No Nitaqat analysis, no rate calculation, no specific compliance obligations. The advice is dangerously vague — failing to flag Saudization exposure could result in Nitaqat downgrade, permit freezes, or fines.",
      ),
      anchor(
        "Nitaqat: Current Saudization rate = 40/50 = 80%. At 80%, the company is likely in the Platinum or High Green band (exact thresholds vary by sector — verify with the HRSD Nitaqat calculator). Hiring 10 more expatriates brings total headcount to 60 with 40 Saudis — new rate = 40/60 = 67%. Depending on sector, this may drop them from Platinum to Green or even Yellow, which could trigger permit renewal restrictions. GOSI/Qiwa: All 10 new hires (expatriate) must be registered with GOSI from Day 1 and pay monthly contributions. Employment contracts must be authenticated via the Qiwa platform before the employee starts — this is legally mandatory. EOSB provisions apply to all employees. Recommendation: Before hiring, run the HRSD Nitaqat calculator to confirm the band impact. If the drop risks a Yellow classification, consider hiring a mix of Saudi and expatriate staff to maintain Green. If the hires are specialist roles with no Saudi equivalents, document this for potential exemption requests.",
        91,
        "Accurate rate calculation with the impact of the new hires, correct identification of GOSI and Qiwa obligations, and a practical, risk-aware recommendation that includes verification steps.",
      ),
    ],
  }),
  mod({
    code: "M34",
    title: "Recruitment & Saudization",
    titleAr: "التوظيف والسعودة",
    dimension: "job_fit",
    level: "L3-E",
    specialization: "Human Resources",
    framework: "Nationalisation policy / talent acquisition",
    focus: "Making a principled recruitment decision when Saudization compliance is at stake.",
    saudiContext: "HRSD offers financial incentives for Saudi hiring including wage subsidies through Hadaf; these should be part of any Saudization-driven hiring recommendation.",
    scenario: "You are recruiting for a Data Analyst role. Two final candidates: Candidate A (Saudi national, strong Excel, no Python, salary expectation SAR 9,000) and Candidate B (non-Saudi, strong Python + SQL, salary expectation SAR 7,500). The company has a Nitaqat deficit.",
    instructions: "Describe your recommendation. Address: how the Nitaqat deficit influences the hiring decision, what legal obligations or incentives apply, and how you would structure the offer and development plan to maximise the outcome.",
    estimateMinutes: 20,
    rubric: [
      { criterion: "saudization_reasoning", weight: 40, descriptor: "Recommends Candidate A for Nitaqat compliance reasons; acknowledges the technical gap but frames it as a manageable development need." },
      { criterion: "legal_compliance", weight: 35, descriptor: "References Nitaqat band risk of hiring non-Saudi; mentions Hadaf wage subsidy or equivalent HRSD incentive available for Saudi hire." },
      { criterion: "process_quality", weight: 25, descriptor: "Proposes a specific onboarding/upskilling plan for Candidate A with milestones." },
    ],
    fewShot: [
      anchor(
        "I would hire Candidate B because they have better technical skills and cost less.",
        28,
        "Ignores the Nitaqat deficit entirely — hiring a non-Saudi when already in deficit could trigger permit freezes or fines. No legal analysis, no reference to HRSD incentives for Saudi hiring, and no consideration of national workforce development obligations.",
      ),
      anchor(
        "Saudization reasoning: With a Nitaqat deficit, hiring Candidate B (non-Saudi) deepens the shortfall and risks further band downgrade — potentially freezing work permit renewals for the whole company. Candidate A is the strategic hire. The Python gap is real but manageable with a 6-month upskilling plan. Legal compliance: Hiring Candidate A qualifies the company for the Hadaf wage subsidy programme, which can offset up to 50% of the salary for the first year — effectively reducing the SAR 9,000 cost to ~SAR 4,500/month. This makes Candidate A the financially competitive choice as well. Process quality: Offer Candidate A SAR 9,000 with a structured 6-month Python and SQL development plan: (1) enrol in a certified online course within the first month, (2) assign a technical mentor from the existing data team, (3) set a 3-month checkpoint to assess progress. Include a performance clause that ties a salary review to Python proficiency. This protects the business's technical quality while meeting Saudization obligations.",
        92,
        "Correct Nitaqat reasoning, reference to Hadaf subsidy that changes the financial calculus, and a specific, milestone-based development plan for Candidate A that addresses the technical gap.",
      ),
    ],
  }),
  mod({
    code: "M35",
    title: "Employee Relations & Conflict",
    titleAr: "علاقات الموظفين وإدارة النزاعات",
    dimension: "job_fit",
    level: "L3-E",
    specialization: "Human Resources",
    framework: "Cross-cultural management (Wasta) + professional mediation frameworks",
    focus: "Handling a wasta-based promotion grievance with investigation and documentation.",
    saudiContext: "Wasta is a sensitive topic; the investigation must be neutral and evidence-based. Framing it as a process fairness review rather than a personal accusation is both culturally appropriate and legally safer.",
    scenario: "An employee comes to you as HR Manager claiming she was passed over for a promotion because a colleague with family connections to the department head (wasta) was chosen, despite her having higher performance ratings. The performance data partially supports her claim.",
    instructions: "Describe how you would handle this. Address: how you recognise and name the conflict type, what your investigation or mediation process would be, and what documentation and policy steps you would take.",
    estimateMinutes: 20,
    rubric: [
      { criterion: "conflict_recognition", weight: 30, descriptor: "Names the conflict type accurately: perceived favouritism / procedural unfairness; acknowledges the cultural sensitivity of the wasta allegation." },
      { criterion: "mediation_approach", weight: 40, descriptor: "Proposes a neutral, evidence-based process: review promotion criteria, interview both candidates and the decision-maker separately, assess whether the process was followed." },
      { criterion: "documentation", weight: 30, descriptor: "Records the complaint formally, documents the investigation steps and findings, and notes the policy implications for future promotions." },
    ],
    fewShot: [
      anchor(
        "I would tell her this is just how things work here and to focus on her next opportunity.",
        28,
        "Dismisses a formal grievance without investigation. This creates legal liability and signals to all employees that bias will not be investigated. No process, no documentation, no resolution.",
      ),
      anchor(
        "Conflict recognition: This is a perceived procedural unfairness grievance with an allegation of nepotism. I would acknowledge her concern professionally — 'I take this seriously and I want to make sure our promotion process was followed correctly' — without making any judgment on the wasta allegation at this stage. Mediation approach: (1) Log the formal complaint and confirm in writing that it is being investigated. (2) Review the promotion criteria documentation — were objective criteria defined in advance? (3) Interview the department head with specific questions about how the final decision was made against the stated criteria. (4) Interview both candidates separately about their understanding of the process. (5) Compare performance ratings, seniority, and any other documented criteria against the outcome. If the process was not followed, the decision may need to be reviewed. Documentation: Maintain a confidential investigation file with all interview notes, performance data, and criteria review. Regardless of outcome, document a recommendation to formalise promotion criteria in writing before future cycles to prevent ambiguity. If the findings suggest procedural failure, escalate to senior HR and legal. The employee should receive written feedback on the investigation outcome.",
        91,
        "Conflict named accurately and sensitively, neutral investigation process with structured interviews and criteria review, and concrete documentation steps including a systemic recommendation for future promotion processes.",
      ),
    ],
  }),

  // ── Track F — Web Development ───────────────────────────────────────────────
  mod({
    code: "M36",
    title: "Core Web Principles",
    titleAr: "أساسيات الويب",
    dimension: "job_fit",
    level: "L3-F",
    specialization: "Web Development",
    framework: "Client-server model and HTTP",
    focus: "Explaining the full URL-to-rendered-page cycle to a junior developer.",
    saudiContext: "Technical module; evaluation is culturally neutral.",
    scenario: "A junior developer on your team asks: 'What exactly happens, step by step, from the moment I type https://example.com in the browser and press Enter, until the page appears on screen?'",
    instructions: "Explain the process. Cover: DNS resolution and the HTTP request/response cycle, what the server does when it receives the request, and how the browser renders the HTML/CSS/JS into a visible page.",
    estimateMinutes: 20,
    rubric: [
      { criterion: "dns_http_accuracy", weight: 35, descriptor: "Correctly describes DNS lookup, TCP/TLS handshake, HTTP GET request, and the server's HTTP response with status code." },
      { criterion: "server_response", weight: 35, descriptor: "Explains what the server does: routing the request, optionally querying a database, and returning HTML (or JSON for SPAs)." },
      { criterion: "rendering_explanation", weight: 30, descriptor: "Describes the browser's rendering pipeline: parse HTML → build DOM → parse CSS → CSSOM → render tree → layout → paint." },
    ],
    fewShot: [
      anchor(
        "The browser downloads the page from the internet and shows it to you.",
        28,
        "Correct at the most superficial level but explains nothing about DNS, HTTP, server processing, or browser rendering. A junior developer would learn nothing actionable from this answer.",
      ),
      anchor(
        "DNS: The browser checks its cache for the IP address of example.com. If not cached, it queries a DNS resolver, which returns the IP. TCP/TLS: The browser opens a TCP connection to the server on port 443 and performs a TLS handshake to establish an encrypted session. HTTP request: The browser sends an HTTP GET request with headers (Host, User-Agent, Accept, cookies). Server: The web server (e.g. Nginx) receives the request, routes it to the application code, which may query a database, then assembles an HTML response and sends it back with a 200 OK status code and Content-Type: text/html. Browser rendering: The browser parses the HTML to build the DOM tree. It encounters CSS links and script tags, fetches those resources, parses CSS into a CSSOM. The DOM and CSSOM are combined into a render tree. The layout engine calculates the size and position of each element. Finally, the paint step draws the pixels to screen. JavaScript can modify the DOM after load (reflow/repaint).",
        94,
        "Covers all stages accurately: DNS cache check, resolver, TCP, TLS, HTTP GET with headers, server routing + optional DB query, HTML response with status code, and the full DOM → CSSOM → render tree → layout → paint pipeline. Technically precise and teachable.",
      ),
    ],
  }),
  mod({
    code: "M37",
    title: "Programming Logic",
    titleAr: "المنطق البرمجي",
    dimension: "job_fit",
    level: "L3-F",
    specialization: "Web Development",
    framework: "Algorithms and ES6 standards",
    focus: "Algorithmic thinking in modern JavaScript.",
    saudiContext: "Technical module; evaluation is culturally neutral.",
    scenario: "You need to filter a list of products by a maximum price. Input: an array of objects such as [{name:'A', price:100}, {name:'B', price:200}]; maxPrice = 150.",
    instructions: "Write a function findAffordableProducts(products, maxPrice) that returns the filtered array.",
    estimateMinutes: 15,
    rubric: [
      { criterion: "correctness", weight: 40, descriptor: "Function works correctly: returns products where price <= maxPrice as full objects." },
      { criterion: "modern_syntax", weight: 30, descriptor: "Uses Array.filter(), const/let, and arrow functions." },
      { criterion: "cleanliness", weight: 30, descriptor: "Clear variable naming and readable code." },
    ],
    fewShot: [
      anchor(
        "function findAffordableProducts(products, maxPrice){ var result = []; for (var i=0;i<products.length;i++){ if(products[i].price > maxPrice){ result.push(products[i].name); } } return result; }",
        40,
        "Two logic errors: the comparison uses > (returning products above the maximum) and it pushes only the name rather than the full object. The style is also dated (var, manual loop).",
      ),
      anchor(
        "const findAffordableProducts = (products, maxPrice) => products.filter(p => p.price <= maxPrice);",
        95,
        "Correct predicate (<=), returns full objects, uses Array.filter, arrow function, and const. Concise and idiomatic ES6.",
      ),
    ],
  }),
  mod({
    code: "M38",
    title: "Software Quality (Code Review)",
    titleAr: "جودة البرمجيات — مراجعة الكود",
    dimension: "job_fit",
    level: "L3-F",
    specialization: "Web Development",
    framework: "Clean Code principles",
    focus: "Spotting substantive defects in legacy JavaScript code.",
    saudiContext: "Technical module; evaluation is culturally neutral.",
    scenario: "Review this legacy code snippet: function show(id) { $.ajax({url: 'api/'+id, success: function(r) { $('p').append(r.name); }}); }",
    instructions: "Identify at least two problems or bad practices in this code and explain why they are problematic.",
    estimateMinutes: 15,
    rubric: [
      { criterion: "issue_identification", weight: 50, descriptor: "Spots at least two of: non-specific $('p') selector, missing error handler, unencoded URL concatenation." },
      { criterion: "explanation_quality", weight: 50, descriptor: "Clearly explains the technical impact of each identified issue." },
    ],
    fewShot: [
      anchor(
        "The function name show is too vague, it should be more descriptive. There are also some missing semicolons.",
        35,
        "Only cosmetic points raised; every substantive defect is missed. Naming and semicolons are style issues; the selector, error handling, and URL encoding are security/correctness defects.",
      ),
      anchor(
        "Issues: (1) $('p') is a non-specific selector that appends to every paragraph on the page — it should target a specific element by id or class to avoid unintended DOM mutations. (2) No error handling: only the success callback is defined; a failed AJAX request fails silently with no feedback or logging — add an error handler or use async/await with try/catch. (3) The URL is built by string concatenation ('api/'+id) without encoding; id should be wrapped in encodeURIComponent() or passed as a URL parameter to avoid malformed or exploitable requests. (4) Minor: the jQuery callback pattern could be modernised to fetch() with async/await for better readability and native browser support.",
        91,
        "All three substantive defects identified with clear impact explanations, plus a sensible modernisation note. The cosmetic vs substantive distinction is correctly applied.",
      ),
    ],
  }),

  // ── Growth Potential (15%) ──────────────────────────────────────────────────
  // ── Level 4 additions ──
  mod({
    code: "M39",
    title: "SFIA Skills Self-Assessment",
    titleAr: "التقييم الذاتي للمهارات وفق إطار SFIA",
    dimension: "growth_potential",
    level: "L4",
    specialization: null,
    framework: "SFIA framework (7 responsibility levels)",
    focus: "Positioning oneself accurately on the SFIA responsibility scale with evidence.",
    scenario:
      "You are reviewing the SFIA Level 4 (Enable) descriptor: 'Works under general direction. Uses discretion in identifying and responding to complex issues and assignments. Determines when to seek guidance. Influences customers, suppliers and partners at account level.' You have been in your current professional role for 18 months.",
    instructions:
      "Rate your own fit with the SFIA Level 4 descriptor. Address: how well you understand what SFIA Level 4 means in practice, what specific work examples from your own role and field match or gap against the Level 4 criteria, and whether Level 3 or Level 4 is a more honest self-assessment and why.",
    estimateMinutes: 20,
    rubric: [
      { criterion: "sfia_understanding", weight: 35, descriptor: "Demonstrates a clear, accurate understanding of what SFIA Level 4 (Enable) means in practice — not merely paraphrasing the descriptor but showing grasp of autonomy, discretion, and stakeholder influence." },
      { criterion: "evidence_quality", weight: 40, descriptor: "Provides specific, concrete examples from their own experience that map to (or honestly gap against) the Level 4 criteria; avoids vague claims." },
      { criterion: "self_calibration", weight: 25, descriptor: "Makes a reasoned, honest judgement about whether Level 3 or Level 4 is the accurate placement, with explicit justification rather than defaulting to the higher level." },
    ],
    fewShot: [
      anchor(
        "I think I am Level 4 because I work independently most of the time and I have been here for 18 months. I understand the descriptor and I match all of it.",
        30,
        "No evidence is provided to support the self-rating. The candidate simply asserts Level 4 without mapping any work examples to the criteria, and ignores whether Level 3 might be a more honest placement. Self-assessment without evidence is not a calibrated self-assessment.",
      ),
      anchor(
        "SFIA Understanding: Level 4 (Enable) requires working under general direction with discretion on complex issues, knowing when to escalate, and influencing external stakeholders. The practical difference between L3 and L4 is whether you own a decision or simply carry out a decision that someone else made. Evidence (I am a procurement coordinator, 18 months in role): In month 14, a key supplier missed a delivery deadline that threatened our quarterly reporting cycle. I assessed the risk independently, contacted two alternative suppliers to obtain emergency quotes, selected the best option within the budget threshold I am authorised to approve, and briefed my line manager only after the contingency was in place. That decision — choosing the approach, judging the risk level, and acting without waiting for instruction — maps well to the L4 discretion and complex-issue criteria. However, influencing external stakeholders at account level is where I am more honestly at L3. My contact with senior supplier representatives is still channelled through my category manager; I prepare the analysis and talking points but do not lead those conversations independently. Self-calibration: On autonomy and complex-issue handling I am a solid L4; on external stakeholder influence I am more accurately L3. I would self-rate L3+ overall, and developing the confidence to lead supplier negotiations independently is my clearest development priority for the next six months.",
        90,
        "The candidate accurately interprets the Level 4 descriptor beyond paraphrasing, provides a specific named example from a procurement role that maps to discretion and complex-issue resolution, and applies genuine calibration by explicitly identifying the stakeholder-influence gap as the area where L3 is the honest rating. All three criteria are addressed with domain-specific, non-software evidence and a reasoned development plan.",
      ),
    ],
  }),
  mod({
    code: "M40",
    title: "Core Job Analysis",
    titleAr: "تحليل الوظيفة الأساسية — منهجية DACUM",
    dimension: "growth_potential",
    level: "L4",
    specialization: null,
    framework: "DACUM (Developing A CurriculUM) method",
    focus: "Breaking down a role into its core duties and tasks for workforce planning.",
    scenario:
      "Your organisation has identified a need for a new professional role and asked you to map what the role should do using the DACUM approach before designing any training programme.",
    instructions:
      "Apply the DACUM method to the role. Address: identify 3–4 core duties (duty areas) for this role, for each duty list 2–3 specific tasks that a worker in this role performs, and assess whether your analysis covers the essential competencies of the role.",
    estimateMinutes: 20,
    rubric: [
      { criterion: "duty_identification", weight: 35, descriptor: "Identifies 3–4 distinct, role-appropriate duty areas that together represent the main responsibilities of the role, not generic job descriptions." },
      { criterion: "task_decomposition", weight: 40, descriptor: "For each duty, lists 2–3 observable, specific tasks (action verb + object) that a worker actually performs; tasks are concrete enough to form the basis of training objectives." },
      { criterion: "completeness", weight: 25, descriptor: "Provides a self-critical assessment of whether the analysis captures the essential competencies of the role; identifies any gaps or assumptions." },
    ],
    fewShot: [
      anchor(
        "The role does general work. Their duties are: doing tasks, using tools, and making reports. They need to know relevant skills. I think this covers everything they do.",
        28,
        "The duty areas are too vague and overlap with tool names rather than functional areas. Tasks are not decomposed — 'using tools' is not a task. The completeness assessment is a bare assertion without analysis. This does not apply the DACUM method meaningfully.",
      ),
      anchor(
        "DACUM Analysis — Professional Role\n\nDuty A: Information Gathering & Validation — (A1) Collect relevant data and information from appropriate sources; (A2) Verify accuracy and completeness of gathered information; (A3) Document sources and flag any quality issues to stakeholders.\n\nDuty B: Core Analysis & Problem-Solving — (B1) Apply domain-appropriate methods to analyse information; (B2) Identify patterns, trends, or issues requiring attention; (B3) Formulate recommendations based on findings.\n\nDuty C: Communication & Reporting — (C1) Prepare clear written summaries for technical and non-technical audiences; (C2) Present findings to stakeholders and respond to questions; (C3) Tailor communication style to audience needs.\n\nDuty D: Process & Quality Support — (D1) Maintain accurate records and documentation; (D2) Support continuous improvement by identifying process gaps.\n\nCompleteness: The four duty areas cover the core workflow from gathering information through analysis to communication, which reflects standard professional practice. A potential gap is stakeholder relationship management — the role likely needs some ability to build and maintain working relationships with internal or external stakeholders. This would warrant a fifth duty or an expansion of Duty C.",
        91,
        "Four clearly labelled duty areas with specific, action-verb tasks meeting the DACUM standard. The completeness section is self-critical and identifies a genuine gap (stakeholder relationship management) with a constructive suggestion. The analysis is specific enough to form training objectives.",
      ),
    ],
  }),
  // ── Level 4 additions ──
  mod({
    code: "M41",
    title: "Career Adaptability",
    titleAr: "القدرة على التكيّف المهني",
    dimension: "growth_potential",
    level: "L4",
    framework: "Savickas' Career Adapt-Abilities, the 4Cs (Concern, Control, Curiosity, Confidence)",
    focus: "Adaptive response to career uncertainty and change.",
    saudiContext:
      "In a hierarchy-sensitive setting, Control is shown through proactive preparation and respectful initiative rather than contesting the reassignment.",
    scenario:
      "Six months into your first job, your team's main project is reorganised and your role may shift to an area you do not know well. Some colleagues are anxious; the change is not negotiable.",
    instructions:
      "In 4 to 6 sentences, describe how you would respond over the next month. Address: how you plan ahead (Concern), what you take control of (Control), how you explore the new area (Curiosity), and what gives you confidence to handle it (Confidence).",
    estimateMinutes: 15,
    rubric: [
      { criterion: "concern", weight: 25, descriptor: "Forward planning and awareness." },
      { criterion: "control", weight: 25, descriptor: "Agency and self-efficacy in managing the change." },
      { criterion: "curiosity", weight: 25, descriptor: "Active exploration of the new area." },
      { criterion: "confidence", weight: 25, descriptor: "Grounded self-belief and a problem-solving stance." },
    ],
    fewShot: [
      anchor(
        "I would just wait and see what happens, it is not my decision. If they move me I will do my best, but I did not choose this, so it is up to them to train me.",
        32,
        "A passive, low-agency response. There is no forward planning, no ownership, and no active exploration; adaptability is treated as something that happens to the candidate.",
      ),
      anchor(
        "Concern: I would map what the new area requires and set weekly learning goals for the month. Control: I would ask my manager for priorities and resources and take ownership of an early, small deliverable to build momentum. Curiosity: I would shadow a colleague who knows the area and follow a short course to close the gaps. Confidence: I have adapted to unfamiliar tasks before by breaking them down, and the same approach applies here; I would also support anxious colleagues by sharing what I learn.",
        88,
        "All four adaptability resources are present and concrete: forward planning, ownership, active exploration, and grounded confidence, with a constructive note toward anxious colleagues.",
      ),
    ],
  }),
  mod({
    code: "M42",
    title: "Team Mediation",
    titleAr: "الوساطة في النزاعات الجماعية",
    dimension: "growth_potential",
    level: "L4",
    specialization: null,
    framework: "Professional mediation frameworks (interest-based mediation)",
    focus: "Managing a quality vs speed conflict that has turned interpersonal within a team.",
    scenario:
      "Two senior team leads in your project, Noura (QA) and Faris (Development), have stopped communicating directly after a dispute over releasing a feature with known minor bugs under schedule pressure. Their conflict is now affecting team morale and sprint velocity.",
    instructions:
      "Describe your mediation approach as their manager. Address: how you frame the conflict and create conditions for dialogue, what steps your mediation process would include, and how you would define and validate a resolution.",
    estimateMinutes: 20,
    rubric: [
      { criterion: "problem_framing", weight: 30, descriptor: "Reframes the conflict as a structural/interest-based issue rather than a personality clash; creates psychological safety by meeting each party privately before a joint session." },
      { criterion: "mediation_process", weight: 40, descriptor: "Describes a structured, step-by-step process (e.g. individual sessions → joint session → shared problem statement → options generation → agreement) grounded in interest-based mediation principles." },
      { criterion: "resolution_quality", weight: 30, descriptor: "Defines a concrete resolution criterion (e.g. a shared decision framework for release quality vs schedule), not just restoring civility; includes a follow-up check to validate the resolution holds." },
    ],
    fewShot: [
      anchor(
        "I would get them both in a room and tell them they need to sort this out because it's affecting the team. They are both professionals and should be able to resolve a disagreement. If it continues I would escalate to HR.",
        32,
        "No framing or preparation before the joint meeting; placing two people in direct conflict in a room without groundwork risks escalation. There is no structured process, and the resolution is undefined. Escalating immediately to HR as a threat is not a mediation approach.",
      ),
      anchor(
        "Problem framing: I would meet Noura and Faris separately first to understand their underlying interests — for Noura, product integrity and professional reputation; for Faris, delivery credibility and sprint commitments. I would name the structural tension (quality gate vs release cadence) explicitly so neither feels blamed personally, and establish ground rules for the joint session.\n\nMediation process: (1) Individual sessions — each person shares their perspective and I reflect back to confirm understanding. (2) Joint session — I open by stating the shared goal (a product we're all proud to ship, on time) and read a neutral summary of each person's interests (anonymised to reduce defensiveness). (3) Shared problem statement — we agree the root issue is an absent explicit policy on what severity of bug blocks a release. (4) Options generation — both parties propose options; I facilitate without judging. (5) Written agreement — we co-author a lightweight 'release readiness checklist' that defines acceptable defect levels by severity.\n\nResolution quality: The resolution is the checklist itself, not just civility. Success is defined as: the checklist is used in the next two sprints without re-escalation, and both leads confirm in a 2-week retrospective that it is workable. If friction persists, we revisit the criteria together rather than through me as intermediary.",
        90,
        "Thorough problem framing with interest-based reframing; a clear five-step mediation process grounded in established practice; and a concrete, measurable resolution (the checklist) with a defined success criterion and follow-up mechanism. All three rubric criteria are addressed at a high level.",
      ),
    ],
  }),
  mod({
    code: "M43",
    title: "Project Pitch",
    titleAr: "تقديم المشاريع والأفكار",
    dimension: "growth_potential",
    level: "L4",
    specialization: null,
    framework: "Aristotle's rhetorical triangle: ethos, pathos, logos",
    focus: "Delivering a persuasive 3-minute pitch for an internal improvement initiative.",
    scenario:
      "You have identified a manual process in your department that currently takes 12 person-hours per week. You believe it can be redesigned to take only 2 hours. You have a 3-minute slot in the all-hands meeting to pitch this to senior management and get approval for a small redesign budget.",
    instructions:
      "Write your 3-minute pitch script. Apply Aristotle's rhetorical triangle: establish your credibility and the problem you understand (Ethos), make a logical case with numbers (Logos), and connect to something the audience genuinely cares about (Pathos).",
    estimateMinutes: 20,
    rubric: [
      { criterion: "logos_argument", weight: 35, descriptor: "Presents a clear quantitative case: time saved, cost avoided, or ROI; uses the numbers in the scenario and applies them logically without inflating claims." },
      { criterion: "ethos_credibility", weight: 30, descriptor: "Establishes the speaker's proximity to the problem (they own or work closely with the process) and competence (they have validated the improvement); does not overclaim." },
      { criterion: "pathos_engagement", weight: 35, descriptor: "Connects the proposal to something the audience (senior management) genuinely cares about — strategy, team capacity, cost, or quality — rather than only to the team's convenience." },
    ],
    fewShot: [
      anchor(
        "Hi everyone, I have an idea to improve one of our processes. It would be great for the team and save us time. I just need a small budget to work on it. Please approve it. Thank you.",
        28,
        "No numbers, no credibility signals, no connection to management priorities. The ask is clear but there is no logical or emotional argument to support it. A vague 'save us time' without quantification does not constitute a logos argument, and 'it would be great' does not constitute pathos.",
      ),
      anchor(
        "[Ethos] Good morning. I have been working with this process for the past seven months and I know exactly where the inefficiencies are.\n\n[Logos] Right now, this process takes 12 person-hours every week across the team. That is 624 hours per year. I have mapped out a redesign that would reduce it to 2 hours per week — a savings of 520 hours annually. The investment is a small redesign budget and roughly two weeks of implementation time. The payback is 520 hours recovered in year one, which at our fully-loaded rate represents approximately SAR 26,000 in avoided cost annually.\n\n[Pathos] I know this organisation is focused on doing more with the same headcount under Vision 2030 efficiency targets. Those 520 hours are 13 weeks of capacity that we currently spend on repetitive manual work — capacity that could go into higher-value activities that directly support your strategic priorities. I am asking for a small budget to give this team 13 weeks back.\n\nThe ask is simple: approve the redesign budget. I will deliver the improved process, document it, and report back at the next all-hands on time saved.",
        91,
        "Strong ethos: proximity to the problem and validated improvement plan. Strong logos: quantified hours, annualised savings, explicit ROI in SAR. Strong pathos: connects directly to Vision 2030 efficiency narrative and reframes the ask in terms of strategic capacity, not team convenience. The pitch has a clear, specific ask.",
      ),
    ],
  }),
  mod({
    code: "M44",
    title: "Digital Workplace Proficiency",
    titleAr: "الكفاءة في بيئة العمل الرقمية",
    dimension: "growth_potential",
    level: "L4",
    specialization: null,
    framework: "Digital dexterity models (Gartner)",
    focus: "Effectively onboarding a new colleague to cloud collaboration tools.",
    scenario:
      "A new hire, Tariq, joins your remote team. He is technically capable but unfamiliar with your company's cloud collaboration stack: Google Workspace (Docs, Sheets, Meet), Slack, and Notion. His first project is starting in 3 days. You are his digital buddy.",
    instructions:
      "Describe your onboarding plan for Tariq's first week. Address: which tools to prioritise and how, how you would structure the onboarding experience to respect his time and avoid overwhelm, and how you would set norms for asynchronous communication.",
    estimateMinutes: 15,
    rubric: [
      { criterion: "tool_selection", weight: 30, descriptor: "Prioritises tools by immediate project need rather than alphabetically or exhaustively; explains the rationale for the order and what each tool is used for in the team's actual workflow." },
      { criterion: "onboarding_approach", weight: 40, descriptor: "Structures the onboarding over time (day 1, days 2–3, end of week) to avoid cognitive overload; uses contextual learning (learn the tool while doing real work) rather than abstract tool tours." },
      { criterion: "asynchronous_comms", weight: 30, descriptor: "Sets explicit norms for async communication: response time expectations, when to use Slack vs Docs vs Meet, and how to signal availability or blockers without real-time interruption." },
    ],
    fewShot: [
      anchor(
        "I would send Tariq links to all the tools on day one and tell him to explore them over the week. If he has questions he can ask me on Slack. By the end of the week he should know them all.",
        30,
        "No prioritisation, no structure, and no explicit norms. Dropping five tool links with no guidance will overwhelm a new hire and guarantee confusion about which tool is used for what. There are no async communication norms set — telling someone to 'ask on Slack' is not a norm.",
      ),
      anchor(
        "Tool selection (priority order): Day 1 — Slack and Google Meet, because Tariq needs to communicate with the team immediately; I will walk him through our channel structure (#general, #project-alpha, #standup) and how we use threads. Day 2 — Google Docs and Sheets, since his first project deliverable is a data summary; we will open a live Docs template together so he sees how we collaborate in real time. Day 3 — Notion, specifically the project wiki for his first assignment; I will defer the full Notion tour until day 4–5 once he has context.\n\nOnboarding approach: I will not give abstract tool demos. Instead, each tool introduction is tied to a real task — Tariq's first Slack message is his team introduction, his first Docs edit is in the actual project document. Each session is capped at 30 minutes to avoid overload. I will check in briefly at the end of each day (5-minute async voice message on Slack) to surface blockers before they become 24-hour delays.\n\nAsync norms: I will share a one-page team norms card on day 1 covering: (1) Slack response time expectation is 2 hours during working hours; (2) for non-urgent questions, use a Slack thread rather than a direct message so others can contribute; (3) use the 🔴 status emoji when in deep work and unavailable; (4) document decisions in Notion within 24 hours of a meeting; (5) Google Meet for anything that would take more than 3 Slack messages to resolve.",
        89,
        "Clear prioritisation rationale tied to immediate project need; structured day-by-day onboarding that uses contextual learning and respects cognitive load; and explicit, actionable async norms with specific response times, tool-routing rules, and availability signals. All three criteria are addressed concretely.",
      ),
    ],
  }),
  mod({
    code: "M45",
    title: "Professional Profile: Summary & Languages",
    titleAr: "الملف المهني: الملخص الذاتي واللغات",
    dimension: "growth_potential",
    level: "L4",
    specialization: null,
    framework: "CEFR language proficiency framework (A1–C2)",
    focus: "Writing a professional profile summary with accurate CEFR language self-assessment.",
    scenario:
      "You are applying to a graduate programme. The application asks for: (1) a 150-word professional summary for your LinkedIn profile, and (2) your language proficiency levels in Arabic and English using the CEFR scale.",
    instructions:
      "Write a professional summary of up to 150 words for your LinkedIn profile. Then state your current Arabic and English language proficiency levels using the CEFR scale (A1–C2) with one sentence of justification for each.",
    estimateMinutes: 15,
    rubric: [
      { criterion: "structure_clarity", weight: 25, descriptor: "The summary has a clear three-part structure: who you are → what you have done (evidence) → what you are seeking; transitions are smooth and the 150-word limit is observed." },
      { criterion: "professional_tone", weight: 35, descriptor: "Written in first person or third person consistently; confident without being boastful; active verbs; free of colloquialisms, filler phrases, or clichés like 'passionate about' without evidence." },
      { criterion: "keyword_relevance", weight: 25, descriptor: "Includes domain-specific keywords appropriate to the target programme or role (e.g. data analysis, Python, stakeholder communication) that would be recognisable to a recruiter or admissions reader." },
      { criterion: "cefr_accuracy", weight: 15, descriptor: "States an Arabic and English CEFR level (A1–C2) with a one-sentence justification that is plausible and internally consistent (e.g. a C1 English claim is not undermined by poor English in the summary itself)." },
    ],
    fewShot: [
      anchor(
        "I am a hardworking and passionate student who loves data and technology. I have done many projects and internships and I am looking for a good opportunity to grow. I am a native Arabic speaker and my English is very good.\n\nArabic: Native. English: Advanced.",
        29,
        "The summary is vague with no specific evidence ('many projects' without naming one), relies on clichés ('hardworking and passionate'), and has no structural arc. Keywords are absent. The CEFR self-assessment omits the scale entirely ('Advanced' is not a CEFR level) and gives no justification. The overall response does not meet any of the four criteria at a meaningful level.",
      ),
      anchor(
        "I am a final-year Healthcare Management student at King Saud University with practical experience improving clinical workflows and supporting patient-centred service delivery. Over the past two years I have led a process-improvement project that reduced patient discharge time by 22% in a 120-bed ward, and completed a six-month placement at a regional hospital where I coordinated between clinical staff, administrative teams, and insurance providers to streamline referral documentation. I am confident working across the healthcare operations cycle: analysing patient flow data, facilitating multi-stakeholder coordination, and applying quality-improvement frameworks such as Lean and PDCA in administrative settings. I am seeking a graduate programme in Health Systems Management where I can deepen my expertise in healthcare policy and contribute to evidence-based service improvement.\n\nArabic: C2 (Native proficiency — my first language, used daily in academic writing, patient communication, and formal reporting). English: B2 (Upper-Intermediate — I can draft clinical reports and participate in international health conferences in English, as demonstrated in this summary, but I still rely on review for high-stakes regulatory submissions).",
        90,
        "Clear three-part structure: who the candidate is → evidence of achievement (ward discharge improvement, placement coordination) → what they seek; professional active-verb tone free of clichés; domain-appropriate keywords (clinical workflow, patient flow, Lean, PDCA, multi-stakeholder coordination, healthcare policy); and an accurate CEFR self-assessment with plausible, internally consistent justifications.",
      ),
    ],
  }),
  mod({
    code: "M46",
    title: "Career Plan & Motivation",
    titleAr: "الخطة المهنية والدافعية",
    dimension: "growth_potential",
    level: "L4",
    framework: "Savickas Career Construction + Locke-Latham goal-setting",
    focus: "Clarity and realism of a 3 to 5 year career plan.",
    saudiContext:
      "A plan that links personal growth to contribution to the team and to national development goals (Vision 2030) reads as well-aligned in a Saudi institutional context.",
    scenario: "You are asked about your professional plan in a structured interview for a graduate programme.",
    instructions:
      "Answer two questions in a short paragraph each: 1. What is your career goal for the next 3 to 5 years? 2. How does the target role fit into your longer-term plan?",
    estimateMinutes: 15,
    rubric: [
      { criterion: "goal_clarity", weight: 35, descriptor: "Is the goal concrete and well-defined?" },
      { criterion: "process_steps", weight: 35, descriptor: "Are the steps to get there laid out?" },
      { criterion: "realistic_outcomes", weight: 30, descriptor: "Are the outcomes realistic and tied to growth and contribution?" },
    ],
    fewShot: [
      anchor(
        "I want a good job with a good salary and maybe to become a manager one day. I am open to anything really, wherever there is opportunity.",
        34,
        "The goal is vague, there are no steps, and openness to anything signals an unformed plan rather than direction.",
      ),
      anchor(
        "Goal: in 3 to 5 years I want to become a data analyst who owns a reporting domain end to end, moving from junior analyst to leading a small analytics workstream. Fit: this graduate role is the entry step; in year 1 I build SQL and dashboarding depth and ship reliable reports, by year 2 to 3 I take on a recurring stakeholder area and mentor an intern, by year 4 to 5 I lead an analytics initiative. It fits my longer-term goal of turning data into decisions that contribute to the organisation's targets.",
        89,
        "A specific goal, a clear year-by-year path, and outcomes tied to both personal growth and organisational contribution. A well-constructed plan.",
      ),
    ],
  }),
  mod({
    code: "M47",
    title: "Intercultural Awareness",
    titleAr: "الوعي بين الثقافات",
    dimension: "growth_potential",
    level: "L4",
    framework: "Erin Meyer's Culture Map (situational judgement)",
    focus: "Navigating cross-cultural and high-context situations.",
    saudiContext:
      "Saudi Arabia is a high-context, relationship-first, hierarchy-respecting culture; the strongest answers privilege private feedback, face-saving language, and relationship before task.",
    scenario:
      "Working with an international team you face three situations: (a) a German colleague gives blunt, direct feedback that a Japanese colleague finds face-threatening; (b) a partner from a flexible-time culture misses a deadline on a time-critical project; (c) a virtual meeting mixes task-focused and relationship-focused colleagues.",
    instructions:
      "For each of the three situations, state in 1 to 2 sentences how you would handle it to bridge the styles without causing loss of face.",
    estimateMinutes: 20,
    rubric: [
      { criterion: "feedback_face", weight: 34, descriptor: "Private, specific, sandwich-style feedback that protects dignity." },
      { criterion: "time_expectations", weight: 33, descriptor: "Non-accusatory message that explains impact and offers collaboration." },
      { criterion: "style_bridging", weight: 33, descriptor: "Accommodates both task-focused and relationship-focused colleagues." },
    ],
    fewShot: [
      anchor(
        "(a) The German colleague is right, the Japanese colleague needs to accept direct feedback. (b) I would raise the missed deadline in the group chat so everyone knows. (c) I would stick to the agenda and tell people to be efficient.",
        30,
        "Each response causes loss of face: it dismisses one style as wrong, calls out the partner publicly, and ignores the relationship-focused colleagues. None bridges the styles.",
      ),
      anchor(
        "(a) I would give the feedback to the Japanese colleague privately, opening with what worked and raising the concern gently with specific examples, and brief the German colleague that private, framed feedback lands better here. (b) I would message the partner privately, without blame, explain the impact on the project, and offer to re-plan together, acknowledging the difference in how time is treated. (c) I would add a few minutes of informal connection before the agenda so the relationship-focused colleagues engage, while keeping the task structure for the others.",
        92,
        "Private, face-saving feedback; a non-accusatory, collaborative handling of the missed deadline; and a meeting design that bridges task and relationship orientations. Strong cultural judgement.",
      ),
    ],
  }),
];

// ═════════════════════════════════════════════════════════════════════════════
//  2. JOB-FIT RESOLUTION  (the only specialization-specific dimension)
// ═════════════════════════════════════════════════════════════════════════════

/** A leaner per-module shape used to author Job-Fit blueprints. */
export interface JobFitModuleTemplate {
  slug: string; // e.g. "sql-joins"
  title: string;
  titleAr?: string;
  level: string; // L3-*
  framework: string;
  focus: string;
  saudiContext?: string;
  scenario: string;
  instructions: string;
  rubric: RubricCriterion[];
  fewShot: FewShotAnchor[];
}

export interface JobFitBlueprint {
  specialization: string;
  cluster: string;
  modules: JobFitModuleTemplate[];
}

/**
 * Curated Job-Fit blueprints for specializations that have NO Level-3 catalog
 * track (M21–M38). CS/IT and the six L3 tracks resolve via JOBFIT_TRACKS to
 * real catalog module codes — they are intentionally NOT duplicated here.
 * Any specialization not in JOBFIT_TRACKS / SPEC_ALIASES is served by
 * generateGenericJobFit().
 */
export const JOBFIT_BLUEPRINTS: Record<string, JobFitBlueprint> = {
  // ── Accounting / Finance ───────────────────────────────────────────────────
  accounting: {
    specialization: "Accounting / Finance",
    cluster: "Financial Services",
    modules: [
      {
        slug: "credit-analysis",
        title: "Credit-Quality Assessment",
        level: "L3-FIN",
        framework: "Ratio analysis + the 5 Cs of credit",
        focus: "Reading financial statements to make a lending decision.",
        saudiContext: "Frame the recommendation against CMA disclosure norms and SOCPA standards; flag, do not hide, weak coverage.",
        scenario:
          "An SME applies for a SAR 2M working-capital facility. Current ratio 1.1, interest-coverage 1.4x, receivables ageing rising, revenue flat. The relationship manager wants a yes.",
        instructions: "State your credit recommendation (approve / approve-with-conditions / decline) and justify it from the ratios, naming the key risk and one mitigant.",
        rubric: [
          { criterion: "ratio_interpretation", weight: 40, descriptor: "Reads liquidity, coverage and working-capital signals correctly." },
          { criterion: "risk_identification", weight: 35, descriptor: "Names the dominant risk (thin coverage / receivables quality)." },
          { criterion: "decision_quality", weight: 25, descriptor: "Defensible decision with a concrete condition/mitigant." },
        ],
        fewShot: [
          anchor("The ratios look okay and revenue is positive, so I would approve the SAR 2M facility to keep the relationship.", 33, "Ignores the thin 1.4x coverage and deteriorating receivables; approves on relationship rather than risk."),
          anchor(
            "Approve with conditions. Liquidity is tight (current 1.1) and coverage is thin (1.4x), and rising receivables ageing with flat revenue signals collection risk, the dominant risk here. Mitigants: cap the facility below SAR 2M against a borrowing base of eligible receivables, add a coverage covenant (>1.5x) with quarterly monitoring, and require an ageing report. This protects the bank while supporting the SME, consistent with prudent SAMA-style underwriting.",
            89,
            "Correctly weighs coverage and receivables quality, names the dominant risk, and converts it into concrete, monitorable conditions.",
          ),
        ],
      },
      {
        slug: "variance-analysis",
        title: "Budget Variance Analysis",
        level: "L3-FIN",
        framework: "Flexible-budget variance decomposition",
        focus: "Explaining a cost overrun to non-finance management.",
        saudiContext: "Present negative variances as managed optimisation items, not as blame.",
        scenario:
          "A department is SAR 180k over budget for the quarter: volume up 12%, unit input cost up 6%, with a one-off SAR 40k maintenance charge.",
        instructions: "Decompose the SAR 180k variance into volume, price and one-off components and write a two-sentence explanation for management.",
        rubric: [
          { criterion: "decomposition", weight: 50, descriptor: "Separates volume, price and one-off drivers rather than a single number." },
          { criterion: "interpretation", weight: 30, descriptor: "Distinguishes controllable from non-controllable variance." },
          { criterion: "communication", weight: 20, descriptor: "Clear, non-alarmist message for management." },
        ],
        fewShot: [
          anchor("We spent SAR 180k more than planned, costs went up. We need to cut spending next quarter.", 34, "No decomposition; treats a partly volume-driven, partly one-off overrun as undifferentiated overspend."),
          anchor(
            "The SAR 180k splits into roughly SAR 60k from 12% higher volume (favourable activity, recovered in revenue), SAR 80k from a 6% input-price rise (a real watch item), and a SAR 40k one-off maintenance charge that will not recur. Message: 'Most of the overrun is higher activity plus a one-off repair; the controllable piece is the 6% input-price rise, which we are addressing through supplier renegotiation.'",
            88,
            "Clean three-way decomposition, separates controllable from one-off, and a calm, accurate message.",
          ),
        ],
      },
      {
        slug: "controls-compliance",
        title: "Internal Controls & Compliance",
        level: "L3-FIN",
        framework: "Segregation of duties + SOCPA/CMA disclosure",
        focus: "Spotting a control weakness in a process.",
        saudiContext: "Reference CMA disclosure and SOCPA where relevant; raise the gap constructively.",
        scenario:
          "In a small finance team, the same accountant raises purchase orders, approves invoices, and runs the payment batch. A duplicate payment was just discovered.",
        instructions: "Identify the core control weakness, explain the risk, and propose a practical fix for a small team.",
        rubric: [
          { criterion: "weakness_identification", weight: 45, descriptor: "Names the segregation-of-duties failure as the root cause." },
          { criterion: "risk_explanation", weight: 30, descriptor: "Explains fraud/error exposure, not just the duplicate." },
          { criterion: "remediation", weight: 25, descriptor: "Practical, proportionate fix for a small team." },
        ],
        fewShot: [
          anchor("It was a duplicate payment by mistake, so we should be more careful and double-check payments.", 31, "Treats a structural control failure as carelessness; no segregation-of-duties insight."),
          anchor(
            "The root cause is a segregation-of-duties failure: one person initiates, approves and pays, so there is no independent check, which is exactly what allows duplicate or fraudulent payments and undermines reliable reporting. Fix for a small team: split the chain so a second person approves invoices and a different person releases the payment batch; add a system three-way match (PO/GRN/invoice) and a duplicate-invoice block; have management review a weekly payment report. This restores a basic control without large headcount.",
            90,
            "Identifies segregation of duties as the root cause, explains the exposure, and proposes a proportionate, layered remediation.",
          ),
        ],
      },
    ],
  },

  // ── Healthcare / Medicine ──────────────────────────────────────────────────
  "healthcare-medicine": {
    specialization: "Healthcare / Medicine",
    cluster: "Healthcare Quality",
    modules: [
      {
        slug: "patient-triage",
        title: "Clinical Triage & Ethics",
        level: "L3-MED",
        framework: "Clinical decision making & Medical Ethics",
        focus: "Prioritizing patient care under pressure.",
        saudiContext: "Aligns with MoH triage protocols and CBAHI patient safety standards.",
        scenario:
          "You are managing a busy ER. A patient arrives with severe chest pain (possible MI) at the same time an influential VIP demands immediate attention for a minor laceration.",
        instructions: "Explain how you handle the situation, prioritizing care while managing the VIP professionally.",
        rubric: [
          { criterion: "medical_priority", weight: 50, descriptor: "Prioritizes the chest pain (MI protocol) immediately.", gate: true },
          { criterion: "professional_communication", weight: 50, descriptor: "Politely defers the VIP without compromising medical ethics." },
        ],
        fewShot: [
          anchor("I would quickly treat the VIP to avoid trouble, then rush to the chest pain patient.", 25, "Fails the core medical ethics gate by prioritizing status over a life-threatening condition."),
          anchor(
            "Medical ethics and MoH protocols dictate immediate triage based on acuity. I would assign the critical chest pain patient to the resuscitation bay for an immediate ECG and MI protocol. I would simultaneously instruct a senior nurse to escort the VIP to a private assessment room, politely explaining that life-threatening emergencies must take precedence, but assuring them their laceration will be treated as soon as a physician is free.",
            95,
            "Correctly prioritizes the critical patient, while managing the VIP diplomatically and professionally."
          ),
        ],
      },
      {
        slug: "health-data-privacy",
        title: "Patient Data Privacy",
        level: "L3-MED",
        framework: "Data Protection & Confidentiality",
        focus: "Handling sensitive medical records securely.",
        saudiContext: "Adheres strictly to the Saudi PDPL (Personal Data Protection Law) and CBAHI privacy standards.",
        scenario:
          "A colleague from another department asks you to send a patient's full medical file via a personal WhatsApp message so they can quickly consult on a complex case.",
        instructions: "How do you respond? Explain the risks and your proposed alternative.",
        rubric: [
          { criterion: "risk_identification", weight: 50, descriptor: "Identifies WhatsApp as an insecure, non-compliant channel." },
          { criterion: "compliant_alternative", weight: 50, descriptor: "Proposes using the secure, internal Hospital Information System (HIS)." },
        ],
        fewShot: [
          anchor("I would send it to them because patient care is urgent and they need to consult on it quickly.", 20, "Completely fails data privacy standards; ignores the severe compliance and security breach of using personal messaging for health data."),
          anchor(
            "I would decline to send the file via WhatsApp. Using personal messaging apps for medical records is a severe breach of patient confidentiality and violates the Saudi PDPL and CBAHI standards. Instead, I would ask the colleague to log into the secure Hospital Information System (HIS) to review the case natively, or I would send a de-identified, encrypted summary through our official secure hospital email.",
            92,
            "Clearly identifies the compliance breach and provides a highly professional, secure alternative."
          ),
        ],
      },
      {
        slug: "quality-improvement",
        title: "Healthcare Quality Improvement",
        level: "L3-MED",
        framework: "PDSA (Plan-Do-Study-Act)",
        focus: "Addressing operational inefficiencies in a clinical setting.",
        saudiContext: "Focuses on measurable improvements aligned with the Health Sector Transformation Program.",
        scenario:
          "Your clinic has noticed a 30% increase in patient wait times over the last quarter, leading to lower patient satisfaction scores.",
        instructions: "Propose a structured approach to diagnose and fix this issue using a standard quality improvement cycle.",
        rubric: [
          { criterion: "structured_method", weight: 40, descriptor: "Uses a recognized framework like PDSA or Root Cause Analysis." },
          { criterion: "data_driven", weight: 30, descriptor: "Mentions gathering specific data (e.g., check-in times, doctor availability)." },
          { criterion: "actionable_solution", weight: 30, descriptor: "Proposes realistic operational changes to test." },
        ],
        fewShot: [
          anchor("We just need to tell the doctors to work faster and schedule fewer patients.", 30, "Lacks any structured analysis; proposes a reactive, likely harmful solution rather than diagnosing the system."),
          anchor(
            "I would use the PDSA cycle. Plan: Gather data to find the bottleneck (e.g., check-in delays vs. consultation overruns). Do: If the issue is check-in, pilot a digital pre-registration system for one week. Study: Compare the new wait times and patient satisfaction against the baseline. Act: If successful, roll the system out clinic-wide; if not, refine the approach. This ensures data-driven, measurable improvements.",
            90,
            "Applies a rigorous PDSA methodology, relies on data gathering, and proposes a safe, measurable pilot intervention."
          ),
        ],
      },
    ],
  },

  // ── Cybersecurity ──────────────────────────────────────────────────────────
  cybersecurity: {
    specialization: "Cybersecurity",
    cluster: "Cybersecurity",
    modules: [
      {
        slug: "incident-triage",
        title: "Incident Triage & Response",
        level: "L3-SEC",
        framework: "NIST IR lifecycle (detect, contain, eradicate, recover)",
        focus: "First-hour response to a suspected breach.",
        saudiContext: "Map containment and reporting to NCA ECC-1 expectations; preserve evidence.",
        scenario:
          "An endpoint alerts on suspicious encryption activity and an unknown outbound connection at 02:00. One workstation is affected; lateral movement is unconfirmed.",
        instructions: "Give your first-hour action plan in order, naming what you do first and why.",
        rubric: [
          { criterion: "containment_priority", weight: 40, descriptor: "Isolates the host first; does not power off and destroy volatile evidence prematurely.", gate: true },
          { criterion: "investigation", weight: 35, descriptor: "Checks for lateral movement, preserves logs/evidence." },
          { criterion: "communication_reporting", weight: 25, descriptor: "Escalation and NCA-aligned reporting path." },
        ],
        fewShot: [
          anchor("I would shut down the computer right away so the virus stops, then run an antivirus scan and tell people in the morning.", 32, "Powering off destroys volatile evidence and delays escalation; misses lateral-movement checks and timely reporting."),
          anchor(
            "First, isolate the host from the network (disable port / quarantine) without powering it off, to stop spread while preserving memory and logs. Second, investigate: check EDR for the process, the outbound destination, and signs of lateral movement to other hosts; snapshot volatile evidence. Third, escalate to the IR lead and begin the NCA-aligned reporting path; preserve logs for forensics. Then move to eradication and recovery from clean backups once scope is confirmed.",
            90,
            "Correct containment-first ordering with evidence preservation, lateral-movement checks, and an aligned escalation/reporting path.",
          ),
        ],
      },
      {
        slug: "access-control",
        title: "Access Control & Least Privilege",
        level: "L3-SEC",
        framework: "Principle of least privilege + RBAC",
        focus: "Right-sizing permissions after an audit finding.",
        saudiContext: "Reference NCA ECC-1 identity and access controls.",
        scenario:
          "An audit finds 40% of staff hold local-admin rights and a shared service account is used by five engineers with a password unchanged for two years.",
        instructions: "Identify the two main risks and propose a remediation plan.",
        rubric: [
          { criterion: "risk_identification", weight: 40, descriptor: "Over-privilege and shared/static credentials as the two risks." },
          { criterion: "remediation_plan", weight: 40, descriptor: "Least-privilege, individual accounts, rotation/secrets management." },
          { criterion: "feasibility", weight: 20, descriptor: "Phased, business-aware rollout." },
        ],
        fewShot: [
          anchor("We should change the shared password and tell people not to share it. The admin rights are needed for work so they can keep them.", 30, "Dismisses over-privilege, the larger risk, and only patches the password without removing the shared account."),
          anchor(
            "Two risks: (1) widespread local-admin rights vastly expand the attack surface (malware runs with admin, lateral movement is easy); (2) a shared, static service account breaks accountability and is a single credential to steal. Plan: remove local admin by default and grant just-in-time elevation for the minority who need it; replace the shared account with individual accounts (or a managed service identity) and move secrets into a vault with automatic rotation. Roll out in phases by department with a short exception process, aligned to NCA least-privilege controls.",
            89,
            "Names both risks correctly and proposes least-privilege plus individual accounts and secret rotation in a feasible, phased way.",
          ),
        ],
      },
      {
        slug: "phishing-deepdive",
        title: "Threat Analysis (Phishing Campaign)",
        level: "L3-SEC",
        framework: "Cyber kill chain + indicators of compromise",
        focus: "Analysing a phishing campaign beyond a single email.",
        saudiContext: "Coordinate awareness messaging respectfully across the hierarchy.",
        scenario:
          "Three staff report similar emails impersonating the finance director with a link to a fake login page on a look-alike domain. One user entered credentials.",
        instructions: "Outline how you scope and respond to this as a campaign, not a single email.",
        rubric: [
          { criterion: "scoping", weight: 40, descriptor: "Treats it as a campaign: search mailboxes, identify all recipients/IOCs." },
          { criterion: "credential_response", weight: 35, descriptor: "Resets the compromised credential, checks for sign-in abuse, enforces MFA.", gate: true },
          { criterion: "prevention", weight: 25, descriptor: "Blocks the domain, reports, awareness follow-up." },
        ],
        fewShot: [
          anchor("I would tell the three people to delete the email and not click links next time.", 30, "Ignores the entered credential and the campaign scope; no reset, no IOC hunt, no blocking."),
          anchor(
            "Scope it as a campaign: search all mailboxes for the sender, subject and look-alike domain to find every recipient and pull IOCs (URL, domain, sender). For the user who entered credentials: immediately reset the password, revoke active sessions, check sign-in logs for abuse from unusual locations, and confirm MFA is enforced. Prevention: block the look-alike domain and URL at the gateway, report to the provider/NCA as appropriate, purge the emails, and send a calm, respectful awareness note across the team without singling anyone out.",
            90,
            "Scopes the campaign, prioritises the compromised credential correctly, and adds blocking, reporting and proportionate awareness.",
          ),
        ],
      },
    ],
  },

  // ── Health Management / Clinical ───────────────────────────────────────────
  "health-management": {
    specialization: "Health Management",
    cluster: "Healthcare Quality",
    modules: [
      {
        slug: "clinical-risk",
        title: "Clinical Risk Assessment",
        level: "L3-HLT",
        framework: "Risk matrix (likelihood × severity) + CBAHI standards",
        focus: "Prioritising a patient-safety risk.",
        saudiContext: "Anchor to CBAHI patient-safety standards; protect staff dignity in incident review.",
        scenario:
          "A ward reports three near-miss medication errors this month, all involving look-alike/sound-alike drugs stored together. No patient harm yet.",
        instructions: "Assess the risk (likelihood/severity), state the priority, and propose two concrete mitigations.",
        rubric: [
          { criterion: "risk_assessment", weight: 40, descriptor: "Uses likelihood × severity; recognises high latent severity despite no harm yet." },
          { criterion: "systemic_thinking", weight: 35, descriptor: "Targets the storage/process root cause, not individual blame." },
          { criterion: "mitigation_quality", weight: 25, descriptor: "Concrete, CBAHI-aligned controls." },
        ],
        fewShot: [
          anchor("No patients were harmed so the risk is low. We should remind the nurses to be more careful when giving medication.", 31, "Underrates latent severity and blames staff; ignores the look-alike storage root cause."),
          anchor(
            "Risk: likelihood is high (three near-misses in a month) and potential severity is high (medication error can cause serious harm), so even with no harm yet this is a high-priority latent risk. Root cause is systemic: look-alike/sound-alike drugs stored together. Mitigations: physically separate and clearly label LASA drugs with tall-man lettering and storage alerts, and add an independent double-check for high-alert medications, both CBAHI-aligned. Track near-misses on a safety dashboard.",
            89,
            "Correctly rates a high latent risk, targets the storage system rather than staff, and proposes concrete CBAHI-aligned controls.",
          ),
        ],
      },
      {
        slug: "patient-flow",
        title: "Patient Flow & Capacity",
        level: "L3-HLT",
        framework: "Bottleneck/queue analysis (Theory of Constraints)",
        focus: "Reducing emergency-department wait times.",
        saudiContext: "Frame change to clinical staff collaboratively.",
        scenario:
          "ED wait times have risen 30%. Triage is fast, but patients wait hours for an inpatient bed; discharge paperwork clusters in the late afternoon.",
        instructions: "Identify the likely bottleneck and propose a flow improvement with a way to measure it.",
        rubric: [
          { criterion: "bottleneck_identification", weight: 45, descriptor: "Locates the constraint downstream (bed/discharge), not triage." },
          { criterion: "improvement", weight: 35, descriptor: "Concrete flow change (early discharge, discharge lounge)." },
          { criterion: "measurement", weight: 20, descriptor: "A metric to confirm the fix." },
        ],
        fewShot: [
          anchor("We should add more triage nurses so patients are seen faster at the front.", 33, "Adds capacity at a non-bottleneck; the constraint is downstream bed/discharge, not triage."),
          anchor(
            "The bottleneck is downstream: discharges clustering late afternoon delay bed turnover, so ED patients wait for inpatient beds despite fast triage. Improvement: move discharges earlier with a morning discharge round and criteria-led discharge, and open a discharge lounge so beds free up before midday. Measure: median discharge time and bed-turnaround time, plus the ED boarding hours, before and after, to confirm the wait drops.",
            88,
            "Correctly relocates the constraint to discharge/bed turnover and proposes a measurable flow change.",
          ),
        ],
      },
      {
        slug: "health-data-privacy",
        title: "Health Data Privacy",
        level: "L3-HLT",
        framework: "PDPL + clinical confidentiality",
        focus: "Handling a request that risks a privacy breach.",
        saudiContext: "Apply the Saudi PDPL and SDAIA data rules; no patient data to unauthorised channels.",
        scenario:
          "A manager asks you to email a spreadsheet of patient names, diagnoses and phone numbers to an external marketing vendor for a wellness campaign.",
        instructions: "State whether and how you proceed, and what you require before any data is shared.",
        rubric: [
          { criterion: "privacy_identification", weight: 45, descriptor: "Recognises sensitive health data and the PDPL/consent issue.", gate: true },
          { criterion: "lawful_basis", weight: 35, descriptor: "Requires consent/lawful basis, minimisation, a data agreement." },
          { criterion: "professional_handling", weight: 20, descriptor: "Refuses the unsafe path respectfully and offers a compliant alternative." },
        ],
        fewShot: [
          anchor("The manager approved it, so I would send the spreadsheet to the vendor so the campaign can start.", 30, "Sends sensitive health data externally with no consent or safeguards; a clear PDPL breach."),
          anchor(
            "I would not send identifiable patient health data to an external vendor as-is, this is sensitive data under the PDPL and disclosing it without a lawful basis breaches confidentiality. Before anything is shared I would require: explicit patient consent or another lawful basis, data minimisation (only fields strictly needed), a signed data-processing agreement with the vendor, and secure transfer, not email. A compliant alternative is to run the outreach internally or share only aggregated/de-identified data. I would raise this respectfully with the manager as a compliance constraint.",
            90,
            "Identifies the sensitive-data/PDPL issue, sets consent/minimisation/agreement requirements, and offers a compliant alternative.",
          ),
        ],
      },
    ],
  },

  // ── AI / Data Science ──────────────────────────────────────────────────────
  ai: {
    specialization: "Artificial Intelligence / Data Science",
    cluster: "AI & Data",
    modules: [
      {
        slug: "model-evaluation",
        title: "Model Evaluation under Imbalance",
        level: "L3-AI",
        framework: "Precision/recall trade-off + confusion matrix",
        focus: "Choosing the right metric for an imbalanced problem.",
        saudiContext: "Technical module; align deployment claims with SDAIA AI Ethics 2.0.",
        scenario:
          "A fraud model on a dataset that is 1% fraud reports 99% accuracy. Stakeholders want to ship it.",
        instructions: "Explain whether 99% accuracy justifies shipping, which metrics you would report instead, and why.",
        rubric: [
          { criterion: "metric_understanding", weight: 50, descriptor: "Explains why accuracy misleads on imbalance; cites precision/recall.", gate: true },
          { criterion: "tradeoff_reasoning", weight: 30, descriptor: "Connects the metric choice to the business cost of FN vs FP." },
          { criterion: "communication", weight: 20, descriptor: "Clear explanation for non-technical stakeholders." },
        ],
        fewShot: [
          anchor("99% accuracy is excellent, so we should ship the fraud model, it is right almost all the time.", 30, "Falls for the accuracy trap on a 1% base rate; a model predicting 'no fraud' scores 99% yet catches nothing."),
          anchor(
            "No, 99% accuracy is misleading here: with 1% fraud, always predicting 'not fraud' already scores 99% while catching zero fraud. I would report recall (share of real fraud caught) and precision (share of flagged cases that are truly fraud), plus the confusion matrix and PR-AUC. The right operating point depends on cost: missing fraud (false negatives) is usually costlier than reviewing a false positive, so I would favour recall while keeping precision high enough that analysts are not swamped, and present it as a trade-off rather than a single accuracy number.",
            90,
            "Correctly debunks the accuracy trap, names the right metrics, and ties the operating point to FN/FP cost.",
          ),
        ],
      },
      {
        slug: "data-leakage",
        title: "Data Leakage & Validation",
        level: "L3-AI",
        framework: "Train/test discipline + leakage detection",
        focus: "Diagnosing an implausibly good result.",
        saudiContext: "Technical module; culturally neutral.",
        scenario:
          "A teammate reports 100% validation accuracy on a churn model after scaling features on the full dataset before splitting and including a 'days_since_cancellation' feature.",
        instructions: "Explain what likely went wrong and how you would fix the validation.",
        rubric: [
          { criterion: "leakage_identification", weight: 50, descriptor: "Spots target leakage and fit-before-split scaling.", gate: true },
          { criterion: "remediation", weight: 35, descriptor: "Fit scaler on train only; remove leaky feature; proper CV." },
          { criterion: "rigor", weight: 15, descriptor: "Healthy scepticism toward a perfect score." },
        ],
        fewShot: [
          anchor("100% accuracy means the model is very good, we should use it. Maybe the data was just easy to predict.", 32, "Accepts a perfect score uncritically and misses both leakage sources."),
          anchor(
            "100% is a red flag for leakage, not a great model. Two issues: 'days_since_cancellation' is target leakage (it only exists after churn happens), and scaling on the full dataset before the split leaks test statistics into training. Fix: drop the leaky feature (and any post-event fields), build a pipeline that fits the scaler on the training fold only, and use proper cross-validation or a time-based split. Re-evaluate, the realistic score will be lower but trustworthy.",
            91,
            "Identifies both target leakage and preprocessing leakage and prescribes the correct pipeline/CV fix.",
          ),
        ],
      },
      {
        slug: "responsible-ai",
        title: "Responsible AI & Bias",
        level: "L3-AI",
        framework: "Fairness/bias auditing + SDAIA AI Ethics 2.0",
        focus: "Handling a fairness concern before deployment.",
        saudiContext: "Apply SDAIA AI Ethics 2.0 and the PDPL; document decisions.",
        scenario:
          "A hiring-screen model performs well overall but selects far fewer candidates from one region. The team wants to deploy and 'monitor later'.",
        instructions: "State whether you would deploy as-is and what you would do about the disparity.",
        rubric: [
          { criterion: "harm_recognition", weight: 40, descriptor: "Recognises disparate impact as a deployment-blocking fairness risk." },
          { criterion: "mitigation", weight: 35, descriptor: "Audit the cause, fix data/features/threshold, re-test by group." },
          { criterion: "governance", weight: 25, descriptor: "Human oversight, documentation, SDAIA/PDPL alignment." },
        ],
        fewShot: [
          anchor("The model is accurate overall so we should deploy it and check the fairness issue later if it becomes a problem.", 31, "Treats a known disparate-impact harm as a deferrable monitoring item; deploys an unfair model."),
          anchor(
            "I would not deploy as-is: a large selection gap for one region is disparate impact and a deployment-blocking fairness risk, not a 'later' item. First audit the cause, biased training labels, a proxy feature for region, or an unsuitable threshold, then mitigate (remove/repair the proxy, re-balance data, calibrate thresholds) and re-test performance and selection rates by group. Add human oversight on screened-out candidates, document the assessment, and align to SDAIA AI Ethics 2.0 and the PDPL before any rollout.",
            90,
            "Treats disparate impact as blocking, audits root cause, mitigates and re-tests by group, and adds governance aligned to SDAIA/PDPL.",
          ),
        ],
      },
    ],
  },
};

// ═════════════════════════════════════════════════════════════════════════════
//  SINGLE Job-Fit registry — one path for every specialization string
// ═════════════════════════════════════════════════════════════════════════════

/**
 * V1 pilot universal module codes — DEAD / test-only.
 * Live assessment uses full UNIVERSAL_MODULES (47) via modulesForSpecialization.
 * Do not wire this into the modules API or UI.
 */
export const V1_UNIVERSAL_MODULE_CODES = [
  "M01",
  "M02",
  "M03",
  "M04",
  "M08",
  "M11",
  "M16",
  "M18",
  "M19",
  "M41",
  "M46",
  "M47",
] as const;

/** Catalog-backed Job-Fit track (real Mxx codes — never duplicated as JOBFIT-*). */
export interface CatalogJobFitTrack {
  kind: "catalog";
  /** Exactly three Level-3 catalog module codes. */
  codes: readonly [string, string, string];
  label: string;
  cluster: string;
}

/** Blueprint-backed Job-Fit track (no L3 catalog equivalent). */
export interface BlueprintJobFitTrack {
  kind: "blueprint";
  blueprintKey: string;
}

export type JobFitTrack = CatalogJobFitTrack | BlueprintJobFitTrack;

/**
 * Canonical specialization → exactly-3 Job-Fit modules.
 *
 * L3 tracks point at real catalog codes (Module Catalog tracks A–F;
 * CS/IT composed track M30+M37+M38 per Appendix C sign-off checklist).
 * Blueprints cover fields with no L3 equivalent.
 */
export const JOBFIT_TRACKS: Record<string, JobFitTrack> = {
  // ── Level-3 catalog tracks (real Mxx) ──────────────────────────────────────
  "computer-science": {
    kind: "catalog",
    // Appendix C: CS/IT composed track = M30 (Data Analysis) + M37/M38 (Web Development)
    codes: ["M30", "M37", "M38"],
    label: "Computer Science / IT",
    cluster: "Software & Digital",
  },
  "web-development": {
    kind: "catalog",
    codes: ["M36", "M37", "M38"],
    label: "Web Development",
    cluster: "Software & Digital",
  },
  "data-analysis": {
    kind: "catalog",
    codes: ["M30", "M31", "M32"],
    label: "Data Analysis",
    cluster: "AI & Data",
  },
  "digital-marketing": {
    kind: "catalog",
    codes: ["M21", "M22", "M23"],
    label: "Digital Marketing",
    cluster: "Digital Economy",
  },
  "business-development": {
    kind: "catalog",
    codes: ["M24", "M25", "M26"],
    label: "Business Development",
    cluster: "Digital Economy",
  },
  "project-management": {
    kind: "catalog",
    codes: ["M27", "M28", "M29"],
    label: "Project Management",
    cluster: "National Workforce",
  },
  "human-resources": {
    kind: "catalog",
    codes: ["M33", "M34", "M35"],
    label: "Human Resources",
    cluster: "Human Capital",
  },
  // ── Curated blueprints (no L3 catalog equivalent) ──────────────────────────
  accounting: { kind: "blueprint", blueprintKey: "accounting" },
  "healthcare-medicine": { kind: "blueprint", blueprintKey: "healthcare-medicine" },
  cybersecurity: { kind: "blueprint", blueprintKey: "cybersecurity" },
  "health-management": { kind: "blueprint", blueprintKey: "health-management" },
  ai: { kind: "blueprint", blueprintKey: "ai" },
};

/**
 * Alias map → canonical JOBFIT_TRACKS key.
 * Every former SPEC_ALIASES entry is preserved; display-label and hyphenated
 * forms that previously fell through to generic or collided are closed here.
 */
const SPEC_ALIASES: Record<string, string> = {
  // Accounting / Finance
  finance: "accounting",
  "islamic-finance": "accounting",
  banking: "accounting",
  "accounting-finance": "accounting", // display label "Accounting / Finance"

  // Computer Science / IT (NOT web-development — that is its own track)
  "information-technology": "computer-science",
  it: "computer-science",
  "software-engineering": "computer-science",
  "computer-science-it": "computer-science", // display label "Computer Science / IT"
  "cs-it": "computer-science", // free-text "CS/IT"

  // Healthcare
  healthcare: "healthcare-medicine", // bare "Healthcare"
  nursing: "health-management",
  "clinical-nursing": "health-management",
  medicine: "health-management",
  "public-health": "health-management",
  "hospital-management": "health-management",
  "hospital": "health-management",
  "health-administration": "health-management",
  "healthcare-administration": "health-management",
  "healthcare-management": "health-management",

  // Cybersecurity
  "information-security": "cybersecurity",

  // AI / Data Science (NOT data-analysis — that is its own L3 track)
  "data-science": "ai",
  "machine-learning": "ai",
  "artificial-intelligence": "ai",
  "artificial-intelligence-data-science": "ai", // display label
};

/** Look up a catalog module by code (throws only if the static catalog is corrupt). */
export function catalogModuleByCode(code: string): AssessmentModuleSpec {
  const found = UNIVERSAL_MODULES.find((m) => m.code === code);
  if (!found) {
    throw new Error(`Catalog integrity error: module ${code} missing from UNIVERSAL_MODULES`);
  }
  return found;
}

/** DEAD / test-only — returns the old 12-module V1 pilot subset. Live path uses UNIVERSAL_MODULES. */
export function v1UniversalModules(): AssessmentModuleSpec[] {
  return V1_UNIVERSAL_MODULE_CODES.map((code) => catalogModuleByCode(code));
}

/** Resolve free-text specialization to a JOBFIT_TRACKS key, or null → generic. */
export function resolveJobFitTrackKey(specialization: string): string | null {
  const key = normalizeSpec(specialization);
  if (!key) return null;
  const canonical = SPEC_ALIASES[key] ?? key;
  return JOBFIT_TRACKS[canonical] ? canonical : null;
}

/**
 * Canonical display label for persistence on EmployabilityProfile /
 * AssessmentResponse. Uses the same alias resolution as Job-Fit routing
 * (`resolveJobFitTrackKey` → track label / blueprint.specialization).
 *
 * - Known track / alias → JOBFIT_TRACKS canonical label
 *   (e.g. "AI" / "Data Science" → "Artificial Intelligence / Data Science")
 * - Unknown free-text → trimmed input (generic Job-Fit path)
 * - null / blank → null
 *
 * Write-path only — do not backfill historical rows (e.g. the single
 * pre-existing EmployabilityProfile "Artificial Intelligence" row).
 */
export function canonicalSpecializationLabel(
  specialization: string | null | undefined,
): string | null {
  if (specialization == null) return null;
  const trimmed = specialization.trim();
  if (!trimmed) return null;

  const trackKey = resolveJobFitTrackKey(trimmed);
  if (trackKey) {
    const track = JOBFIT_TRACKS[trackKey];
    if (track.kind === "catalog") return track.label;
    const curated = JOBFIT_BLUEPRINTS[track.blueprintKey];
    if (curated) return curated.specialization;
  }
  return trimmed;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Generic Job-Fit generator — deterministic, for ANY specialization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lightweight discipline cues for the deterministic fallback.
 * Named frameworks / foci mirror Module Catalog §4 structure (framework, focus,
 * saudi-context note, scenario, instructions, rubric summing to 100) without
 * live AI. Unknown fields still get a coherent, field-parameterised trio.
 */
function disciplineCues(field: string): {
  diagnosisFramework: string;
  methodFramework: string;
  qualityFramework: string;
  diagnosisFocus: string;
  methodFocus: string;
  qualityFocus: string;
  diagnosisScenario: string;
  methodScenario: string;
  qualityScenario: string;
  saudiNote: (authority: string, cluster: string) => string;
} {
  const f = field.trim() || "General Professional Practice";
  const lower = f.toLowerCase();

  if (/supply.?chain|logistic|procur|ops|operations|inventory/.test(lower)) {
    return {
      diagnosisFramework: "Theory of Constraints + root-cause (5 Whys / fishbone)",
      methodFramework: "SCOR / inventory & service-level trade-off analysis",
      qualityFramework: "Process control + contract / delivery compliance",
      diagnosisFocus: `Diagnosing a recurring ${f} bottleneck (lead time, fill rate, or cost-to-serve).`,
      methodFocus: `Applying a core ${f} planning or control method to a concrete operational task.`,
      qualityFocus: `Reviewing a ${f} plan or shipment pack for substantive defects before release.`,
      diagnosisScenario: `A ${f} cell is missing OTIF targets for three consecutive weeks. Leadership wants the constraint identified and a fix that does not just add buffer stock.`,
      methodScenario: `You must set a reorder point for a fast-moving SKU given demand variability and a stated service-level target. A common trap is treating average demand as if it were certain.`,
      qualityScenario: `A supplier schedule and ASN pack look complete but hide at least one substantive defect (wrong Incoterms, missing lot traceability, or an unsafe expedite path).`,
      saudiNote: (authority, cluster) =>
        `Light-touch: ground the recommendation in ${cluster} practice and ${authority} expectations for reliable national logistics.`,
    };
  }
  if (/marine|biology|life scien|environ|ecology|lab/.test(lower)) {
    return {
      diagnosisFramework: "Scientific method + evidence hierarchy",
      methodFramework: `${f} field / lab protocol application`,
      qualityFramework: "Research integrity + safety / ethics compliance",
      diagnosisFocus: `Diagnosing an anomalous ${f} result or field observation with a defensible hypothesis.`,
      methodFocus: `Correctly applying a core ${f} method or protocol to a concrete task.`,
      qualityFocus: `Reviewing ${f} work for methodological or compliance defects before dissemination.`,
      diagnosisScenario: `A ${f} team sees a recurring anomaly in field or lab readings that is hurting a key research or operational outcome. Leadership wants root cause, not another symptom patch.`,
      methodScenario: `You are given a concrete ${f} task with a common methodological trap that distinguishes careful from careless practice.`,
      qualityScenario: `A draft ${f} report or protocol looks acceptable at a glance but contains at least one substantive quality, safety, or ethics defect.`,
      saudiNote: (authority, cluster) =>
        `Light-touch: align methods and reporting with ${authority} norms where ${cluster} oversight applies.`,
    };
  }
  if (/educat|teach|pedagog|curricul|training/.test(lower)) {
    return {
      diagnosisFramework: "Instructional design (ADDIE) + learning-outcome alignment",
      methodFramework: "Assessment design / constructive alignment",
      qualityFramework: "ETEC/NCAAA-aligned quality review",
      diagnosisFocus: `Diagnosing a learning or delivery problem in ${f} and recommending a defensible intervention.`,
      methodFocus: `Applying a core ${f} method (e.g. outcome alignment, formative assessment) to a concrete task.`,
      qualityFocus: `Reviewing ${f} materials for quality and accreditation/compliance gaps.`,
      diagnosisScenario: `A ${f} cohort is underperforming on a stated learning outcome for two consecutive terms. Leadership wants root cause and a prioritised fix.`,
      methodScenario: `You must redesign one assessment task so it constructively aligns to a stated CLO, avoiding the common trap of testing recall only.`,
      qualityScenario: `A course pack looks polished but contains at least one substantive alignment or academic-integrity defect.`,
      saudiNote: (authority, cluster) =>
        `Light-touch: frame recommendations against ${authority} expectations in the ${cluster} sector.`,
    };
  }
  if (/law|legal|shariah|compliance|govern|policy/.test(lower)) {
    return {
      diagnosisFramework: "Issue-spotting + IRAC / structured legal analysis",
      methodFramework: `${f} doctrine / procedure application`,
      qualityFramework: "Professional ethics + regulatory compliance review",
      diagnosisFocus: `Issue-spotting a realistic ${f} problem and recommending a defensible course of action.`,
      methodFocus: `Correctly applying a core ${f} method or doctrine to a concrete fact pattern.`,
      qualityFocus: `Reviewing ${f} work for substantive defects and compliance gaps.`,
      diagnosisScenario: `A client matter in ${f} presents conflicting facts and an unclear duty. Leadership wants the real legal issue framed, not a generic summary.`,
      methodScenario: `You are given a fact pattern that requires correct application of a core ${f} rule, with a common trap that weak practitioners miss.`,
      qualityScenario: `A draft memo or filing looks acceptable but hides at least one substantive legal or ethical defect.`,
      saudiNote: (authority, cluster) =>
        `Light-touch: anchor reasoning to ${authority} and ${cluster} practice; raise gaps constructively.`,
    };
  }
  if (/engineer|civil|mechanical|electric|industrial|construct/.test(lower)) {
    return {
      diagnosisFramework: "Engineering root-cause (fault tree / 5 Whys) + risk ranking",
      methodFramework: `${f} calculation / design-check method`,
      qualityFramework: "SASO / code compliance + safety review",
      diagnosisFocus: `Diagnosing a recurring ${f} performance or safety problem with a defensible fix.`,
      methodFocus: `Applying a core ${f} method or calculation correctly to a concrete task.`,
      qualityFocus: `Reviewing ${f} deliverables for defects and code/compliance gaps.`,
      diagnosisScenario: `A ${f} asset or process is failing a key performance or safety metric. Leadership wants root cause and a prioritised remediation.`,
      methodScenario: `You must apply a standard ${f} method to a design or verification task; a common shortcut produces an unsafe or non-compliant result.`,
      qualityScenario: `A drawing package or calculation note looks complete but contains at least one substantive safety or compliance defect.`,
      saudiNote: (authority, cluster) =>
        `Light-touch: align to ${authority} expectations for ${cluster} work on Vision 2030 projects where relevant.`,
    };
  }

  // Default — still §4-shaped, field-parameterised, never crashes
  return {
    diagnosisFramework: `${f} professional problem-solving (define → analyse → recommend)`,
    methodFramework: `${f} core methods and tools`,
    qualityFramework: `${f} quality standards + regulatory compliance`,
    diagnosisFocus: `Diagnosing a realistic ${f} problem and recommending a defensible course of action.`,
    methodFocus: `Correctly applying a core ${f} method or tool to a concrete task.`,
    qualityFocus: `Reviewing ${f} work for substantive defects and compliance gaps.`,
    diagnosisScenario: `A ${f} team faces a recurring operational problem that is hurting a key outcome. Leadership wants the root cause and a fix, not a symptom patch.`,
    methodScenario: `You are given a concrete ${f} task that requires the correct application of a core method or tool of the field, with a common trap that distinguishes proficient from weak practitioners.`,
    qualityScenario: `You are asked to review a piece of ${f} work before it goes out. It looks acceptable at a glance but contains at least one substantive quality or compliance defect.`,
    saudiNote: (authority, cluster) =>
      `Light-touch Saudi-context note: ground recommendations in ${cluster} practice and ${authority} expectations where they genuinely apply to ${f}.`,
  };
}

/**
 * Builds a credible 3-module Job-Fit blueprint for a specialization that has no
 * curated track. Structure follows Module Catalog §4: named framework, focus,
 * light-touch Saudi-context note, scenario, candidate instructions, rubric
 * (weights → 100). Deterministic only — no live model calls.
 */
export function generateGenericJobFit(specialization: string): JobFitBlueprint {
  const field = specialization.trim() || "General Professional Practice";
  const reg = resolveRegulator(field);
  const authority = reg.authorities[0] ?? "Vision 2030";
  const cues = disciplineCues(field);
  const saudiBase = cues.saudiNote(authority, reg.cluster);

  return {
    specialization: field,
    cluster: reg.cluster,
    modules: [
      {
        slug: "applied-diagnosis",
        title: `Applied Problem Diagnosis (${field})`,
        level: "L3-GEN",
        framework: cues.diagnosisFramework,
        focus: cues.diagnosisFocus,
        saudiContext: saudiBase,
        scenario: cues.diagnosisScenario,
        instructions: `Define the problem precisely, analyse the likely root causes specific to ${field}, and recommend a prioritised action with one risk and one safeguard.`,
        rubric: [
          { criterion: "problem_definition", weight: 30, descriptor: "Frames the real problem, not the symptom." },
          { criterion: "domain_root_cause", weight: 40, descriptor: `Root-cause reasoning grounded in ${field} fundamentals.` },
          { criterion: "decision_quality", weight: 30, descriptor: "Defensible, prioritised recommendation with a safeguard." },
        ],
        fewShot: [
          anchor(
            "The problem is that things are not working well, so we should just try harder and fix it quickly.",
            32,
            "No precise definition, no domain root-cause analysis, and a generic action with no safeguard.",
          ),
          anchor(
            `I would first define the problem in measurable terms specific to ${field}, then analyse the likely root causes using ${field} fundamentals rather than assuming the obvious one, prioritise the highest-impact cause supported by evidence, and recommend a targeted fix, naming the main risk and a safeguard/monitoring step. ${saudiBase}`,
            87,
            "Defines the problem, reasons about domain-specific root causes, and gives a prioritised, safeguarded recommendation.",
          ),
        ],
      },
      {
        slug: "method-application",
        title: `Core Method Application (${field})`,
        level: "L3-GEN",
        framework: cues.methodFramework,
        focus: cues.methodFocus,
        saudiContext: `Technical module; align outputs with ${authority} norms where relevant to ${field}.`,
        scenario: cues.methodScenario,
        instructions: `Apply the appropriate ${field} method to the task, show your working, and explain why your approach is correct and the common wrong approach is not.`,
        rubric: [
          { criterion: "correctness", weight: 50, descriptor: `Selects and applies the right ${field} method correctly.`, gate: true },
          { criterion: "method_justification", weight: 30, descriptor: "Explains why this method fits and the common alternative fails." },
          { criterion: "clarity", weight: 20, descriptor: "Clear, well-structured working." },
        ],
        fewShot: [
          anchor(
            "I would use whatever method is easiest and assume the result is fine.",
            33,
            "No deliberate method selection, no justification, and no awareness of the common trap.",
          ),
          anchor(
            `I would select the standard ${field} method that fits this task, apply it step by step with the working shown, and justify it against the common shortcut that practitioners get wrong, explaining why that shortcut produces an incorrect result here. The reasoning rests on ${field} fundamentals.`,
            88,
            "Selects and applies the correct method with justification against the common trap, and clear working.",
          ),
        ],
      },
      {
        slug: "quality-compliance",
        title: `Quality & Compliance Review (${field})`,
        level: "L3-GEN",
        framework: cues.qualityFramework,
        focus: cues.qualityFocus,
        saudiContext: `Anchor the review to ${authority} requirements that genuinely apply to ${field}; raise gaps constructively.`,
        scenario: cues.qualityScenario,
        instructions: `Identify the substantive defect(s), explain why each matters for ${field} quality or ${authority} compliance, and state how to fix them.`,
        rubric: [
          { criterion: "defect_identification", weight: 50, descriptor: "Finds substantive defects, not cosmetics." },
          { criterion: "compliance_reasoning", weight: 30, descriptor: `Explains impact on ${field} quality / ${authority} compliance.` },
          { criterion: "remediation", weight: 20, descriptor: "Concrete, proportionate fixes." },
        ],
        fewShot: [
          anchor(
            "It looks fine to me, maybe fix a couple of small wording things and send it.",
            31,
            "Raises only cosmetics and misses the substantive quality/compliance defect.",
          ),
          anchor(
            `I would flag the substantive defect(s) rather than cosmetics, explain why each matters for ${field} quality and for ${authority} compliance, and specify a concrete, proportionate fix for each before the work goes out. This protects both quality and the relevant standard.`,
            88,
            "Identifies substantive defects, ties them to quality/compliance impact, and gives concrete fixes.",
          ),
        ],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Public resolution API — ONE path, always exactly 47 modules
// ─────────────────────────────────────────────────────────────────────────────

function materializeBlueprint(
  blueprint: JobFitBlueprint,
  source: "curated" | "generic",
): AssessmentModuleSpec[] {
  const specKey = normalizeSpec(blueprint.specialization).toUpperCase() || "GENERIC";
  return blueprint.modules.map((t, i) =>
    mod({
      code: `JOBFIT-${specKey}-${i + 1}`,
      title: t.title,
      titleAr: t.titleAr,
      dimension: "job_fit",
      level: t.level,
      framework: t.framework,
      focus: t.focus,
      saudiContext: t.saudiContext,
      scenario: t.scenario,
      instructions: t.instructions,
      rubric: t.rubric,
      fewShot: t.fewShot,
      specialization: blueprint.specialization,
      generated: source === "generic",
      estimateMinutes: 15,
    }),
  );
}

/**
 * Resolve the Job-Fit blueprint for a specialization.
 * Catalog-backed tracks synthesise a blueprint view from the real Mxx modules
 * so existing callers of resolveJobFitBlueprint keep working; runtime module
 * codes for those tracks remain the real catalog codes via jobFitModulesFor.
 */
export function resolveJobFitBlueprint(specialization: string): {
  blueprint: JobFitBlueprint;
  source: "curated" | "generic";
} {
  const trackKey = resolveJobFitTrackKey(specialization);
  if (trackKey) {
    const track = JOBFIT_TRACKS[trackKey];
    if (track.kind === "blueprint") {
      const curated = JOBFIT_BLUEPRINTS[track.blueprintKey];
      if (curated) return { blueprint: curated, source: "curated" };
    } else {
      // Catalog track → blueprint-shaped view of the three real modules
      const modules = track.codes.map((code) => {
        const m = catalogModuleByCode(code);
        return {
          slug: code.toLowerCase(),
          title: m.title,
          titleAr: m.titleAr,
          level: m.level,
          framework: m.framework,
          focus: m.focus,
          saudiContext: m.saudiContext,
          scenario: m.scenario,
          instructions: m.instructions,
          rubric: m.rubric,
          fewShot: m.fewShot,
        } satisfies JobFitModuleTemplate;
      });
      return {
        blueprint: {
          specialization: track.label,
          cluster: track.cluster,
          modules,
        },
        source: "curated",
      };
    }
  }
  return { blueprint: generateGenericJobFit(specialization), source: "generic" };
}

/** Exactly three Job-Fit modules for a specialization (catalog codes or JOBFIT-*). */
export function jobFitModulesFor(specialization: string): {
  modules: AssessmentModuleSpec[];
  source: "curated" | "generic";
  cluster: string;
} {
  const trackKey = resolveJobFitTrackKey(specialization);
  if (trackKey) {
    const track = JOBFIT_TRACKS[trackKey];
    if (track.kind === "catalog") {
      const modules = track.codes.map((code) => {
        const m = catalogModuleByCode(code);
        return {
          ...m,
          dimension: "job_fit" as const,
          specialization: track.label,
          generated: false,
        };
      });
      return { modules, source: "curated", cluster: track.cluster };
    }
    const curated = JOBFIT_BLUEPRINTS[track.blueprintKey];
    if (curated) {
      return {
        modules: materializeBlueprint(curated, "curated"),
        source: "curated",
        cluster: curated.cluster,
      };
    }
  }
  const blueprint = generateGenericJobFit(specialization);
  return {
    modules: materializeBlueprint(blueprint, "generic"),
    source: "generic",
    cluster: blueprint.cluster,
  };
}

// ── CS/IT Job-Fit replacements for unrelated universal slots (ISC-QA-004) ───
const CS_JOBFIT_REPLACEMENTS: Record<string, Partial<AssessmentModuleSpec>> = {
  M21: {
    title: "Algorithms & Data Structures",
    titleAr: "الخوارزميات وهياكل البيانات",
    framework: "Big-O Time/Space Complexity & Data Structure Selection",
    focus: "Selecting optimal data structures and algorithms for performance.",
    saudiContext: "Aligned to Vision 2030 digital transformation and SDAIA technical standards.",
    scenario: "A high-throughput service processes 100,000 user requests per second. The current implementation uses nested loops over unindexed arrays, causing severe latency spikes.",
    instructions: "Identify the algorithmic complexity bottleneck, propose an optimal data structure (e.g. Hash Map, Trie, or Balanced Tree), and explain how it reduces time complexity.",
    rubric: [
      { criterion: "complexity_analysis", weight: 40, descriptor: "Accurately identifies Big-O bottleneck." },
      { criterion: "data_structure_choice", weight: 40, descriptor: "Selects appropriate data structure for target performance." },
      { criterion: "tradeoff_reasoning", weight: 20, descriptor: "Explains space vs time trade-offs clearly." },
    ],
  },
  M22: {
    title: "System Design & Scalability",
    titleAr: "تصميم الأنظمة وهندسة التوسع",
    framework: "Distributed Systems Architecture & Load Balancing",
    focus: "Designing scalable, fault-tolerant system architectures.",
    saudiContext: "Aligned to NCA cybersecurity controls and National Data Management Office guidelines.",
    scenario: "A national e-government portal experiences sudden 10x traffic bursts during registration periods. Database connections saturate and crash the application servers.",
    instructions: "Propose a system architecture incorporating caching (Redis), load balancing, and read-replicas to handle peak load without downtime.",
    rubric: [
      { criterion: "architecture_design", weight: 40, descriptor: "Proposes robust distributed architecture." },
      { criterion: "bottleneck_mitigation", weight: 40, descriptor: "Solves database saturation via caching and decoupling." },
      { criterion: "fault_tolerance", weight: 20, descriptor: "Ensures high availability during peak traffic." },
    ],
  },
  M23: {
    title: "Software Security & Vulnerability Analysis",
    titleAr: "أمان البرمجيات وتحليل الثغرات",
    framework: "OWASP Top 10 & Secure Coding Standards",
    focus: "Identifying and remediating application security vulnerabilities.",
    saudiContext: "Aligned to NCA ECC-1 cybersecurity controls and CITC data security frameworks.",
    scenario: "A code review reveals dynamic SQL concatenation in an authentication endpoint and unvalidated user input rendered directly into the DOM.",
    instructions: "Identify the two major security vulnerabilities (SQL Injection and XSS), explain the exploit mechanics, and write the parameterized / sanitized code remediation.",
    rubric: [
      { criterion: "vulnerability_identification", weight: 40, descriptor: "Correctly identifies SQLi and XSS vulnerabilities." },
      { criterion: "remediation_quality", weight: 40, descriptor: "Provides parameterized queries and input sanitization." },
      { criterion: "security_awareness", weight: 20, descriptor: "Understands OWASP secure coding principles." },
    ],
  },
  M24: {
    title: "API Design & Integration",
    titleAr: "تصميم وتكامل واجهات البرمجة",
    framework: "RESTful Principles & OpenAPI Specification",
    focus: "Designing clean, scalable, and secure Web APIs.",
    saudiContext: "Aligned to Saudi Government Enterprise Architecture (DEA) interoperability standards.",
    scenario: "An enterprise integration requires exposing student academic records to third-party verification services. The proposed API sends passwords in GET query parameters and lacks rate limiting.",
    instructions: "Redesign the API specification using RESTful best practices: HTTPS, POST/OAuth2 authentication, structured JSON error responses, and rate limiting headers.",
    rubric: [
      { criterion: "api_design_best_practices", weight: 40, descriptor: "Follows RESTful conventions and HTTP status codes." },
      { criterion: "security_implementation", weight: 40, descriptor: "Enforces OAuth2/HTTPS and rate limiting." },
      { criterion: "error_handling", weight: 20, descriptor: "Provides structured error payloads." },
    ],
  },
  M25: {
    title: "DevOps & CI/CD Pipeline Automation",
    titleAr: "أتمتة عمليات التطوير والإنتاج (DevOps)",
    framework: "Continuous Integration / Continuous Deployment & Infrastructure as Code",
    focus: "Automating software build, test, and deployment pipelines.",
    saudiContext: "Aligned to SDAIA cloud computing adoption and modern software delivery standards.",
    scenario: "Deployments to production are manual, taking 4 hours via FTP upload. Bug fixes frequently break live features because tests are only run locally on developer machines.",
    instructions: "Design an automated CI/CD pipeline (e.g. GitHub Actions / GitLab CI) including linting, automated unit/integration tests, staging preview builds, and zero-downtime production deployment.",
    rubric: [
      { criterion: "pipeline_architecture", weight: 40, descriptor: "Designs comprehensive automated CI/CD pipeline." },
      { criterion: "quality_gates", weight: 40, descriptor: "Integrates mandatory test and lint gates before release." },
      { criterion: "deployment_strategy", weight: 20, descriptor: "Specifies safe deployment strategy (blue/green or canary)." },
    ],
  },
  M26: {
    title: "Concurrency & Asynchronous Processing",
    titleAr: "المعالجة المتزامنة وغير المتزامنة",
    framework: "Async/Await, Thread Pools & Message Queues",
    focus: "Handling concurrent operations without race conditions or deadlocks.",
    saudiContext: "Aligned to high-performance enterprise computing requirements.",
    scenario: "A payment processing module blocks the main event loop while waiting 5 seconds for third-party bank gateways, freezing the UI for all connected users.",
    instructions: "Refactor the synchronous blocking call into an asynchronous non-blocking worker queue architecture (e.g., Redis queue / async workers), explaining how event-loop blocking is prevented.",
    rubric: [
      { criterion: "concurrency_understanding", weight: 40, descriptor: "Identifies event-loop blocking root cause." },
      { criterion: "async_architecture", weight: 40, descriptor: "Proposes queue-based worker pattern for long-running tasks." },
      { criterion: "thread_safety", weight: 20, descriptor: "Ensures race-free state handling." },
    ],
  },
  M33: {
    title: "Cloud Computing & Infrastructure",
    titleAr: "الحوسبة السحابية والبنية التحتية",
    framework: "Cloud Native Architecture & Cloud Security",
    focus: "Deploying and managing cloud infrastructure and microservices.",
    saudiContext: "Aligned to KSA Cloud First Policy and CST cloud service provider regulations.",
    scenario: "An organization is migrating an on-premise monolithic application to a cloud provider. The initial plan copies hardcoded local file paths and database connection strings into container environment variables.",
    instructions: "Outline a cloud-native refactoring strategy: containerization (Docker), secret management (Key Vault), object storage (S3/R2), and autoscaling groups.",
    rubric: [
      { criterion: "cloud_architecture", weight: 40, descriptor: "Applies cloud-native design patterns appropriately." },
      { criterion: "security_and_secrets", weight: 40, descriptor: "Secures secrets and credentials outside application code." },
      { criterion: "scalability_planning", weight: 20, descriptor: "Configures autoscaling and managed services." },
    ],
  },
  M34: {
    title: "Database Optimization & Query Tuning",
    titleAr: "تحسين قواعد البيانات وضبط الاستعلامات",
    framework: "Relational Database Management & Indexing Strategies",
    focus: "Optimizing SQL queries, indexing, and schema design for speed.",
    saudiContext: "Aligned to enterprise data governance and high-volume transaction processing.",
    scenario: "A dashboard endpoint takes 12 seconds to load because a query performs N+1 subqueries across unindexed foreign key columns on a 5-million row table.",
    instructions: "Explain how to diagnose the slow query using EXPLAIN ANALYZE, design composite indexes, and rewrite the N+1 queries into an optimized SQL JOIN or aggregation.",
    rubric: [
      { criterion: "query_diagnosis", weight: 40, descriptor: "Uses EXPLAIN output to pinpoint table scans and N+1 issues." },
      { criterion: "indexing_strategy", weight: 40, descriptor: "Designs correct B-Tree / composite indexes." },
      { criterion: "sql_optimization", weight: 20, descriptor: "Rewrites query cleanly with JOINs/aggregates." },
    ],
  },
  M35: {
    title: "Object-Oriented & Modular Design",
    titleAr: "التصميم كائني التوجه والنمطي",
    framework: "SOLID Design Principles & Design Patterns",
    focus: "Structuring clean, maintainable, and extensible codebases.",
    saudiContext: "Aligned to software engineering best practices for enterprise maintainability.",
    scenario: "A legacy order processing class contains 3,000 lines of code handling UI rendering, database persistence, payment gateway HTTP calls, and PDF invoice generation in a single method.",
    instructions: "Apply SOLID principles (Single Responsibility, Dependency Inversion) to refactor the monolithic class into decoupled modules (OrderService, PaymentGateway, InvoiceRenderer, OrderRepository).",
    rubric: [
      { criterion: "solid_application", weight: 40, descriptor: "Applies SRP and DIP to decouple monolithic class." },
      { criterion: "pattern_selection", weight: 40, descriptor: "Uses appropriate design patterns (Repository, Factory, Adapter)." },
      { criterion: "code_maintainability", weight: 20, descriptor: "Produces clean, testable, and modular abstractions." },
    ],
  },
};

function isComputerScienceSpecialization(spec: string): boolean {
  const norm = normalizeSpec(spec);
  return (
    norm === "computer-science" ||
    norm === "computer-science-it" ||
    norm === "cs-it" ||
    norm === "software-engineering" ||
    norm === "information-technology" ||
    norm === "it" ||
    norm === "web-development"
  );
}

/**
 * Assessment set for a specialization: exactly UNIVERSAL_MODULES.length (47).
 * Specialty Job-Fit is swapped into the set — never appended.
 *
 * - Catalog tracks (CS/IT, etc.): remap existing Mxx codes in place.
 * - Blueprint / generic (Accounting, Cyber, free-text…): replace the last N
 *   universal job_fit slots with the specialty's JOBFIT-* modules (N = 3).
 */
export function modulesForSpecialization(specialization: string): {
  modules: AssessmentModuleSpec[];
  jobFitSource: "curated" | "generic";
  cluster: string;
} {
  const jf = jobFitModulesFor(specialization);
  const jobFitMap = new Map(jf.modules.map((m) => [m.code, m]));
  const customJobFits = jf.modules.filter(
    (m) => !UNIVERSAL_MODULES.some((u) => u.code === m.code),
  );

  const isCS = isComputerScienceSpecialization(specialization);

  let baseModules = UNIVERSAL_MODULES;
  if (isCS) {
    baseModules = UNIVERSAL_MODULES.map((m) => {
      const repl = CS_JOBFIT_REPLACEMENTS[m.code];
      if (repl) {
        return {
          ...m,
          ...repl,
          specialization: "Computer Science / IT",
        };
      }
      return m;
    });
  }

  if (customJobFits.length === 0) {
    return {
      modules: baseModules.map((m) => jobFitMap.get(m.code) ?? m),
      jobFitSource: jf.source,
      cluster: jf.cluster,
    };
  }

  const universalJobFitCodes = baseModules.filter(
    (m) => m.dimension === "job_fit",
  ).map((m) => m.code);
  const swapCount = Math.min(customJobFits.length, universalJobFitCodes.length);
  const swapCodes = new Set(universalJobFitCodes.slice(-swapCount));
  const inserted = customJobFits.slice(0, swapCount);

  const modules = [
    ...baseModules.filter((m) => !swapCodes.has(m.code)).map(
      (m) => jobFitMap.get(m.code) ?? m,
    ),
    ...inserted,
  ];

  return {
    modules,
    jobFitSource: jf.source,
    cluster: jf.cluster,
  };
}

/**
 * Public module set for the assessment UI/API.
 * Always exactly 47 modules: full UNIVERSAL_MODULES with specialty Job-Fit swapped in.
 */
export function resolveAssessmentModuleSet(specialization: string): {
  modules: AssessmentModuleSpec[];
  jobFitSource: "curated" | "generic";
  cluster: string;
  mode: "universal-plus-jobfit";
} {
  const { modules, jobFitSource, cluster } = modulesForSpecialization(specialization);
  return {
    modules,
    jobFitSource,
    cluster,
    mode: "universal-plus-jobfit",
  };
}

/** Look up a single module by code for a given specialization. */
export function findModule(code: string, specialization: string): AssessmentModuleSpec | null {
  const { modules } = resolveAssessmentModuleSet(specialization);
  return modules.find((m) => m.code === code) ?? null;
}

/** All curated track keys (catalog + blueprint) for diagnostics / UI. */
export function curatedSpecializations(): string[] {
  return Object.keys(JOBFIT_TRACKS);
}

/** Display labels for signup chips / specialty UI (canonical track names). */
export function curatedSpecializationLabels(): string[] {
  const labels: string[] = [];
  for (const track of Object.values(JOBFIT_TRACKS)) {
    if (track.kind === "catalog") {
      labels.push(track.label);
    } else {
      const bp = JOBFIT_BLUEPRINTS[track.blueprintKey];
      if (bp?.specialization) labels.push(bp.specialization);
    }
  }
  return labels;
}

export const UNIVERSAL_MODULES: AssessmentModuleSpec[] = _UNIVERSAL_MODULES.map(mod => ({
  ...mod,
  ...(catalogTranslations as Record<string, { scenarioAr: string; instructionsAr: string; choicesAr?: string[] }>)[mod.code]
}));

/** All modules: universal 47 plus materialized Job-Fit blueprint modules. */
export const ALL_MODULES = [
  ...UNIVERSAL_MODULES,
  ...Object.values(JOBFIT_BLUEPRINTS).flatMap(bp => materializeBlueprint(bp, "curated"))
];

// ── ISC-QA-005 lint guard ─────────────────────────────────────────────────────
// This runs at module-load time in every environment (dev, test, production).
// It will throw before any assessment can start if a draft/placeholder module
// is present in the live catalog, giving a clear error rather than a silent
// STUB reaching a scored attempt.
const BANNED_TITLE_RE = /\b(STUB|TODO|PLACEHOLDER)\b/i;
(function assertNoDraftModules() {
  const offenders: string[] = [];
  for (const m of UNIVERSAL_MODULES) {
    if (BANNED_TITLE_RE.test(m.title)) offenders.push(`UNIVERSAL ${m.code}: "${m.title}"`);
    if (m.framework && BANNED_TITLE_RE.test(m.framework)) offenders.push(`UNIVERSAL ${m.code} framework: "${m.framework}"`);
  }
  for (const [key, bp] of Object.entries(JOBFIT_BLUEPRINTS)) {
    for (const slot of bp.modules ?? []) {
      const title = (slot as { title?: string }).title ?? "";
      if (BANNED_TITLE_RE.test(title)) offenders.push(`JOBFIT ${key} slot: "${title}"`);
    }
  }
  if (offenders.length > 0) {
    throw new Error(
      `[catalog] Draft/placeholder modules detected in live assessment catalog — ` +
      `fix or remove before deploying:\n  ${offenders.join("\n  ")}`
    );
  }
})();

