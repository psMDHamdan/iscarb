/**
 * iSCARB — Saudi Context Injector: technical concept → real Saudi example.
 * ===========================================================================
 * Textbooks teach with Amazon / Netflix / Uber / Stripe. This library maps each
 * technical concept to a REAL, recognisable Saudi system so students learn the
 * concept through their own market (Vision 2030, government platforms, Saudi
 * fintech). Bilingual (EN/AR), framework-free — a curated reference, extensible
 * by appending rows. The "why" field is the teaching hook, not marketing.
 *
 * Facts are kept deliberately conservative: each Saudi example names the service
 * and the operating entity, and describes the relevant architectural property —
 * not internal implementation details (which are not public).
 * ===========================================================================
 */

export type ConceptCategory =
  | "architecture"
  | "data"
  | "integration"
  | "fintech"
  | "ai-ml"
  | "security"
  | "cloud"
  | "devops";

export interface Bilingual {
  en: string;
  ar: string;
}

export interface SaudiExampleRef {
  /** The Saudi service/system. */
  name: Bilingual;
  /** The entity that operates it. */
  by: Bilingual;
  /** What this system illustrates about the concept. */
  note: Bilingual;
}

export interface ConceptMapping {
  id: string; // stable slug
  category: ConceptCategory;
  concept: Bilingual; // the technical concept
  textbookExample: string; // the usual non-Saudi example (Netflix, Stripe, …)
  saudi: SaudiExampleRef[]; // one or more Saudi analogues
  why: Bilingual; // the teaching hook: why this Saudi system fits the concept
  keywords: string[]; // for the resolver (EN + AR surface forms)
}

export const CATEGORY_LABEL: Record<ConceptCategory, Bilingual> = {
  architecture: { en: "Architecture", ar: "البنية المعمارية" },
  data: { en: "Data & Databases", ar: "البيانات وقواعد البيانات" },
  integration: { en: "Integration & APIs", ar: "التكامل وواجهات البرمجة" },
  fintech: { en: "Payments & Fintech", ar: "المدفوعات والتقنية المالية" },
  "ai-ml": { en: "AI & Machine Learning", ar: "الذكاء الاصطناعي وتعلم الآلة" },
  security: { en: "Security & Identity", ar: "الأمن والهوية" },
  cloud: { en: "Cloud & Scale", ar: "السحابة والتوسّع" },
  devops: { en: "DevOps & Delivery", ar: "DevOps والتسليم" },
};

export const CONCEPT_MAPPINGS: ConceptMapping[] = [
  {
    id: "microservices",
    category: "architecture",
    concept: { en: "Microservices", ar: "الخدمات المصغّرة" },
    textbookExample: "Netflix",
    saudi: [
      {
        name: { en: "Tawakkalna Services", ar: "توكلنا خدمات" },
        by: { en: "SDAIA", ar: "سدايا" },
        note: {
          en: "Dozens of independent government services exposed behind one super-app.",
          ar: "عشرات الخدمات الحكومية المستقلة خلف تطبيق موحّد واحد.",
        },
      },
      {
        name: { en: "Absher", ar: "أبشر" },
        by: { en: "Ministry of Interior", ar: "وزارة الداخلية" },
        note: {
          en: "Civil affairs, traffic, and passport services as separately-owned domains.",
          ar: "الأحوال المدنية والمرور والجوازات كنطاقات مملوكة بشكل منفصل.",
        },
      },
    ],
    why: {
      en: "Each government domain (traffic, passports, health) deploys and scales independently behind a single citizen entry point — the textbook microservices boundary.",
      ar: "كل نطاق حكومي (المرور، الجوازات، الصحة) يُنشَر ويتوسّع باستقلال خلف نقطة دخول واحدة للمواطن — وهو حدّ الخدمات المصغّرة كما في الكتب.",
    },
    keywords: ["microservice", "microservices", "خدمات مصغرة", "خدمات مصغّرة", "service boundary"],
  },
  {
    id: "sso-identity",
    category: "security",
    concept: { en: "Single Sign-On / Federated Identity", ar: "الدخول الموحّد / الهوية الموحّدة" },
    textbookExample: "Google / Okta SSO",
    saudi: [
      {
        name: { en: "Nafath", ar: "نفاذ" },
        by: { en: "National Information Center", ar: "المركز الوطني للمعلومات" },
        note: {
          en: "One national identity logs a citizen into both government and private digital services.",
          ar: "هويّة وطنية واحدة تُدخِل المواطن إلى الخدمات الرقمية الحكومية والخاصة معاً.",
        },
      },
    ],
    why: {
      en: "Nafath is the real-world OAuth/OIDC identity provider Saudi students already use — the canonical example for SSO, token exchange, and trust delegation.",
      ar: "نفاذ هو مزوّد الهوية (OAuth/OIDC) الذي يستخدمه الطلبة فعلاً — المثال النموذجي للدخول الموحّد وتبادل الرموز وتفويض الثقة.",
    },
    keywords: ["sso", "single sign-on", "oauth", "oidc", "identity provider", "نفاذ", "دخول موحد", "هوية"],
  },
  {
    id: "event-driven",
    category: "architecture",
    concept: { en: "Event-Driven Architecture", ar: "البنية المُوجَّهة بالأحداث" },
    textbookExample: "Uber",
    saudi: [
      {
        name: { en: "Jahez", ar: "جاهز" },
        by: { en: "Jahez (Saudi)", ar: "جاهز (سعودية)" },
        note: {
          en: "Order placed → restaurant accepts → driver assigned → live tracking, each a published event.",
          ar: "طلب → قبول المطعم → إسناد سائق → تتبّع حيّ، كلٌّ منها حدث مُنشَر.",
        },
      },
      {
        name: { en: "HungerStation", ar: "هنقرستيشن" },
        by: { en: "HungerStation (Saudi)", ar: "هنقرستيشن (سعودية)" },
        note: {
          en: "Decoupled order, kitchen, and delivery services react to the same event stream.",
          ar: "خدمات الطلب والمطبخ والتوصيل المنفصلة تتفاعل مع تدفّق الأحداث نفسه.",
        },
      },
    ],
    why: {
      en: "A food-delivery order is a chain of asynchronous events across decoupled services — the clearest local model for producers, consumers, and eventual consistency.",
      ar: "طلب التوصيل سلسلة أحداث غير متزامنة عبر خدمات منفصلة — أوضح نموذج محلّي للمنتِجين والمستهلكين والاتّساق المُؤجَّل.",
    },
    keywords: ["event-driven", "event driven", "message queue", "kafka", "pub/sub", "أحداث", "موجهة بالأحداث", "طابور رسائل"],
  },
  {
    id: "realtime-db",
    category: "data",
    concept: { en: "Real-Time Database / Push", ar: "قاعدة البيانات الفورية / الدفع اللحظي" },
    textbookExample: "WhatsApp",
    saudi: [
      {
        name: { en: "Kollona Amn", ar: "كلنا أمن" },
        by: { en: "Ministry of Interior", ar: "وزارة الداخلية" },
        note: {
          en: "Citizen security reports and status updates pushed in real time to operations.",
          ar: "بلاغات المواطنين الأمنية وتحديثات حالتها تُدفَع لحظياً إلى مركز العمليات.",
        },
      },
    ],
    why: {
      en: "A live reporting app needs sub-second push from many clients to a central console — the real-time-sync / websocket pattern with a Saudi face.",
      ar: "تطبيق البلاغات الحيّ يحتاج دفعاً دون الثانية من عملاء كثر إلى لوحة مركزية — نمط المزامنة الفورية/الويب سوكِت بوجه سعودي.",
    },
    keywords: ["real-time", "realtime", "websocket", "push", "live sync", "فوري", "لحظي", "زمن حقيقي"],
  },
  {
    id: "ml-pipeline",
    category: "ai-ml",
    concept: { en: "ML Recommendation Pipeline", ar: "خط ترشيح بتعلّم الآلة" },
    textbookExample: "Netflix recommendations",
    saudi: [
      {
        name: { en: "Qiwa job matching", ar: "مطابقة وظائف قِوى" },
        by: { en: "MHRSD / Qiwa", ar: "وزارة الموارد البشرية / قِوى" },
        note: {
          en: "Matches job seekers to vacancies from skills, occupation codes, and market demand.",
          ar: "تطابق الباحثين عن عمل مع الشواغر من المهارات وأكواد المهن وطلب السوق.",
        },
      },
    ],
    why: {
      en: "Job matching is a feature-engineering + ranking pipeline (the same shape iSCARB's own matcher uses) — concrete, sovereign, and tied to SSCO codes.",
      ar: "مطابقة الوظائف خطّ هندسة سمات + ترتيب (نفس بنية مُطابِق iSCARB) — ملموس وسيادي ومربوط بأكواد التصنيف السعودي للمهن.",
    },
    keywords: ["recommendation", "recommender", "ml pipeline", "ranking", "matching", "ترشيح", "توصية", "مطابقة"],
  },
  {
    id: "payment-gateway",
    category: "fintech",
    concept: { en: "Payment Gateway", ar: "بوّابة الدفع" },
    textbookExample: "Stripe",
    saudi: [
      {
        name: { en: "mada", ar: "مدى" },
        by: { en: "Saudi Payments", ar: "المدفوعات السعودية" },
        note: {
          en: "The national debit network behind in-store and online card payments.",
          ar: "الشبكة الوطنية للخصم خلف مدفوعات البطاقات في المتاجر وعبر الإنترنت.",
        },
      },
      {
        name: { en: "STC Pay", ar: "STC Pay" },
        by: { en: "stc bank", ar: "بنك stc" },
        note: { en: "A digital wallet for P2P and merchant payments.", ar: "محفظة رقمية للتحويلات والمدفوعات التجارية." },
      },
    ],
    why: {
      en: "Integrating mada / STC Pay teaches tokenization, settlement, idempotency, and webhooks against rails students actually transact on.",
      ar: "تكامل مدى/STC Pay يُعلّم الترميز والتسوية وعدم التكرار (idempotency) والـwebhooks على قنوات يتعامل بها الطلبة فعلاً.",
    },
    keywords: ["payment", "gateway", "checkout", "mada", "stc pay", "مدفوعات", "بوابة دفع", "مدى"],
  },
  {
    id: "bnpl",
    category: "fintech",
    concept: { en: "Buy Now, Pay Later (BNPL)", ar: "اشترِ الآن وادفع لاحقاً" },
    textbookExample: "Klarna / Afterpay",
    saudi: [
      {
        name: { en: "Tamara", ar: "تمارا" },
        by: { en: "Tamara (Saudi)", ar: "تمارا (سعودية)" },
        note: { en: "Split-payment checkout integrated by Saudi merchants.", ar: "دفع مُقسّط مُدمَج لدى التجّار السعوديين." },
      },
      {
        name: { en: "Tabby", ar: "تابي" },
        by: { en: "Tabby", ar: "تابي" },
        note: { en: "Instalment financing at point of checkout.", ar: "تمويل بالأقساط عند الدفع." },
      },
    ],
    why: {
      en: "BNPL adds an asynchronous credit-decision + scheduling flow on top of checkout — a real Saudi case for state machines and SAMA-regulated flows.",
      ar: "BNPL يضيف قرار ائتمان غير متزامن + جدولة فوق الدفع — حالة سعودية حقيقية لآلات الحالة والتدفّقات الخاضعة لساما.",
    },
    keywords: ["bnpl", "buy now pay later", "installment", "instalment", "tamara", "tabby", "تقسيط", "أقساط", "تمارا", "تابي"],
  },
  {
    id: "multitenant-ecommerce",
    category: "architecture",
    concept: { en: "Multi-Tenant SaaS / E-commerce Platform", ar: "منصّة SaaS / تجارة متعدّدة المستأجرين" },
    textbookExample: "Shopify",
    saudi: [
      {
        name: { en: "Salla", ar: "سلة" },
        by: { en: "Salla (Saudi)", ar: "سلة (سعودية)" },
        note: { en: "Thousands of independent merchant stores on one platform.", ar: "آلاف المتاجر المستقلة على منصّة واحدة." },
      },
      {
        name: { en: "Zid", ar: "زد" },
        by: { en: "Zid (Saudi)", ar: "زد (سعودية)" },
        note: { en: "Per-merchant data isolation with shared infrastructure.", ar: "عزل بيانات كل تاجر مع بنية تحتية مشتركة." },
      },
    ],
    why: {
      en: "Salla / Zid are the local Shopify — the exact tenant-isolation, row-level-security, and per-store theming problems iSCARB itself solves.",
      ar: "سلة/زد هما شوبيفاي المحلّي — نفس مسائل عزل المستأجر وأمن مستوى الصف وتخصيص كل متجر التي يحلّها iSCARB ذاته.",
    },
    keywords: ["multi-tenant", "multitenant", "saas", "e-commerce", "ecommerce", "salla", "zid", "متعدد المستأجرين", "متجر", "سلة"],
  },
  {
    id: "api-integration",
    category: "integration",
    concept: { en: "Third-Party API Integration", ar: "تكامل واجهات الطرف الثالث" },
    textbookExample: "Twilio / Google Maps API",
    saudi: [
      {
        name: { en: "Yakeen", ar: "يقين" },
        by: { en: "Elm / NIC", ar: "علم / المركز الوطني للمعلومات" },
        note: { en: "Identity-verification API used by banks and fintechs.", ar: "واجهة التحقّق من الهوية تستخدمها البنوك والتقنية المالية." },
      },
      {
        name: { en: "Qiwa & Absher Business APIs", ar: "واجهات قِوى وأبشر أعمال" },
        by: { en: "Government", ar: "حكومي" },
        note: { en: "Labor and civil services consumed programmatically by HR systems.", ar: "خدمات العمل والأحوال تُستهلَك برمجياً من أنظمة الموارد البشرية." },
      },
    ],
    why: {
      en: "Yakeen / Qiwa are the integrations a Saudi product actually ships — teaching auth keys, rate limits, retries, and contract testing in context.",
      ar: "يقين/قِوى هي التكاملات التي يشحنها منتج سعودي فعلاً — تُعلّم مفاتيح المصادقة وحدود المعدّل وإعادة المحاولة واختبار العقود في سياقها.",
    },
    keywords: ["api integration", "third-party", "rest api", "webhook", "yakeen", "تكامل", "واجهة برمجة", "يقين"],
  },
  {
    id: "einvoicing-compliance",
    category: "integration",
    concept: { en: "Regulatory Compliance Integration", ar: "تكامل الامتثال التنظيمي" },
    textbookExample: "Avalara tax APIs",
    saudi: [
      {
        name: { en: "Fatoorah (e-invoicing)", ar: "فاتورة (الفوترة الإلكترونية)" },
        by: { en: "ZATCA", ar: "هيئة الزكاة والضريبة والجمارك" },
        note: { en: "Every B2B/B2C invoice must be cleared/reported in a mandated format.", ar: "كل فاتورة يجب إجازتها/الإبلاغ عنها بصيغة إلزامية." },
      },
    ],
    why: {
      en: "ZATCA e-invoicing is a hard, real compliance integration (cryptographic stamps, clearance) — teaching schema validation and regulated data flows.",
      ar: "الفوترة الإلكترونية لهيئة الزكاة تكامل امتثال حقيقي وصارم (أختام تشفيرية، إجازة) — تُعلّم التحقّق من المخطّط وتدفّقات البيانات المنظّمة.",
    },
    keywords: ["e-invoicing", "einvoicing", "compliance", "zatca", "tax", "فاتورة", "فوترة", "امتثال", "زاتكا", "ضريبة"],
  },
  {
    id: "open-data",
    category: "data",
    concept: { en: "Open Data / Public Datasets", ar: "البيانات المفتوحة / مجموعات البيانات العامة" },
    textbookExample: "Kaggle datasets",
    saudi: [
      {
        name: { en: "Saudi Open Data Portal", ar: "بوّابة البيانات المفتوحة" },
        by: { en: "SDAIA", ar: "سدايا" },
        note: { en: "National open datasets (open.data.gov.sa) across sectors for analysis and ML.", ar: "مجموعات بيانات وطنية مفتوحة (open.data.gov.sa) عبر القطاعات للتحليل وتعلّم الآلة." },
      },
    ],
    why: {
      en: "Train and benchmark on real Saudi data (labor, health, transport) instead of foreign Kaggle sets — relevant features, local distributions.",
      ar: "درّب وقِس على بيانات سعودية حقيقية (العمل، الصحة، النقل) بدل مجموعات كاجل الأجنبية — سمات ملائمة وتوزيعات محلّية.",
    },
    keywords: ["open data", "dataset", "public data", "sdaia", "بيانات مفتوحة", "مجموعة بيانات", "سدايا"],
  },
  {
    id: "egov-portal",
    category: "integration",
    concept: { en: "Government Service Portal / e-Gov", ar: "بوّابة الخدمات الحكومية" },
    textbookExample: "gov.uk",
    saudi: [
      {
        name: { en: "Najiz", ar: "ناجز" },
        by: { en: "Ministry of Justice", ar: "وزارة العدل" },
        note: { en: "Judicial e-services (cases, deeds, powers of attorney) online.", ar: "خدمات العدل الإلكترونية (القضايا، الصكوك، الوكالات) عبر الإنترنت." },
      },
      {
        name: { en: "Etimad", ar: "اعتماد" },
        by: { en: "Ministry of Finance", ar: "وزارة المالية" },
        note: { en: "Government procurement and financial services platform.", ar: "منصّة المشتريات الحكومية والخدمات المالية." },
      },
    ],
    why: {
      en: "Najiz / Etimad show workflow engines, approvals, and audit trails at national scale — the governance patterns iSCARB's dean/grade flows mirror.",
      ar: "ناجز/اعتماد يُظهران محرّكات سير العمل والموافقات وسجلّات التدقيق بمقياس وطني — أنماط الحوكمة التي تحاكيها تدفّقات العميد/الدرجات في iSCARB.",
    },
    keywords: ["e-gov", "egovernment", "portal", "workflow", "najiz", "etimad", "حكومة", "بوابة", "ناجز", "اعتماد"],
  },
  {
    id: "cloud-scale",
    category: "cloud",
    concept: { en: "Elastic Cloud Scaling", ar: "التوسّع السحابي المرن" },
    textbookExample: "Amazon during Black Friday",
    saudi: [
      {
        name: { en: "Hajj & Umrah digital services", ar: "الخدمات الرقمية للحج والعمرة" },
        by: { en: "Nusuk / Ministry of Hajj", ar: "نُسُك / وزارة الحج" },
        note: { en: "Massive, seasonal, predictable demand spikes around Hajj season.", ar: "طلب موسمي ضخم ومتوقّع يتضخّم حول موسم الحج." },
      },
    ],
    why: {
      en: "Hajj season is Saudi Arabia's 'Black Friday' — a real, predictable load spike teaching autoscaling, capacity planning, and graceful degradation.",
      ar: "موسم الحج هو «الجمعة البيضاء» السعودية — تضخّم حِمل حقيقي ومتوقّع يُعلّم التوسّع التلقائي وتخطيط السعة والتدهور المتدرّج.",
    },
    keywords: ["scaling", "autoscaling", "elastic", "load", "capacity", "توسع", "حمل", "سعة", "حج"],
  },
  {
    id: "health-app",
    category: "data",
    concept: { en: "Health Records & Privacy", ar: "السجلات الصحية والخصوصية" },
    textbookExample: "Epic / MyChart",
    saudi: [
      {
        name: { en: "Sehhaty", ar: "صحتي" },
        by: { en: "Ministry of Health / SDAIA", ar: "وزارة الصحة / سدايا" },
        note: { en: "Citizen health records, appointments, and prescriptions in one app.", ar: "السجلات الصحية والمواعيد والوصفات للمواطن في تطبيق واحد." },
      },
    ],
    why: {
      en: "Sehhaty is the local case for PDPL-grade health-data handling, consent, and access control — exactly iSCARB's own privacy posture.",
      ar: "صحتي هي الحالة المحلّية لمعالجة البيانات الصحية بمستوى نظام حماية البيانات والموافقة والتحكّم بالوصول — وهو موقف الخصوصية في iSCARB ذاته.",
    },
    keywords: ["health record", "ehr", "privacy", "pdpl", "consent", "sehhaty", "سجل صحي", "خصوصية", "صحتي"],
  },
  // ── Architecture ───────────────────────────────────────────────────────────
  {
    id: "micro-frontends",
    category: "architecture",
    concept: { en: "Micro-Frontends", ar: "الواجهات الأمامية المصغّرة" },
    textbookExample: "Spotify desktop",
    saudi: [
      {
        name: { en: "Tawakkalna", ar: "توكلنا" },
        by: { en: "SDAIA", ar: "سدايا" },
        note: {
          en: "Many independently-built service mini-apps composed into one super-app shell.",
          ar: "تطبيقات خدمية مصغّرة مبنيّة باستقلال تُركَّب داخل قشرة تطبيق موحّد واحد.",
        },
      },
      {
        name: { en: "Absher", ar: "أبشر" },
        by: { en: "Ministry of Interior", ar: "وزارة الداخلية" },
        note: { en: "Each ministry domain ships its own UI module behind a shared frame.", ar: "كل نطاق وزاري يشحن وحدة واجهته الخاصة خلف إطار مشترك." },
      },
    ],
    why: {
      en: "A government super-app is the clearest local case for composing many separately-owned frontend modules into one shell — independent teams, one experience.",
      ar: "التطبيق الحكومي الموحّد أوضح حالة محلّية لتركيب وحدات واجهة مملوكة بشكل منفصل في قشرة واحدة — فِرَق مستقلّة وتجربة واحدة.",
    },
    keywords: ["micro-frontend", "microfrontend", "module federation", "frontend composition", "واجهات مصغرة", "تجزئة الواجهة"],
  },
  {
    id: "cqrs",
    category: "architecture",
    concept: { en: "CQRS (Command/Query Separation)", ar: "فصل الأوامر عن الاستعلامات (CQRS)" },
    textbookExample: "Event-sourced banking ledgers",
    saudi: [
      {
        name: { en: "Absher", ar: "أبشر" },
        by: { en: "Ministry of Interior", ar: "وزارة الداخلية" },
        note: {
          en: "Fast citizen lookups (queries) are served separately from governed civil-affairs changes (commands).",
          ar: "الاستعلامات السريعة للمواطن تُخدَم بمعزل عن تعديلات الأحوال المدنية المحكومة (الأوامر).",
        },
      },
    ],
    why: {
      en: "A national service that must read instantly for millions yet write under strict approval is the textbook reason to split the read model from the write model.",
      ar: "خدمة وطنية تقرأ فوراً للملايين بينما تكتب وفق موافقات صارمة هي السبب النموذجي لفصل نموذج القراءة عن نموذج الكتابة.",
    },
    keywords: ["cqrs", "command query", "read model", "write model", "فصل القراءة والكتابة", "نموذج القراءة"],
  },
  {
    id: "saga-pattern",
    category: "architecture",
    concept: { en: "Saga / Compensating Transactions", ar: "نمط الساغا / المعاملات التعويضية" },
    textbookExample: "Airline booking + payment + seating",
    saudi: [
      {
        name: { en: "Nusuk (Hajj & Umrah)", ar: "نُسُك (الحج والعمرة)" },
        by: { en: "Ministry of Hajj & Umrah", ar: "وزارة الحج والعمرة" },
        note: {
          en: "A pilgrimage booking spans permit, transport, and accommodation steps that must each roll back if one fails.",
          ar: "حجز الرحلة يمتدّ عبر التصريح والنقل والسكن، وكل خطوة يجب التراجع عنها إن فشلت أخرى.",
        },
      },
    ],
    why: {
      en: "A multi-service Hajj booking with no single database is the perfect local model for orchestrating distributed steps and compensating actions on failure.",
      ar: "حجز حج متعدّد الخدمات بلا قاعدة بيانات واحدة هو النموذج المحلّي المثالي لتنسيق خطوات موزّعة وإجراءات تعويضية عند الفشل.",
    },
    keywords: ["saga", "distributed transaction", "compensating transaction", "compensation", "معاملة موزعة", "تعويضية", "ساغا"],
  },
  {
    id: "message-broker",
    category: "architecture",
    concept: { en: "Message Broker / Routing", ar: "وسيط الرسائل / التوجيه" },
    textbookExample: "RabbitMQ / Kafka",
    saudi: [
      {
        name: { en: "mada switch", ar: "مبدّل مدى" },
        by: { en: "Saudi Payments", ar: "المدفوعات السعودية" },
        note: {
          en: "Card messages are routed between thousands of terminals, banks, and processors at national scale.",
          ar: "رسائل البطاقات تُوجَّه بين آلاف نقاط البيع والبنوك والمعالِجات على مستوى وطني.",
        },
      },
    ],
    why: {
      en: "The national payment switch is a message-routing backbone — the real-world picture of brokers, topics, and guaranteed delivery between decoupled parties.",
      ar: "مبدّل المدفوعات الوطني عمود فقري لتوجيه الرسائل — الصورة الواقعية للوسطاء والمواضيع وضمان التسليم بين أطراف منفصلة.",
    },
    keywords: ["message broker", "broker", "payment switch", "mada switch", "routing", "وسيط الرسائل", "مبدل المدفوعات", "توجيه الرسائل"],
  },
  // ── Integration & APIs ───────────────────────────────────────────────────────
  {
    id: "api-gateway",
    category: "integration",
    concept: { en: "API Gateway & Rate Limiting", ar: "بوّابة الواجهات وحدّ الطلبات" },
    textbookExample: "Kong / AWS API Gateway",
    saudi: [
      {
        name: { en: "Government Service Bus (GSB)", ar: "قناة الربط الحكومي" },
        by: { en: "Digital Government Authority / NIC", ar: "هيئة الحكومة الرقمية / المركز الوطني للمعلومات" },
        note: {
          en: "A single controlled entry point through which agencies expose and consume each other's services.",
          ar: "نقطة دخول واحدة محكومة تُبادل عبرها الجهات خدماتها وتستهلكها.",
        },
      },
    ],
    why: {
      en: "The national integration channel is a real API gateway — authentication, throttling, and routing in front of many backend agencies.",
      ar: "قناة الربط الوطنية بوّابة واجهات حقيقية — مصادقة وتقنين معدّل وتوجيه أمام عدّة جهات خلفية.",
    },
    keywords: ["api gateway", "rate limit", "rate limiting", "reverse proxy", "بوابة واجهات", "حد الطلبات", "ربط حكومي"],
  },
  {
    id: "graphql",
    category: "integration",
    concept: { en: "GraphQL / Client-Shaped APIs", ar: "GraphQL / واجهات بحسب احتياج العميل" },
    textbookExample: "GitHub GraphQL API",
    saudi: [
      {
        name: { en: "Salla storefront APIs", ar: "واجهات متجر سلة" },
        by: { en: "Salla (Saudi)", ar: "سلة (سعودية)" },
        note: {
          en: "Each merchant theme fetches exactly the product fields it renders — nothing more.",
          ar: "كل قالب تاجر يجلب حقول المنتج التي يعرضها بالضبط — لا أكثر.",
        },
      },
    ],
    why: {
      en: "Per-theme storefront data needs are the flexibility GraphQL formalizes: one endpoint, client-declared fields, no over- or under-fetching.",
      ar: "احتياجات بيانات كل قالب متجر هي المرونة التي يصوغها GraphQL: نقطة واحدة وحقول يحدّدها العميل دون زيادة أو نقص في الجلب.",
    },
    keywords: ["graphql", "schema query", "client-shaped", "graph api", "استعلام مرن", "واجهة جراف"],
  },
  {
    id: "grpc-rpc",
    category: "integration",
    concept: { en: "gRPC / Service-to-Service RPC", ar: "gRPC / الاستدعاء بين الخدمات" },
    textbookExample: "Google internal services",
    saudi: [
      {
        name: { en: "Super-app internal services", ar: "الخدمات الداخلية للتطبيقات الموحّدة" },
        by: { en: "Tawakkalna / Absher", ar: "توكلنا / أبشر" },
        note: {
          en: "Behind one app, many internal services exchange high-throughput, strongly-typed calls — the niche RPC fills.",
          ar: "خلف تطبيق واحد، تتبادل خدمات داخلية كثيرة استدعاءات عالية الإنتاجية ومُحكَمة الأنواع — وهو ما يملؤه الاستدعاء الإجرائي.",
        },
      },
    ],
    why: {
      en: "Where a super-app's internal services call each other at scale, contract-first, binary RPC (gRPC) is the pattern — fast, typed, language-agnostic.",
      ar: "حيث تستدعي الخدمات الداخلية للتطبيق الموحّد بعضها بكثافة، يكون الاستدعاء الثنائي المبني على عقد (gRPC) هو النمط — سريع ومُنمَّط ومستقل عن اللغة.",
    },
    keywords: ["grpc", "rpc", "protocol buffers", "protobuf", "service-to-service", "استدعاء إجرائي", "اتصال بين الخدمات"],
  },
  {
    id: "webhooks",
    category: "integration",
    concept: { en: "Webhooks & Async Callbacks", ar: "الـWebhooks والاستدعاءات الراجعة" },
    textbookExample: "Stripe / GitHub webhooks",
    saudi: [
      {
        name: { en: "Tamara / Tabby merchant callbacks", ar: "استدعاءات تمارا / تابي للتجّار" },
        by: { en: "Tamara / Tabby", ar: "تمارا / تابي" },
        note: {
          en: "When an instalment is approved or settled, the provider calls the merchant back to update the order.",
          ar: "عند الموافقة على قسط أو تسويته، يُعيد المزوّد الاتصال بالتاجر لتحديث الطلب.",
        },
      },
    ],
    why: {
      en: "BNPL status callbacks are a real webhook flow — signed payloads, retries, and idempotent handlers a Saudi merchant integration must get right.",
      ar: "استدعاءات حالة التقسيط تدفّق Webhook حقيقي — حمولات موقّعة وإعادات محاولة ومعالِجات لا تتكرّر، يجب أن يُتقنها تكامل تاجر سعودي.",
    },
    keywords: ["webhook", "callback", "async callback", "event callback", "استدعاء راجع", "ويب هوك"],
  },
  // ── Data & Databases ─────────────────────────────────────────────────────────
  {
    id: "event-sourcing",
    category: "data",
    concept: { en: "Event Sourcing / Append-Only Log", ar: "تخزين الأحداث / السجل غير القابل للتعديل" },
    textbookExample: "Bank account ledgers",
    saudi: [
      {
        name: { en: "SADAD bill records", ar: "سجلّات سداد" },
        by: { en: "Saudi Payments / SAMA", ar: "المدفوعات السعودية / ساما" },
        note: {
          en: "Every bill and payment is an immutable, time-ordered record; the balance is the replay of those events.",
          ar: "كل فاتورة ودفعة سجلّ ثابت مرتّب زمنياً؛ والرصيد هو إعادة تشغيل تلك الأحداث.",
        },
      },
    ],
    why: {
      en: "A national bill-payment ledger is append-only by necessity — the canonical event-sourcing case where current state is derived, never overwritten. iSCARB's own equity ledger is built the same way.",
      ar: "سجلّ مدفوعات وطني يكون إضافيّاً بالضرورة — الحالة النموذجية لتخزين الأحداث حيث تُشتقّ الحالة الحالية ولا تُكتَب فوقها. وسجلّ الإنصاف في iSCARB مبنيّ بالطريقة نفسها.",
    },
    keywords: ["event sourcing", "event store", "append-only", "audit log", "immutable log", "تخزين الأحداث", "سجل غير قابل للتعديل", "سجل تدقيق"],
  },
  {
    id: "data-warehouse",
    category: "data",
    concept: { en: "Data Warehouse & Analytics", ar: "مستودع البيانات والتحليلات" },
    textbookExample: "Snowflake / BigQuery",
    saudi: [
      {
        name: { en: "National Data Bank", ar: "بنك البيانات الوطني" },
        by: { en: "SDAIA", ar: "سدايا" },
        note: {
          en: "Cross-sector government data consolidated for national analytics and reporting.",
          ar: "بيانات حكومية عبر القطاعات تُوحَّد لأغراض التحليل والتقارير الوطنية.",
        },
      },
    ],
    why: {
      en: "Consolidating many agencies' data for analysis is exactly the OLAP warehouse problem — modeling, aggregation, and query performance at national scale.",
      ar: "توحيد بيانات جهات متعدّدة للتحليل هو تحديداً مسألة مستودع البيانات التحليلي — النمذجة والتجميع وأداء الاستعلام بمقياس وطني.",
    },
    keywords: ["data warehouse", "olap", "analytics", "business intelligence", "warehouse", "مستودع بيانات", "تحليلات", "ذكاء الأعمال"],
  },
  {
    id: "etl-pipeline",
    category: "data",
    concept: { en: "ETL / Data Ingestion", ar: "الاستخلاص والتحويل / ابتلاع البيانات" },
    textbookExample: "Airflow / dbt",
    saudi: [
      {
        name: { en: "ZATCA e-invoice clearance", ar: "إجازة الفواتير لهيئة الزكاة" },
        by: { en: "ZATCA", ar: "هيئة الزكاة والضريبة والجمارك" },
        note: {
          en: "Millions of invoices are received, validated, transformed, and stored in a mandated format.",
          ar: "ملايين الفواتير تُستقبَل وتُتحقَّق وتُحوَّل وتُخزَّن بصيغة إلزامية.",
        },
      },
    ],
    why: {
      en: "Clearing invoices at national volume is an ETL pipeline under SLA — extract, validate, transform, load, with auditing at every step.",
      ar: "إجازة الفواتير بحجم وطني خطّ استخلاص وتحويل تحت اتفاقية مستوى خدمة — استخلاص وتحقّق وتحويل وتحميل مع تدقيق في كل خطوة.",
    },
    keywords: ["etl", "elt", "data ingestion", "data pipeline", "ingest", "استخلاص وتحويل", "ابتلاع البيانات"],
  },
  {
    id: "full-text-search",
    category: "data",
    concept: { en: "Full-Text Search / Inverted Index", ar: "البحث النصّي / الفهرس المعكوس" },
    textbookExample: "Elasticsearch",
    saudi: [
      {
        name: { en: "Etimad tenders search", ar: "بحث منافسات اعتماد" },
        by: { en: "Ministry of Finance", ar: "وزارة المالية" },
        note: {
          en: "Thousands of government tenders are searchable by keyword, sector, and filters.",
          ar: "آلاف المنافسات الحكومية قابلة للبحث بالكلمة والقطاع والمرشّحات.",
        },
      },
      {
        name: { en: "Qiwa job search", ar: "بحث وظائف قِوى" },
        by: { en: "MHRSD / Qiwa", ar: "وزارة الموارد البشرية / قِوى" },
        note: { en: "Free-text search across a large, changing vacancy catalogue.", ar: "بحث نصّي حر عبر فهرس شواغر كبير ومتغيّر." },
      },
    ],
    why: {
      en: "Searching a large tender or jobs catalogue by relevance is the inverted-index problem — tokenization, ranking, and faceted filters in Arabic and English.",
      ar: "البحث في فهرس منافسات أو وظائف كبير بحسب الصِّلة هو مسألة الفهرس المعكوس — تقطيع وترتيب ومرشّحات أوجه بالعربية والإنجليزية.",
    },
    keywords: ["full-text search", "search index", "inverted index", "elasticsearch", "faceted search", "بحث نصي", "فهرس معكوس", "محرك بحث"],
  },
  {
    id: "geospatial",
    category: "data",
    concept: { en: "Geospatial & Maps", ar: "البيانات الجغرافية المكانية والخرائط" },
    textbookExample: "Google Maps / PostGIS",
    saudi: [
      {
        name: { en: "National Address", ar: "العنوان الوطني" },
        by: { en: "Saudi Post | SPL", ar: "البريد السعودي | سُبل" },
        note: {
          en: "Every location is a precise short code with coordinates — geocoding the whole Kingdom.",
          ar: "كل موقع رمز قصير دقيق مع إحداثيات — ترميز جغرافي للمملكة كلها.",
        },
      },
      {
        name: { en: "Balady", ar: "بلدي" },
        by: { en: "Ministry of Municipal & Rural Affairs", ar: "وزارة الشؤون البلدية والقروية" },
        note: { en: "Municipal services bound to map parcels and zones.", ar: "خدمات بلدية مرتبطة بقطع الخرائط ونطاقاتها." },
      },
    ],
    why: {
      en: "A national addressing system is real geospatial engineering — coordinates, geocoding, spatial indexing, and proximity queries with a Saudi face.",
      ar: "نظام عنونة وطني هندسة جغرافية مكانية حقيقية — إحداثيات وترميز جغرافي وفهرسة مكانية واستعلامات قُرب بوجه سعودي.",
    },
    keywords: ["geospatial", "gis", "geocoding", "maps", "location", "جغرافي مكاني", "ترميز جغرافي", "خرائط", "العنوان الوطني"],
  },
  {
    id: "timeseries-iot",
    category: "data",
    concept: { en: "Time-Series & IoT Telemetry", ar: "السلاسل الزمنية وقياسات إنترنت الأشياء" },
    textbookExample: "InfluxDB / industrial SCADA",
    saudi: [
      {
        name: { en: "NEOM smart-city sensors", ar: "مستشعرات مدينة نيوم الذكية" },
        by: { en: "NEOM / Tonomus", ar: "نيوم / تونوموس" },
        note: {
          en: "Dense streams of environmental and utility readings flow continuously from city infrastructure.",
          ar: "تدفّقات كثيفة من قراءات البيئة والمرافق تتدفّق باستمرار من بنية المدينة.",
        },
      },
      {
        name: { en: "SWCC desalination telemetry", ar: "قياسات تحلية المياه (المؤسسة العامة لتحلية المياه)" },
        by: { en: "SWCC", ar: "المؤسسة العامة لتحلية المياه المالحة" },
        note: { en: "Plant sensors emit high-frequency readings for monitoring and forecasting.", ar: "مستشعرات المحطّات تُصدِر قراءات عالية التردّد للمراقبة والتنبّؤ." },
      },
    ],
    why: {
      en: "Smart-city and utility sensor streams are textbook time-series — high write rates, retention/downsampling, and windowed queries over ordered points.",
      ar: "تدفّقات مستشعرات المدن الذكية والمرافق سلاسل زمنية نموذجية — معدّلات كتابة عالية واحتفاظ/تخفيض عيّنات واستعلامات نوافذ على نقاط مرتّبة.",
    },
    keywords: ["time-series", "timeseries", "iot", "sensor", "telemetry", "سلاسل زمنية", "إنترنت الأشياء", "استشعار", "قياس عن بعد"],
  },
  // ── Payments & Fintech ───────────────────────────────────────────────────────
  {
    id: "idempotency",
    category: "fintech",
    concept: { en: "Idempotency / Exactly-Once", ar: "عدم التكرار / التنفيذ مرّة واحدة" },
    textbookExample: "Stripe idempotency keys",
    saudi: [
      {
        name: { en: "sarie instant payments", ar: "سريع للمدفوعات الفورية" },
        by: { en: "SAMA", ar: "البنك المركزي السعودي" },
        note: {
          en: "A retried transfer must never move the money twice — the same request key yields the same single effect.",
          ar: "التحويل المُعاد يجب ألّا يُحرّك المال مرّتين — مفتاح الطلب نفسه يُعطي الأثر المفرد نفسه.",
        },
      },
    ],
    why: {
      en: "Instant-payment retries over flaky networks are the sharpest reason to teach idempotency keys — exactly-once semantics where double-charging is unacceptable.",
      ar: "إعادة المحاولة في المدفوعات الفورية عبر شبكات غير مستقرّة أقوى سبب لتعليم مفاتيح عدم التكرار — دلالة التنفيذ مرّة واحدة حيث لا يُقبَل الخصم المزدوج.",
    },
    keywords: ["idempotency", "idempotent", "exactly-once", "retry safety", "double charge", "عدم التكرار", "تنفيذ مرة واحدة", "أمان إعادة المحاولة"],
  },
  {
    id: "open-banking",
    category: "fintech",
    concept: { en: "Open Banking & Account Aggregation", ar: "الخدمات المصرفية المفتوحة وتجميع الحسابات" },
    textbookExample: "Plaid",
    saudi: [
      {
        name: { en: "Lean Technologies", ar: "لين تكنولوجيز" },
        by: { en: "Lean (Saudi)", ar: "لين (سعودية)" },
        note: {
          en: "Consent-based APIs let apps read a user's bank data and initiate payments under the SAMA framework.",
          ar: "واجهات قائمة على الموافقة تتيح للتطبيقات قراءة بيانات بنك المستخدم وبدء المدفوعات ضمن إطار ساما.",
        },
      },
      {
        name: { en: "Tarabut", ar: "ترابط" },
        by: { en: "Tarabut", ar: "ترابط" },
        note: { en: "Open-banking connectivity across Saudi banks.", ar: "ربط مصرفي مفتوح عبر البنوك السعودية." },
      },
    ],
    why: {
      en: "Saudi open banking is consented data sharing in practice — OAuth-style scopes, secure aggregation, and SAMA-regulated payment initiation.",
      ar: "الخدمات المصرفية المفتوحة السعودية مشاركة بيانات بموافقة عمليّاً — نطاقات على نمط OAuth وتجميع آمن وبدء مدفوعات خاضع لساما.",
    },
    keywords: ["open banking", "account aggregation", "financial data sharing", "aisp", "pisp", "الخدمات المصرفية المفتوحة", "تجميع الحسابات", "ربط مصرفي"],
  },
  {
    id: "instant-payments",
    category: "fintech",
    concept: { en: "Instant Payments / Real-Time Rails", ar: "المدفوعات الفورية / القنوات اللحظية" },
    textbookExample: "FedNow / UPI",
    saudi: [
      {
        name: { en: "sarie", ar: "سريع" },
        by: { en: "SAMA", ar: "البنك المركزي السعودي" },
        note: {
          en: "Transfers between banks settle in seconds, around the clock.",
          ar: "التحويلات بين البنوك تُسوّى خلال ثوانٍ وعلى مدار الساعة.",
        },
      },
    ],
    why: {
      en: "A 24/7 instant-transfer rail teaches synchronous settlement, strict timeouts, and consistency guarantees under real-time SLAs.",
      ar: "قناة تحويل فوري على مدار الساعة تُعلّم التسوية المتزامنة والمهل الصارمة وضمانات الاتساق ضمن اتفاقيات زمن حقيقي.",
    },
    keywords: ["instant payment", "real-time payment", "rtgs", "ips", "instant transfer", "مدفوعات فورية", "تحويل فوري", "سريع"],
  },
  {
    id: "digital-wallet",
    category: "fintech",
    concept: { en: "Digital Wallets / Stored Value", ar: "المحافظ الرقمية / القيمة المخزّنة" },
    textbookExample: "Apple Pay / PayPal",
    saudi: [
      {
        name: { en: "STC Pay", ar: "STC Pay" },
        by: { en: "stc bank", ar: "بنك stc" },
        note: {
          en: "A licensed e-money wallet holding stored value for P2P and merchant payments.",
          ar: "محفظة نقود إلكترونية مرخّصة تحتفظ بقيمة مخزّنة للتحويلات والمدفوعات التجارية.",
        },
      },
      {
        name: { en: "urpay", ar: "urpay" },
        by: { en: "neoleap (stc)", ar: "نيوليب (stc)" },
        note: { en: "A digital wallet for everyday transfers and payments.", ar: "محفظة رقمية للتحويلات والمدفوعات اليومية." },
      },
    ],
    why: {
      en: "An e-money wallet is a stored-value ledger plus KYC and SAMA limits — distinct from a card gateway, and a clean lesson in balances and double-entry.",
      ar: "محفظة النقود الإلكترونية سجلّ قيمة مخزّنة مع تحقّق هوية وحدود ساما — تختلف عن بوّابة البطاقات، ودرس نظيف في الأرصدة والقيد المزدوج.",
    },
    keywords: ["digital wallet", "e-wallet", "stored value", "e-money", "mobile wallet", "محفظة رقمية", "نقود إلكترونية", "محفظة إلكترونية"],
  },
  // ── AI & Machine Learning ────────────────────────────────────────────────────
  {
    id: "llm-arabic",
    category: "ai-ml",
    concept: { en: "Large Language Models (Arabic)", ar: "النماذج اللغوية الكبيرة (العربية)" },
    textbookExample: "GPT / Llama",
    saudi: [
      {
        name: { en: "ALLaM", ar: "علّام" },
        by: { en: "SDAIA", ar: "سدايا" },
        note: {
          en: "A large Arabic-first language model developed nationally.",
          ar: "نموذج لغوي كبير يركّز على العربية طُوِّر وطنيّاً.",
        },
      },
    ],
    why: {
      en: "An Arabic-first LLM is the local anchor for tokenization, context windows, fine-tuning, and evaluation in a language students actually write.",
      ar: "نموذج لغوي عربيّ أولاً هو المرتكز المحلّي للتقطيع ونوافذ السياق والضبط الدقيق والتقييم بلغة يكتبها الطلبة فعلاً.",
    },
    keywords: ["llm", "large language model", "generative ai", "allam", "نموذج لغوي", "ذكاء توليدي", "علام"],
  },
  {
    id: "computer-vision",
    category: "ai-ml",
    concept: { en: "Computer Vision", ar: "الرؤية الحاسوبية" },
    textbookExample: "Tesla Autopilot vision",
    saudi: [
      {
        name: { en: "Saher", ar: "ساهر" },
        by: { en: "Ministry of Interior", ar: "وزارة الداخلية" },
        note: {
          en: "Automated cameras read vehicle plates and detect violations across road networks.",
          ar: "كاميرات آلية تقرأ لوحات المركبات وترصد المخالفات عبر شبكات الطرق.",
        },
      },
    ],
    why: {
      en: "Automated number-plate recognition at national scale is a real CV pipeline — detection, recognition, and confidence thresholds under hard latency.",
      ar: "التعرّف الآلي على لوحات المركبات بمقياس وطني خطّ رؤية حاسوبية حقيقي — كشف وتعرّف وعتبات ثقة تحت زمن استجابة صارم.",
    },
    keywords: ["computer vision", "image recognition", "object detection", "anpr", "facial recognition", "رؤية حاسوبية", "تعرف على الصور", "لوحات المركبات"],
  },
  {
    id: "nlp-arabic",
    category: "ai-ml",
    concept: { en: "Arabic NLP & Sentiment", ar: "معالجة اللغة العربية وتحليل المشاعر" },
    textbookExample: "Social-listening NLP",
    saudi: [
      {
        name: { en: "Lucidya", ar: "لوسيديا" },
        by: { en: "Lucidya (Saudi)", ar: "لوسيديا (سعودية)" },
        note: {
          en: "Arabic-dialect understanding for sentiment and customer-experience analytics.",
          ar: "فهم اللهجات العربية لتحليل المشاعر وتجربة العملاء.",
        },
      },
    ],
    why: {
      en: "Arabic dialects, diacritics, and morphology make local NLP harder than English — the realistic case for tokenization, embeddings, and sentiment models.",
      ar: "اللهجات العربية والحركات والصرف تجعل المعالجة المحلّية أصعب من الإنجليزية — الحالة الواقعية للتقطيع والتمثيلات وتحليل المشاعر.",
    },
    keywords: ["nlp", "natural language processing", "sentiment", "arabic nlp", "معالجة اللغة", "تحليل المشاعر", "لغة عربية"],
  },
  {
    id: "fraud-ai",
    category: "ai-ml",
    concept: { en: "Fraud Detection & AML", ar: "كشف الاحتيال ومكافحة غسل الأموال" },
    textbookExample: "PayPal fraud models",
    saudi: [
      {
        name: { en: "Mozn FOCAL", ar: "مزن FOCAL" },
        by: { en: "Mozn (Saudi)", ar: "مزن (سعودية)" },
        note: {
          en: "Screening and anomaly detection used by Saudi banks and fintechs for AML and fraud.",
          ar: "فحص وكشف شذوذ تستخدمه البنوك والتقنية المالية السعودية لمكافحة غسل الأموال والاحتيال.",
        },
      },
    ],
    why: {
      en: "Real-time AML/fraud scoring teaches imbalanced classes, anomaly detection, and the precision/recall trade-off where false positives carry real cost.",
      ar: "تقييم الاحتيال/غسل الأموال لحظيّاً يُعلّم الفئات غير المتوازنة وكشف الشذوذ ومفاضلة الدقّة والاستدعاء حيث للإيجابيات الكاذبة كلفة حقيقية.",
    },
    keywords: ["fraud", "aml", "anti-money laundering", "anomaly detection", "احتيال", "غسل الأموال", "كشف الشذوذ"],
  },
  {
    id: "mlops",
    category: "ai-ml",
    concept: { en: "MLOps / Model Serving", ar: "MLOps / خدمة النماذج" },
    textbookExample: "SageMaker / MLflow",
    saudi: [
      {
        name: { en: "National AI model serving", ar: "تشغيل النماذج الوطنية للذكاء الاصطناعي" },
        by: { en: "SDAIA", ar: "سدايا" },
        note: {
          en: "Serving national models (such as ALLaM) reliably at scale with versioning and monitoring.",
          ar: "تشغيل النماذج الوطنية (مثل علّام) بموثوقية وعلى نطاق واسع مع إصدارات ومراقبة.",
        },
      },
    ],
    why: {
      en: "Taking a model from notebook to a monitored, versioned, scalable service is the MLOps lifecycle — registries, rollout, drift, and serving latency.",
      ar: "نقل النموذج من الدفتر إلى خدمة مُراقَبة ومُصدَّرة وقابلة للتوسّع هو دورة MLOps — السجلّات والإطلاق والانجراف وزمن الخدمة.",
    },
    keywords: ["mlops", "model serving", "model deployment", "feature store", "inference", "نشر النماذج", "خدمة النماذج"],
  },
  {
    id: "ecommerce-personalization",
    category: "ai-ml",
    concept: { en: "E-commerce Personalization", ar: "تخصيص تجربة التجارة الإلكترونية" },
    textbookExample: "Amazon product recs",
    saudi: [
      {
        name: { en: "noon", ar: "نون" },
        by: { en: "noon", ar: "نون" },
        note: {
          en: "Product ranking and suggestions adapt to each shopper's browsing and purchases.",
          ar: "ترتيب المنتجات واقتراحاتها يتكيّف مع تصفّح كل متسوّق ومشترياته.",
        },
      },
    ],
    why: {
      en: "A consumer marketplace ranking products per shopper is a recommender system — implicit signals, ranking models, and online evaluation, distinct from job matching.",
      ar: "سوق استهلاكي يرتّب المنتجات لكل متسوّق نظام توصية — إشارات ضمنية ونماذج ترتيب وتقييم مباشر، يختلف عن مطابقة الوظائف.",
    },
    keywords: ["personalization", "personalisation", "recommender", "product ranking", "تخصيص المتجر", "ترتيب المنتجات"],
  },
  // ── Security & Identity ──────────────────────────────────────────────────────
  {
    id: "jwt-tokens",
    category: "security",
    concept: { en: "Token-Based Auth (JWT)", ar: "المصادقة بالرموز (JWT)" },
    textbookExample: "Auth0 access tokens",
    saudi: [
      {
        name: { en: "Nafath sessions", ar: "جلسات نفاذ" },
        by: { en: "National Information Center", ar: "المركز الوطني للمعلومات" },
        note: {
          en: "After login, short-lived signed tokens carry identity claims to downstream services.",
          ar: "بعد تسجيل الدخول، رموز موقّعة قصيرة العمر تحمل بيانات الهوية إلى الخدمات اللاحقة.",
        },
      },
    ],
    why: {
      en: "Stateless, signed identity claims are how a national login authorizes many services — the practical lesson in token issuance, expiry, and verification.",
      ar: "بيانات الهوية الموقّعة عديمة الحالة هي كيف يُصرّح دخول وطني لعدّة خدمات — الدرس العملي في إصدار الرموز وانتهائها والتحقّق منها.",
    },
    keywords: ["jwt", "json web token", "bearer token", "access token", "stateless auth", "رمز وصول", "مصادقة بالرموز"],
  },
  {
    id: "crypto-stamps",
    category: "security",
    concept: { en: "Cryptographic Signing & Key Management", ar: "التوقيع التشفيري وإدارة المفاتيح" },
    textbookExample: "Code signing / PKI",
    saudi: [
      {
        name: { en: "ZATCA e-invoice stamp", ar: "الختم التشفيري لفاتورة الزكاة" },
        by: { en: "ZATCA", ar: "هيئة الزكاة والضريبة والجمارك" },
        note: {
          en: "Each cleared invoice carries a cryptographic stamp and QR proving authenticity and integrity.",
          ar: "كل فاتورة مُجازة تحمل ختماً تشفيرياً ورمز QR يُثبتان الأصالة والسلامة.",
        },
      },
    ],
    why: {
      en: "Mandatory invoice stamps are applied PKI — key custody, digital signatures, and verifiable integrity that a tampered document fails.",
      ar: "أختام الفواتير الإلزامية تطبيق عملي للبنية التحتية للمفاتيح — حفظ المفاتيح والتواقيع الرقمية وسلامة قابلة للتحقّق يفشلها أي تلاعب.",
    },
    keywords: ["cryptographic", "digital signature", "hsm", "key management", "signing", "ختم تشفيري", "توقيع رقمي", "إدارة المفاتيح"],
  },
  {
    id: "zero-trust",
    category: "security",
    concept: { en: "Zero Trust & Cyber Controls", ar: "انعدام الثقة والضوابط السيبرانية" },
    textbookExample: "BeyondCorp",
    saudi: [
      {
        name: { en: "Essential Cybersecurity Controls (ECC)", ar: "الضوابط الأساسية للأمن السيبراني" },
        by: { en: "National Cybersecurity Authority", ar: "الهيئة الوطنية للأمن السيبراني" },
        note: {
          en: "National controls push strong identity, least privilege, and segmentation across entities.",
          ar: "ضوابط وطنية تفرض هوية قويّة وأقلّ امتياز وتجزئة عبر الجهات.",
        },
      },
    ],
    why: {
      en: "Mandated national cyber controls are zero-trust in policy — never trust by network location, verify every request, and minimize blast radius.",
      ar: "الضوابط السيبرانية الوطنية الإلزامية هي انعدام الثقة سياسةً — لا ثقة بحسب موقع الشبكة، تحقّق من كل طلب، وقلّل نطاق الضرر.",
    },
    keywords: ["zero trust", "least privilege", "network segmentation", "cybersecurity controls", "انعدام الثقة", "أقل امتياز", "الضوابط الأساسية"],
  },
  // ── Cloud & Scale ────────────────────────────────────────────────────────────
  {
    id: "caching-cdn",
    category: "cloud",
    concept: { en: "Caching & CDN", ar: "التخزين المؤقّت وشبكة توصيل المحتوى" },
    textbookExample: "Cloudflare / Redis cache",
    saudi: [
      {
        name: { en: "National portals at peak", ar: "البوّابات الوطنية في الذروة" },
        by: { en: "Absher / Tawakkalna", ar: "أبشر / توكلنا" },
        note: {
          en: "Static assets and hot data are cached and served from the edge so peaks (e.g. Hajj) stay fast.",
          ar: "الأصول الثابتة والبيانات الساخنة تُخزَّن وتُخدَم من الحافة لتبقى الذروة (مثل الحج) سريعة.",
        },
      },
    ],
    why: {
      en: "Keeping national portals fast under load is the caching/CDN lesson — cache layers, invalidation, TTLs, and edge delivery close to users.",
      ar: "إبقاء البوّابات الوطنية سريعة تحت الحِمل هو درس التخزين المؤقّت/الـCDN — طبقات التخزين وإبطالها ومدد الصلاحية والتوصيل من الحافة قرب المستخدم.",
    },
    keywords: ["cache", "caching", "cdn", "content delivery", "edge cache", "ذاكرة مؤقتة", "تخزين مؤقت", "شبكة توصيل المحتوى"],
  },
  {
    id: "sovereign-cloud",
    category: "cloud",
    concept: { en: "Sovereign / In-Kingdom Cloud", ar: "السحابة السيادية / داخل المملكة" },
    textbookExample: "Region-locked cloud",
    saudi: [
      {
        name: { en: "In-Kingdom cloud regions", ar: "مناطق السحابة داخل المملكة" },
        by: { en: "center3 / SCCC / Google Cloud Dammam / Oracle Riyadh", ar: "سنتر3 / SCCC / جوجل كلاود الدمّام / أوراكل الرياض" },
        note: {
          en: "Regulated workloads run on infrastructure physically located inside Saudi Arabia.",
          ar: "الأحمال المنظّمة تعمل على بنية تحتية موجودة فعليّاً داخل السعودية.",
        },
      },
    ],
    why: {
      en: "Data-residency rules make region choice an architecture decision — sovereignty, latency, and compliance, not just a deployment knob.",
      ar: "قواعد إقامة البيانات تجعل اختيار المنطقة قراراً معماريّاً — سيادة وزمن استجابة وامتثال، لا مجرّد إعداد نشر.",
    },
    keywords: ["sovereign cloud", "data residency", "data sovereignty", "in-kingdom", "سحابة سيادية", "إقامة البيانات", "سيادة البيانات"],
  },
  {
    id: "serverless",
    category: "cloud",
    concept: { en: "Serverless / Functions", ar: "الحوسبة بدون خوادم / الدوال" },
    textbookExample: "AWS Lambda",
    saudi: [
      {
        name: { en: "Event-driven functions in-Kingdom", ar: "دوال موجّهة بالأحداث داخل المملكة" },
        by: { en: "Saudi cloud providers", ar: "مزوّدو السحابة في المملكة" },
        note: {
          en: "Short, event-triggered tasks (notifications, image processing) run without managing servers.",
          ar: "مهامّ قصيرة تُطلَق بالأحداث (إشعارات، معالجة صور) تعمل دون إدارة خوادم.",
        },
      },
    ],
    why: {
      en: "Bursty, event-triggered work is the serverless sweet spot — pay-per-use, autoscaling to zero, and cold-start trade-offs to reason about.",
      ar: "العمل المتقطّع المُطلَق بالأحداث هو موضع تفوّق الحوسبة بدون خوادم — دفع بالاستخدام وتوسّع حتى الصفر ومفاضلات البدء البارد.",
    },
    keywords: ["serverless", "faas", "functions", "lambda", "بدون خادم", "الحوسبة بدون خوادم", "دوال"],
  },
  // ── DevOps & Delivery ────────────────────────────────────────────────────────
  {
    id: "containers-k8s",
    category: "devops",
    concept: { en: "Containers & Kubernetes", ar: "الحاويات وكوبرنيتس" },
    textbookExample: "Kubernetes",
    saudi: [
      {
        name: { en: "Managed Kubernetes in-Kingdom", ar: "كوبرنيتس المُدار داخل المملكة" },
        by: { en: "SCCC (Alibaba Cloud) / center3 / Google Cloud Dammam", ar: "SCCC (علي بابا كلاود) / سنتر3 / جوجل كلاود الدمّام" },
        note: {
          en: "Saudi cloud providers offer managed container orchestration as a product, in-region.",
          ar: "مزوّدو السحابة في المملكة يقدّمون تنسيق الحاويات المُدار كمنتَج وداخل المنطقة.",
        },
      },
    ],
    why: {
      en: "Managed Kubernetes offered in-Kingdom is where containers, pods, scheduling, and self-healing become concrete — orchestration as a real local service.",
      ar: "كوبرنيتس المُدار داخل المملكة هو حيث تصبح الحاويات والـpods والجدولة والتعافي الذاتي ملموسة — تنسيق كخدمة محلّية حقيقية.",
    },
    keywords: ["kubernetes", "k8s", "containers", "container orchestration", "docker", "حاويات", "تنسيق الحاويات", "كوبرنيتس"],
  },
  {
    id: "ci-cd",
    category: "devops",
    concept: { en: "CI/CD & Continuous Delivery", ar: "التكامل والتسليم المستمرّ" },
    textbookExample: "GitHub Actions / GitLab CI",
    saudi: [
      {
        name: { en: "Salla / Zid", ar: "سلة / زد" },
        by: { en: "Salla / Zid (Saudi)", ar: "سلة / زد (سعودية)" },
        note: {
          en: "Features reach thousands of merchant stores continuously, without taking storefronts offline.",
          ar: "الميزات تصل آلاف متاجر التجّار باستمرار دون إيقاف الواجهات.",
        },
      },
    ],
    why: {
      en: "Shipping to many live tenants without downtime is what CI/CD buys — automated build, test, and progressive release behind every commit.",
      ar: "الشحن لكثير من المستأجرين المباشرين دون توقّف هو ما يحقّقه التكامل/التسليم المستمرّ — بناء واختبار وإطلاق تدريجي آليّ خلف كل تعديل.",
    },
    keywords: ["ci/cd", "continuous integration", "continuous delivery", "continuous deployment", "تكامل مستمر", "تسليم مستمر", "نشر مستمر"],
  },
  {
    id: "iac",
    category: "devops",
    concept: { en: "Infrastructure as Code", ar: "البنية التحتية كشيفرة" },
    textbookExample: "Terraform",
    saudi: [
      {
        name: { en: "Reproducible cloud environments", ar: "بيئات سحابية قابلة للاستنساخ" },
        by: { en: "center3 / SCCC", ar: "سنتر3 / SCCC" },
        note: {
          en: "Whole environments are declared and version-controlled, so dev/test/prod match exactly.",
          ar: "تُعرَّف البيئات كاملةً وتُدار بإصدارات، فتتطابق التطوير والاختبار والإنتاج تماماً.",
        },
      },
    ],
    why: {
      en: "Declaring infrastructure as version-controlled code is how teams make environments reproducible and auditable — no more snowflake servers.",
      ar: "تعريف البنية التحتية كشيفرة مُدارة بالإصدارات هو كيف تجعل الفِرَق البيئات قابلة للاستنساخ والتدقيق — لا خوادم فريدة بعد اليوم.",
    },
    keywords: ["infrastructure as code", "terraform", "iac", "provisioning", "بنية كشيفرة", "توفير الموارد", "تيرافورم"],
  },
  {
    id: "observability",
    category: "devops",
    concept: { en: "Observability & Monitoring", ar: "القابلية للملاحظة والمراقبة" },
    textbookExample: "Datadog / Grafana",
    saudi: [
      {
        name: { en: "Telecom network operations", ar: "عمليات شبكات الاتصالات" },
        by: { en: "stc / Mobily", ar: "stc / موبايلي" },
        note: {
          en: "24/7 centers watch nationwide network health with metrics, logs, and alerts.",
          ar: "مراكز تعمل على مدار الساعة تراقب صحّة الشبكة الوطنية بالمقاييس والسجلّات والتنبيهات.",
        },
      },
    ],
    why: {
      en: "Running a national network you cannot see is impossible — the concrete case for metrics, logs, traces, dashboards, and alerting on SLOs.",
      ar: "تشغيل شبكة وطنية لا تراها مستحيل — الحالة الملموسة للمقاييس والسجلّات والتتبّع واللوحات والتنبيه على أهداف مستوى الخدمة.",
    },
    keywords: ["observability", "monitoring", "metrics", "tracing", "logging", "alerting", "قابلية الملاحظة", "مراقبة", "تتبع"],
  },
  {
    id: "feature-flags",
    category: "devops",
    concept: { en: "Feature Flags & Progressive Delivery", ar: "أعلام الميزات والتسليم التدريجي" },
    textbookExample: "LaunchDarkly",
    saudi: [
      {
        name: { en: "Salla / Zid rollouts", ar: "إطلاقات سلة / زد" },
        by: { en: "Salla / Zid (Saudi)", ar: "سلة / زد (سعودية)" },
        note: {
          en: "New capabilities are enabled for a subset of merchants first, then widened.",
          ar: "القدرات الجديدة تُفعَّل لمجموعة من التجّار أولاً ثم تُوسَّع.",
        },
      },
    ],
    why: {
      en: "Turning a feature on for some tenants before all is progressive delivery — decoupling deploy from release, with instant rollback by toggle.",
      ar: "تفعيل ميزة لبعض المستأجرين قبل الجميع هو التسليم التدريجي — فصل النشر عن الإطلاق مع تراجع فوري بزرّ.",
    },
    keywords: ["feature flag", "feature toggle", "progressive delivery", "canary", "a/b rollout", "أعلام الميزات", "تسليم تدريجي", "إطلاق تجريبي"],
  },
];

/** A short, honest description of the SDAIA open-data resource for the UI. */
export const OPEN_DATA_RESOURCE = {
  name: { en: "Saudi Open Data Portal", ar: "بوّابة البيانات المفتوحة السعودية" },
  url: "open.data.gov.sa",
  by: { en: "SDAIA (Saudi Data & AI Authority)", ar: "الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا)" },
  note: {
    en: "National open datasets across labor, health, transport, education and more — usable for analytics, dashboards and ML coursework.",
    ar: "مجموعات بيانات وطنية مفتوحة عبر العمل والصحة والنقل والتعليم وغيرها — صالحة للتحليلات ولوحات المعلومات ومشاريع تعلّم الآلة.",
  },
} as const;

export const SAUDI_CONTEXT_SOURCE = {
  note: {
    en: "Curated by iSCARB. Examples name public Saudi services and their operating entities; architectural properties are described, not internal implementations.",
    ar: "مُنسَّق من iSCARB. تذكر الأمثلة خدمات سعودية عامة وجهاتها المُشغِّلة؛ وتُوصَف الخصائص المعمارية لا التفاصيل الداخلية.",
  },
} as const;
