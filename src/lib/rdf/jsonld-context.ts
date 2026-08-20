import { rdfConfig } from "@/config/rdf";

/**
 * Shared JSON-LD @context for all iSCARB RDF responses.
 * Maps standard prefixes and the core ontology namespace.
 */
export const ISCARB_CONTEXT = {
  "@vocab": rdfConfig.namespaces.iscarb,
  iscarb: rdfConfig.namespaces.iscarb,
  iscarbInst: rdfConfig.namespaces.iscarbInst,
  iscarbNs: rdfConfig.namespaces.iscarbNs,
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  rdfs: "http://www.w3.org/2000/01/rdf-schema#",
  xsd: "http://www.w3.org/2001/XMLSchema#",
  schema: "http://schema.org/",
  id: "@id",
  type: "@type",
};

/**
 * Shared base definition for an entity
 */
export interface JsonLdEntity {
  "@context"?: typeof ISCARB_CONTEXT;
  id: string;
  type: string | string[];
  [key: string]: any;
}
