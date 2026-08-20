import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildBaseUrl, jsonldResponse } from "@/lib/rdf/jsonld-helpers";
import { ISCARB_CONTEXT } from "@/lib/rdf/jsonld-context";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orgId = params.id;
    const baseUrl = buildBaseUrl(req);
    
    // Fetch org with basic relations (paginated/limited for safety)
    const org = await db.organization.findUnique({
      where: { id: orgId },
      include: {
        users: { take: 10 },
        teams: { take: 10 },
      }
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const graph = {
      "@context": ISCARB_CONTEXT,
      "@id": `${baseUrl}/api/rdf/organization/${org.id}/graph`,
      "@type": "schema:Dataset",
      "schema:name": `Knowledge Graph for ${org.name}`,
      "schema:about": { "@id": `${baseUrl}/api/rdf/organization/${org.id}` },
      "@graph": [
        {
          "@id": `${baseUrl}/api/rdf/organization/${org.id}`,
          "@type": "iscarb:Organization",
          "iscarb:name": org.name,
          "iscarb:hasMember": org.users.map(u => ({ "@id": `${baseUrl}/api/rdf/user/${u.id}` })),
          "iscarb:hasTeam": org.teams.map(t => ({ "@id": `${baseUrl}/api/rdf/team/${t.id}` }))
        }
      ]
    };

    return jsonldResponse(graph);
  } catch (error) {
    console.error("RDF Org Graph Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
