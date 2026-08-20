/**
 * MarketplaceListing entity mapper — converts Prisma MarketplaceListing to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface MarketplaceListingEntity {
  id: string;
  type: string;
  title: string;
  titleAr?: string | null;
  description: string;
  descriptionAr?: string | null;
  providerId?: string | null;
  providerType?: string | null;
  providerName?: string | null;
  price?: number | null;
  currency: string;
  rating: number;
  reviewCount: number;
  imageUrl?: string | null;
  url?: string | null;
  active: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const marketplaceListingMapper: RdfMapper<MarketplaceListingEntity> = {
  entityType: "MarketplaceListing",
  classUri: classUri("MarketplaceListing"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("MarketplaceListing", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("MarketplaceListing")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.titleAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:titleAr", entity.titleAr, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    if (entity.descriptionAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:descriptionAr", entity.descriptionAr, "xsd:string"));
    }
    if (entity.providerId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:providerId", entity.providerId, "xsd:string"));
    }
    if (entity.providerType != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:providerType", entity.providerType, "xsd:string"));
    }
    if (entity.providerName != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:providerName", entity.providerName, "xsd:string"));
    }
    if (entity.price != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:price", entity.price, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:currency", entity.currency, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:rating", entity.rating, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:reviewCount", entity.reviewCount, "xsd:decimal"));
    if (entity.imageUrl != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:imageUrl", entity.imageUrl, "xsd:string"));
    }
    if (entity.url != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:url", entity.url, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:active", entity.active, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:featured", entity.featured, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
