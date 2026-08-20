import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { studentToJSONLD } from "@/lib/assessment/rdf-mapper";

export async function GET(req: NextRequest) {
  // We use read-level access
  const g = await guard(req, "assessment:graph:read");
  if (!g.ok) {
    return NextResponse.json({ error: g.error }, { status: g.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    
    if (!studentId) {
      return NextResponse.json({ error: "Missing studentId parameter" }, { status: 400 });
    }

    // Generate JSON-LD RDF representation
    const jsonld = await studentToJSONLD(studentId);

    if (!jsonld) {
      return NextResponse.json({ error: "Student not found or no profile exists" }, { status: 404 });
    }

    // Return with application/ld+json content type as required by W3C Semantic Web standards
    return new NextResponse(JSON.stringify(jsonld, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/ld+json",
      },
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
