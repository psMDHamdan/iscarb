/**
 * iSCARB — Saudi national classification reference data (bilingual AR/EN).
 * ===========================================================================
 * Two official Saudi statistical standards are encoded here so that iSCARB's
 * AI-generated career titles and the universities' programmes are ANCHORED to
 * sovereign, auditable codes instead of free text:
 *
 *   1. SCED — Saudi Unified Classification of Educational Levels & Specializations
 *      (Ministry of Education, Council of Ministers decision 701/1440H; built on
 *      UNESCO ISCED 2011 levels + ISCED-F 2013 fields). English labels follow the
 *      official ISCED-F broad-field names for international comparability; Arabic
 *      labels are taken from the Saudi classification itself.
 *
 *   2. SSCO — Saudi Standard Classification of Occupations
 *      (GASTAT, Council of Ministers decision 540/1440H; built on ILO ISCO-08).
 *      English major/sub-group labels follow the official ISCO-08 titles; Arabic
 *      labels are taken from the Saudi classification.
 *
 * SCOPE NOTE: this is a CURATED seed, not the full national catalogue (SCED has
 * ~520 specializations; SSCO has thousands of 6-digit occupations). It encodes
 * the complete top-level hierarchy of both standards plus the specializations
 * and occupations relevant to the programmes iSCARB serves. The full ingestion
 * is a separate, validated data-engineering task (and for production should be
 * sourced from the current GASTAT "Unified SSCO" platform rather than a snapshot).
 * Every row carries both `nameEn` and `nameAr` — bilingual parity is enforced by
 * the type, not by convention.
 * ===========================================================================
 */

export type ScedKind = "level" | "broad" | "narrow" | "detailed" | "specialization";
export type SsccoKind = "major" | "sub" | "minor" | "unit" | "occupation";

export interface ScedRow {
  code: string; // SCED code (1 digit for level; 2/3/4/6 digits for fields)
  kind: ScedKind;
  nameEn: string;
  nameAr: string;
  parentCode: string | null; // null for top level
  nqfLevel?: number | null; // National Qualifications Framework level (levels only)
  iscedLevel?: number | null; // UNESCO ISCED level mapping (levels only)
  exampleCoursesEn?: string[]; // from the SCED specialization card (specializations only)
  exampleCoursesAr?: string[];
}

export interface SsccoRow {
  code: string; // SSCO code (1 digit major → 6 digit occupation)
  kind: SsccoKind;
  nameEn: string;
  nameAr: string;
  parentCode: string | null;
  iscoCode?: string | null; // ISCO-08 mapping (the international standard SSCO is built on)
  skillLevel?: number | null; // ISCO skill level 1–4 (major groups)
}

// ───────────────────────────────────────────────────────────────────────────
//  SCED — Educational LEVELS (0–8), with NQF + ISCED mapping
//  English follows ISCED 2011 level names; Arabic from the Saudi classification.
// ───────────────────────────────────────────────────────────────────────────
export const SCED_LEVELS: ScedRow[] = [
  { code: "0", kind: "level", nameEn: "Early childhood education", nameAr: "تعليم الطفولة المبكرة", parentCode: null, iscedLevel: 0, nqfLevel: null },
  { code: "1", kind: "level", nameEn: "Primary education", nameAr: "التعليم الابتدائي", parentCode: null, iscedLevel: 1, nqfLevel: 1 },
  { code: "2", kind: "level", nameEn: "Lower secondary education", nameAr: "التعليم المتوسط", parentCode: null, iscedLevel: 2, nqfLevel: 2 },
  { code: "3", kind: "level", nameEn: "Upper secondary education", nameAr: "التعليم الثانوي", parentCode: null, iscedLevel: 3, nqfLevel: 3 },
  { code: "4", kind: "level", nameEn: "Associate diploma", nameAr: "الدبلوم المشارك", parentCode: null, iscedLevel: 4, nqfLevel: 4 },
  { code: "5", kind: "level", nameEn: "Intermediate diploma", nameAr: "الدبلوم المتوسط", parentCode: null, iscedLevel: 5, nqfLevel: 5 },
  { code: "6", kind: "level", nameEn: "Bachelor's or equivalent", nameAr: "البكالوريوس أو ما يعادلها", parentCode: null, iscedLevel: 6, nqfLevel: 6 },
  { code: "7", kind: "level", nameEn: "Master's or equivalent", nameAr: "الماجستير أو ما يعادلها", parentCode: null, iscedLevel: 7, nqfLevel: 7 },
  { code: "8", kind: "level", nameEn: "Doctorate or equivalent", nameAr: "الدكتوراه أو ما يعادلها", parentCode: null, iscedLevel: 8, nqfLevel: 8 },
];

// ───────────────────────────────────────────────────────────────────────────
//  SCED — Broad fields (00–10). English follows ISCED-F 2013 broad-field names.
// ───────────────────────────────────────────────────────────────────────────
export const SCED_BROAD_FIELDS: ScedRow[] = [
  { code: "00", kind: "broad", nameEn: "Generic programmes and qualifications", nameAr: "البرامج والمؤهلات العامة", parentCode: null },
  { code: "01", kind: "broad", nameEn: "Education", nameAr: "التعليم", parentCode: null },
  { code: "02", kind: "broad", nameEn: "Arts and humanities", nameAr: "الفنون والعلوم الإنسانية", parentCode: null },
  { code: "03", kind: "broad", nameEn: "Social sciences, journalism and information", nameAr: "العلوم الاجتماعية والصحافة والإعلام", parentCode: null },
  { code: "04", kind: "broad", nameEn: "Business, administration and law", nameAr: "الأعمال والإدارة والقانون", parentCode: null },
  { code: "05", kind: "broad", nameEn: "Natural sciences, mathematics and statistics", nameAr: "العلوم الطبيعية والرياضيات والإحصاء", parentCode: null },
  { code: "06", kind: "broad", nameEn: "Information and communication technologies", nameAr: "تقنية الاتصالات والمعلومات", parentCode: null },
  { code: "07", kind: "broad", nameEn: "Engineering, manufacturing and construction", nameAr: "الهندسة والتصنيع والبناء", parentCode: null },
  { code: "08", kind: "broad", nameEn: "Agriculture, forestry, fisheries and veterinary", nameAr: "الزراعة والحراجة ومصائد الأسماك والبيطرة", parentCode: null },
  { code: "09", kind: "broad", nameEn: "Health and welfare", nameAr: "الصحة والرفاه", parentCode: null },
  { code: "10", kind: "broad", nameEn: "Services", nameAr: "الخدمات", parentCode: null },
];

// ───────────────────────────────────────────────────────────────────────────
//  SCED — Narrow fields (3-digit) for the broad fields iSCARB programmes touch.
//  English follows ISCED-F 2013 narrow-field names.
// ───────────────────────────────────────────────────────────────────────────
export const SCED_NARROW_FIELDS: ScedRow[] = [
  // 04 Business, administration and law
  { code: "041", kind: "narrow", nameEn: "Business and administration", nameAr: "الأعمال والإدارة", parentCode: "04" },
  { code: "042", kind: "narrow", nameEn: "Law", nameAr: "القانون", parentCode: "04" },
  // 05 Natural sciences, mathematics and statistics
  { code: "054", kind: "narrow", nameEn: "Mathematics and statistics", nameAr: "الرياضيات والإحصاء", parentCode: "05" },
  // 06 ICT
  { code: "061", kind: "narrow", nameEn: "Information and communication technologies", nameAr: "تقنية الاتصالات والمعلومات", parentCode: "06" },
  { code: "068", kind: "narrow", nameEn: "Inter-disciplinary programmes involving ICT", nameAr: "برامج متعددة التخصصات تتضمن تقنية المعلومات والاتصالات", parentCode: "06" },
  // 07 Engineering
  { code: "071", kind: "narrow", nameEn: "Engineering and engineering trades", nameAr: "الهندسة والحرف الهندسية", parentCode: "07" },
  // 09 Health and welfare
  { code: "091", kind: "narrow", nameEn: "Health", nameAr: "الصحة", parentCode: "09" },
];

// ───────────────────────────────────────────────────────────────────────────
//  SCED — Detailed fields (4-digit) for the relevant narrow fields.
// ───────────────────────────────────────────────────────────────────────────
export const SCED_DETAILED_FIELDS: ScedRow[] = [
  { code: "0411", kind: "detailed", nameEn: "Accounting and taxation", nameAr: "المحاسبة والضرائب", parentCode: "041" },
  { code: "0412", kind: "detailed", nameEn: "Finance, banking and insurance", nameAr: "التمويل والمصارف والتأمين", parentCode: "041" },
  { code: "0413", kind: "detailed", nameEn: "Management and administration", nameAr: "الإدارة", parentCode: "041" },
  { code: "0414", kind: "detailed", nameEn: "Marketing and advertising", nameAr: "التسويق والإعلان", parentCode: "041" },
  { code: "0612", kind: "detailed", nameEn: "Database and network design and administration", nameAr: "تصميم وإدارة قواعد البيانات والشبكات", parentCode: "061" },
  { code: "0613", kind: "detailed", nameEn: "Software and applications development and analysis", nameAr: "تطوير وتحليل البرمجيات والتطبيقات", parentCode: "061" },
  { code: "0619", kind: "detailed", nameEn: "Information and communication technologies (others)", nameAr: "برامج أخرى في تقنية الاتصالات والمعلومات", parentCode: "061" },
  { code: "0688", kind: "detailed", nameEn: "Inter-disciplinary programmes involving ICT", nameAr: "برامج ومؤهلات متعددة التخصصات تتضمن تقنية المعلومات والاتصالات", parentCode: "068" },
  { code: "0912", kind: "detailed", nameEn: "Medicine", nameAr: "الطب", parentCode: "091" },
];

// ───────────────────────────────────────────────────────────────────────────
//  SCED — Specializations (6-digit) relevant to iSCARB programmes.
//  Arabic name + code from the Saudi classification; example courses from the
//  classification's specialization "cards" where captured. English titles are
//  the standard equivalents.
// ───────────────────────────────────────────────────────────────────────────
export const SCED_SPECIALIZATIONS: ScedRow[] = [
  {
    code: "041101", kind: "specialization", nameEn: "Accounting", nameAr: "المحاسبة", parentCode: "0411",
    exampleCoursesEn: ["Financial accounting", "Managerial accounting", "Auditing", "Taxation and zakat"],
    exampleCoursesAr: ["المحاسبة المالية", "المحاسبة الإدارية", "المراجعة", "الضرائب والزكاة"],
  },
  {
    code: "041102", kind: "specialization", nameEn: "Accounting information systems", nameAr: "نظم المعلومات المحاسبية", parentCode: "0411",
    exampleCoursesEn: ["Accounting information systems", "Databases for accounting", "Internal control", "ERP systems"],
    exampleCoursesAr: ["نظم المعلومات المحاسبية", "قواعد بيانات المحاسبة", "الرقابة الداخلية", "أنظمة تخطيط الموارد"],
  },
  {
    code: "041201", kind: "specialization", nameEn: "Financial management", nameAr: "الإدارة المالية", parentCode: "0412",
    exampleCoursesEn: ["Corporate finance", "Investment analysis", "Financial markets", "Risk management"],
    exampleCoursesAr: ["التمويل المؤسسي", "تحليل الاستثمار", "الأسواق المالية", "إدارة المخاطر"],
  },
  {
    code: "041202", kind: "specialization", nameEn: "Islamic financial management", nameAr: "الإدارة المالية الإسلامية", parentCode: "0412",
    exampleCoursesEn: ["Islamic finance principles", "Sukuk and Islamic markets", "Murabaha and Ijara", "Shariah governance"],
    exampleCoursesAr: ["أصول التمويل الإسلامي", "الصكوك والأسواق الإسلامية", "المرابحة والإجارة", "الحوكمة الشرعية"],
  },
  {
    code: "041205", kind: "specialization", nameEn: "Risk management and insurance", nameAr: "إدارة المخاطر والتأمين", parentCode: "0412",
    exampleCoursesEn: ["Enterprise risk management", "Actuarial principles", "Insurance markets", "Credit risk"],
    exampleCoursesAr: ["إدارة مخاطر المؤسسة", "أصول علم الاكتواري", "أسواق التأمين", "مخاطر الائتمان"],
  },
  {
    code: "041303", kind: "specialization", nameEn: "Business administration", nameAr: "إدارة الأعمال", parentCode: "0413",
    exampleCoursesEn: ["Principles of management", "Organizational behaviour", "Strategic management", "Operations management"],
    exampleCoursesAr: ["مبادئ الإدارة", "السلوك التنظيمي", "الإدارة الاستراتيجية", "إدارة العمليات"],
  },
  {
    code: "041304", kind: "specialization", nameEn: "Management information systems", nameAr: "نظم المعلومات الإدارية", parentCode: "0413",
    exampleCoursesEn: ["Management information systems", "Business analytics", "Systems analysis and design", "Digital transformation"],
    exampleCoursesAr: ["نظم المعلومات الإدارية", "تحليلات الأعمال", "تحليل وتصميم النظم", "التحول الرقمي"],
  },
  {
    code: "041305", kind: "specialization", nameEn: "Health services administration", nameAr: "إدارة الخدمات الصحية", parentCode: "0413",
    exampleCoursesEn: ["Health systems management", "Healthcare quality and CBAHI", "Health economics", "Healthcare operations"],
    exampleCoursesAr: ["إدارة الأنظمة الصحية", "جودة الرعاية الصحية وCBAHI", "اقتصاديات الصحة", "عمليات الرعاية الصحية"],
  },
  {
    code: "041306", kind: "specialization", nameEn: "Health information management", nameAr: "إدارة المعلومات الصحية", parentCode: "0413",
    exampleCoursesEn: ["Health information management", "Medical coding", "Health data governance", "Electronic health records"],
    exampleCoursesAr: ["إدارة المعلومات الصحية", "الترميز الطبي", "حوكمة البيانات الصحية", "السجلات الصحية الإلكترونية"],
  },
  {
    code: "041401", kind: "specialization", nameEn: "Marketing", nameAr: "التسويق", parentCode: "0414",
    exampleCoursesEn: ["Marketing principles", "Consumer behaviour", "Digital marketing", "Marketing research"],
    exampleCoursesAr: ["مبادئ التسويق", "سلوك المستهلك", "التسويق الرقمي", "بحوث التسويق"],
  },
  {
    code: "061203", kind: "specialization", nameEn: "Information security", nameAr: "أمن المعلومات", parentCode: "0612",
    exampleCoursesEn: ["Network security", "Cryptography", "Security operations and NCA ECC", "Digital forensics"],
    exampleCoursesAr: ["أمن الشبكات", "التشفير", "عمليات الأمن والضوابط الأساسية NCA", "الأدلة الجنائية الرقمية"],
  },
  {
    code: "061301", kind: "specialization", nameEn: "Computer programming and science", nameAr: "البرمجة وعلوم الحاسب", parentCode: "0613",
    exampleCoursesEn: ["Programming fundamentals", "Data structures and algorithms", "Operating systems", "Software engineering"],
    exampleCoursesAr: ["أساسيات البرمجة", "هياكل البيانات والخوارزميات", "نظم التشغيل", "هندسة البرمجيات"],
  },
  {
    code: "061302", kind: "specialization", nameEn: "Software engineering", nameAr: "هندسة البرمجيات", parentCode: "0613",
    exampleCoursesEn: ["Software requirements", "Software architecture", "Quality assurance and testing", "DevOps"],
    exampleCoursesAr: ["متطلبات البرمجيات", "معمارية البرمجيات", "ضمان الجودة والاختبار", "DevOps"],
  },
  {
    code: "061303", kind: "specialization", nameEn: "Information technology", nameAr: "تقنية المعلومات", parentCode: "0613",
    exampleCoursesEn: ["IT infrastructure", "Cloud computing", "Networking", "IT service management"],
    exampleCoursesAr: ["البنية التحتية لتقنية المعلومات", "الحوسبة السحابية", "الشبكات", "إدارة خدمات تقنية المعلومات"],
  },
  {
    code: "061304", kind: "specialization", nameEn: "Information systems", nameAr: "نظم المعلومات", parentCode: "0613",
    exampleCoursesEn: ["Information systems analysis", "Databases", "Enterprise systems", "IT governance"],
    exampleCoursesAr: ["تحليل نظم المعلومات", "قواعد البيانات", "الأنظمة المؤسسية", "حوكمة تقنية المعلومات"],
  },
  {
    code: "061901", kind: "specialization", nameEn: "Artificial intelligence", nameAr: "الذكاء الاصطناعي", parentCode: "0619",
    exampleCoursesEn: ["Machine learning", "Deep learning", "Natural language processing", "AI ethics and governance"],
    exampleCoursesAr: ["تعلّم الآلة", "التعلّم العميق", "معالجة اللغة الطبيعية", "أخلاقيات وحوكمة الذكاء الاصطناعي"],
  },
  {
    code: "061902", kind: "specialization", nameEn: "Data science", nameAr: "علوم البيانات", parentCode: "0619",
    exampleCoursesEn: ["Statistical learning", "Data engineering", "Big data analytics", "Data visualization"],
    exampleCoursesAr: ["التعلّم الإحصائي", "هندسة البيانات", "تحليلات البيانات الضخمة", "تمثيل البيانات"],
  },
  {
    code: "068801", kind: "specialization", nameEn: "Health informatics", nameAr: "المعلوماتية الصحية", parentCode: "0688",
    exampleCoursesEn: ["Biostatistics and epidemiology", "Decision support systems", "Information security technology and policy", "Healthcare data analytics"],
    exampleCoursesAr: ["الإحصاء الحيوي وعلم الأوبئة", "نظم دعم القرارات", "تقنية وسياسات أمن المعلومات", "تحليل بيانات الرعاية الصحية"],
  },
  {
    code: "091240", kind: "specialization", nameEn: "Public health", nameAr: "الصحة العامة", parentCode: "0912",
    exampleCoursesEn: ["Epidemiology", "Biostatistics", "Health policy", "Environmental health"],
    exampleCoursesAr: ["علم الأوبئة", "الإحصاء الحيوي", "السياسات الصحية", "الصحة البيئية"],
  },
];

// ───────────────────────────────────────────────────────────────────────────
//  SSCO — Major groups (1–0). English = official ISCO-08 major-group titles;
//  Arabic from the Saudi classification. skillLevel = ISCO-08 skill level.
// ───────────────────────────────────────────────────────────────────────────
export const SSCO_MAJOR_GROUPS: SsccoRow[] = [
  { code: "1", kind: "major", nameEn: "Managers", nameAr: "المديرون", parentCode: null, iscoCode: "1", skillLevel: null },
  { code: "2", kind: "major", nameEn: "Professionals", nameAr: "الاختصاصيون", parentCode: null, iscoCode: "2", skillLevel: 4 },
  { code: "3", kind: "major", nameEn: "Technicians and associate professionals", nameAr: "الفنيون ومساعدو الاختصاصيين", parentCode: null, iscoCode: "3", skillLevel: 3 },
  { code: "4", kind: "major", nameEn: "Clerical support workers", nameAr: "الكتبة", parentCode: null, iscoCode: "4", skillLevel: 2 },
  { code: "5", kind: "major", nameEn: "Service and sales workers", nameAr: "العاملون في الخدمات والبيع", parentCode: null, iscoCode: "5", skillLevel: 2 },
  { code: "6", kind: "major", nameEn: "Skilled agricultural, forestry and fishery workers", nameAr: "العاملون المهرة في الزراعة والغابات والثروة السمكية", parentCode: null, iscoCode: "6", skillLevel: 2 },
  { code: "7", kind: "major", nameEn: "Craft and related trades workers", nameAr: "الحرفيون والمهن المرتبطة بالأعمال التجارية", parentCode: null, iscoCode: "7", skillLevel: 2 },
  { code: "8", kind: "major", nameEn: "Plant and machine operators and assemblers", nameAr: "عمال تشغيل المصانع والآلات وعمال التجميع", parentCode: null, iscoCode: "8", skillLevel: 2 },
  { code: "9", kind: "major", nameEn: "Elementary occupations", nameAr: "المهن الأولية", parentCode: null, iscoCode: "9", skillLevel: 1 },
  { code: "0", kind: "major", nameEn: "Armed forces and security occupations", nameAr: "العاملون في القوات المسلحة والأمن", parentCode: null, iscoCode: "0", skillLevel: null },
];

// ───────────────────────────────────────────────────────────────────────────
//  SSCO — Sub-groups (2-digit) for the graduate-relevant major groups (1,2,3,4,5).
//  English follows the official ISCO-08 sub-major-group titles.
// ───────────────────────────────────────────────────────────────────────────
export const SSCO_SUB_GROUPS: SsccoRow[] = [
  // 1 Managers
  { code: "11", kind: "sub", nameEn: "Chief executives, senior officials and legislators", nameAr: "المشرعون والرؤساء التنفيذيون وكبار المسؤولين", parentCode: "1", iscoCode: "11" },
  { code: "12", kind: "sub", nameEn: "Administrative and commercial managers", nameAr: "المديرون الإداريون والتجاريون", parentCode: "1", iscoCode: "12" },
  { code: "13", kind: "sub", nameEn: "Production and specialized services managers", nameAr: "مديرو الإنتاج والخدمات المتخصصة", parentCode: "1", iscoCode: "13" },
  { code: "14", kind: "sub", nameEn: "Hospitality, retail and other services managers", nameAr: "مديرو الضيافة والتجارة ومديرو الخدمات الأخرى", parentCode: "1", iscoCode: "14" },
  // 2 Professionals
  { code: "21", kind: "sub", nameEn: "Science and engineering professionals", nameAr: "الاختصاصيون في العلوم والهندسة", parentCode: "2", iscoCode: "21" },
  { code: "22", kind: "sub", nameEn: "Health professionals", nameAr: "الاختصاصيون في الصحة", parentCode: "2", iscoCode: "22" },
  { code: "23", kind: "sub", nameEn: "Teaching professionals", nameAr: "الاختصاصيون في التعليم", parentCode: "2", iscoCode: "23" },
  { code: "24", kind: "sub", nameEn: "Business and administration professionals", nameAr: "الاختصاصيون في الأعمال والإدارة", parentCode: "2", iscoCode: "24" },
  { code: "25", kind: "sub", nameEn: "Information and communications technology professionals", nameAr: "الاختصاصيون في المعلومات وتكنولوجيا الاتصالات", parentCode: "2", iscoCode: "25" },
  { code: "26", kind: "sub", nameEn: "Legal, social and cultural professionals", nameAr: "الاختصاصيون في القانون والاجتماع والثقافة", parentCode: "2", iscoCode: "26" },
  // 3 Technicians and associate professionals
  { code: "31", kind: "sub", nameEn: "Science and engineering associate professionals", nameAr: "مساعدو الاختصاصيين في العلوم والهندسة", parentCode: "3", iscoCode: "31" },
  { code: "32", kind: "sub", nameEn: "Health associate professionals", nameAr: "مساعدو الاختصاصيين في الصحة", parentCode: "3", iscoCode: "32" },
  { code: "33", kind: "sub", nameEn: "Business and administration associate professionals", nameAr: "مساعدو الاختصاصيين في الأعمال والإدارة", parentCode: "3", iscoCode: "33" },
  { code: "34", kind: "sub", nameEn: "Legal, social, cultural and related associate professionals", nameAr: "مساعدو الاختصاصيين في القانون والعمل الاجتماعي والثقافي", parentCode: "3", iscoCode: "34" },
  { code: "35", kind: "sub", nameEn: "Information and communications technicians", nameAr: "فنيو المعلومات والاتصالات", parentCode: "3", iscoCode: "35" },
  // 4 Clerical support / 5 Services & sales (kept brief — graduate-relevant entry points)
  { code: "41", kind: "sub", nameEn: "General and keyboard clerks", nameAr: "الكتبة العامون والطابعون", parentCode: "4", iscoCode: "41" },
  { code: "42", kind: "sub", nameEn: "Customer services clerks", nameAr: "كتبة خدمات العملاء", parentCode: "4", iscoCode: "42" },
  { code: "52", kind: "sub", nameEn: "Sales workers", nameAr: "العاملون في البيع", parentCode: "5", iscoCode: "52" },
];

// ───────────────────────────────────────────────────────────────────────────
//  SSCO — Unit groups (4-digit) + occupations (6-digit) graduates map to.
//  English follows ISCO-08 unit-group titles where applicable; Arabic from the
//  Saudi classification. These are the anchor targets for CareerMapping.
// ───────────────────────────────────────────────────────────────────────────
export const SSCO_OCCUPATIONS: SsccoRow[] = [
  // 24 Business and administration professionals
  { code: "2411", kind: "unit", nameEn: "Accountants", nameAr: "المحاسبون", parentCode: "24", iscoCode: "2411" },
  { code: "241101", kind: "occupation", nameEn: "Accountant", nameAr: "محاسب", parentCode: "2411", iscoCode: "2411" },
  { code: "241107", kind: "occupation", nameEn: "Certified public accountant / auditor", nameAr: "محاسب قانوني / مراجع حسابات", parentCode: "2411", iscoCode: "2411" },
  { code: "2413", kind: "unit", nameEn: "Financial analysts", nameAr: "المحللون الماليون", parentCode: "24", iscoCode: "2413" },
  { code: "241301", kind: "occupation", nameEn: "Financial analyst", nameAr: "محلل مالي", parentCode: "2413", iscoCode: "2413" },
  { code: "241305", kind: "occupation", nameEn: "Risk analyst", nameAr: "محلل مخاطر", parentCode: "2413", iscoCode: "2413" },
  { code: "2421", kind: "unit", nameEn: "Management and organization analysts", nameAr: "محللو الإدارة والتنظيم", parentCode: "24", iscoCode: "2421" },
  { code: "242101", kind: "occupation", nameEn: "Management consultant", nameAr: "مستشار إداري", parentCode: "2421", iscoCode: "2421" },
  { code: "242107", kind: "occupation", nameEn: "Business analyst", nameAr: "محلل أعمال", parentCode: "2421", iscoCode: "2421" },
  { code: "2431", kind: "unit", nameEn: "Advertising and marketing professionals", nameAr: "اختصاصيو الإعلان والتسويق", parentCode: "24", iscoCode: "2431" },
  { code: "243101", kind: "occupation", nameEn: "Marketing specialist", nameAr: "اختصاصي تسويق", parentCode: "2431", iscoCode: "2431" },

  // 25 ICT professionals
  { code: "2511", kind: "unit", nameEn: "Systems analysts", nameAr: "محللو النظم", parentCode: "25", iscoCode: "2511" },
  { code: "251101", kind: "occupation", nameEn: "Systems analyst", nameAr: "محلل نظم", parentCode: "2511", iscoCode: "2511" },
  { code: "2512", kind: "unit", nameEn: "Software developers", nameAr: "مطورو البرمجيات", parentCode: "25", iscoCode: "2512" },
  { code: "251201", kind: "occupation", nameEn: "Software developer", nameAr: "مطور برمجيات", parentCode: "2512", iscoCode: "2512" },
  { code: "251205", kind: "occupation", nameEn: "Software engineer", nameAr: "مهندس برمجيات", parentCode: "2512", iscoCode: "2512" },
  { code: "2519", kind: "unit", nameEn: "Software and applications developers and analysts n.e.c.", nameAr: "مطورو ومحللو البرمجيات والتطبيقات غير المصنفين في مكان آخر", parentCode: "25", iscoCode: "2519" },
  { code: "251902", kind: "occupation", nameEn: "Data scientist", nameAr: "عالم بيانات", parentCode: "2519", iscoCode: "2519" },
  { code: "251904", kind: "occupation", nameEn: "Artificial intelligence specialist", nameAr: "اختصاصي ذكاء اصطناعي", parentCode: "2519", iscoCode: "2519" },
  { code: "2521", kind: "unit", nameEn: "Database designers and administrators", nameAr: "مصممو ومديرو قواعد البيانات", parentCode: "25", iscoCode: "2521" },
  { code: "252101", kind: "occupation", nameEn: "Database administrator", nameAr: "مدير قواعد بيانات", parentCode: "2521", iscoCode: "2521" },
  { code: "2529", kind: "unit", nameEn: "Database and network professionals n.e.c.", nameAr: "اختصاصيو قواعد البيانات والشبكات غير المصنفين في مكان آخر", parentCode: "25", iscoCode: "2529" },
  { code: "252901", kind: "occupation", nameEn: "Information security specialist", nameAr: "اختصاصي أمن معلومات", parentCode: "2529", iscoCode: "2529" },

  // 22 Health professionals (for Health Management / informatics graduates leaning clinical-adjacent)
  { code: "2269", kind: "unit", nameEn: "Health professionals n.e.c.", nameAr: "اختصاصيو الصحة غير المصنفين في مكان آخر", parentCode: "22", iscoCode: "2269" },
  { code: "226901", kind: "occupation", nameEn: "Health information manager", nameAr: "مدير معلومات صحية", parentCode: "2269", iscoCode: "2269" },

  // 13 Production & specialized services managers (health services management leadership target)
  { code: "1342", kind: "unit", nameEn: "Health services managers", nameAr: "مديرو الخدمات الصحية", parentCode: "13", iscoCode: "1342" },
  { code: "134201", kind: "occupation", nameEn: "Health services manager", nameAr: "مدير خدمات صحية", parentCode: "1342", iscoCode: "1342" },
  { code: "1330", kind: "unit", nameEn: "Information and communications technology service managers", nameAr: "مديرو خدمات تقنية المعلومات والاتصالات", parentCode: "13", iscoCode: "1330" },
  { code: "133001", kind: "occupation", nameEn: "ICT services manager", nameAr: "مدير خدمات تقنية المعلومات", parentCode: "1330", iscoCode: "1330" },
];

// ───────────────────────────────────────────────────────────────────────────
//  Convenience: combined exports + counts (used by seed + UI summary).
// ───────────────────────────────────────────────────────────────────────────
export const ALL_SCED: ScedRow[] = [
  ...SCED_LEVELS,
  ...SCED_BROAD_FIELDS,
  ...SCED_NARROW_FIELDS,
  ...SCED_DETAILED_FIELDS,
  ...SCED_SPECIALIZATIONS,
];

export const ALL_SSCO: SsccoRow[] = [
  ...SSCO_MAJOR_GROUPS,
  ...SSCO_SUB_GROUPS,
  ...SSCO_OCCUPATIONS,
];

export const CLASSIFICATION_SOURCES = {
  sced: {
    nameEn: "Saudi Unified Classification of Educational Levels and Specializations",
    nameAr: "التصنيف السعودي الموحد للمستويات والتخصصات التعليمية",
    authorityEn: "Ministry of Education",
    authorityAr: "وزارة التعليم",
    basisEn: "UNESCO ISCED 2011 / ISCED-F 2013",
    basisAr: "التصنيف الدولي ISCED 2011 / ISCED-F 2013",
    decree: "701/1440H",
  },
  ssco: {
    nameEn: "Saudi Standard Classification of Occupations",
    nameAr: "التصنيف السعودي للمهن",
    authorityEn: "General Authority for Statistics (GASTAT)",
    authorityAr: "الهيئة العامة للإحصاء",
    basisEn: "ILO ISCO-08",
    basisAr: "التصنيف الدولي ISCO-08",
    decree: "540/1440H",
  },
} as const;
