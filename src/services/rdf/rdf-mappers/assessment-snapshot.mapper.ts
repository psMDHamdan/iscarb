import type { AssessmentSnapshot } from "@prisma/client";
import { instanceUri } from "@/config/rdf";
import type { RdfMappingResult } from "./index";

export function toTriples(
  data: AssessmentSnapshot,
  universityCode: string,
): RdfMappingResult {
  const triples: Array<{ s: string; p: string; o: string | { value: string; type: string } }> = [];
  const graph = `<http://iscarb.sa/graphs/university/${universityCode}>`;
  const subject = instanceUri("AssessmentSnapshot", universityCode, data.id);
  const studentUri = instanceUri("Student", universityCode, data.studentId);

  // Parse the snapshot JSON to extract semantic details
  let snapshotPayload: any = {};
  try {
    snapshotPayload = JSON.parse(data.dataJson);
  } catch (e) {
    // Graceful fallback
  }

  // Base Triples
  triples.push({
    s: subject,
    p: "rdf:type",
    o: "<http://iscarb.sa/ontology/AssessmentSnapshot>",
  });

  triples.push({
    s: subject,
    p: "<http://iscarb.sa/ontology/belongsToStudent>",
    o: studentUri,
  });

  triples.push({
    s: subject,
    p: "<http://iscarb.sa/ontology/createdAt>",
    o: { value: data.createdAt.toISOString(), type: "xsd:dateTime" },
  });

  // Include semantic score data if available in the snapshot
  if (snapshotPayload?.profile?.composite !== undefined) {
    triples.push({
      s: subject,
      p: "<http://iscarb.sa/ontology/hasEmployabilityScore>",
      o: { value: String(snapshotPayload.profile.composite), type: "xsd:float" },
    });
  }

  if (snapshotPayload?.profile?.band) {
    triples.push({
      s: subject,
      p: "<http://iscarb.sa/ontology/hasEmployabilityBand>",
      o: { value: snapshotPayload.profile.band, type: "xsd:string" },
    });
  }

  return { graph, triples };
}
