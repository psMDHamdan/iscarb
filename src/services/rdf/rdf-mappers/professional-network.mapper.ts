/**
 * ProfessionalNetwork entity mapper — converts Prisma ProfessionalNetwork to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ProfessionalNetworkEntity {
  id: string;
  studentId: string;
  contactId?: string | null;
  contactName: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactRole?: string | null;
  company?: string | null;
  industry?: string | null;
  connectionType: string;
  relationshipStatus: string;
  linkedinUrl?: string | null;
  notes?: string | null;
  lastInteraction?: Date | null;
  universityId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const professionalNetworkMapper: RdfMapper<ProfessionalNetworkEntity> = {
  entityType: "ProfessionalNetwork",
  classUri: classUri("ProfessionalNetwork"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ProfessionalNetwork", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ProfessionalNetwork")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    if (entity.contactId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:contactId", entity.contactId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:contactName", entity.contactName, "xsd:string"));
    if (entity.contactEmail != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:contactEmail", entity.contactEmail, "xsd:string"));
    }
    if (entity.contactPhone != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:contactPhone", entity.contactPhone, "xsd:string"));
    }
    if (entity.contactRole != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:contactRole", entity.contactRole, "xsd:string"));
    }
    if (entity.company != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:company", entity.company, "xsd:string"));
    }
    if (entity.industry != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:industry", entity.industry, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:connectionType", entity.connectionType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:relationshipStatus", entity.relationshipStatus, "xsd:string"));
    if (entity.linkedinUrl != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:linkedinUrl", entity.linkedinUrl, "xsd:string"));
    }
    if (entity.notes != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:notes", entity.notes, "xsd:string"));
    }
    if (entity.lastInteraction) {
      triples.push(rdfLiteralTriple(uri, "iscarb:lastInteraction", entity.lastInteraction.toISOString(), "xsd:dateTime"));
    }
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
