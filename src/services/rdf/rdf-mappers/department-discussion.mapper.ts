/**
 * DepartmentDiscussion entity mapper — converts Prisma DepartmentDiscussion to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface DepartmentDiscussionEntity {
  id: string;
  departmentId?: string | null;
  authorId: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  universityId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const departmentDiscussionMapper: RdfMapper<DepartmentDiscussionEntity> = {
  entityType: "DepartmentDiscussion",
  classUri: classUri("DepartmentDiscussion"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("DepartmentDiscussion", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("DepartmentDiscussion")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    if (entity.departmentId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:departmentId", entity.departmentId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:authorId", entity.authorId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:pinned", entity.pinned, "xsd:boolean"));
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
