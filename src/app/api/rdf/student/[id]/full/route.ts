import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildBaseUrl, jsonldResponse } from "@/lib/rdf/jsonld-helpers";
import { ISCARB_CONTEXT } from "@/lib/rdf/jsonld-context";
import { studentToJSONLD } from "@/lib/assessment/rdf-mapper";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const studentId = params.id;
    const baseUrl = buildBaseUrl(req);
    
    // The existing studentToJSONLD already builds a very rich graph including employability
    // We can use it as the base and just wrap it in a larger graph if needed,
    // or just return it directly since it's already a comprehensive representation.
    const studentGraph = await studentToJSONLD(studentId, baseUrl);
    
    if (!studentGraph) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return jsonldResponse(studentGraph);
  } catch (error) {
    console.error("RDF Student Full Graph Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
