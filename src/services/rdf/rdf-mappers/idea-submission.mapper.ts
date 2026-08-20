/**
 * IdeaSubmission entity mapper — converts Prisma IdeaSubmission to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface IdeaSubmissionEntity {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  submittedBy: string;
  votes: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ideaSubmissionMapper: RdfMapper<IdeaSubmissionEntity> = {
  entityType: "IdeaSubmission",
  classUri: classUri("IdeaSubmission"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("IdeaSubmission", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("IdeaSubmission")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:submittedBy", entity.submittedBy, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:votes", entity.votes, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
