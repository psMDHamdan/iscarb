/**
 * Bounded scenario / instruction variants for universal modules.
 * Rubrics and few-shot anchors stay on the base catalog module — only the
 * candidate-facing scenario text varies per attempt.
 *
 * Index 0 is always the catalog default (applied when no variant list exists).
 */

export interface ScenarioVariant {
  scenario: string;
  instructions: string;
}

/** Alternate scenarios keyed by universal module code. */
export const SCENARIO_VARIANTS: Record<string, ScenarioVariant[]> = {
  M01: [
    {
      scenario:
        "You lead the launch of PayFast, a campus payments app. Adoption is strong, but the team found that students on older Android phones see intermittent payment confirmation delays. A patch is ready within 36 hours. Leadership is non-technical and anxious about reputation.",
      instructions:
        "Write a short email to leadership: explain the issue in plain language, reassure them it is contained, and state clear next steps with the 36-hour timeline.",
    },
    {
      scenario:
        "Your team shipped PortalX for the university. A accessibility bug means screen-reader users cannot complete one enrollment form. The fix ships in two business days. You must brief a non-technical steering committee.",
      instructions:
        "Draft a concise briefing note: bottom line up front, impact scope, reassurance, and next steps with the two-day fix window.",
    },
  ],
  M02: [
    {
      scenario:
        "You advise MedSupply, a medical logistics firm. Average order fulfilment time rose 20% this quarter. Leadership suspects 'lazy drivers' but has no structured diagnosis.",
      instructions:
        "Write a DMAIC action plan: DEFINE the problem, MEASURE three KPIs, ANALYZE root causes with an Ishikawa lens, IMPROVE with concrete fixes, CONTROL with a monitoring plan.",
    },
    {
      scenario:
        "Campus Wi-Fi ticket resolution time increased 30%. IT management wants a structured diagnosis before hiring more staff.",
      instructions:
        "Apply DMAIC: redefine the problem, list three KPIs, analyse root causes beyond 'staff too slow', propose improvements, and define control metrics.",
    },
  ],
  M03: [
    {
      scenario:
        "You manage Project Horizon. Sara (QA lead) wants one more week of testing before release; Omar (product) insists on shipping Friday for a partner demo. Tension is rising in standup.",
      instructions:
        "1. Name the Thomas-Kilmann style you choose. 2. Write the exact message you send to Sara and Omar to resolve the deadlock.",
    },
    {
      scenario:
        "Two senior engineers disagree on whether to rewrite a fragile module before a regulatory audit deadline. One wants a rewrite; the other wants targeted patches only.",
      instructions:
        "Choose a Thomas-Kilmann conflict style and write the message you would send to both engineers to move to a decision.",
    },
  ],
  M08: [
    {
      scenario:
        "A dean asks for a one-page dashboard of student internship placement rates by college. Raw CSV exports exist but are messy.",
      instructions:
        "Explain which metrics you would show, how you would clean/validate the data, and how you would visualise the result for a non-technical dean.",
    },
  ],
  M11: [
    {
      scenario:
        "Your unit is adopting a new CRM. Half the team still emails spreadsheets; the other half refuses to log calls in the CRM.",
      instructions:
        "Propose a change-adoption plan that increases CRM usage without shaming holdouts, including one metric of success.",
    },
  ],
  M41: [
    {
      scenario:
        "After a failed client pitch, your manager asks what you learned and what you will change next time. The failure was partly process, partly your preparation.",
      instructions:
        "Write a reflective note: own your part, extract two concrete lessons, and state one behaviour you will change with a check-in date.",
    },
  ],
};

/**
 * Resolve the scenario/instructions for a module code + variant index.
 * Returns null when the index is 0 or no variants exist (caller keeps catalog text).
 */
export function variantFor(
  moduleCode: string,
  variantIndex: number,
): ScenarioVariant | null {
  if (variantIndex <= 0) return null;
  const list = SCENARIO_VARIANTS[moduleCode];
  if (!list || list.length === 0) return null;
  const idx = (variantIndex - 1) % list.length;
  return list[idx] ?? null;
}

/** How many alternate variants exist (not counting the catalog default). */
export function variantCount(moduleCode: string): number {
  return SCENARIO_VARIANTS[moduleCode]?.length ?? 0;
}
