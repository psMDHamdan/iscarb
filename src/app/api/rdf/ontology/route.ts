import { NextResponse } from "next/server";
import { ISCARB_CONTEXT } from "@/lib/rdf/jsonld-context";
import { jsonldResponse } from "@/lib/rdf/jsonld-helpers";

export async function GET() {
  try {
    const ontology = {
      "@context": ISCARB_CONTEXT,
      "@id": ISCARB_CONTEXT.iscarb,
      "@type": "owl:Ontology",
      "rdfs:label": "iSCARB Higher Education Ontology",
      "rdfs:comment": "Core ontology definitions for the iSCARB knowledge graph, spanning academic, administrative, and student lifecycle domains."
    };

    return jsonldResponse(ontology);
  } catch (error) {
    console.error("RDF Ontology Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
