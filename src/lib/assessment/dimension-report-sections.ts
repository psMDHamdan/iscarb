import { DIMENSIONS, type DimensionScore, type DimensionId } from "./framework";
import { pushDistinctSentence } from "./text-dedupe";

/** Minimal module row shape for category synthesis (avoids circular imports). */
export type DimensionChapterModuleInput = {
  moduleCode: string;
  moduleTitle: string;
  dimension: string;
  score: number;
  band: string;
  strengths: string[];
  improvements: string[];
  feedback?: string;
};

export type DimensionChapter = {
  id: DimensionId;
  label: string;
  labelAr: string | null;
  weight: number;
  score: number | null;
  band: string | null;
  passed: boolean | null;
  moduleCount: number;
  definition: string;
  /** Category-level performance narrative (no per-question content). */
  narrative: string[];
  narrativeAr: string[];
  narrativeFr: string[];
  /** Category-level development suggestions keyed by this dimension's band. */
  development: string[];
  developmentAr: string[];
  developmentFr: string[];
  /** Synthesized strengths across the category (not per-question). */
  strengths: string[];
  /** Synthesized areas for improvement across the category. */
  improvements: string[];
  /** Internal only — never render module titles/codes in the candidate report. */
  contributingModules: Array<{
    moduleCode: string;
    moduleTitle: string;
    score: number;
    band: string;
  }>;
};

type BandKey = "weak" | "developing" | "proficient" | "strong";

/**
 * Development suggestions keyed by dimension × that dimension's own band
 * (never the composite band). Weak/Developing emphasize foundational rebuild
 * in what the dimension measures; Proficient/Strong emphasize stretch and lead.
 */
const DEVELOPMENT_BY_DIMENSION_BAND: Record<DimensionId, Record<BandKey, string[]>> = {
  core_professionalism: {
    weak: [
      "Rebuild core professional habits: practice clear stakeholder updates, structured problem framing, and documenting decisions before acting.",
      "Drill ethical judgment on realistic workplace dilemmas — name the risk, refuse unsafe shortcuts, and propose a compliant alternative.",
      "Strengthen teamwork basics: listen first, restate shared goals, and resolve conflict without escalating prematurely.",
    ],
    developing: [
      "Turn developing communication into a repeatable brief: audience, issue, impact, and next action in non-technical language.",
      "Practice adaptability under scope change — impact assessment, transparent stakeholder updates, and a phased recovery plan.",
      "Deepen conflict facilitation: surface interests on both sides and negotiate a time-boxed compromise that protects quality.",
    ],
    proficient: [
      "Raise the bar on executive presence: tighter structure, quantified outcomes, and calm delivery under time pressure.",
      "Lead multi-stakeholder ethics calls — document directives, escalate safely, and coach peers on quality-over-deadline tradeoffs.",
      "Mentor teammates on constructive conflict modes so the team resolves deadlocks without leadership intervention.",
    ],
    strong: [
      "Set the professional standard for others: model face-saving escalation, evidence-based challenge of unsafe asks, and crisp leadership briefs.",
      "Take ownership of cross-team communication rituals (decision logs, risk registers) so excellence scales beyond your own tasks.",
      "Coach juniors on ethical courage and stakeholder diplomacy in Saudi hierarchical contexts.",
    ],
  },
  business_digital: {
    weak: [
      "Build digital literacy fundamentals: method choice (e.g. Agile vs Waterfall), basic data reading, and why PDPL/cyber hygiene matter at work.",
      "Practice safe AI use — approved tools only, no confidential paste into public models, and always fact-check outputs.",
      "Learn to recognize phishing and social-engineering red flags and verify unusual requests out-of-band before acting.",
    ],
    developing: [
      "Strengthen methodology justification: tie project approach to uncertainty, feedback loops, and delivery constraints in the scenario.",
      "Improve data storytelling for non-technical managers — accurate trends, business implication, and a diplomatic recommendation.",
      "Harden cyber and privacy habits: report suspicious mail, use internal AI platforms, and cite PDPL constraints explicitly.",
    ],
    proficient: [
      "Advance business-digital judgment: combine SWOT/ROI-style reasoning with clear go/no-go recommendations under uncertainty.",
      "Integrate AI, data, and security controls into one operating habit — verify, protect, then communicate.",
      "Own digital process improvements (analytics checks, sprint discipline) that raise team throughput without adding risk.",
    ],
    strong: [
      "Lead digital operating standards: coach peers on responsible AI, cyber response, and evidence-based project methodology.",
      "Translate analytics and ROI into executive decisions that balance speed, compliance, and Vision 2030 delivery goals.",
      "Design lightweight playbooks so the team repeats your strong digital practices without relying on you alone.",
    ],
  },
  job_fit: {
    weak: [
      "Rebuild technical foundations for your track — core concepts, correct terminology, and step-by-step solutions before advanced tools.",
      "Practice applying one specialty method end-to-end on a small real task and write down why each step is required.",
      "Seek supervised drills (labs, code reviews, case walkthroughs) until you can explain and execute the basics without prompts.",
    ],
    developing: [
      "Close specific technical gaps flagged in your weaker responses: rework the exact procedure until you can teach it.",
      "Move from partial answers to complete specialty deliverables — correct method, justification, and edge-case awareness.",
      "Build a short practice set of domain problems weekly and compare your solution to a known-good reference.",
    ],
    proficient: [
      "Stretch specialty depth: harder edge cases, performance/safety constraints, and clearer technical tradeoff language.",
      "Produce portfolio artifacts (reviewed code, designs, analyses) that prove Job-Fit strength to employers.",
      "Cross-check your work against professional standards and Vision 2030 / sector regulations relevant to your field.",
    ],
    strong: [
      "Lead technical excellence: review peers’ work, set quality bars, and mentor on domain standards.",
      "Tackle ambiguous, multi-constraint specialty problems and document decisions for handover.",
      "Convert strong Job-Fit into visible impact — ship improvements, publish learnings, and support hiring/calibration discussions.",
    ],
  },
  growth_potential: {
    weak: [
      "Start a concrete growth routine: weekly learning goals, a simple career target, and honest self-rating against a framework such as SFIA.",
      "Practice adaptability — map how your current skills transfer when tools or roles change, and name one skill to build this month.",
      "Build intercultural and networking basics: respectful outreach, listening across styles, and a short professional profile.",
    ],
    developing: [
      "Turn career intent into a 3–5 year roadmap with measurable milestones and skills to acquire.",
      "Strengthen self-calibration: evidence for your level claims, plus a clear gap and next practice step.",
      "Practice mediating style differences and pitching ideas with ethos/logos/pathos suited to senior audiences.",
    ],
    proficient: [
      "Expand growth leadership: mentor a peer, lead a small transition plan, and seek stretch assignments outside your comfort zone.",
      "Deepen intercultural facilitation so mixed teams stay aligned under deadline pressure.",
      "Link personal development goals explicitly to team and Vision 2030 contribution.",
    ],
    strong: [
      "Scale your adaptability: design upskilling paths for others during organizational change.",
      "Lead intercultural and career-growth conversations that raise the whole cohort’s readiness.",
      "Use your strong growth profile to sponsor juniors and shape learning culture, not only personal advancement.",
    ],
  },
};

const DEVELOPMENT_BY_DIMENSION_BAND_AR: Record<DimensionId, Record<BandKey, string[]>> = {
  core_professionalism: {
    weak: [
      "إعادة بناء العادات المهنية الأساسية: ممارسة تحديثات أصحاب المصلحة بوضوح، وتأطير المشكلات بشكل منظم، وتوثيق القرارات قبل اتخاذها.",
      "التدريب على الحكم الأخلاقي في معضلات العمل الواقعية - تحديد المخاطر، ورفض الاختصارات غير الآمنة، واقتراح بديل متوافق.",
      "تعزيز أساسيات العمل الجماعي: الاستماع أولاً، وتأكيد الأهداف المشتركة، وحل النزاعات دون تصعيد مبكر.",
    ],
    developing: [
      "تحويل التواصل إلى ملخص قابل للتكرار: الجمهور، والمشكلة، والتأثير، والخطوة التالية بلغة غير تقنية.",
      "ممارسة القدرة على التكيف في ظل تغيير النطاق - تقييم التأثير، والتحديثات الشفافة لأصحاب المصلحة، وخطة تعافي مرحلية.",
      "تعميق تسهيل النزاعات: إبراز المصالح لدى كلا الجانبين والتفاوض على حل وسط محدد بوقت يحمي الجودة.",
    ],
    proficient: [
      "رفع مستوى الحضور التنفيذي: هيكلة أدق، ونتائج كمية، وتقديم هادئ تحت ضغط الوقت.",
      "قيادة المكالمات الأخلاقية متعددة الأطراف - توثيق التوجيهات، والتصعيد بأمان، وتوجيه الزملاء نحو الجودة بدلاً من ضغط الوقت.",
      "توجيه زملاء الفريق في طرق حل النزاعات البناءة بحيث يحل الفريق خلافاته دون تدخل القيادة.",
    ],
    strong: [
      "تحديد المعيار المهني للآخرين: تقديم نموذج للتصعيد لحفظ ماء الوجه، والتحدي القائم على الأدلة للطلبات غير الآمنة، والملخصات القيادية الواضحة.",
      "تحمل مسؤولية طقوس التواصل عبر الفِرق (سجلات القرارات، سجلات المخاطر) ليتجاوز التميز مهامك الشخصية.",
      "توجيه الموظفين المبتدئين حول الشجاعة الأخلاقية ودبلوماسية أصحاب المصلحة في سياقات العمل.",
    ],
  },
  business_digital: {
    weak: [
      "بناء أساسيات محو الأمية الرقمية: اختيار المنهجية، والقراءة الأساسية للبيانات، وأهمية قوانين الخصوصية في العمل.",
      "ممارسة الاستخدام الآمن للذكاء الاصطناعي - أدوات معتمدة فقط، ولا تلصق معلومات سرية في نماذج عامة، وتحقق دائمًا من المخرجات.",
      "تعلم التعرف على علامات الخداع والتصيد، والتحقق من الطلبات غير العادية قبل اتخاذ الإجراء.",
    ],
    developing: [
      "تعزيز مبررات المنهجية: ربط نهج المشروع بالغموض، وحلقات التغذية الراجعة، وقيود التسليم في السيناريو.",
      "تحسين سرد البيانات للمديرين غير التقنيين - اتجاهات دقيقة، وآثار أعمال، وتوصية دبلوماسية.",
      "تعزيز عادات الأمان السيبراني والخصوصية: الإبلاغ عن البريد المشبوه، واستخدام المنصات الداخلية، والإشارة الصريحة للقيود.",
    ],
    proficient: [
      "تطوير الحكم الرقمي والتجاري: دمج التفكير المعتمد على تحليل نقاط القوة/عائد الاستثمار مع توصيات واضحة تحت ظروف الغموض.",
      "دمج الذكاء الاصطناعي والبيانات وضوابط الأمان في عادة تشغيلية واحدة - تحقق، واحمِ، ثم تواصل.",
      "امتلاك تحسينات العمليات الرقمية التي ترفع إنتاجية الفريق دون إضافة مخاطر.",
    ],
    strong: [
      "قيادة معايير التشغيل الرقمي: توجيه الزملاء نحو الذكاء الاصطناعي المسؤول، والاستجابة السيبرانية، ومنهجية المشروع القائمة على الأدلة.",
      "ترجمة التحليلات وعائد الاستثمار إلى قرارات تنفيذية توازن بين السرعة والامتثال وأهداف التسليم.",
      "تصميم إرشادات خفيفة لكي يكرر الفريق ممارساتك الرقمية القوية دون الاعتماد عليك وحدك.",
    ],
  },
  job_fit: {
    weak: [
      "إعادة بناء الأسس التقنية لمسارك - المفاهيم الأساسية، والمصطلحات الصحيحة، والحلول التدريجية قبل الأدوات المتقدمة.",
      "ممارسة تطبيق أسلوب تخصصي واحد من البداية للنهاية على مهمة حقيقية صغيرة وكتابة سبب كل خطوة.",
      "طلب تدريبات خاضعة للإشراف حتى تتمكن من شرح وتنفيذ الأساسيات دون توجيه.",
    ],
    developing: [
      "سد الفجوات التقنية المحددة في ردودك الأضعف: أعد العمل على الإجراء الدقيق حتى تتمكن من تعليمه.",
      "الانتقال من الإجابات الجزئية إلى المخرجات التخصصية الكاملة - المنهجية الصحيحة، والمبررات، والوعي بالحالات الاستثنائية.",
      "بناء مجموعة ممارسة أسبوعية ومقارنة الحل الخاص بك بمرجع معروف.",
    ],
    proficient: [
      "توسيع العمق التخصصي: حالات أصعب، وقيود الأداء/الأمان، ولغة أكثر وضوحاً في المفاضلة التقنية.",
      "إنتاج نماذج أعمال تثبت قوة الملاءمة الوظيفية لأصحاب العمل.",
      "مراجعة عملك مقارنة بالمعايير المهنية ولوائح القطاع ذات الصلة بمجالك.",
    ],
    strong: [
      "قيادة التميز التقني: مراجعة أعمال الزملاء، وتحديد مستويات الجودة، والتوجيه في معايير المجال.",
      "معالجة المشكلات التخصصية الغامضة ومتعددة القيود وتوثيق القرارات للتسليم.",
      "تحويل الملاءمة الوظيفية القوية إلى تأثير ملموس - إطلاق التحسينات، ونشر الدروس المستفادة، ودعم مناقشات التوظيف.",
    ],
  },
  growth_potential: {
    weak: [
      "بدء روتين نمو ملموس: أهداف تعليمية أسبوعية، وهدف وظيفي بسيط، وتقييم ذاتي صادق.",
      "ممارسة القدرة على التكيف - رسم خريطة لكيفية انتقال مهاراتك الحالية عند تغيير الأدوات، وتسمية مهارة واحدة لبنائها هذا الشهر.",
      "بناء أساسيات التواصل: التواصل المحترم، والاستماع عبر الأساليب المختلفة، وملف مهني قصير.",
    ],
    developing: [
      "تحويل النية المهنية إلى خارطة طريق مدتها 3-5 سنوات مع مراحل قابلة للقياس ومهارات لاكتسابها.",
      "تعزيز التقييم الذاتي: أدلة على ادعاءات مستواك، بالإضافة إلى فجوة واضحة وخطوة الممارسة التالية.",
      "ممارسة التوسط في الاختلافات وعرض الأفكار بما يناسب الجماهير من كبار المسؤولين.",
    ],
    proficient: [
      "توسيع نطاق القيادة في النمو: توجيه زميل، وقيادة خطة انتقال صغيرة، والبحث عن مهام خارج منطقة راحتك.",
      "تعميق التسهيل بين الثقافات بحيث تظل الفرق متوافقة تحت ضغط المواعيد النهائية.",
      "ربط أهداف التنمية الشخصية بوضوح بمساهمة الفريق ورؤية 2030.",
    ],
    strong: [
      "توسيع نطاق قدرتك على التكيف: تصميم مسارات لرفع مهارات الآخرين أثناء التغيير التنظيمي.",
      "قيادة حوارات النمو المهني والثقافي التي ترفع جاهزية الجميع.",
      "استخدام ملف النمو القوي الخاص بك لرعاية المبتدئين وتشكيل ثقافة التعلم، وليس فقط التقدم الشخصي.",
    ],
  },
};

const DEVELOPMENT_BY_DIMENSION_BAND_FR: Record<DimensionId, Record<BandKey, string[]>> = {
  core_professionalism: {
    weak: [
      "Reconstruire les habitudes professionnelles fondamentales: pratiquer des mises à jour claires pour les parties prenantes, formuler les problèmes de manière structurée et documenter les décisions avant d'agir.",
      "S'exercer au jugement éthique sur des dilemmes réalistes en milieu de travail — nommer le risque, refuser les raccourcis dangereux et proposer une alternative conforme.",
      "Renforcer les bases du travail en équipe: écouter d'abord, réaffirmer les objectifs communs et résoudre les conflits sans escalade prématurée."
    ],
    developing: [
      "Transformer la communication en développement en un briefing répétable: public, problème, impact et prochaine action en langage non technique.",
      "Pratiquer l'adaptabilité en cas de changement de portée — évaluation de l'impact, mises à jour transparentes pour les parties prenantes et plan de récupération progressif.",
      "Approfondir la facilitation des conflits: faire ressortir les intérêts des deux parties et négocier un compromis limité dans le temps qui protège la qualité."
    ],
    proficient: [
      "Relever la barre de la présence exécutive: structure plus stricte, résultats quantifiés et prestation calme sous la pression du temps.",
      "Diriger des appels éthiques multipartites — documenter les directives, faire remonter les problèmes en toute sécurité et encadrer les pairs sur les compromis qualité/délais.",
      "Encadrer les coéquipiers sur les modes de conflit constructifs afin que l'équipe résolve les impasses sans l'intervention de la direction."
    ],
    strong: [
      "Définir la norme professionnelle pour les autres: modéliser l'escalade qui sauve la face, la remise en question fondée sur des preuves des demandes non sécurisées et des briefings de direction clairs.",
      "S'approprier les rituels de communication inter-équipes (journaux de décisions, registres des risques) afin que l'excellence aille au-delà de vos propres tâches.",
      "Accompagner les jeunes sur le courage éthique et la diplomatie des parties prenantes dans des contextes hiérarchiques."
    ]
  },
  business_digital: {
    weak: [
      "Construire les fondamentaux de la littératie numérique: choix de la méthode (ex. Agile vs Waterfall), lecture de base des données et pourquoi l'hygiène PDPL/cyber compte au travail.",
      "Pratiquer l'utilisation sécurisée de l'IA — outils approuvés uniquement, pas de collage confidentiel dans des modèles publics, et toujours vérifier les résultats.",
      "Apprendre à reconnaître les signaux d'alarme d'hameçonnage et d'ingénierie sociale et vérifier les demandes inhabituelles avant d'agir."
    ],
    developing: [
      "Renforcer la justification méthodologique: lier l'approche du projet à l'incertitude, aux boucles de rétroaction et aux contraintes de livraison.",
      "Améliorer la narration des données pour les gestionnaires non techniques — tendances précises, implications commerciales et recommandation diplomatique.",
      "Renforcer les habitudes de cybersécurité et de confidentialité: signaler les courriers suspects, utiliser des plateformes d'IA internes et citer explicitement les contraintes PDPL."
    ],
    proficient: [
      "Faire progresser le jugement numérico-commercial: combiner le raisonnement SWOT/ROI avec des recommandations claires de go/no-go en cas d'incertitude.",
      "Intégrer l'IA, les données et les contrôles de sécurité dans une seule habitude opérationnelle — vérifier, protéger, puis communiquer.",
      "Posséder des améliorations de processus numériques qui augmentent le rendement de l'équipe sans ajouter de risque."
    ],
    strong: [
      "Diriger les normes de fonctionnement numérique: encadrer les pairs sur l'IA responsable, la réponse cybernétique et la méthodologie de projet fondée sur des preuves.",
      "Traduire les analyses et le retour sur investissement en décisions exécutives qui équilibrent vitesse, conformité et objectifs de livraison.",
      "Concevoir des manuels légers pour que l'équipe répète vos solides pratiques numériques sans compter sur vous seul."
    ]
  },
  job_fit: {
    weak: [
      "Reconstruire les bases techniques de votre domaine — concepts de base, terminologie correcte et solutions étape par étape.",
      "S'exercer à appliquer une méthode de spécialité de bout en bout sur une petite tâche réelle et écrire pourquoi chaque étape est requise.",
      "Rechercher des exercices supervisés jusqu'à ce que vous puissiez expliquer et exécuter les bases sans invites."
    ],
    developing: [
      "Combler les lacunes techniques spécifiques signalées dans vos réponses les plus faibles: retravailler la procédure exacte jusqu'à ce que vous puissiez l'enseigner.",
      "Passer de réponses partielles à des livrables de spécialité complets — méthode correcte, justification et conscience des cas extrêmes.",
      "Construire un court ensemble de pratiques hebdomadaires de problèmes de domaine et comparer votre solution à une référence."
    ],
    proficient: [
      "Étendre la profondeur de spécialité: cas extrêmes plus difficiles, contraintes de performance/sécurité et langage de compromis technique plus clair.",
      "Produire des artefacts de portfolio qui prouvent la force de l'adéquation à l'emploi.",
      "Vérifier votre travail par rapport aux normes professionnelles et aux réglementations pertinentes de votre domaine."
    ],
    strong: [
      "Diriger l'excellence technique: examiner le travail des pairs, fixer des barres de qualité et encadrer sur les normes du domaine.",
      "S'attaquer à des problèmes de spécialité ambigus à contraintes multiples et documenter les décisions pour le transfert.",
      "Convertir l'adéquation au poste en impact visible — publier des apprentissages et soutenir les discussions d'étalonnage."
    ]
  },
  growth_potential: {
    weak: [
      "Démarrer une routine de croissance concrète: objectifs d'apprentissage hebdomadaires, cible de carrière simple et auto-évaluation honnête.",
      "Pratiquer l'adaptabilité — cartographier la façon dont vos compétences actuelles se transfèrent lorsque les outils changent, et nommer une compétence à acquérir ce mois-ci.",
      "Construire les bases interculturelles et de réseautage: approche respectueuse, écoute à travers les styles et un court profil professionnel."
    ],
    developing: [
      "Transformer l'intention de carrière en une feuille de route de 3 à 5 ans avec des jalons mesurables et des compétences à acquérir.",
      "Renforcer l'auto-étalonnage: preuves de vos niveaux de compétence, plus un écart clair et la prochaine étape de pratique.",
      "S'exercer à la médiation des différences de style et à la présentation d'idées adaptées aux auditoires chevronnés."
    ],
    proficient: [
      "Développer le leadership de croissance: encadrer un pair, diriger un petit plan de transition et rechercher des missions d'étirement en dehors de votre zone de confort.",
      "Approfondir la facilitation interculturelle pour que les équipes mixtes restent alignées sous la pression des délais.",
      "Lier les objectifs de développement personnel explicitement à la contribution de l'équipe et à la vision."
    ],
    strong: [
      "Faire évoluer votre adaptabilité: concevoir des parcours de perfectionnement pour les autres lors des changements organisationnels.",
      "Diriger les conversations interculturelles et d'évolution de carrière qui élèvent la préparation de toute la cohorte.",
      "Utiliser votre solide profil de croissance pour parrainer des juniors et façonner la culture d'apprentissage, pas seulement l'avancement personnel."
    ]
  }
};

/** Band-specific opening analysis per dimension — score-driven, not boilerplate. */
const ANALYSIS_BY_DIMENSION_BAND: Record<DimensionId, Record<BandKey, (score: number, n: number) => string>> = {
  core_professionalism: {
    weak: (s, n) =>
      `Your Core Professionalism average is ${s}/100 across ${n} competency areas — currently in the weak band. Responses in this category often missed structured stakeholder communication, ethical risk naming, or constructive teamwork under pressure. Employers reading this profile will expect clearer professional judgment before trusting you with unsupervised client or leadership-facing work.`,
    developing: (s, n) =>
      `Your Core Professionalism average is ${s}/100 across ${n} competency areas — a developing profile. You show emerging professional habits, but consistency slips when ethics, conflict, or executive brevity are required. Closing the gap to proficient means turning occasional strong moments into a repeatable communication and judgment standard.`,
    proficient: (s, n) =>
      `Your Core Professionalism average is ${s}/100 across ${n} competency areas — a proficient band. You generally demonstrate sound communication, ethics, and collaboration. Remaining gains come from sharper executive structure, calmer conflict facilitation, and modeling those habits for peers.`,
    strong: (s, n) =>
      `Your Core Professionalism average is ${s}/100 across ${n} competency areas — a strong band. You consistently show mature professional judgment, clear stakeholder communication, and ethical courage. This is a leadership-ready signal; the next step is setting the standard for others, not only performing well yourself.`,
  },
  business_digital: {
    weak: (s, n) =>
      `Your Business & Digital Literacy average is ${s}/100 across ${n} competency areas — currently weak. Answers in this category under-used data, methodology, responsible AI, or cyber/privacy safeguards. That leaves a material employability risk in digitally enabled Saudi workplaces.`,
    developing: (s, n) =>
      `Your Business & Digital Literacy average is ${s}/100 across ${n} competency areas — developing. You engage digital and business concepts partially, but recommendations are not yet consistently evidence-based or compliance-aware. Strengthening PDPL/cyber hygiene and clearer data storytelling will lift this band.`,
    proficient: (s, n) =>
      `Your Business & Digital Literacy average is ${s}/100 across ${n} competency areas — proficient. You combine business framing with usable digital judgment most of the time. Stretch toward integrating AI, analytics, and security into one operating habit that executives can trust.`,
    strong: (s, n) =>
      `Your Business & Digital Literacy average is ${s}/100 across ${n} competency areas — strong. You show confident, responsible digital and business judgment aligned with modern workplace expectations. Use that strength to define team playbooks and coach peers on safe, high-impact digital practice.`,
  },
  job_fit: {
    weak: (s, n) =>
      `Your Job-Fit Technical average is ${s}/100 across ${n} specialty areas — currently weak. Domain method, terminology, or end-to-end technical execution did not hold up under scenario pressure. This is the heaviest-weighted dimension for employers in your track, so foundational rebuild here should be the priority.`,
    developing: (s, n) =>
      `Your Job-Fit Technical average is ${s}/100 across ${n} specialty areas — developing. You show partial specialty competence, but responses often stop short of complete, justified, edge-case-aware deliverables. Moving to proficient requires finishing the method correctly and explaining why each step matters.`,
    proficient: (s, n) =>
      `Your Job-Fit Technical average is ${s}/100 across ${n} specialty areas — proficient. You demonstrate solid track-specific technical judgment in most scenarios. Further gains come from harder constraints, clearer tradeoff language, and portfolio-ready artifacts.`,
    strong: (s, n) =>
      `Your Job-Fit Technical average is ${s}/100 across ${n} specialty areas — strong. You consistently apply specialty methods with clarity and rigor. This is a primary employability advantage for your track; convert it into visible impact and peer quality standards.`,
  },
  growth_potential: {
    weak: (s, n) =>
      `Your Growth Potential average is ${s}/100 across ${n} competency areas — currently weak. Career foresight, adaptability, and self-directed learning signals were thin. Employers look here for long-term upside; a concrete learning and career routine will change how this category reads.`,
    developing: (s, n) =>
      `Your Growth Potential average is ${s}/100 across ${n} competency areas — developing. You show some adaptability and growth intent, but milestones, self-calibration, and stretch ambition are uneven. A clearer 3–5 year roadmap with measurable skill targets will strengthen this band.`,
    proficient: (s, n) =>
      `Your Growth Potential average is ${s}/100 across ${n} competency areas — proficient. You demonstrate credible learning agility and career orientation. Stretch by mentoring others and linking personal development to team and Vision 2030 outcomes.`,
    strong: (s, n) =>
      `Your Growth Potential average is ${s}/100 across ${n} competency areas — strong. You show high adaptability and intentional growth leadership. Scale that by designing learning paths for others and shaping cohort readiness, not only personal advancement.`,
  },
};

const ANALYSIS_BY_DIMENSION_BAND_AR: Record<DimensionId, Record<BandKey, (score: number, n: number) => string>> = {
  core_professionalism: {
    weak: (s, n) =>
      `معدل الاحتراف الأساسي الخاص بك هو ${s}/100 عبر ${n} من مجالات الكفاءة — حاليًا في النطاق الضعيف. غالبًا ما افتقرت الردود في هذه الفئة إلى التواصل المنظم مع أصحاب المصلحة، أو تسمية المخاطر الأخلاقية، أو العمل الجماعي البناء تحت الضغط. يتوقع أصحاب العمل حكمًا مهنيًا أوضح قبل الوثوق بك في مهام قيادية أو مواجهة العملاء بدون إشراف.`,
    developing: (s, n) =>
      `معدل الاحتراف الأساسي الخاص بك هو ${s}/100 عبر ${n} من مجالات الكفاءة — مستوى قيد التطوير. تظهر لديك عادات مهنية ناشئة، لكن الاتساق يتراجع عندما يتطلب الأمر الأخلاقيات أو حل النزاعات أو الإيجاز التنفيذي. يتطلب الوصول إلى مستوى الكفاءة تحويل اللحظات القوية العرضية إلى معيار تواصل وحكم قابل للتكرار.`,
    proficient: (s, n) =>
      `معدل الاحتراف الأساسي الخاص بك هو ${s}/100 عبر ${n} من مجالات الكفاءة — نطاق الكفاءة. تُظهر عمومًا تواصلًا وأخلاقيات وتعاونًا سليمًا. المكاسب المتبقية تأتي من هيكل تنفيذي أكثر حدة، وتسهيل أكثر هدوءًا للنزاعات، وتقديم نموذج لهذه العادات للزملاء.`,
    strong: (s, n) =>
      `معدل الاحتراف الأساسي الخاص بك هو ${s}/100 عبر ${n} من مجالات الكفاءة — نطاق قوي. تُظهر باستمرار حكمًا مهنيًا ناضجًا، وتواصلًا واضحًا مع أصحاب المصلحة، وشجاعة أخلاقية. هذه إشارة للجاهزية القيادية؛ الخطوة التالية هي وضع المعيار للآخرين، وليس فقط الأداء الجيد بنفسك.`,
  },
  business_digital: {
    weak: (s, n) =>
      `معدل الثقافة الرقمية والتجارية الخاص بك هو ${s}/100 عبر ${n} من مجالات الكفاءة — ضعيف حاليًا. لم تستخدم الإجابات في هذه الفئة البيانات أو المنهجية أو الذكاء الاصطناعي المسؤول أو ضمانات الخصوصية/السيبرانية بشكل كافٍ. وهذا يترك مخاطر توظيفية مادية في بيئات العمل السعودية المعتمدة على التكنولوجيا الرقمية.`,
    developing: (s, n) =>
      `معدل الثقافة الرقمية والتجارية الخاص بك هو ${s}/100 عبر ${n} من مجالات الكفاءة — قيد التطوير. أنت تتفاعل مع المفاهيم الرقمية والتجارية جزئيًا، لكن التوصيات ليست مستندة باستمرار إلى أدلة أو تراعي الامتثال. تعزيز نظافة البيانات وسردها بشكل أوضح سيرفع من هذا النطاق.`,
    proficient: (s, n) =>
      `معدل الثقافة الرقمية والتجارية الخاص بك هو ${s}/100 عبر ${n} من مجالات الكفاءة — كفء. أنت تدمج الإطار التجاري مع الحكم الرقمي القابل للاستخدام معظم الوقت. اسعَ نحو دمج الذكاء الاصطناعي والتحليلات والأمان في عادة تشغيلية واحدة يمكن للمديرين التنفيذيين الوثوق بها.`,
    strong: (s, n) =>
      `معدل الثقافة الرقمية والتجارية الخاص بك هو ${s}/100 عبر ${n} من مجالات الكفاءة — قوي. أنت تظهر حكمًا رقميًا وتجاريًا واثقًا ومسؤولًا يتماشى مع توقعات مكان العمل الحديث. استخدم هذه القوة لتحديد أدلة الفريق وتوجيه الزملاء نحو الممارسة الرقمية الآمنة وعالية التأثير.`,
  },
  job_fit: {
    weak: (s, n) =>
      `معدل الملاءمة الوظيفية الفنية الخاص بك هو ${s}/100 عبر ${n} من مجالات التخصص — ضعيف حاليًا. لم تصمد طريقة المجال أو المصطلحات أو التنفيذ الفني الشامل تحت ضغط السيناريو. هذا هو البعد الأثقل وزنًا لأصحاب العمل في مسارك، لذا يجب أن يكون إعادة البناء التأسيسي هنا هو الأولوية.`,
    developing: (s, n) =>
      `معدل الملاءمة الوظيفية الفنية الخاص بك هو ${s}/100 عبر ${n} من مجالات التخصص — قيد التطوير. تُظهر كفاءة تخصصية جزئية، لكن الردود غالبًا ما تتوقف قبل تقديم مخرجات كاملة ومبررة ومدركة للحالات الاستثنائية. يتطلب الانتقال إلى الكفاءة إنهاء المنهجية بشكل صحيح وشرح سبب أهمية كل خطوة.`,
    proficient: (s, n) =>
      `معدل الملاءمة الوظيفية الفنية الخاص بك هو ${s}/100 عبر ${n} من مجالات التخصص — كفء. تُظهر حكمًا تقنيًا قويًا خاصًا بالمسار في معظم السيناريوهات. تأتي المكاسب الإضافية من قيود أصعب، ولغة مفاضلة أكثر وضوحًا، ونماذج أعمال جاهزة للملف التعريفي.`,
    strong: (s, n) =>
      `معدل الملاءمة الوظيفية الفنية الخاص بك هو ${s}/100 عبر ${n} من مجالات التخصص — قوي. أنت تطبق الأساليب التخصصية باستمرار بوضوح ودقة. هذه ميزة توظيفية أساسية لمسارك؛ حولها إلى تأثير ملموس ومعايير جودة للزملاء.`,
  },
  growth_potential: {
    weak: (s, n) =>
      `معدل إمكانات النمو الخاص بك هو ${s}/100 عبر ${n} من مجالات الكفاءة — ضعيف حاليًا. كانت إشارات الاستشراف الوظيفي والقدرة على التكيف والتعلم الذاتي ضعيفة. يبحث أصحاب العمل هنا عن إمكانات صعودية طويلة الأجل؛ الروتين التعليمي والمهني الملموس سيغير من قراءة هذه الفئة.`,
    developing: (s, n) =>
      `معدل إمكانات النمو الخاص بك هو ${s}/100 عبر ${n} من مجالات الكفاءة — قيد التطوير. تُظهر بعض القدرة على التكيف ونية النمو، لكن المعالم والمعايرة الذاتية والطموح غير متساوية. خريطة طريق أوضح لمدة 3-5 سنوات مع أهداف مهارات قابلة للقياس ستعزز هذا النطاق.`,
    proficient: (s, n) =>
      `معدل إمكانات النمو الخاص بك هو ${s}/100 عبر ${n} من مجالات الكفاءة — كفء. تُظهر مرونة تعليمية وتوجهًا وظيفيًا موثوقًا. اسعَ لتوجيه الآخرين وربط التطوير الشخصي بنتائج الفريق ورؤية 2030.`,
    strong: (s, n) =>
      `معدل إمكانات النمو الخاص بك هو ${s}/100 عبر ${n} من مجالات الكفاءة — قوي. تُظهر قدرة عالية على التكيف وقيادة نمو مقصودة. قم بتوسيع نطاق ذلك من خلال تصميم مسارات تعليمية للآخرين وتشكيل جاهزية المجموعة، وليس فقط التقدم الشخصي.`,
  },
};

const ANALYSIS_BY_DIMENSION_BAND_FR: Record<DimensionId, Record<BandKey, (score: number, n: number) => string>> = {
  core_professionalism: {
    weak: (s, n) =>
      `Votre moyenne de professionnalisme de base est de ${s}/100 sur ${n} domaines de compétences — actuellement faible. Les réponses manquent souvent de communication structurée, d'éthique ou de travail d'équipe sous pression.`,
    developing: (s, n) =>
      `Votre moyenne de professionnalisme de base est de ${s}/100 sur ${n} domaines de compétences — en développement. Vous montrez des habitudes émergentes, mais la cohérence diminue face aux conflits ou à l'éthique.`,
    proficient: (s, n) =>
      `Votre moyenne de professionnalisme de base est de ${s}/100 sur ${n} domaines de compétences — compétent. Vous démontrez une bonne communication et collaboration.`,
    strong: (s, n) =>
      `Votre moyenne de professionnalisme de base est de ${s}/100 sur ${n} domaines de compétences — fort. Vous faites preuve d'un jugement professionnel mature et d'une communication claire.`,
  },
  business_digital: {
    weak: (s, n) =>
      `Votre moyenne en affaires et numérique est de ${s}/100 sur ${n} domaines — actuellement faible. Les réponses sous-utilisent les données et les garanties de confidentialité.`,
    developing: (s, n) =>
      `Votre moyenne en affaires et numérique est de ${s}/100 sur ${n} domaines — en développement. Vous engagez partiellement les concepts, mais l'approche manque de preuves constantes.`,
    proficient: (s, n) =>
      `Votre moyenne en affaires et numérique est de ${s}/100 sur ${n} domaines — compétent. Vous combinez la stratégie d'affaires avec un bon jugement numérique la plupart du temps.`,
    strong: (s, n) =>
      `Votre moyenne en affaires et numérique est de ${s}/100 sur ${n} domaines — fort. Vous montrez un jugement sûr et responsable aligné avec les attentes du marché.`,
  },
  job_fit: {
    weak: (s, n) =>
      `Votre moyenne d'adéquation technique est de ${s}/100 sur ${n} domaines — actuellement faible. L'exécution technique n'a pas résisté sous la pression du scénario.`,
    developing: (s, n) =>
      `Votre moyenne d'adéquation technique est de ${s}/100 sur ${n} domaines — en développement. Vous montrez des compétences partielles, mais vos réponses s'arrêtent souvent avant des livrables complets.`,
    proficient: (s, n) =>
      `Votre moyenne d'adéquation technique est de ${s}/100 sur ${n} domaines — compétent. Vous démontrez un solide jugement technique dans la plupart des scénarios.`,
    strong: (s, n) =>
      `Votre moyenne d'adéquation technique est de ${s}/100 sur ${n} domaines — fort. Vous appliquez systématiquement les méthodes avec clarté et rigueur.`,
  },
  growth_potential: {
    weak: (s, n) =>
      `Votre moyenne de potentiel de croissance est de ${s}/100 sur ${n} domaines — actuellement faible. L'adaptabilité et les signaux d'apprentissage autonome étaient limités.`,
    developing: (s, n) =>
      `Votre moyenne de potentiel de croissance est de ${s}/100 sur ${n} domaines — en développement. Vous montrez une certaine intention de croissance, mais les ambitions sont inégales.`,
    proficient: (s, n) =>
      `Votre moyenne de potentiel de croissance est de ${s}/100 sur ${n} domaines — compétent. Vous démontrez une agilité d'apprentissage et une orientation de carrière crédibles.`,
    strong: (s, n) =>
      `Votre moyenne de potentiel de croissance est de ${s}/100 sur ${n} domaines — fort. Vous montrez une grande adaptabilité et un leadership de croissance intentionnel.`,
  },
};

function normalizeBandKey(band: string | null | undefined): BandKey {
  const b = (band || "").toLowerCase().trim();
  if (b === "strong" || b === "proficient" || b === "developing" || b === "weak") return b;
  return "weak";
}

export function formatBandLabel(band: string | null | undefined): string {
  const key = normalizeBandKey(band);
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/** Public helper — development tips for one dimension from that dimension's band only. */
export function developmentSuggestionsForDimension(
  dimensionId: DimensionId,
  band: string | null | undefined,
): string[] {
  const tips = DEVELOPMENT_BY_DIMENSION_BAND[dimensionId]?.[normalizeBandKey(band)];
  return tips ? [...tips] : [...DEVELOPMENT_BY_DIMENSION_BAND.core_professionalism.weak];
}

function cleanBullet(text: string): string | null {
  const t = String(text || "").trim();
  if (!t || t === "-") return null;
  // Drop bullets that clearly name a single module code / "Competency Area N".
  if (/\bM\d{1,2}\b/i.test(t) || /competency area\s+\d+/i.test(t)) return null;
  return t;
}

function synthesizeBullets(
  modules: DimensionChapterModuleInput[],
  field: "strengths" | "improvements",
  preferHigherScores: boolean,
  limit = 4,
): string[] {
  if (modules.length === 0) return [];
  const sorted = [...modules].sort((a, b) =>
    preferHigherScores ? b.score - a.score : a.score - b.score,
  );
  const half = Math.max(1, Math.ceil(sorted.length / 2));
  const pool = sorted.slice(0, half);
  const out: string[] = [];
  for (const m of pool) {
    for (const raw of m[field] || []) {
      const cleaned = cleanBullet(raw);
      if (!cleaned) continue;
      pushDistinctSentence(out, cleaned);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

export function buildDimensionChapters(
  results: DimensionChapterModuleInput[],
  dimensions: DimensionScore[],
): DimensionChapter[] {
  const chapters: DimensionChapter[] = [];

  for (const dim of DIMENSIONS) {
    const scoreData = dimensions.find((d) => d.dimension === dim.id);
    const modulesInDim = results.filter((r) => normalizeDimensionId(r.dimension) === dim.id);
    // ISC-QA-006: always use actual result rows — never scoreData.moduleCount which
    // may reflect a partial scoring run (retry recovered fewer items). This keeps
    // UI cards, narrative, PDF and certificate all on the same number.
    const moduleCount = modulesInDim.length;
    const score =
      scoreData?.score ??
      (modulesInDim.length > 0
        ? Math.round(modulesInDim.reduce((a, m) => a + m.score, 0) / modulesInDim.length)
        : null);
    const band = scoreData?.band ?? (score != null ? normalizeBandKey(null) : null);
    const bandKey = normalizeBandKey(band);

    const chapter: DimensionChapter = {
      id: dim.id,
      label: scoreData?.label ?? dim.label,
      labelAr: scoreData?.labelAr ?? dim.labelAr,
      weight: scoreData?.weight ?? dim.weight,
      score,
      band: bandKey,
      passed: score != null ? score >= 50 : null,
      moduleCount,
      definition: dim.blurb || "Evaluated dimension of employability capability.",
      narrative: [],
      narrativeAr: [],
      narrativeFr: [],
      development: developmentSuggestionsForDimension(dim.id, bandKey),
      developmentAr: DEVELOPMENT_BY_DIMENSION_BAND_AR[dim.id]?.[bandKey] || [],
      developmentFr: DEVELOPMENT_BY_DIMENSION_BAND_FR[dim.id]?.[bandKey] || [],
      strengths: [],
      improvements: [],
      contributingModules: modulesInDim.map((m) => ({
        moduleCode: m.moduleCode,
        moduleTitle: m.moduleTitle,
        score: m.score,
        band: m.band,
      })),
    };

    const n = Math.max(moduleCount, modulesInDim.length);
    const scoreNum = Math.round(score ?? 0);
    const analysisFn = ANALYSIS_BY_DIMENSION_BAND[dim.id][bandKey];
    chapter.narrative.push(analysisFn(scoreNum, n || 1));
    const analysisFnAr = ANALYSIS_BY_DIMENSION_BAND_AR[dim.id]?.[bandKey];
    if (analysisFnAr) chapter.narrativeAr.push(analysisFnAr(scoreNum, n || 1));
    const analysisFnFr = ANALYSIS_BY_DIMENSION_BAND_FR[dim.id]?.[bandKey];
    if (analysisFnFr) chapter.narrativeFr.push(analysisFnFr(scoreNum, n || 1));

    if (modulesInDim.length > 0) {
      const mean =
        modulesInDim.reduce((a, m) => a + m.score, 0) / modulesInDim.length;
      const above = modulesInDim.filter((m) => m.score >= mean).length;
      const below = modulesInDim.length - above;
      pushDistinctSentence(
        chapter.narrative,
        above >= below
          ? `Within this category, more of your responses sat at or above your category average — the main lift comes from converting remaining soft spots into the same standard.`
          : `Within this category, a majority of responses sat below your category average — the score is being pulled down by inconsistent depth across the set, not by a single isolated miss.`,
      );
      pushDistinctSentence(
        chapter.narrativeAr,
        above >= below
          ? `ضمن هذه الفئة، معظم إجاباتك كانت عند متوسط الفئة أو أعلى منه — التحسن الرئيسي يأتي من رفع مستوى النقاط الضعيفة المتبقية لتتوافق مع نفس المعيار.`
          : `ضمن هذه الفئة، أغلبية الإجابات كانت أقل من متوسط الفئة — النتيجة تتأثر بعدم الاتساق عبر المجموعة، وليس بخطأ فردي معزول.`
      );
      pushDistinctSentence(
        chapter.narrativeFr,
        above >= below
          ? `Dans cette catégorie, la plupart de vos réponses se situent à la moyenne ou au-dessus — l'amélioration principale viendra du renforcement des points faibles restants.`
          : `Dans cette catégorie, une majorité de réponses se situent en dessous de la moyenne — le score est tiré vers le bas par un manque de cohérence, et non par un échec isolé.`
      );

      chapter.strengths = synthesizeBullets(modulesInDim, "strengths", true, 4);
      chapter.improvements = synthesizeBullets(modulesInDim, "improvements", false, 4);
    }

    if (chapter.strengths.length === 0) {
      chapter.strengths =
        bandKey === "weak" || bandKey === "developing"
          ? [`Emerging engagement with ${chapter.label} scenarios under assessment conditions.`]
          : [`Consistent demonstration of ${chapter.label} judgment across the category.`];
    }
    if (chapter.improvements.length === 0) {
      chapter.improvements = chapter.development.slice(0, 2);
    }

    chapters.push(chapter);
  }

  return chapters;
}

function normalizeDimensionId(raw: string): DimensionId | null {
  const key = raw.trim().toLowerCase().replace(/[\s/-]+/g, "_");
  const aliases: Record<string, DimensionId> = {
    core_professionalism: "core_professionalism",
    business_digital: "business_digital",
    business_digital_literacy: "business_digital",
    job_fit: "job_fit",
    job_fit_technical: "job_fit",
    growth_potential: "growth_potential",
  };
  return aliases[key] ?? null;
}
