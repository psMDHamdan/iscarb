import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ error: "Missing SPARQL query" }, { status: 400 });
    }

    const res = await fetch("http://127.0.0.1:8080/sparql", {
      method: "POST",
      headers: {
        "Content-Type": "application/sparql-query",
        "Accept": "application/sparql-results+json"
      },
      body: query
    });

    const text = await res.text();
    
    // Attempt to parse as JSON if the request was successful
    if (res.ok) {
      try {
        const data = JSON.parse(text);
        return NextResponse.json(data);
      } catch (e) {
        // Fallback in case of weird success response
        return NextResponse.json({ result: text });
      }
    } else {
      // Return the raw text error message from Fuseki (e.g. "Parse error: ...")
      return NextResponse.json({ error: text }, { status: res.status });
    }
  } catch (error: any) {
    console.error("SPARQL Proxy Error:", error);
    return NextResponse.json({ error: error.message || "Failed to execute SPARQL query" }, { status: 500 });
  }
}
