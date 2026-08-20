/**
 * QTI 2.1 / 3.0 Assessment Packaging Engine.
 * ===========================================================================
 * Generates IMS Content Packaging v1.1 + IMS QTI 2.1 compliant assessment
 * ZIP archives for Canvas, Blackboard Learn, and Moodle LMS engines.
 */
import JSZip from "jszip";

export interface QtiItemOption {
  id?: string;
  text: string;
  isCorrect?: boolean;
}

export interface QtiReadinessItem {
  id?: string;
  slideNo: number;
  stem: string;
  options: unknown; // QtiItemOption[] | string[] | Record<string, unknown>[]
  correctIndex: number;
  difficulty?: string;
  rationale?: string | null;
  misconception?: string | null;
  cloId?: string;
  sourceLocator?: string | null;
}

export interface QtiPackageParams {
  packageVersion: {
    id: string;
    version: number;
    manifestHash?: string | null;
  };
  project: {
    id: string;
    title?: string | null;
    courseProfile?: {
      courseCode?: string;
      title?: string;
      specialty?: string;
    } | null;
    slideArtifacts?: {
      slideNo: number;
      contentJson?: unknown;
    }[];
  };
  readinessItems?: QtiReadinessItem[];
  profileHash?: string;
}

export interface QtiPackageResult {
  zipBuffer: Buffer;
  filename: string;
  manifestXml: string;
  testXml: string;
  itemXmls: Record<string, string>;
}

export function escapeXml(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeIdentifier(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export interface NormalizedOption {
  identifier: string; // Choice_A, Choice_B, Choice_C, Choice_D
  text: string;
  isCorrect: boolean;
}

export interface NormalizedQtiItem {
  id: string;
  cleanId: string;
  slideNo: number;
  stem: string;
  options: NormalizedOption[];
  correctIdentifier: string;
  difficulty: string;
  rationale: string;
  misconception?: string;
}

export function normalizeQtiItems(
  items: QtiReadinessItem[] | undefined,
  artifacts?: { slideNo: number; contentJson?: unknown }[]
): NormalizedQtiItem[] {
  let sourceItems = items ? [...items] : [];

  // Fallback synthesis if no readiness items exist
  if (sourceItems.length === 0 && artifacts && artifacts.length > 0) {
    const targetSlides = [4, 10, 15, 20];
    sourceItems = targetSlides.map((slideNo) => {
      const art = artifacts.find((a) => a.slideNo === slideNo) || artifacts[0];
      const content = (art?.contentJson ?? {}) as any;
      const title = content.title || `Slide ${slideNo}`;
      return {
        id: `synth-${slideNo}`,
        slideNo,
        stem: `Regarding ${title}: Which decision or technique best applies to this learning outcome?`,
        options: [
          { id: "A", text: `Apply the core mechanism taught in ${title}`, isCorrect: true },
          { id: "B", text: "Ignore system constraints and increase dimensionality", isCorrect: false },
          { id: "C", text: "Use arbitrary assumptions without empirical evidence", isCorrect: false },
          { id: "D", text: "Bypass variance analysis and select random features", isCorrect: false },
        ],
        correctIndex: 0,
        difficulty: slideNo >= 15 ? "hard" : "medium",
        rationale: `Applying the core mechanism of ${title} correctly addresses the problem constraints.`,
        misconception: "Confusing dimensional reduction with feature deletion.",
      };
    });
  }

  // Deduplicate by slideNo (keep latest item)
  const bySlide = new Map<number, QtiReadinessItem>();
  for (const it of sourceItems) {
    bySlide.set(it.slideNo, it);
  }
  const deduplicated = [...bySlide.values()].sort((a, b) => a.slideNo - b.slideNo);

  const choiceIds = ["Choice_A", "Choice_B", "Choice_C", "Choice_D"];

  return deduplicated.map((item, idx) => {
    let rawOptions: any[] = [];
    if (Array.isArray(item.options)) {
      rawOptions = item.options;
    } else if (typeof item.options === "string") {
      try {
        const parsed = JSON.parse(item.options);
        if (Array.isArray(parsed)) rawOptions = parsed;
      } catch {
        rawOptions = [];
      }
    }

    let correctIdx = typeof item.correctIndex === "number" && !isNaN(item.correctIndex) ? item.correctIndex : 0;
    if (correctIdx < 0 || correctIdx > 3) {
      // Try to find if any raw option is marked isCorrect
      const foundIdx = rawOptions.findIndex((opt) => opt && typeof opt === "object" && opt.isCorrect === true);
      correctIdx = foundIdx >= 0 && foundIdx < 4 ? foundIdx : 0;
    }

    const normalizedOpts: NormalizedOption[] = [];
    for (let i = 0; i < 4; i++) {
      const raw = rawOptions[i];
      let text = `Option ${String.fromCharCode(65 + i)}`;

      if (typeof raw === "string") {
        text = raw;
      } else if (raw && typeof raw === "object") {
        text = (raw as any).text || (raw as any).label || (raw as any).value || text;
      }

      normalizedOpts.push({
        identifier: choiceIds[i],
        text,
        isCorrect: i === correctIdx,
      });
    }

    const cleanId = sanitizeIdentifier(item.id || `item_${idx + 1}`);

    return {
      id: item.id || `item_${idx + 1}`,
      cleanId,
      slideNo: item.slideNo,
      stem: item.stem || `Slide ${item.slideNo} Readiness Check`,
      options: normalizedOpts,
      correctIdentifier: choiceIds[correctIdx],
      difficulty: item.difficulty || "medium",
      rationale: item.rationale || "Faculty rationale provided for this assessment check.",
      misconception: item.misconception || undefined,
    };
  });
}

export function generateItemXml(item: NormalizedQtiItem): string {
  const optionsXml = item.options
    .map((opt) => `      <simpleChoice identifier="${opt.identifier}">${escapeXml(opt.text)}</simpleChoice>`)
    .join("\n");

  const misconceptionXml = item.misconception
    ? `\n    <p><strong>Targeted Misconception:</strong> ${escapeXml(item.misconception)}</p>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/imsqti_v2p1.xsd"
  identifier="item_${item.cleanId}"
  title="Slide ${item.slideNo} Readiness Check"
  adaptive="false"
  timeDependent="false">
  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="identifier">
    <correctResponse>
      <value>${item.correctIdentifier}</value>
    </correctResponse>
  </responseDeclaration>
  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
    <defaultValue>
      <value>0</value>
    </defaultValue>
  </outcomeDeclaration>
  <outcomeDeclaration identifier="FEEDBACK" cardinality="single" baseType="identifier"/>
  <itemBody>
    <p class="question-stem">${escapeXml(item.stem)}</p>
    <choiceInteraction responseIdentifier="RESPONSE" shuffle="false" maxChoices="1">
      <prompt>${escapeXml(item.stem)}</prompt>
${optionsXml}
    </choiceInteraction>
  </itemBody>
  <responseProcessing template="http://www.imsglobal.org/question/qti_v2p1/rptemplates/match_correct"/>
  <modalFeedback outcomeIdentifier="FEEDBACK" identifier="FEEDBACK_MODAL" showHide="show" title="Faculty Rationale">
    <p>${escapeXml(item.rationale)}</p>${misconceptionXml}
  </modalFeedback>
</assessmentItem>`;
}

export function generateAssessmentTestXml(
  versionId: string,
  courseCode: string,
  lectureTitle: string,
  items: NormalizedQtiItem[]
): string {
  const itemRefs = items
    .map(
      (item) =>
        `      <assessmentItemRef identifier="ref_item_${item.cleanId}" href="items/item_${item.cleanId}.xml"/>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<assessmentTest xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/imsqti_v2p1.xsd"
  identifier="test_${sanitizeIdentifier(versionId)}"
  title="${escapeXml(courseCode)}: ${escapeXml(lectureTitle)} Readiness Assessment">
  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float"/>
  <testPart identifier="testPart_1" navigationMode="nonlinear" submissionMode="individual">
    <assessmentSection identifier="section_1" title="Readiness Checks" visible="true">
${itemRefs}
    </assessmentSection>
  </testPart>
</assessmentTest>`;
}

export function generateManifestXml(
  packageId: string,
  courseCode: string,
  lectureTitle: string,
  items: NormalizedQtiItem[]
): string {
  const testFiles = items
    .map((item) => `      <file href="items/item_${item.cleanId}.xml"/>`)
    .join("\n");

  const itemResources = items
    .map(
      (item) => `    <resource identifier="resource_item_${item.cleanId}" type="imsqti_item_xmlv2p1" href="items/item_${item.cleanId}.xml">
      <file href="items/item_${item.cleanId}.xml"/>
    </resource>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="MANIFEST-${sanitizeIdentifier(packageId)}"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:imsmd="http://www.imsglobal.org/xsd/imsmd_v1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 http://www.imsglobal.org/xsd/imscp_v1p1.xsd http://www.imsglobal.org/xsd/imsmd_v1p2 http://www.imsglobal.org/xsd/imsmd_v1p2p2.xsd http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/imsqti_v2p1.xsd">
  <metadata>
    <schema>IMS QTI</schema>
    <schemaversion>2.1</schemaversion>
    <imsmd:lom>
      <imsmd:general>
        <imsmd:title>
          <imsmd:langstring xml:lang="en">${escapeXml(courseCode)} - ${escapeXml(lectureTitle)} Assessments</imsmd:langstring>
        </imsmd:title>
        <imsmd:description>
          <imsmd:langstring xml:lang="en">Formative and Summative S20 Readiness Checks for ${escapeXml(courseCode)}</imsmd:langstring>
        </imsmd:description>
      </imsmd:general>
    </imsmd:lom>
  </metadata>
  <organizations/>
  <resources>
    <resource identifier="assessment_test_01" type="imsqti_test_xmlv2p1" href="assessment.xml">
      <file href="assessment.xml"/>
${testFiles}
    </resource>
${itemResources}
  </resources>
</manifest>`;
}

export async function generateQtiPackage(params: QtiPackageParams): Promise<QtiPackageResult> {
  const { packageVersion, project, readinessItems } = params;
  const courseCode = project.courseProfile?.courseCode || "course";
  const sanitizedCourseCode = sanitizeIdentifier(courseCode) || "course";
  const lectureTitle = project.courseProfile?.title || project.title || "Lecture Assessment";

  const normalizedItems = normalizeQtiItems(readinessItems, project.slideArtifacts);

  const manifestXml = generateManifestXml(packageVersion.id, courseCode, lectureTitle, normalizedItems);
  const testXml = generateAssessmentTestXml(packageVersion.id, courseCode, lectureTitle, normalizedItems);

  const itemXmls: Record<string, string> = {};
  const zip = new JSZip();

  zip.file("imsmanifest.xml", manifestXml);
  zip.file("assessment.xml", testXml);

  for (const item of normalizedItems) {
    const itemXml = generateItemXml(item);
    itemXmls[item.cleanId] = itemXml;
    zip.file(`items/item_${item.cleanId}.xml`, itemXml);
  }

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const filename = `${sanitizedCourseCode}-qti-assessment.zip`;

  return {
    zipBuffer,
    filename,
    manifestXml,
    testXml,
    itemXmls,
  };
}
