/**
 * XML & QTI Helper Utilities.
 * ===========================
 * Sanitization and formatting for IMS QTI 2.1/3.0 XML and IMS Content Packages.
 */

/**
 * Escapes XML special characters for safe inclusion in XML elements and attributes.
 */
export function escapeXml(unsafe?: string | null): string {
  if (!unsafe || typeof unsafe !== "string") return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Sanitizes an identifier to match NCName syntax required for XML and QTI IDs.
 */
export function sanitizeQtiIdentifier(rawId: string): string {
  if (!rawId) return "item_default";
  // Replace invalid characters with underscores and ensure starts with letter or underscore
  let sanitized = rawId.replace(/[^a-zA-Z0-9_-]/g, "_");
  if (!/^[a-zA-Z_]/.test(sanitized)) {
    sanitized = `id_${sanitized}`;
  }
  return sanitized;
}

/**
 * Generates an IMS QTI 2.1 assessmentItem XML string.
 */
export function generateQtiItemXml(params: {
  itemId: string;
  title: string;
  stem: string;
  options: Array<{ id: "A" | "B" | "C" | "D"; text: string; isCorrect?: boolean }>;
  correctOptionId: "A" | "B" | "C" | "D";
  instructorRationale?: string;
  misconceptionDiagnosis?: string;
}): string {
  const { itemId, title, stem, options, correctOptionId, instructorRationale, misconceptionDiagnosis } = params;
  const safeId = sanitizeQtiIdentifier(itemId);
  const correctChoiceId = `Choice_${correctOptionId}`;

  const choicesXml = options
    .map(
      (opt) =>
        `      <simpleChoice identifier="Choice_${opt.id}">${escapeXml(opt.text)}</simpleChoice>`
    )
    .join("\n");

  const modalFeedbackXml = instructorRationale
    ? `  <modalFeedback outcomeIdentifier="FEEDBACK" identifier="FEEDBACK_MODAL" showHide="show" title="Pedagogical Rationale">
    <p>${escapeXml(instructorRationale)}</p>
    ${misconceptionDiagnosis ? `<p><strong>Targeted Misconception:</strong> ${escapeXml(misconceptionDiagnosis)}</p>` : ""}
  </modalFeedback>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_v2p1.xsd"
                identifier="${safeId}"
                title="${escapeXml(title)}"
                adaptive="false"
                timeDependent="false">
  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="identifier">
    <correctResponse>
      <value>${correctChoiceId}</value>
    </correctResponse>
    <mapping defaultValue="0">
      <mapEntry mapKey="${correctChoiceId}" mappedValue="1.0" />
    </mapping>
  </responseDeclaration>
  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
    <defaultValue>
      <value>0</value>
    </defaultValue>
  </outcomeDeclaration>
  <outcomeDeclaration identifier="FEEDBACK" cardinality="single" baseType="identifier" />
  <itemBody>
    <p class="stem">${escapeXml(stem)}</p>
    <choiceInteraction responseIdentifier="RESPONSE" shuffle="false" maxChoices="1">
${choicesXml}
    </choiceInteraction>
  </itemBody>
  <responseProcessing template="http://www.imsglobal.org/question/qti_v2p1/rptemplates/match_correct" />
${modalFeedbackXml}
</assessmentItem>`.trim();
}

/**
 * Generates an IMS QTI 2.1 assessmentTest XML string.
 */
export function generateQtiTestXml(params: {
  testId: string;
  title: string;
  itemIds: string[];
}): string {
  const { testId, title, itemIds } = params;
  const safeTestId = sanitizeQtiIdentifier(testId);

  const itemRefsXml = itemIds
    .map(
      (id) =>
        `        <assessmentItemRef identifier="${sanitizeQtiIdentifier(id)}" href="items/item_${sanitizeQtiIdentifier(id)}.xml" />`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<assessmentTest xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_v2p1.xsd"
                identifier="${safeTestId}"
                title="${escapeXml(title)}">
  <testPart identifier="part_1" navigationMode="nonlinear" submissionMode="individual">
    <assessmentSection identifier="section_main" title="Main Section" visible="true">
${itemRefsXml}
    </assessmentSection>
  </testPart>
</assessmentTest>`.trim();
}

/**
 * Generates an IMS Content Packaging imsmanifest.xml string.
 */
export function generateImsManifestXml(params: {
  manifestId: string;
  title: string;
  testId: string;
  itemIds: string[];
}): string {
  const { manifestId, title, testId, itemIds } = params;
  const safeManifestId = sanitizeQtiIdentifier(manifestId);
  const safeTestId = sanitizeQtiIdentifier(testId);

  const itemResourcesXml = itemIds
    .map(
      (id) =>
        `    <resource identifier="res_${sanitizeQtiIdentifier(id)}" type="imsqti_item_xmlv2p1" href="items/item_${sanitizeQtiIdentifier(id)}.xml">
      <file href="items/item_${sanitizeQtiIdentifier(id)}.xml" />
    </resource>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 http://www.imsglobal.org/xsd/imscp_v1p1.xsd"
          identifier="${safeManifestId}">
  <metadata>
    <schema>IMS Content</schema>
    <schemaversion>1.1.4</schemaversion>
  </metadata>
  <organizations default="org_default">
    <organization identifier="org_default" structure="hierarchical">
      <title>${escapeXml(title)}</title>
      <item identifier="item_test_root" identifierref="res_test">
        <title>${escapeXml(title)} Assessment</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res_test" type="imsqti_test_xmlv2p1" href="assessment.xml">
      <file href="assessment.xml" />
    </resource>
${itemResourcesXml}
  </resources>
</manifest>`.trim();
}
