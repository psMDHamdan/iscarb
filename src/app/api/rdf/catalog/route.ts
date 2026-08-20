import { NextRequest, NextResponse } from "next/server";
import { getEntityTypes } from "@/services/rdf/rdf-mappers";
import { buildBaseUrl, jsonldResponse } from "@/lib/rdf/jsonld-helpers";

export async function GET(req: NextRequest) {
  try {
    const baseUrl = buildBaseUrl(req);
    const entityTypes = getEntityTypes();
    
    const catalog = {
      "@context": {
        "dcat": "http://www.w3.org/ns/dcat#",
        "dcterms": "http://purl.org/dc/terms/",
        "schema": "http://schema.org/"
      },
      "@id": `${baseUrl}/api/rdf/catalog`,
      "@type": "dcat:Catalog",
      "dcterms:title": "iSCARB Triple Store & JSON-LD API Catalog",
      "dcterms:description": "Provides semantic access to the iSCARB application knowledge graph.",
      "schema:url": baseUrl,
      "dcat:dataset": entityTypes.map((type) => {
        // Simple kebab casing for generic endpoints
        const endpoint = type.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        return {
          "@type": "dcat:Dataset",
          "dcterms:title": type,
          "dcat:distribution": {
            "@type": "dcat:Distribution",
            "dcat:accessURL": `${baseUrl}/api/rdf/${endpoint}/[id]`,
            "dcterms:format": "application/ld+json"
          }
        };
      })
    };

    return jsonldResponse(catalog);
  } catch (error) {
    console.error("RDF Catalog Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
