import type { AssessmentModuleSpec } from "./framework";

export interface ModuleBriefForChoices {
  code: string;
  title: string;
  scenario?: string;
  instructions?: string;
  choices?: string[];
}

const SPECIFIC_MODULE_CHOICES: Record<string, string[]> = {
  M01: [
    "Brief the management team in plain, non-technical language: launch was successful, a subset of users on older smartphones is seeing slower load times, the cause is understood, the fix is already prepared and will deploy within 48 hours after testing, and no action is needed from them — with a commitment to a short confirmation update once it is live.",
    "Escalate the bug as a critical incident in an urgent email listing every affected device model and technical detail, so leadership understands the full engineering severity of the slowness.",
    "Delay any communication until the fix is fully deployed, so management is not told about a problem that may already be resolved by the time they read it.",
    "Instruct the technical team to extend testing and only report the issue to management after two full weeks of post-fix stability data, even though the fix is ready within 48 hours.",
  ],
  M02: [
    "Run DMAIC: Define the delivery-time problem precisely, Measure three KPIs (average delivery time, order-to-handoff, courier wait), Analyze root causes with an Ishikawa diagram across app latency, courier routing, demand and capacity, Improve the top causes, and Control with ongoing monitoring to keep the gain.",
    "Blame the increased order volume as the sole cause and immediately cap orders without measuring or analysing any other factor such as routing or app latency.",
    "Switch the entire delivery fleet to a new vendor immediately, assuming the old vendor is the root cause without measuring current delivery-time baselines.",
    "Do nothing structural and wait a few weeks to see whether the 25% increase in average delivery time corrects itself during off-peak demand.",
  ],
  M03: [
    "Facilitate a structured conflict-resolution session between the project manager and Chloe: have Chloe state the specific deployment risk and what verification is missing, agree a mitigation plan (e.g. staged rollout with rollback), and make a team decision on whether Tuesday is safe — balancing the committed date with the technical concern.",
    "Side with the project manager and deploy on Tuesday as scheduled, since the feature is complete and the deadline is committed, and ask Chloe to log her concerns for a post-release review.",
    "Side with Chloe and postpone the deployment indefinitely until she is fully comfortable, accepting an uncommitted new date without assessing the cost of the slip.",
    "Escalate immediately to senior management for a top-down decision, skipping any attempt to reconcile the technical objection with the schedule at team level.",
  ],
  M04: [
    "Assess which features depend on the changed platform/API, find the fastest compatible path (wrapper, alternate endpoint, or negotiated grace period with the platform), reprioritise the remaining scope for the 7-day window, and brief stakeholders on the revised plan and residual risk before proceeding.",
    "Ignore the breaking change and keep the original launch plan, assuming the platform will delay enforcement or that the current integration will keep working on launch day.",
    "Halt the launch entirely until a full rewrite on the new API is complete, accepting that the 7-day deadline will be missed with no interim mitigation.",
    "Promise stakeholders the launch is fully on track with no changes, without verifying the technical impact of the breaking change on the current integration.",
  ],
  M05: [
    "In a private 1:1, open with the specific observed cues (unusually quiet, missing meetings, missed deadlines), ask open questions about workload and wellbeing without judgement, listen, and agree concrete support plus a follow-up check-in so both performance and care are addressed.",
    "Address the missed deadlines in the 1:1 as a performance issue first, and set a formal warning about attendance and delivery before exploring any personal reasons.",
    "Ignore the behavioural change and only mention the missed deadlines in the next written performance review, giving Sara more time to self-correct.",
    "Send a brief email listing the missed deliverables and asking for a written plan, without meeting in person or acknowledging the change in behaviour.",
  ],
  M06: [
    "Before the client presentation, verify the current regulatory version, raise the outdated model privately with the senior analyst, document the discrepancy, and agree whether the slide must be corrected now or flagged — escalating only if the colleague refuses to address a material error.",
    "Quietly correct the outdated numbers on the slide yourself and present them as the senior analyst’s work, avoiding any conversation so the client is not alarmed.",
    "Present the slide as it is, assuming the senior analyst must have a reason for the older version and that the client will not notice the discrepancy.",
    "Publicly call out the senior analyst in the client meeting that the numbers are wrong, to make the correction transparent to everyone present.",
  ],
  M07: [
    "Meet each department head privately to understand their interests, then facilitate a joint session where Khalid (Operations) and Layla (Product) restate each other's constraints, agree a resource-allocation decision matrix, and set a communication cadence to rebuild direct working.",
    "Decide the resource split yourself based on the business case and instruct both heads to comply, ending the dispute by authority without a joint conversation.",
    "Escalate the conflict to the CEO immediately for a top-down allocation decision, bypassing the two heads entirely so they no longer have to negotiate.",
    "Formally warn both department heads about their public disagreement and require all future resource discussions to go through you in writing.",
  ],
  M08: [
    "Refuse to skip the quality-control step: explain the risk of delivering unverified work to the client, propose alternatives such as delivering a verified subset now and the remainder after full checks, or negotiate a short deadline extension, and document your position if the manager insists on cutting corners.",
    "Follow the manager's instruction and skip the QC step to hit the deadline, noting that bugs can be fixed later as the manager suggested.",
    "Resign immediately over the request, treating the quality-control compromise as unforgivable and offering no alternative path to meet the client deadline.",
    "Quietly skip the QC checks but do not record that the step was omitted, so the client remains confident the process was followed.",
  ],
  M09: [
    "Build an 8-week plan mixing pull applications (HRSD, Jadarat, LinkedIn) with push networking: alumni, sector conferences, and polite referral asks in utilities/renewables — measuring weekly outreach and applications while respecting Saudi professional etiquette.",
    "Only submit online applications every few days and wait for portals to respond, without networking.",
    "Message senior utility executives daily asking directly for a job in the first sentence.",
    "Attend one conference in week 8 only, with no earlier outreach or application cadence.",
  ],
  M10: [
    "Write an AIDA opening paragraph: hook with the 40% event-attendance increase from the university campaign, show interest with the Google Analytics certification and bilingual skills, create desire by connecting data-driven decision-making to the Digital Campaigns role, and close with a clear call to action for an interview.",
    "Paste a generic cover letter about being hardworking and eager to learn, with no mention of analytics, campaign results, or the role's stated requirements.",
    "List only the role title, salary expectation, and availability date, skipping any evidence of data skills or campaign outcomes.",
    "Criticize the company's current digital campaigns to show you know more than the hiring team, without presenting your own relevant credentials.",
  ],
  M11: [
    "Answer with STAR: Situation — checkout outage at Saudi e-commerce launch; Task — lead restoration and cross-functional coordination; Action — triage, communicate, restore path, reduce further loss; Result — service restored with a measurable recovery time / revenue protected figure.",
    "Say you were present during the outage but cannot recall specific actions or results.",
    "Blame another team for the outage and refuse to describe your own contribution.",
    "Describe only the technical root cause in deep jargon with no task, actions, or measurable result.",
  ],
  M12: [
    "Upgrade LinkedIn (headline, summary, skills, project evidence from the internship) then send a short personalized note to the Saudi Binladin infrastructure manager asking for career advice — not an immediate job ask.",
    "Leave the profile unchanged and send a mass InMail to dozens of managers asking who is hiring.",
    "Open the message by demanding a job referral and salary range before introducing yourself.",
    "Invent senior project leadership experience on the profile to impress Binladin Group.",
  ],
  M13: [
    "Negotiate using BATNA and market data (SAR 9.5–10.5k): request a salary closer to market and one growth benefit (training budget or flexible work), stay within a win-win tone, and be ready to walk to the freelance/other offer if needed.",
    "Accept SAR 8,500 immediately without raising market evidence or benefits.",
    "Demand SAR 15,000 and fully remote work with no BATNA reference, threatening to sue if refused.",
    "Ignore the offer and ghost the employer while waiting on the other interview.",
  ],
  M14: [
    "I appreciate the points raised. I will dedicate a set 20‑minute block each morning to finalize the data subset and update code comments before moving on, and I will post a brief progress note in the shared Slack channel every Friday.",
    "I think the feedback is harsh; I work well under pressure and will just try to finish faster next time.",
    "I understand the concerns. I will aim to be more organized by using a to‑do list, though I haven't identified exact steps yet.",
    "I will ask my supervisor to reassign the data preparation tasks to another teammate, so my workload is lighter.",
  ],
  M15: [
    "Clarify the situation with the people involved first: gather the facts, identify what is known versus assumed, and agree the next step with clear owners so the response is grounded in evidence rather than assumption.",
    "Act immediately on the first plausible explanation to show decisiveness, without verifying the facts or checking with the team members closest to the situation.",
    "Escalate the situation to senior management right away for them to decide, without first gathering the context the team already has.",
    "Do nothing until the situation resolves itself or someone raises it again, avoiding any action that might be wrong.",
  ],
  M16: [
    "Choose Scrum/Agile: short sprints to ship a usable pilot in four months, then iterate using driver and customer feedback as contracts and regulations keep changing.",
    "Choose classic Waterfall: freeze all routing requirements on day one and deliver a single release after four months with no interim feedback loops.",
    "Cancel stakeholder feedback channels and optimize only for internal documentation completeness before any pilot.",
    "Adopt a multi-year big-bang deployment with no pilot, locking scope until every regional regulation variant is fully specified.",
  ],
  M17: [
    "Mobile abandonment rose by 8 points and desktop fell by 6 points; we should redesign the mobile checkout to lower abandonment as a performance improvement.",
    "Desktop abandonment increased while mobile decreased, suggesting we need to double‑down on desktop advertising.",
    "Both mobile and desktop abandonment are stable; no action is required.",
    "The chart shows a 15‑point gap between channels; we should halt mobile sales entirely.",
  ],
  M18: [
    "Use the approved internal AI platform to draft the memo, verify all numerical data by cross-checking with the confidential internal report, retain proprietary cost information within the secure system, and prompt the AI for a professional, hierarchy-aware tone suitable for senior executives.",
    "Copy the confidential cost estimates into a public AI chatbot to generate polished client presentation slides.",
    "Rely on the AI's output for market trends without verifying the figures, assuming its confidence indicates accuracy.",
    "Ask the AI to write the briefing memo in an informal, casual tone that disregards the audience's senior leadership status.",
  ],
  M19: [
    "Report the email to the IT security team and confirm the request through the official finance phone number.",
    "Reply with the requested financial details and complete the transfer.",
    "Click the link in the email to verify the new account and submit the payment.",
    "Transfer the funds first to avoid service disruption, then mention it in the next weekly standup.",
  ],
  M20: [
    "Recommend doubling the budget in a controlled way: note the current campaign returned SAR 45,000 on SAR 10,000 (4.5×), build a SWOT of the expansion (e.g. proven channel, capacity to fulfil added demand, ad-fatigue and platform-cost threats), and propose a phased ramp to SAR 20,000 with ROI tracked monthly.",
    "Reject the increase outright because spending more on advertising always eats into profit, without calculating the current ROI or considering the attributable SAR 45,000.",
    "Approve doubling the budget immediately with no measurement plan, assuming that because the first month was profitable the second will be equally or more profitable.",
    "Advise the owner to keep the budget at SAR 10,000 indefinitely and spend the potential extra SAR 10,000 on hiring instead, without analysing the campaign's actual return.",
  ],
  M21: [
    "Conduct a keyword audit to refine toward purchase-intent, location-specific terms (e.g. long-tail variants of 'buy running shoes online in Riyadh'), rewrite the title tag, meta description, and H1 to match user intent, enrich the page content with product and sizing detail, and track CTR improvement over three months.",
    "Keep the page copy unchanged and only add a large banner image and weekly blog posts about running, without touching any on-page SEO elements.",
    "Abandon organic work and move the whole budget to paid search for the same query so the page appears above organic results immediately.",
    "Duplicate the existing landing page content onto a new URL and submit it for indexing, assuming two identical pages will double the impressions.",
  ],
  M22: [
    "Open GA4's referral traffic report and confirm whether TikTok is the primary source of sessions for that day.",
    "Review Search Console for a sudden rise in impressions for a specific keyword on the spike day.",
    "Search for any news articles published about SoukExpress on 20 July to see if media coverage generated the traffic.",
    "Increase the paid acquisition budget to keep the traffic level high.",
  ],
  M23: [
    "Propose a 90-day digital launch: allocate the SAR 100,000 across awareness, conversion, and retention phases; set milestones for launch, first 2,500 active users, then repeat-usage push; and track KPIs such as active users, customer acquisition cost, and 30-day retention toward the 5,000-user target.",
    "Spend the entire SAR 100,000 on a single influencer post in week one with no milestones, no KPI tracking, and no plan for the remaining 85 days.",
    "Ignore digital channels and spend the budget on unmeasured offline display advertising outside the brief, with no way to attribute user signups.",
    "Set no user-acquisition target and optimise only for social vanity metrics like likes and followers instead of the 5,000 active-user goal.",
  ],
  M24: [
    "Could you outline the budget you plan to assign for the automation upgrade, the decision-making hierarchy, the primary problem you aim to solve, and the target go-live date?",
    "What is your department's budget limit for this project?",
    "Who will sign off on the final purchase decision?",
    "What production bottlenecks are you trying to eliminate?",
  ],
  M25: [
    "Log the call details, record his contact information, note the need for internal budget review, schedule a value‑add touchpoint this week and a confirmation call for two weeks later, then move the opportunity to Qualified.",
    "Log the call, move the opportunity directly to Proposal, and schedule a call next week.",
    "Record only his email address and plan a follow‑up three weeks from now.",
    "Mark the lead as Lost without adding any notes.",
  ],
  M26: [
    "Acknowledge the 12% competitor quote, reframe to documented SAR 180k annual efficiency value, and offer at most the 8% policy-capped discount plus a scoped value-add — not matching 12%.",
    "Match the competitor’s full 12% discount immediately despite the 8% policy cap.",
    "Refuse any discussion, tell the client to leave if they want a lower price, and cite no value delivered.",
    "Offer a 20% discount to win the renewal, exceeding both policy and the competitor ask.",
  ],
  M27: [
    "Thank the Product Owner, explain that the sprint goal is already committed at 60% completion, and propose evaluating the new feature for the next sprint — offering to do a quick impact estimate so the CEO gets a realistic timeline instead of a promise.",
    "Immediately add the CEO's new feature to the current sprint, re-assign team members mid-sprint, and tell the team the sprint deadline must be met regardless of the added scope.",
    "Refuse the request outright, stating that mid-sprint changes are never allowed, without offering the Product Owner any alternative timeline or trade-off.",
    "Silently swap the new feature in for an existing backlog item without telling the team or the Product Owner, assuming the swap is equivalent effort.",
  ],
  M28: [
    "Critical path is A → B → D, project duration 8 days.",
    "Critical path is A → C → D, 10 days; Phase B has 2 days of float.",
    "Critical path is B → D, project duration 5 days.",
    "Critical path is A → B → C → D, project duration 12 days.",
  ],
  M29: [
    "Activate a structured crisis response: verify the supplier's stated recovery timeline and any remaining inventory, qualify alternative suppliers urgently (including fast-track approval), quantify the launch impact and contract penalty, and brief stakeholders on a revised plan with a clear decision gate — protecting the launch as far as the evidence supports.",
    "Accept the one-week delay immediately and inform the client, treating the supplier's announcement as final without verifying alternatives or the supplier's actual recovery prospects, and accept the contract penalties as unavoidable.",
    "Switch to an unapproved alternative supplier right away to hold the original launch date, selecting the first vendor that can ship in time even though quality, compliance, and reliability are unverified.",
    "Withhold the news from stakeholders until the week of the launch in case the supplier recovers, keeping the original plan visible while privately hoping production resumes in time to avoid any difficult conversation.",
  ],
  // M30 — SQL / joins (Data Analysis track). Domain-correct options for when
  // no bank row or live generation is available.
  M30: [
    "Use a LEFT JOIN (or LEFT OUTER JOIN) on Customers.id = Orders.customer_id to include all customers, including those with 0 orders.",
    "Use an INNER JOIN to return only customers who have placed at least one order.",
    "Use a RIGHT JOIN on Orders table without filtering NULL customer records.",
    "Use a CROSS JOIN to produce a Cartesian product of all customers and orders.",
  ],
};

/**
 * Decision-style task text for the MCQ exam, matching each module's options.
 * The catalog `instructions` are essay-era prompts ("Write an email…") which
 * must NEVER appear above A/B/C/D options. Every entry below is a decision
 * question consistent with the module's scenario + choices in this file.
 */
const SPECIFIC_MODULE_TASKS: Record<string, string> = {
  M01: "Which approach should you take to inform the management team about the ConnectApp slowness bug, so they are reassured and understand the 48-hour fix without unnecessary alarm?",
  M02: "Which problem-solving approach should you lead to diagnose and fix the 25% increase in average delivery time for UrbanEat?",
  M03: "Which approach should you take to resolve the deployment conflict between the project manager and Chloe before Tuesday?",
  M04: "Which strategy should you adopt to keep the launch on track after the breaking platform/API change with only 7 days to go?",
  M05: "Which approach should you take in the one-on-one with Sara after noticing the change in her behaviour and missed deadlines?",
  M06: "Which course of action should you take after discovering the outdated regulatory model in the client presentation?",
  M07: "Which approach should you take to defuse the conflict between Khalid (Operations) and Layla (Product) and restore their working relationship?",
  M08: "Which action should you take when your manager asks you to cut quality-control corners to meet the client deadline?",
  M09: "Which four-week job-search strategy should you adopt to access the hidden job market in the Saudi context?",
  M10: "Which cover-letter opening paragraph should you write for the Marketing Analyst — Digital Campaigns role at the Saudi fintech company?",
  M11: "Which STAR-structured answer should you give to the interview question about working under intense pressure?",
  M12: "Which LinkedIn profile and cold-outreach approach should you take before contacting the senior data analyst?",
  M13: "Which negotiation approach should you take for the job offer that is slightly below the market rate?",
  M14: "Which response should you give to the 360-degree feedback that points to lower Conscientiousness?",
  M15: "Which approach should you take to handle the professional situation with your team?",
  M16: "Which project methodology should you choose for QuickPlate's mobile app, and which reasoning best justifies it?",
  M17: "Which insight and recommendation should you present to your manager from the website traffic chart?",
  M18: "Which approach should you take to use generative AI responsibly for the client email and the confidential report?",
  M19: "Which action should you take after receiving the urgent gift-card request from an email address claiming to be the CEO?",
  M20: "Which recommendation should you give the owner about doubling the social media advertising budget from SAR 10,000 to SAR 20,000?",
  M21: "Which SEO strategy should you implement to improve organic performance for the landing page?",
  M22: "Which investigation approach should you take for the one-day GA4 traffic spike?",
  M23: "Which 90-day digital marketing launch plan should you propose for the mobile payments app?",
  M24: "Which set of BANT questions should you ask to qualify the inbound lead?",
  M25: "Which CRM actions and follow-up should you log after the discovery call with Ahmed Al-Rasheed?",
  M26: "Which negotiation approach should you take for the renewal when the client asks for a 20% price reduction?",
  M27: "How should you respond to the Product Owner's request to add the CEO's new feature to the current sprint?",
  M28: "Which critical path and project duration should you identify for the activity network?",
  M29: "Which crisis-management approach should you lead when your primary supplier cannot fulfil the component order due to a factory fire two weeks before launch?",
  M30: "Which SQL JOIN type should you use to list all customers including those without orders?",
};

/**
 * Decision task for the MCQ exam. Prefers the curated decision wording above;
 * falls back to the catalog instructions only for modules without an entry.
 */
export function getTaskForModule(module: ModuleBriefForChoices): string {
  const codeKey = (module.code || "").toUpperCase().trim();
  return SPECIFIC_MODULE_TASKS[codeKey] ?? module.instructions ?? "";
}

export function getChoicesForModule(module: ModuleBriefForChoices): string[] {
  // If AI already generated choices, use them
  if (module.choices && Array.isArray(module.choices) && module.choices.length >= 2) {
    return module.choices;
  }

  // Exact code match (e.g. M01, M25, M24, M28)
  const codeKey = (module.code || "").toUpperCase().trim();
  if (SPECIFIC_MODULE_CHOICES[codeKey]) {
    return SPECIFIC_MODULE_CHOICES[codeKey];
  }

  // Title-only domain match for the SQL module (M30 / Data Analysis track).
  // Deliberately checks the TITLE only, not the scenario/instructions text:
  // scenario wording (e.g. "joins your remote team") previously matched a
  // "join" keyword and served SQL options to a non-SQL module (M44 bug).
  const titleLower = (module.title || "").toLowerCase();
  if (
    titleLower.includes("sql") ||
    titleLower.includes("join") ||
    titleLower.includes("query") ||
    titleLower.includes("database")
  ) {
    return SPECIFIC_MODULE_CHOICES.M30;
  }

  // No keyword-based reuse of OTHER modules' choice packs — that historically
  // served irrelevant options (e.g. a conflict-resolution scenario getting
  // budget-procurement questions). Only exact code matches are trusted above.

  // Contextually tailored dynamic fallback so NO TWO MODULES share identical
  // text. Four plausible, professionally-differentiated responses: diagnose
  // first, communicate + recommend, safeguard then fix, structured decision.
  // These are generic in domain but credible as decision options — they are
  // only used as a last resort when no authored/AI options exist.
  const cleanTitle = module.title || "the operational situation";
  return [
    `Diagnose ${cleanTitle} first: confirm the facts with the people closest to the work, identify the root cause from evidence rather than assumption, and only then commit to a corrective action with clear owners.`,
    `Communicate a clear recommendation on ${cleanTitle} to the accountable stakeholders: state the problem, present two realistic options with their trade-offs, and propose a decision with a fallback if conditions change.`,
    `Apply the least-risky immediate safeguard to ${cleanTitle} to protect the affected people or process, then investigate the underlying cause and implement a permanent fix once the urgent pressure is removed.`,
    `Run a structured decision on ${cleanTitle}: define the goal and constraints, score the realistic alternatives against impact, effort, risk and reversibility, document the trade-offs, and own the chosen course of action.`
  ];
}
