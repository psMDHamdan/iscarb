import { NextRequest, NextResponse } from "next/server";
import { withGateway } from "@/lib/gateway";
import { logger } from "@/lib/logger";
import { getTripleStore } from "@/services/triple-store/triple-store.service";
import { validateSparqlQuery } from "@/lib/sparql-sanitiser";

interface SparqlRequest {
  query: string;
  format?: "json" | "xml" | "csv";
}

async function executeSparqlQuery(query: string): Promise<unknown> {
  logger.info({ queryLength: query.length }, "SPARQL query received");

  const store = getTripleStore();
  return store.query(query);
}

async function handleSparqlPost(req: NextRequest): Promise<NextResponse> {
  try {
    const body: SparqlRequest = await req.json();

    if (!body.query) {
      return NextResponse.json({ error: "SPARQL query is required" }, { status: 400 });
    }

    const validation = validateSparqlQuery(body.query);
    if (!validation.valid) {
      logger.warn({ error: validation.error }, "SPARQL injection blocked");
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const results = await executeSparqlQuery(body.query);

    return NextResponse.json(results, {
      headers: { "Content-Type": "application/sparql-results+json" },
    });
  } catch (error) {
    logger.error({ error }, "SPARQL query error");
    return NextResponse.json({ error: "SPARQL query failed" }, { status: 500 });
  }
}

export const POST = withGateway(handleSparqlPost, { rateLimitTier: "read", analytics: true });
