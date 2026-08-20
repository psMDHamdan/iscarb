/**
 * R2CArtifact entity mapper — converts Prisma R2CArtifact to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface R2CArtifactEntity {
  id: string;
  studentId?: string | null;
  requirement: string;
  titleEn: string;
  titleAr: string;
  prismaSchema: string;
  mermaidDiagram: string;
  dockerCompose: string;
  testsCode: string;
  stack?: string | null;
  model?: string | null;
  createdAt: Date;
}

export const r2CartifactMapper: RdfMapper<R2CArtifactEntity> = {
  entityType: "R2CArtifact",
  classUri: classUri("R2CArtifact"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("R2CArtifact", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("R2CArtifact")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    if (entity.studentId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:requirement", entity.requirement, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:titleEn", entity.titleEn, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:titleAr", entity.titleAr, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:prismaSchema", entity.prismaSchema, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:mermaidDiagram", entity.mermaidDiagram, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:dockerCompose", entity.dockerCompose, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:testsCode", entity.testsCode, "xsd:string"));
    if (entity.stack != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:stack", entity.stack, "xsd:string"));
    }
    if (entity.model != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:model", entity.model, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
