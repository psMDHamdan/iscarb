/**
 * Specialization Profile Generator
 * Dynamically builds a domain context profile for ANY specialization.
 * Used by the question generator to make every question structurally
 * dependent on the candidate's actual field.
 */

export interface SpecializationProfile {
  name: string;
  domain: string;
  coreKnowledgeAreas: string[];
  typicalTools: string[];
  professionalScenarios: string[];
  regulatoryContext: string;
  keyStakeholders: string[];
  commonDecisions: string[];
}

// ── Static curated profiles for the most common specializations ──────────────

const PROFILES: Record<string, SpecializationProfile> = {
  "web development": {
    name: "Web Development",
    domain: "Software Engineering",
    coreKnowledgeAreas: [
      "frontend development", "backend development", "REST APIs",
      "authentication & authorization", "databases", "caching",
      "performance optimization", "security", "CI/CD", "testing",
      "accessibility", "state management", "deployment", "observability",
    ],
    typicalTools: ["Git", "JavaScript/TypeScript", "React/Vue/Angular", "Node.js",
      "SQL/NoSQL databases", "Docker", "cloud platforms", "browser DevTools"],
    professionalScenarios: [
      "production API outage during a campaign launch",
      "frontend-backend contract disagreement before a release",
      "security vulnerability found in authentication flow",
      "performance regression introduced by a new deployment",
      "cross-team disagreement on caching strategy",
      "database query bottleneck under high traffic",
    ],
    regulatoryContext: "SDAIA data protection, NCA cybersecurity controls, CITC digital regulations",
    keyStakeholders: ["frontend engineers", "backend engineers", "product managers",
      "DevOps", "QA engineers", "security team", "end users"],
    commonDecisions: [
      "rollback vs hotfix a production regression",
      "API versioning strategy for backward compatibility",
      "choosing between server-side and client-side rendering",
      "database schema migration with zero downtime",
    ],
  },

  "artificial intelligence": {
    name: "Artificial Intelligence",
    domain: "AI & Data Science",
    coreKnowledgeAreas: [
      "machine learning", "deep learning", "model training & evaluation",
      "data preprocessing", "feature engineering", "bias & fairness",
      "model deployment (MLOps)", "explainability (XAI)", "NLP",
      "computer vision", "reinforcement learning", "data pipelines",
    ],
    typicalTools: ["Python", "PyTorch/TensorFlow", "scikit-learn", "MLflow",
      "Jupyter", "Spark", "cloud AI platforms", "vector databases"],
    professionalScenarios: [
      "model performance diverges between validation and production",
      "discovered bias in a model used for high-stakes decisions",
      "stakeholder requests deployment of an under-validated model",
      "data drift detected in live model after 3 months",
      "non-technical executive asks to announce model accuracy prematurely",
      "conflicting metrics between A/B test groups",
    ],
    regulatoryContext: "SDAIA AI Ethics 2.0, PDPL, NSDAI national AI strategy",
    keyStakeholders: ["data scientists", "ML engineers", "product owners",
      "business stakeholders", "ethics reviewers", "end users"],
    commonDecisions: [
      "deploy imperfect model vs delay for further validation",
      "communicate model limitations to non-technical leadership",
      "choose retraining frequency to manage data drift",
      "handle class imbalance in training data",
    ],
  },

  "machine learning": {
    name: "Machine Learning",
    domain: "AI & Data Science",
    coreKnowledgeAreas: [
      "supervised learning", "unsupervised learning", "model selection",
      "cross-validation", "hyperparameter tuning", "overfitting/underfitting",
      "ensemble methods", "neural networks", "model monitoring", "MLOps",
    ],
    typicalTools: ["Python", "scikit-learn", "PyTorch", "TensorFlow",
      "MLflow", "Kubeflow", "Pandas", "NumPy"],
    professionalScenarios: [
      "model generalizes poorly to production data",
      "A/B test shows conflicting lift metrics across segments",
      "training pipeline fails silently due to upstream data change",
      "leadership demands a faster model at the cost of accuracy",
    ],
    regulatoryContext: "SDAIA AI Ethics, PDPL data governance",
    keyStakeholders: ["ML engineers", "data engineers", "product managers", "business analysts"],
    commonDecisions: [
      "retrain vs fine-tune an existing model",
      "accept lower accuracy for interpretability requirements",
      "respond to sudden input distribution shift in production",
    ],
  },

  "data science": {
    name: "Data Science",
    domain: "AI & Data Science",
    coreKnowledgeAreas: [
      "statistical analysis", "data wrangling", "EDA", "hypothesis testing",
      "regression & classification", "time series", "data visualization",
      "A/B testing", "causal inference", "SQL & databases",
    ],
    typicalTools: ["Python", "R", "SQL", "Power BI", "Tableau",
      "Pandas", "Spark", "Jupyter", "dbt"],
    professionalScenarios: [
      "conflicting business metrics interpreted differently by two teams",
      "analysis reveals insight leadership does not want to act on",
      "data quality issue discovered mid-analysis before a board presentation",
      "stakeholder requests analysis that lacks statistical power",
    ],
    regulatoryContext: "PDPL data privacy, SDAIA data governance standards",
    keyStakeholders: ["data analysts", "business stakeholders", "engineers", "product teams"],
    commonDecisions: [
      "report uncomfortable findings vs soften conclusions",
      "proceed with incomplete data vs wait for complete dataset",
      "choose statistical test given sample size constraints",
    ],
  },

  "cybersecurity": {
    name: "Cybersecurity",
    domain: "Information Security",
    coreKnowledgeAreas: [
      "threat detection & response", "vulnerability management", "penetration testing",
      "incident response", "network security", "identity & access management",
      "cryptography", "SIEM", "security architecture", "compliance frameworks",
    ],
    typicalTools: ["SIEM platforms", "firewalls", "IDS/IPS", "vulnerability scanners",
      "endpoint protection", "SOAR", "network analyzers"],
    professionalScenarios: [
      "active ransomware incident on a production system",
      "critical vulnerability discovered in a live customer-facing service",
      "third-party vendor found to have weak access controls",
      "security vs usability conflict in authentication design",
      "detected insider threat with unclear evidence",
    ],
    regulatoryContext: "NCA ECC-1, NCA CSCC, SDAIA PDPL, CITC",
    keyStakeholders: ["SOC analysts", "IT leadership", "compliance officers",
      "developers", "vendors", "executive management"],
    commonDecisions: [
      "take a system offline vs allow continued operation during investigation",
      "disclose a breach to regulators before root cause is confirmed",
      "balance security controls with operational continuity",
    ],
  },

  "database systems": {
    name: "Database Systems",
    domain: "Software Engineering",
    coreKnowledgeAreas: [
      "relational database design", "SQL optimization", "indexing strategies",
      "transactions & ACID", "normalization", "NoSQL databases",
      "data migration", "replication", "backup & recovery", "query performance",
    ],
    typicalTools: ["PostgreSQL", "MySQL", "Oracle", "SQL Server",
      "MongoDB", "Redis", "Elasticsearch", "database monitoring tools"],
    professionalScenarios: [
      "production query causing full table scan under load",
      "schema migration needed without downtime",
      "database replication lag causing stale reads in application",
      "conflicting indexing strategies requested by two teams",
    ],
    regulatoryContext: "PDPL data residency, NCA data protection controls",
    keyStakeholders: ["DBAs", "backend engineers", "DevOps", "product managers"],
    commonDecisions: [
      "add index vs accept query cost for infrequent operations",
      "normalize vs denormalize for read-heavy workloads",
      "choose consistency vs availability under network partition",
    ],
  },

  "cloud computing": {
    name: "Cloud Computing",
    domain: "Software Engineering / Infrastructure",
    coreKnowledgeAreas: [
      "IaaS/PaaS/SaaS models", "cloud architecture", "auto-scaling",
      "cost optimization", "serverless computing", "containers & orchestration",
      "cloud security", "multi-cloud strategy", "disaster recovery", "SLAs",
    ],
    typicalTools: ["AWS/Azure/GCP", "Kubernetes", "Terraform", "Docker",
      "CloudFormation", "monitoring platforms", "CDN services"],
    professionalScenarios: [
      "cloud costs tripled after an unmonitored autoscaling event",
      "multi-region outage affecting SLA commitments",
      "security misconfiguration in a public S3 bucket found post-deployment",
      "team debates managed services vs self-hosted for a new system",
    ],
    regulatoryContext: "NCA cloud security controls, SDAIA data residency, CITC",
    keyStakeholders: ["cloud architects", "DevOps engineers", "security teams",
      "finance/FinOps", "product managers"],
    commonDecisions: [
      "migrate to managed service vs maintain self-hosted for control",
      "optimize cost vs maintain redundancy for SLA compliance",
      "respond to active data exfiltration via misconfigured storage",
    ],
  },

  "devops": {
    name: "DevOps",
    domain: "Software Engineering / Infrastructure",
    coreKnowledgeAreas: [
      "CI/CD pipelines", "infrastructure as code", "container orchestration",
      "monitoring & observability", "incident management", "release engineering",
      "configuration management", "GitOps", "chaos engineering",
    ],
    typicalTools: ["Jenkins/GitHub Actions", "Kubernetes", "Docker", "Terraform",
      "Ansible", "Prometheus/Grafana", "PagerDuty", "Helm"],
    professionalScenarios: [
      "broken CI pipeline blocking all deployments before a release",
      "production deployment causes a service degradation",
      "on-call engineer discovers memory leak at 2 AM",
      "team disagrees on deployment frequency vs stability",
    ],
    regulatoryContext: "NCA operational security, SDAIA system reliability standards",
    keyStakeholders: ["developers", "SREs", "product managers", "security team", "operations"],
    commonDecisions: [
      "roll back a bad release vs attempt hotfix under live traffic",
      "increase deployment frequency vs enforce longer stabilization windows",
      "automate vs manual approval gates in the release pipeline",
    ],
  },

  "accounting": {
    name: "Accounting",
    domain: "Financial Services",
    coreKnowledgeAreas: [
      "financial reporting (IFRS/GAAP)", "audit procedures", "internal controls",
      "reconciliation", "tax compliance", "cost accounting", "budgeting",
      "materiality assessment", "forensic accounting", "consolidation",
    ],
    typicalTools: ["ERP systems (SAP/Oracle)", "Excel", "audit software",
      "accounting platforms", "SOCPA standards", "SAMA reporting"],
    professionalScenarios: [
      "material misstatement discovered days before financial statement sign-off",
      "auditor finds a control gap in accounts payable approval workflow",
      "management pressure to defer recognizing a loss",
      "consolidation error in a group company with a tight reporting deadline",
      "suspected expense fraud discovered during reconciliation",
    ],
    regulatoryContext: "SOCPA standards, SAMA financial reporting, CMA disclosure requirements, IFRS",
    keyStakeholders: ["CFOs", "external auditors", "audit committee", "regulators",
      "board members", "tax authorities"],
    commonDecisions: [
      "disclose a material misstatement vs quantify materiality threshold",
      "escalate a suspected fraud vs gather more evidence first",
      "challenge management's accounting estimate vs accept with a caveat",
    ],
  },

  "finance": {
    name: "Finance",
    domain: "Financial Services",
    coreKnowledgeAreas: [
      "financial modeling", "valuation (DCF, comparables)", "capital markets",
      "risk management", "portfolio analysis", "corporate finance",
      "investment analysis", "derivatives", "financial regulation",
    ],
    typicalTools: ["Bloomberg", "Excel/VBA", "Python for finance",
      "ERP/TMS systems", "risk platforms", "CMA reporting tools"],
    professionalScenarios: [
      "valuation model produces results inconsistent with management's view",
      "market volatility requires immediate portfolio rebalancing decision",
      "credit risk assessment conflicts with deal team's optimistic projections",
      "regulatory capital requirement changes affect a live investment",
    ],
    regulatoryContext: "SAMA capital requirements, CMA investment regulations, SOCPA",
    keyStakeholders: ["investment committees", "CFOs", "risk managers",
      "regulators", "clients", "deal teams"],
    commonDecisions: [
      "accept a higher-return investment with elevated risk vs decline",
      "report a stressed position to management before full analysis is complete",
      "challenge deal assumptions when model outputs are materially different",
    ],
  },

  "molecular biology": {
    name: "Molecular Biology",
    domain: "Life Sciences",
    coreKnowledgeAreas: [
      "PCR & qPCR", "gene expression analysis", "CRISPR/gene editing",
      "protein purification", "cell culture", "Western blot", "sequencing",
      "microscopy", "assay development", "experimental design",
    ],
    typicalTools: ["PCR machines", "flow cytometry", "ELISA platforms",
      "bioinformatics tools", "gel electrophoresis", "mass spectrometry"],
    professionalScenarios: [
      "qPCR results show unexpected variability across biological replicates",
      "cell line contamination discovered mid-experiment",
      "assay shows off-target effects in a gene-editing experiment",
      "conflicting data between two technicians running the same protocol",
      "reagent quality issue identified after 3 months of experiments",
    ],
    regulatoryContext: "SFDA laboratory standards, GLP compliance, research ethics board",
    keyStakeholders: ["principal investigators", "lab technicians", "ethics boards",
      "regulatory affairs", "collaborators"],
    commonDecisions: [
      "repeat failed experiments vs proceed with caveat",
      "report unexpected off-target effects before manuscript submission",
      "choose between two conflicting assay protocols",
    ],
  },

  "aeronautical engineering": {
    name: "Aeronautical Engineering",
    domain: "Aerospace Engineering",
    coreKnowledgeAreas: [
      "aerodynamics", "structural analysis", "propulsion systems",
      "flight mechanics", "avionics", "systems integration",
      "airworthiness certification", "maintenance engineering",
      "failure mode analysis (FMEA)", "fatigue life",
    ],
    typicalTools: ["CAD/FEA software (CATIA/ANSYS)", "wind tunnel testing",
      "flight simulation", "DFMEA tools", "EASA/FAA certification frameworks"],
    professionalScenarios: [
      "structural test reveals margin below minimum safety factor",
      "supplier component fails to meet airworthiness spec before delivery",
      "in-service crack propagation found during routine inspection",
      "certification timeline conflict between safety test and delivery date",
      "two engineers disagree on acceptable fatigue life margin",
    ],
    regulatoryContext: "GACA airworthiness, EASA CS-25, FAA FAR Part 25, SASO aerospace standards",
    keyStakeholders: ["chief engineers", "airworthiness authorities", "airline customers",
      "MRO teams", "systems integrators", "test pilots"],
    commonDecisions: [
      "halt delivery vs accept with a documented deviation and corrective action",
      "approve a repair vs require part replacement on structural finding",
      "balance weight reduction against structural safety margin",
    ],
  },

  "mechanical engineering": {
    name: "Mechanical Engineering",
    domain: "Engineering",
    coreKnowledgeAreas: ["thermodynamics", "fluid mechanics", "materials science",
      "mechanical design", "manufacturing processes", "finite element analysis",
      "heat transfer", "vibration analysis", "robotics & automation"],
    typicalTools: ["SolidWorks/AutoCAD", "ANSYS", "MATLAB", "CNC machines", "3D printers"],
    professionalScenarios: [
      "fatigue failure in a production component before end of design life",
      "material substitution required due to supply chain disruption",
      "prototype fails thermal test near certification deadline",
    ],
    regulatoryContext: "Saudi Council of Engineers, SASO standards, MOMRAH construction codes",
    keyStakeholders: ["design engineers", "manufacturing teams", "QA", "clients", "suppliers"],
    commonDecisions: ["redesign vs material upgrade for failed component",
      "delay launch vs ship with documented deviation",
      "accept supplier substitute vs halt production"],
  },

  "electrical engineering": {
    name: "Electrical Engineering",
    domain: "Engineering",
    coreKnowledgeAreas: ["circuit design", "power systems", "control systems",
      "signal processing", "embedded systems", "PCB design",
      "electromagnetic compatibility", "power electronics"],
    typicalTools: ["MATLAB/Simulink", "Altium", "oscilloscopes", "SCADA", "PLC programming"],
    professionalScenarios: [
      "power system fault on a live industrial installation",
      "EMC test failure before product certification",
      "firmware bug causing intermittent hardware fault in field units",
    ],
    regulatoryContext: "Saudi Council of Engineers, IEC standards, SASO, SEC regulations",
    keyStakeholders: ["power engineers", "clients", "safety officers", "regulators"],
    commonDecisions: ["isolate vs maintain live power under fault condition",
      "delay shipment for EMC re-test vs ship with risk acceptance",
      "patch firmware remotely vs recall field units"],
  },

  "medicine": {
    name: "Medicine",
    domain: "Healthcare",
    coreKnowledgeAreas: ["clinical diagnosis", "patient safety", "pharmacology",
      "evidence-based medicine", "clinical procedures", "medical ethics",
      "infection control", "emergency response", "healthcare quality"],
    typicalTools: ["EMR/EHR systems", "diagnostic imaging", "laboratory analysis",
      "clinical protocols", "MoH clinical guidelines"],
    professionalScenarios: [
      "adverse drug reaction discovered after patient is discharged",
      "conflicting diagnoses between two senior physicians",
      "resource constraint forces triage decision in emergency",
      "patient declines recommended treatment with informed consent",
    ],
    regulatoryContext: "CBAHI accreditation, SFDA drug regulations, MoH clinical standards, medical ethics board",
    keyStakeholders: ["patients", "nurses", "consultants", "pharmacists",
      "hospital administration", "ethics committee"],
    commonDecisions: ["escalate vs monitor a deteriorating patient",
      "disclose a medical error to patient and family",
      "balance patient autonomy vs clinical recommendation"],
  },

  "nursing": {
    name: "Nursing",
    domain: "Healthcare",
    coreKnowledgeAreas: ["patient assessment", "medication administration",
      "wound care", "infection prevention", "documentation", "patient education",
      "critical care", "triage", "nursing ethics"],
    typicalTools: ["EHR systems", "patient monitoring equipment", "medication dispensing systems"],
    professionalScenarios: [
      "medication discrepancy found during handover",
      "patient condition deteriorates unexpectedly on a busy ward",
      "colleague observed bypassing hand hygiene protocol",
    ],
    regulatoryContext: "CBAHI, Saudi Commission for Health Specialties, MoH nursing standards",
    keyStakeholders: ["patients", "physicians", "charge nurses", "hospital management"],
    commonDecisions: ["escalate vs manage patient deterioration independently",
      "report a colleague's protocol violation vs address informally",
      "prioritize competing patient needs under staffing shortage"],
  },

  "civil engineering": {
    name: "Civil Engineering",
    domain: "Engineering",
    coreKnowledgeAreas: ["structural design", "geotechnical engineering",
      "construction management", "materials testing", "surveying",
      "environmental engineering", "transportation engineering", "project delivery"],
    typicalTools: ["AutoCAD/Revit", "SAP2000/ETABS", "project management software",
      "geotechnical testing equipment"],
    professionalScenarios: [
      "foundation soil report shows unexpected bearing capacity reduction",
      "contractor proposes material substitution mid-construction",
      "structural inspection reveals rebar placement deviation",
    ],
    regulatoryContext: "Saudi Council of Engineers, MOMRAH building codes, SASO standards, municipality approvals",
    keyStakeholders: ["project owners", "contractors", "inspection authority",
      "environmental regulators", "consultants"],
    commonDecisions: ["issue stop-work order vs corrective action plan for deviation",
      "accept expedited material testing vs delay construction",
      "escalate design change request vs implement under engineer's discretion"],
  },
};

// ── Generic profile builder for unlisted specializations ────────────────────

function buildGenericProfile(specialization: string): SpecializationProfile {
  return {
    name: specialization,
    domain: "Professional Practice",
    coreKnowledgeAreas: [
      `core ${specialization} theory and methodology`,
      `applied ${specialization} problem-solving`,
      `professional ethics in ${specialization}`,
      `industry standards and best practices`,
      `stakeholder management`,
      `quality assurance`,
      `documentation and reporting`,
    ],
    typicalTools: [
      `standard ${specialization} software tools`,
      "project management platforms",
      "communication and collaboration tools",
    ],
    professionalScenarios: [
      `critical deadline conflict with quality standards in ${specialization}`,
      `technical disagreement between team members on a ${specialization} decision`,
      `compliance issue discovered before a key ${specialization} deliverable`,
      `resource constraint requiring difficult prioritization in ${specialization}`,
    ],
    regulatoryContext: "Vision 2030, NQF, relevant Saudi professional authority standards",
    keyStakeholders: [
      "project team members", "manager", "client", "quality assurance",
      "subject matter experts", "end users",
    ],
    commonDecisions: [
      "escalate a quality risk vs manage it within the team",
      "meet deadline with accepted risk vs delay for quality",
      "resolve a technical disagreement between peers",
    ],
  };
}

// ── Normalize lookup key ─────────────────────────────────────────────────────

function normalizeKey(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ");
}

/**
 * Returns a specialization profile for any input.
 * Exact match → curated profile.
 * Partial match → curated profile.
 * No match → dynamically generated generic profile.
 */
export function getSpecializationProfile(specialization: string): SpecializationProfile {
  const key = normalizeKey(specialization);

  // Exact match
  if (PROFILES[key]) return PROFILES[key];

  // Partial match (e.g. "Mobile Development" matches "web development" context partially;
  // "Biomedical Engineering" matches "molecular biology" partially)
  const partialKey = Object.keys(PROFILES).find(
    (k) => key.includes(k) || k.includes(key) ||
      // check word-level overlap
      key.split(" ").some((w) => w.length > 3 && k.includes(w))
  );
  if (partialKey) {
    // Return the matched profile but with the real specialization name
    return { ...PROFILES[partialKey], name: specialization };
  }

  return buildGenericProfile(specialization);
}

/**
 * Renders the specialization profile as a compact string block
 * to be injected into LLM system prompts.
 */
export function renderProfileForPrompt(profile: SpecializationProfile): string {
  return [
    `SPECIALIZATION: ${profile.name}`,
    `DOMAIN: ${profile.domain}`,
    ``,
    `CORE KNOWLEDGE AREAS (the scenario MUST draw from these):`,
    profile.coreKnowledgeAreas.map((a) => `  - ${a}`).join("\n"),
    ``,
    `TYPICAL PROFESSIONAL TOOLS & CONCEPTS:`,
    profile.typicalTools.map((t) => `  - ${t}`).join("\n"),
    ``,
    `REALISTIC PROFESSIONAL SCENARIOS (use these as structural templates):`,
    profile.professionalScenarios.map((s) => `  - ${s}`).join("\n"),
    ``,
    `KEY STAKEHOLDERS IN THIS DOMAIN:`,
    profile.keyStakeholders.map((s) => `  - ${s}`).join("\n"),
    ``,
    `TYPICAL HIGH-STAKES DECISIONS IN THIS DOMAIN:`,
    profile.commonDecisions.map((d) => `  - ${d}`).join("\n"),
    ``,
    `REGULATORY CONTEXT (reference only when relevant):`,
    `  ${profile.regulatoryContext}`,
  ].join("\n");
}
