/**
 * ResearchTeam entity mapper — converts Prisma ResearchTeam to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ResearchTeamEntity {
  id: string;
  name: string;
  description?: string | null;
  principalInvestigatorId: string;
  memberIds?: string | null;
  organizationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const researchTeamMapper: RdfMapper<ResearchTeamEntity> = {
  entityType: "ResearchTeam",
  classUri: classUri("ResearchTeam"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ResearchTeam", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ResearchTeam")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:principalInvestigatorId", entity.principalInvestigatorId, "xsd:string"));
    if (entity.memberIds != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:memberIds", entity.memberIds, "xsd:string"));
    }
    if (entity.organizationId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
