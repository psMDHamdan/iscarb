/**
 * Placement entity mapper — converts Prisma Placement to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface PlacementEntity {
  id: string;
  studentId: string;
  employerId?: string | null;
  employer?: string | null;
  position?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  employmentType?: string | null;
  location?: string | null;
  salary?: number | null;
}

export const placementMapper: RdfMapper<PlacementEntity> = {
  entityType: "Placement",
  classUri: classUri("Placement"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Placement", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Placement")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    if (entity.employerId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:employerId", entity.employerId, "xsd:string"));
    }
    if (entity.employer != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:employer", entity.employer, "xsd:string"));
    }
    if (entity.position != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:position", entity.position, "xsd:string"));
    }
    if (entity.startDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:startDate", entity.startDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.endDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:endDate", entity.endDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.employmentType != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:employmentType", entity.employmentType, "xsd:string"));
    }
    if (entity.location != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:location", entity.location, "xsd:string"));
    }
    if (entity.salary != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:salary", entity.salary, "xsd:decimal"));
    }

    return { triples, graph };
  },
};
