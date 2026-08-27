/**
 * Refactor script for all 47 assessment modules in default-choices.ts and generated-questions.json.
 * Replaces absurd/foolish distractors with high-quality, plausible professional options.
 */

const fs = require("fs");
const path = require("path");

// ── 47 High-Quality Module Choice Packs ──────────────────────────────────────
const HIGH_QUALITY_CHOICES = {
  M01: {
    task: "Which approach should you take to inform the management team about the ConnectApp slowness bug, so they are reassured and understand the 48-hour fix without unnecessary alarm?",
    choices: [
      "Brief senior medical leaders in plain language: explain the minor performance issue on older mobile hardware, confirm patient data safety, state that a tested patch will deploy within 48 hours, and outline interim safeguards.",
      "Provide an extensive technical root-cause breakdown including stack traces and memory profiles, requesting that senior medical leadership determine the technical remediation path.",
      "Issue an immediate emergency system alert to all hospital departments advising staff of system instability, while holding executive briefings until post-patch verification.",
      "Summarize the patch schedule and deployment timeline accurately to executive leadership, but omit specific operational workarounds and temporary user guidance."
    ]
  },
  M02: {
    task: "Which problem-solving approach should you lead to diagnose and fix the 25% increase in average delivery time for UrbanEat?",
    choices: [
      "Run DMAIC: Define problem and wait-time baselines, Measure order handoff and courier routing metrics, Analyze root causes via Ishikawa diagram, Improve top bottlenecks, and Control with KPI dashboards.",
      "Measure current delivery times and order volumes, then immediately implement a revised courier routing protocol before completing a root-cause analysis.",
      "Convene an operational alignment task force to improve courier communication and dispatch tools, focusing on team coordination without analyzing baseline latency metrics.",
      "Apply DMAIC by defining the issue and analyzing historical courier performance, but focus remediation solely on third-party vendor SLAs while leaving internal app dispatch unaddressed."
    ]
  },
  M03: {
    task: "Which approach should you take to resolve the deployment conflict between the project manager and Chloe before Tuesday?",
    choices: [
      "Facilitate a collaborating session: surface both technical deployment risks and grant deadline constraints, negotiate a staged rollout with rollback safeguards, and commit to a joint timeline.",
      "Apply a compromising approach by agreeing to release on schedule while reducing the firmware feature set, without resolving the underlying power budget verification.",
      "Apply an accommodating approach by agreeing to the hardware engineer's complete redesign request, accepting the grant deadline slip without evaluating interim mitigations.",
      "Escalate the dispute to project leadership to arbitrate between the schedule and technical requirements, providing individual assessments rather than leading joint team resolution."
    ]
  },
  M04: {
    task: "Which strategy should you adopt to keep the launch on track after the breaking platform/API change with only 7 days to go?",
    choices: [
      "Assess feature dependencies against the mandated directive, identify compatible integration paths, reprioritize remaining scope for the 14-day window, and brief stakeholders on revised milestones and residual risk.",
      "Conduct an immediate technical impact analysis and update stakeholders on required changes, but attempt to implement the full original scope alongside the mandatory directive without reprioritizing.",
      "Pause current platform expansion and focus team efforts entirely on building the mandated integration, postponing stakeholder communication until migration feasibility is proven.",
      "Implement the mandated integration for high-priority user flows while leaving secondary flows on the existing architecture, without establishing formal stakeholder approval for the dual-run strategy."
    ]
  },
  M05: {
    task: "Which approach should you take in the one-on-one with Sara after noticing the change in her behaviour and missed deadlines?",
    choices: [
      "In a private 1:1, open with specific observed cues, ask open-ended questions regarding workload and wellbeing without judgment, listen actively, and agree on tailored support plus a follow-up check-in.",
      "Focus the 1:1 on reviewing recent missed deliverables and establishing a structured performance improvement plan, offering support if workload issues are raised by the employee.",
      "Express personal concern for the employee's wellbeing and adjust immediate task assignments, but avoid discussing the specific performance gaps to prevent added stress.",
      "Discuss observed stress cues and offer workload adjustments during the meeting, but defer setting specific follow-up milestones or documented support commitments."
    ]
  },
  M06: {
    task: "Which course of action should you take after discovering the outdated regulatory model in the client presentation?",
    choices: [
      "Verify current regulatory guidelines, discuss the outdated model privately with the senior analyst before the briefing, document required adjustments, and flag material discrepancies for immediate correction.",
      "Prepare updated regulatory figures independently and present the revised data during the briefing, explaining the recalculation after the client Q&A session.",
      "Present the slide using the senior analyst's figures as drafted, while preparing an addendum document with updated regulatory figures for post-meeting distribution.",
      "Highlight the regulatory model update during the presentation as an evolving industry trend, without clarifying whether the slide data reflects the latest guidelines."
    ]
  },
  M07: {
    task: "Which approach should you take to defuse the conflict between Khalid (Operations) and Layla (Product) and restore their working relationship?",
    choices: [
      "Hold individual meetings to understand constraints, then lead a joint session to align on shared objectives, establish a clear resource-allocation matrix, and agree on governance rules.",
      "Propose an equal split of contested resources between both departments based on historical allocations, bypassing a detailed analysis of current project priorities.",
      "Analyze each department's resource requirements and draft a comprehensive allocation proposal, then submit it to executive leadership for final sign-off before consulting department heads.",
      "Facilitate a joint alignment meeting to discuss competing demands, but allow department heads to negotiate bilateral trade-offs without establishing a formal decision matrix."
    ]
  },
  M08: {
    task: "Which action should you take when your manager asks you to cut quality-control corners to meet the client deadline?",
    choices: [
      "Maintain essential quality control: explain delivery risks to stakeholders, propose a phased delivery of verified components, or negotiate a short window extension with documented risk mitigation.",
      "Perform a condensed quality check on high-risk features to meet the deadline, documenting skipped test cases for post-launch verification.",
      "Request an immediate deadline extension from the client to complete full quality assurance, without presenting a phased release option or interim risk assessment.",
      "Complete all required quality assurance steps by reallocating team members from secondary tasks, while accepting unmitigated delays on the secondary deliverables."
    ]
  },
  M09: {
    task: "Which four-week job-search strategy should you adopt to access the hidden job market in the Saudi context?",
    choices: [
      "Execute a balanced strategy: combine targeted applications on official portals (HRSD, Jadarat, LinkedIn) with professional networking, informational interviews, and tracking weekly outreach metrics.",
      "Focus entirely on submitting a high volume of tailored applications through official job portals, deferring direct networking until initial interviews are scheduled.",
      "Prioritize networking with industry professionals and requesting informational interviews, while submitting standard resumes on job portals without tailoring application materials.",
      "Build an extensive list of target companies and connect with recruitment leads on professional platforms, but delay applying until personal referrals are secured for each role."
    ]
  },
  M10: {
    task: "Which cover-letter opening paragraph should you write for the Marketing Analyst — Digital Campaigns role at the Saudi fintech company?",
    choices: [
      "Structure the application using AIDA: hook with measurable accomplishments, demonstrate alignment with role requirements, highlight specialized skills, and close with a professional call to action.",
      "Detail relevant past technical projects and academic certifications, but omit explicit connections to the target company's specific job requirements and strategic goals.",
      "Focus on explaining your career aspirations and passion for the organization, supported by a general summary of qualifications without quantifying past achievements.",
      "Provide a comprehensive chronological summary of all previous roles and responsibilities, but omit a concise closing statement and explicit alignment to the target position."
    ]
  },
  M11: {
    task: "Which STAR-structured answer should you give to the interview question about working under intense pressure?",
    choices: [
      "Apply STAR method: outline the specific Situation (checkout outage during launch), Task (lead restoration effort), individual Actions taken (triage, cross-team coordination), and measurable Result (system restored in 25 mins, revenue impact minimized).",
      "Describe the high-pressure situation and the immediate technical actions taken to resolve the incident, but omit specific metrics regarding the final outcome and business impact.",
      "Explain the technical architecture and root cause of the incident in detail, describing how the overall engineering group collaborated to restore service.",
      "Focus on the successful recovery results and key lessons learned, providing only a high-level summary of the initial problem and individual intervention steps."
    ]
  },
  M12: {
    task: "Which LinkedIn profile and cold-outreach approach should you take before contacting the senior data analyst?",
    choices: [
      "Optimize profile headline, summary, and skills to highlight domain expertise, showcase verified project outcomes, and send personalized, context-rich connection requests to industry peers.",
      "Update profile experience and skills with detailed technical descriptions, but send generic connection requests without personalizing the outreach message.",
      "Focus outreach on sending direct messages to senior hiring managers asking about job openings, before fully updating project portfolio and recommendations.",
      "Publish frequent industry commentary and share relevant technical articles, while keeping the background experience and project summary brief."
    ]
  },
  M13: {
    task: "Which negotiation approach should you take for the job offer that is slightly below the market rate?",
    choices: [
      "Research benchmark compensation data (SAR 9.5k–10.5k), articulate your value proposition against role requirements, present a fair salary counter-offer alongside professional growth benefits, and leverage your BATNA professionally.",
      "Request a salary at the upper end of the benchmark range based on market research, but focus negotiation exclusively on base pay without discussing performance bonuses or professional development.",
      "Accept the initial offer as presented and request a formal performance and compensation review after six months based on agreed deliverables.",
      "Present market benchmark data and request an increased compensation package, but defer articulating specific additional value or accomplishments that justify the higher tier."
    ]
  },
  M14: {
    task: "Which response should you give to the 360-degree feedback that points to lower Conscientiousness?",
    choices: [
      "Listen actively without defensiveness, acknowledge specific valid points, ask clarifying questions to understand expectations, and commit to a concrete action plan with follow-up milestones.",
      "Accept the feedback politely and agree to implement suggested changes, but refrain from asking clarifying questions or establishing explicit follow-up review dates.",
      "Provide context and rationale for the choices made during the task before accepting the feedback, ensuring the supervisor understands background constraints.",
      "Commit to improving performance immediately and request additional training resources, without establishing specific measurable metrics for the required adjustments."
    ]
  },
  M15: {
    task: "Which approach should you take to handle the professional situation with your team?",
    choices: [
      "Gather objective facts from frontline team members, distinguish verified data from assumptions, analyze root causes using structured techniques, and execute a documented decision with clear ownership.",
      "Implement a proven operational fix based on past experience with similar incidents, then monitor system performance to confirm if the issue is resolved.",
      "Conduct a detailed investigation into all potential contributing factors, deferring corrective action until a comprehensive report is completed and reviewed.",
      "Consult key stakeholders to reach consensus on the most likely cause, executing an agreed mitigation plan without conducting independent data verification."
    ]
  },
  M16: {
    task: "Which project methodology should you choose for QuickPlate's mobile app, and which reasoning best justifies it?",
    choices: [
      "Adopt Scrum/Agile: plan 2-week iterations to ship an MVP in four months, validating user experience and routing features with early feedback while adapting to evolving commercial requirements.",
      "Select a phased Waterfall approach: define comprehensive functional specifications up front, executing sequential design and development phases before conducting end-to-end user acceptance testing.",
      "Implement a Hybrid framework: freeze core architectural requirements while utilizing iterative sprints for user interface components, deferring deployment until all features are complete.",
      "Utilize Kanban: maintain a continuous workflow queue without fixed iteration boundaries, prioritizing user feedback cards as operational capacity allows."
    ]
  },
  M17: {
    task: "Which insight and recommendation should you present to your manager from the website traffic chart?",
    choices: [
      "Analyze channel data: identify that mobile checkout abandonment rose by 8% while desktop fell by 6%, isolate mobile UX friction points, and recommend targeted mobile checkout optimization.",
      "Highlight the total increase in mobile traffic volume and recommend reallocating marketing spend to mobile acquisition campaigns, while deferring checkout optimization.",
      "Focus analysis on the desktop conversion stability and recommend expanding desktop promotional offers, treating mobile abandonment as an industry-standard trend.",
      "Report the conversion gap between mobile and desktop channels, proposing an immediate overhaul of both desktop and mobile landing pages without isolating checkout drop-offs."
    ]
  },
  M18: {
    task: "Which approach should you take to use generative AI responsibly for the client email and the confidential report?",
    choices: [
      "Use approved internal AI tools with sanitized data: draft content, independently verify numerical figures against primary sources, ensure proprietary data is protected, and review tone for professional alignment.",
      "Utilize enterprise AI tools to draft the executive briefing, but rely on automated output validation without cross-checking financial calculations against source documents.",
      "Draft the briefing manually using internal data sources, then run the text through AI tools solely for grammar and formatting refinement without verifying contextual accuracy.",
      "Use AI tools to summarize background industry trends and generate structural outlines, while authoring all specific client recommendations independently."
    ]
  },
  M19: {
    task: "Which action should you take after receiving the urgent gift-card request from an email address claiming to be the CEO?",
    choices: [
      "Verify the request through official out-of-band communication: report suspicious email headers to IT Security and confirm authorization with the executive assistant via verified internal channels.",
      "Forward the email to IT Security for analysis while replying to the sender requesting secondary confirmation before proceeding with the purchase.",
      "Check the internal corporate directory to verify executive contact details, then pause processing until the manager reviews the request during business hours.",
      "Contact your direct supervisor to report the unusual executive request, while holding off on security escalation pending internal clarification."
    ]
  },
  M20: {
    task: "Which recommendation should you give the owner about doubling the social media advertising budget from SAR 10,000 to SAR 20,000?",
    choices: [
      "Recommend a phased budget increase: evaluate current 4.5x ROI data, conduct a SWOT analysis of scaling capacity, and test a SAR 15,000 intermediate stage while monitoring acquisition CAC and conversion rates.",
      "Approve doubling the advertising budget immediately based on strong initial returns, establishing weekly performance reporting to track revenue growth.",
      "Recommend maintaining the current SAR 10,000 budget while reallocating internal creative resources to improve ad click-through rates before increasing ad spend.",
      "Propose reallocating the additional SAR 10,000 to influencer partnerships and organic content channels, comparing attribution against current paid campaigns."
    ]
  },
  M21: {
    task: "Which SEO strategy should you implement to improve organic performance for the landing page?",
    choices: [
      "Perform a search intent and keyword audit: optimize title tags, meta descriptions, and header hierarchy, enrich page content with domain-specific terms, and track ranking improvements over 90 days.",
      "Focus optimization efforts on technical site speed and mobile page loading performance, while keeping existing landing page copy and metadata unchanged.",
      "Expand page content by publishing weekly industry articles on the domain, while retaining current title tags and meta descriptions.",
      "Redesign landing page visual elements and call-to-action placement to boost user engagement metrics, monitoring secondary impact on organic search traffic."
    ]
  },
  M22: {
    task: "Which investigation approach should you take for the one-day GA4 traffic spike?",
    choices: [
      "Analyze GA4 traffic acquisition reports: segment data by source/medium, user geography, and landing page behavior, cross-referencing external campaign dates to identify the primary driver.",
      "Review Google Search Console impression data for the spike date to determine if specific search queries drove the traffic surge.",
      "Check social media channel analytics to see if recent brand mentions aligned with the high-volume traffic day.",
      "Compare conversion rates on the spike date against monthly averages to evaluate whether the traffic surge generated qualified leads."
    ]
  },
  M23: {
    task: "Which 90-day digital marketing launch plan should you propose for the mobile payments app?",
    choices: [
      "Execute a structured 90-day roadmap: allocate budget across Awareness, Acquisition, and Retention phases, set 30-day user milestones, and measure CAC, MAU, and 30-day retention toward the 5,000 active user target.",
      "Allocate the majority of the budget to high-impact launch campaigns in month one, transitioning to organic social media engagement for months two and three.",
      "Implement a continuous paid acquisition campaign focused on app store downloads, evaluating user retention metrics at the conclusion of the 90-day period.",
      "Focus marketing efforts on influencer partnerships and referral incentives during the first 60 days, deferring performance ad spend until user onboarding is streamlined."
    ]
  },
  M24: {
    task: "Which set of BANT questions should you ask to qualify the inbound lead?",
    choices: [
      "Apply BANT systematically: confirm allocated Budget range, identify Authority and decision workflow, establish core Need and technical pain points, and clarify the implementation Timeline.",
      "Focus qualification on assessing technical Need and project Timeline, while confirming executive Authority during subsequent product demonstrations.",
      "Clarify Budget availability and decision Authority upfront, then schedule a dedicated technical discovery session to evaluate project Needs.",
      "Assess project Timeline and technical requirements first, providing standard pricing tiers to qualify Budget before identifying decision makers."
    ]
  },
  M25: {
    task: "Which CRM actions and follow-up should you log after the discovery call with Ahmed Al-Rasheed?",
    choices: [
      "Log comprehensive call notes: update BANT qualification fields, record key requirements and budget parameters, schedule follow-up milestones, and advance deal stage to Qualified Opportunity.",
      "Update deal stage to Qualified Opportunity and create a follow-up task, summarizing key discussion points in the activity log.",
      "Log contact details and project requirements, scheduling a follow-up presentation before updating the formal opportunity pipeline stage.",
      "Record call notes and technical constraints in the CRM, assigning account tasks to technical pre-sales for solution design."
    ]
  },
  M26: {
    task: "Which negotiation approach should you take for the renewal when the client asks for a 20% price reduction?",
    choices: [
      "Reframe value proposition: present documented ROI achievements (SAR 180k savings), offer a policy-aligned 8% multi-year discount or value-add services, and negotiate within approved commercial boundaries.",
      "Offer a 10% discount contingent on extending contract duration to two years, highlighting delivered platform reliability and support SLAs.",
      "Maintain existing contract pricing while offering additional user licenses and premium support services to address the client's budget constraints.",
      "Propose a phased pricing structure that reduces upfront costs in exchange for performance-based incentives upon achieving operational milestones."
    ]
  },
  M27: {
    task: "How should you respond to the Product Owner's request to add the CEO's new feature to the current sprint?",
    choices: [
      "Protect sprint commitment: explain impact on agreed sprint goals, evaluate feature urgency, propose evaluating the item for the next sprint backlog, and offer a quick effort estimation.",
      "Assess feature scope with the engineering team and swap out an equivalent low-priority backlog item to accommodate the request within the current sprint.",
      "Accept the high-priority feature request and adjust current sprint deliverables, updating stakeholders on revised release timelines during the sprint review.",
      "Review technical requirements with the Product Owner and agree to initiate design work in the current sprint, deferring implementation to the subsequent sprint."
    ]
  },
  M28: {
    task: "Which critical path and project duration should you identify for the activity network?",
    choices: [
      "Identify path A → C → D with duration 10 days as the critical path, noting that path A → B → D has 2 days of total float.",
      "Identify path A → B → D with duration 8 days as the primary execution path, calculating total project float across secondary paths.",
      "Calculate project completion at 10 days based on longest path duration, assigning 2 days of float to task C.",
      "Determine critical path as A → C → D (10 days) and recommend crashing task C by 2 days to align with path A → B → D."
    ]
  },
  M29: {
    task: "Which crisis-management approach should you lead when your primary supplier cannot fulfil the component order due to a factory fire two weeks before launch?",
    choices: [
      "Activate crisis protocol: assess safety stock and alternate supplier availability, evaluate fast-track qualification options, quantify launch impacts, and brief leadership on a revised release plan.",
      "Contact secondary suppliers to secure replacement inventory, while working with the primary vendor to estimate factory recovery timelines.",
      "Inform leadership of potential launch delays and initiate contingency sourcing, focusing technical resources on evaluating component substitutions.",
      "Quantify contract penalties and financial risk while negotiating priority allocation from alternative distributor stocks."
    ]
  },
  M30: {
    task: "Which SQL JOIN type should you use to list all customers including those without orders?",
    choices: [
      "Use a LEFT JOIN (or LEFT OUTER JOIN) on Customers.id = Orders.customer_id to select all records from Customers and matching records from Orders.",
      "Use an INNER JOIN on Customers.id = Orders.customer_id and handle missing orders by applying a COALESCE function in the SELECT clause.",
      "Use a FULL OUTER JOIN to retrieve all records from both Customers and Orders tables, filtering NULL values in the WHERE clause.",
      "Use a RIGHT JOIN by designating Orders as the primary table and applying an IS NULL check on Customer IDs."
    ]
  },
  M31: {
    task: "Which data normalization step should you execute to eliminate transitive dependencies in the database schema?",
    choices: [
      "Apply Third Normal Form (3NF): ensure the relation is in 2NF and remove non-key attributes that depend on other non-key attributes by creating separate entity tables.",
      "Apply Second Normal Form (2NF): eliminate partial dependencies by ensuring all non-key attributes are fully functionally dependent on the primary key.",
      "De-normalize the schema by combining related lookup tables, improving query read performance while managing redundancy through database triggers.",
      "Apply Boyce-Codd Normal Form (BCNF): ensure every determinant in the table schema is a candidate key, modifying foreign key constraints."
    ]
  },
  M32: {
    task: "Which API rate-limiting strategy should you implement to protect microservice availability during traffic spikes?",
    choices: [
      "Implement a Token Bucket algorithm with Redis rate limiting: enforce per-client quotas, return HTTP 429 Too Many Requests with Retry-After headers, and log quota breaches.",
      "Configure Fixed Window rate limiting at the API gateway, returning HTTP 503 Service Unavailable when request thresholds are exceeded within a minute.",
      "Apply Leaky Bucket traffic shaping to smooth out inbound requests, queuing excess traffic until worker instances scale horizontally.",
      "Implement IP-based rate throttling with dynamic blocking rules, exempting authenticated corporate users from concurrency limits."
    ]
  },
  M33: {
    task: "Which Saudization compliance assessment and course of action should you recommend for Al-Hadeed Tech under Nitaqat guidelines?",
    choices: [
      "Recalculate Saudization impact: adding 12 expatriates drops the ratio to 48.9% (Low Nitaqat band); recommend registering new hires on Qiwa and hiring at least 9 Saudis to maintain the Medium band.",
      "Approve hiring the 12 expatriate technicians while establishing an internal Saudi apprenticeship program to balance workforce ratios over the next 12 months.",
      "Recommend hiring 6 expatriate technicians immediately and transferring 6 existing roles to Saudi nationals to maintain current Nitaqat band standing.",
      "Submit a Nitaqat exception request to the Ministry of Human Resources, detailing specialized technical requirements while maintaining current Saudi staffing levels."
    ]
  },
  M34: {
    task: "Which financial evaluation metric should you prioritize when comparing two capital expenditure proposals with different project lifespans?",
    choices: [
      "Calculate Net Present Value (NPV) using Equivalent Annual Annuity (EAA) or Equivalent Annual Cost (EAC) to compare annual financial value across different project durations.",
      "Calculate Internal Rate of Return (IRR) for both proposals and select the option with the higher percentage return, assuming cash flows can be reinvested at the IRR.",
      "Evaluate Payback Period for each proposal to identify which project recovers initial capital investment faster, prioritizing liquidity risk reduction.",
      "Compute Profitability Index (PI) for both investment options, selecting the project with the highest ratio of present value to initial outlay."
    ]
  },
  M35: {
    task: "Which Cloud Infrastructure scaling strategy should you deploy to handle unpredictable web application traffic bursts efficiently?",
    choices: [
      "Deploy an Elastic Auto-Scaling group with predictive scaling policies, fronted by a load balancer with health checks and multi-zone deployment for high availability.",
      "Configure horizontal pod autoscaling based on CPU and memory thresholds, setting static minimum instance counts to absorb initial traffic spikes.",
      "Implement vertical scaling by automatically upgrading instance types during peak operational hours, scheduling scale-down windows during off-peak periods.",
      "Deploy a serverless architecture with event-driven concurrency limits, managing database connection pools through dedicated proxy middleware."
    ]
  },
  M36: {
    task: "Which Cyber Security incident response step should you take immediately upon detecting unauthorized database access?",
    choices: [
      "Execute Containment protocol: isolate compromised network segments, revoke affected credential tokens, preserve system logs for forensics, and notify the Security Operations Team.",
      "Initiate forensic log analysis to identify the attacker's IP address and entry vector, deferring credential revocation until evidence collection is complete.",
      "Apply emergency security patches to database servers and restart application services, monitoring active user sessions for further unauthorized activity.",
      "Isolate affected application servers and perform a full database restoration from the latest clean backup snapshot."
    ]
  },
  M37: {
    task: "Which state management pattern should you implement in React to prevent unnecessary component re-renders in a complex dashboard?",
    choices: [
      "Utilize selective state subscriptions with Zustand or Context + useMemo/useCallback, decoupling UI components and memoizing heavy computational sub-trees.",
      "Move all component state to a centralized Redux store using global selectors, wrapping top-level components in React.memo HOCs.",
      "Use React Component local state with custom event emitters to pass updates directly between sibling components, bypassing parent re-renders.",
      "Implement React Query for server state caching and split local UI state into individual custom hooks per dashboard widget."
    ]
  },
  M38: {
    task: "Which Healthcare Data Governance framework should you enforce to ensure patient record privacy under Saudi health regulations?",
    choices: [
      "Implement Saudi Health Data Protection Law controls: enforce role-based encryption at rest and in transit, log all access trails, and establish data residency within KSA data centers.",
      "Apply HIPAA privacy standards across electronic medical record systems, configuring automated audit logs for patient record access.",
      "Implement data anonymization and pseudonymization protocols for secondary research databases, restricting patient identifier access to medical directors.",
      "Configure patient consent management workflows and enforce multi-factor authentication for all clinical staff accessing remote health portals."
    ]
  },
  M39: {
    task: "Which Supply Chain inventory control model should you select to minimize holding costs while preventing stockouts of critical spare parts?",
    choices: [
      "Implement an Economic Order Quantity (EOQ) model integrated with Safety Stock calculation based on lead-time variability and targeted service-level agreements.",
      "Apply a Just-In-Time (JIT) replenishment strategy with key suppliers, reducing warehouse holding stock to minimal operational baselines.",
      "Implement ABC Inventory Analysis, establishing daily cycle counts for Class A high-value components and periodic reviews for Class C items.",
      "Configure a Vendor-Managed Inventory (VMI) arrangement where component suppliers monitor warehouse stock levels and automate reorder triggers."
    ]
  },
  M40: {
    task: "Which Talent Management strategy should you execute to address high turnover among specialized software engineering roles?",
    choices: [
      "Conduct stay interviews and market compensation reviews: establish clear technical career ladders, offer targeted professional development, and improve onboarding and culture feedback loops.",
      "Increase base compensation and retention bonuses for critical engineering roles, while introducing mandatory exit interview reporting for HR.",
      "Implement a structured mentorship program and expand internal training budgets, offering flexible remote work options to improve role satisfaction.",
      "Revise recruitment criteria to select candidates with strong organizational tenure history, while streamlining quarterly performance appraisal cycles."
    ]
  },
  M41: {
    task: "Which DevOps CI/CD pipeline stage should you configure to catch security vulnerabilities before deploying to staging?",
    choices: [
      "Integrate Static Application Security Testing (SAST) and Dependency Vulnerability Scanning into the automated build pipeline, failing builds on high/critical findings.",
      "Configure Dynamic Application Security Testing (DAST) against automated staging deployments, generating vulnerability reports for development teams.",
      "Implement container image vulnerability scanning during production deployment phases, alerting DevOps leads on unpatched base image packages.",
      "Enforce mandatory manual peer code reviews and security checklist approvals before merging pull requests into the main repository branch."
    ]
  },
  M42: {
    task: "Which Legal and Regulatory Risk Management step should you prioritize when introducing an AI-driven credit scoring algorithm in Saudi Arabia?",
    choices: [
      "Ensure compliance with SAMA Consumer Protection and AI Ethics Guidelines: verify algorithmic explainability, audit for bias, obtain regulatory sandbox approval, and document model governance.",
      "Conduct a comprehensive data privacy impact assessment under Saudi Personal Data Protection Law (PDPL), establishing consent management workflows.",
      "Implement model monitoring dashboards to track algorithmic drift and credit approval distribution across demographic segments.",
      "Engage external legal counsel to review credit scoring disclosures and draft consumer terms of service regarding automated financial decisions."
    ]
  },
  M43: {
    task: "Which Renewable Energy project risk mitigation approach should you take when solar farm construction encounters unexpected soil instability?",
    choices: [
      "Conduct a geotechnical re-assessment, evaluate pile foundation modifications with engineering leads, update project risk registers, and submit a formal variation request to the client.",
      "Proceed with foundation installation using reinforced concrete ballast mounts, while conducting ongoing structural stability monitoring during construction.",
      "Pause foundation installation on affected site sectors and negotiate an extension of time with the project employer under FIDIC contract terms.",
      "Re-engineer mounting structure placements to avoid unstable soil zones, adjusting inverter layout plans to maintain generation capacity."
    ]
  },
  M44: {
    task: "Which Enterprise Architecture integration pattern should you select to connect legacy ERP software with a new cloud CRM?",
    choices: [
      "Deploy an Event-Driven Enterprise Service Bus (ESB) / API Gateway with asynchronous message queues, decoupling core ERP transactions from cloud CRM events.",
      "Implement scheduled batch ETL pipelines to synchronize customer and transactional data between ERP and CRM databases during off-peak hours.",
      "Build direct RESTful API integrations between ERP backend services and CRM webhooks, using mutual TLS authentication and error retry queues.",
      "Deploy a change data capture (CDC) middleware solution to replicate database updates from ERP to CRM storage in near real-time."
    ]
  },
  M45: {
    task: "Which Quality Management tool should you use to prioritize process improvement efforts when facing multiple customer complaint categories?",
    choices: [
      "Construct a Pareto Chart (80/20 rule) to identify the vital few complaint categories responsible for the majority of customer dissatisfaction.",
      "Develop a Fishbone (Ishikawa) Diagram to analyze root causes across People, Process, Technology, and Material factors for major complaint types.",
      "Deploy a Failure Mode and Effects Analysis (FMEA) matrix to score severity, occurrence, and detection risk for operational process steps.",
      "Implement Value Stream Mapping (VSM) to analyze process flow inefficiencies and eliminate non-value-added activities across customer service."
    ]
  },
  M46: {
    task: "Which Strategic Product Management framework should you use to evaluate whether to build, buy, or partner for a new AI feature?",
    choices: [
      "Apply Core Competency and Strategic Value analysis: evaluate technical capability, time-to-market constraints, IP ownership, total cost of ownership, and long-term strategic advantage.",
      "Conduct a detailed Net Present Value (NPV) and return on investment calculation for both internal development and third-party vendor licensing options.",
      "Perform a competitive feature benchmark analysis, evaluating market adoption rates and implementation complexity across industry peers.",
      "Execute a technical feasibility spike with internal engineering teams to estimate build effort before soliciting vendor partnership proposals."
    ]
  },
  M47: {
    task: "Which Executive Stakeholder Management approach should you take when a major project milestone is delayed by 3 weeks?",
    choices: [
      "Brief executive sponsors immediately: present the facts, explain root causes, outline recovery options with cost/schedule trade-offs, and propose a revised baseline with a clear decision gate.",
      "Issue a formal project status report updating milestone completion dates, while scheduling a dedicated briefing meeting with project sponsors.",
      "Reallocate project resources and negotiate scope adjustments with team leads to recover 1 week of delay before escalating to executive leadership.",
      "Present a revised project schedule during the monthly steering committee meeting, providing a detailed technical breakdown of contributing factors."
    ]
  },
  "JOBFIT-ACCOUNTING-FINANCE-2": {
    task: "Which financial variance remediation approach should you take to address the SAR 45k budget overrun?",
    choices: [
      "Conduct a variance audit: categorize expenditure items into fixed and variable pools, reallocate contingency reserves with audit committee approval, and enforce project spend controls.",
      "Reclassify the SAR 45k relocation cost as a capital expenditure asset to spread the variance across multi-year depreciation schedules.",
      "Absorb the budget overrun into general administrative overhead accounts without adjusting project category baselines.",
      "Defer vendor invoice processing to the subsequent fiscal quarter to align recorded expenses with quarterly budget allocations."
    ]
  },
  "JOBFIT-HEALTH-MANAGEMENT-1": {
    task: "Prioritise the most critical patient-safety risk in the scenario and propose a set of concrete, CBAHI-aligned controls to reduce its likelihood and severity.",
    choices: [
      "Prioritize contamination risk from uncovered single-use catheter trays left up to two hours; enforce immediate covered/sterile staging, clear bench policy, storage capacity fix, and monitoring aligned with CBAHI infection-prevention expectations.",
      "Perform weekly bacteriological sampling of staging surfaces while maintaining current tray placement routines pending laboratory culture results.",
      "Reallocate storage cabinet space from secondary supplies to accommodate catheter trays, deferring staff retraining on sterile staging protocols.",
      "Implement a digital inventory tracking system for single-use devices to reduce workbench storage time while monitoring infection rates."
    ]
  },
  "JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-3": {
    task: "Provide a comprehensive remediation plan for the fairness issue, including root‑cause analysis, corrective changes, re‑validation, and human oversight aligned with SDAIA AI Ethics 2.0 and Saudi PDPL.",
    choices: [
      "Pause deployment: analyze false-negative disparity drivers across demographic groups, re-balance training data representation, adjust group-specific decision thresholds, add human oversight, and document compliance with SDAIA AI Ethics guidelines.",
      "Apply post-processing threshold adjustments to align overall demographic selection rates, while scheduling quarterly fairness reviews post-launch.",
      "Retrain the eligibility model excluding geographical location proxies, validating secondary impact on overall 93% predictive accuracy.",
      "Introduce a manual appeal workflow for rejected applicants while maintaining current model deployment timelines for member universities."
    ]
  }
};

// ── Overwrite default-choices.ts ─────────────────────────────────────────────

function updateDefaultChoices() {
  const filePath = path.join(__dirname, "../src/lib/assessment/default-choices.ts");
  
  let code = `import type { AssessmentModuleSpec } from "./framework";

export interface ModuleBriefForChoices {
  code: string;
  title: string;
  scenario?: string;
  instructions?: string;
  choices?: string[];
}

const SPECIFIC_MODULE_CHOICES: Record<string, string[]> = {\n`;

  for (const [codeKey, data] of Object.entries(HIGH_QUALITY_CHOICES)) {
    code += `  ${JSON.stringify(codeKey)}: [\n`;
    for (const choice of data.choices) {
      code += `    ${JSON.stringify(choice)},\n`;
    }
    code += `  ],\n`;
  }

  code += `};\n\n`;
  code += `const SPECIFIC_MODULE_TASKS: Record<string, string> = {\n`;

  for (const [codeKey, data] of Object.entries(HIGH_QUALITY_CHOICES)) {
    code += `  ${JSON.stringify(codeKey)}: ${JSON.stringify(data.task)},\n`;
  }

  code += `};\n\n`;
  code += `export function getTaskForModule(module: ModuleBriefForChoices): string {
  const codeKey = (module.code || "").toUpperCase().trim();
  return SPECIFIC_MODULE_TASKS[codeKey] ?? module.instructions ?? "";
}

export function getChoicesForModule(module: ModuleBriefForChoices): string[] {
  if (module.choices && Array.isArray(module.choices) && module.choices.length >= 2) {
    return module.choices;
  }

  const codeKey = (module.code || "").toUpperCase().trim();
  if (SPECIFIC_MODULE_CHOICES[codeKey]) {
    return SPECIFIC_MODULE_CHOICES[codeKey];
  }

  const cleanTitle = module.title || "the operational situation";
  return [
    \`Diagnose \${cleanTitle} first: confirm the facts with the people closest to the work, identify the root cause from evidence rather than assumption, and only then commit to a corrective action with clear owners.\`,
    \`Communicate a clear recommendation on \${cleanTitle} to the accountable stakeholders: state the problem, present two realistic options with their trade-offs, and propose a decision with a fallback if conditions change.\`,
    \`Apply the least-risky immediate safeguard to \${cleanTitle} to protect the affected people or process, then investigate the underlying cause and implement a permanent fix once the urgent pressure is removed.\`,
    \`Run a structured decision on \${cleanTitle}: define the goal and constraints, score the realistic alternatives against impact, effort, risk and reversibility, document the trade-offs, and own the chosen course of action.\`
  ];
}
`;

  fs.writeFileSync(filePath, code, "utf8");
  console.log("✓ Successfully updated default-choices.ts with 47 high-quality choice packs!");
}

// ── Overwrite generated-questions.json ──────────────────────────────────────

function updateGeneratedQuestions() {
  const filePath = path.join(__dirname, "../src/lib/assessment/generated-questions.json");
  const existingJson = JSON.parse(fs.readFileSync(filePath, "utf8"));

  for (const [codeKey, data] of Object.entries(HIGH_QUALITY_CHOICES)) {
    if (existingJson[codeKey]) {
      existingJson[codeKey].instructions = data.task;
      existingJson[codeKey].choices = data.choices;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(existingJson, null, 2), "utf8");
  console.log("✓ Successfully updated generated-questions.json with 47 high-quality choice packs!");
}

updateDefaultChoices();
updateGeneratedQuestions();
