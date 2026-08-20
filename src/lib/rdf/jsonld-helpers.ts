import { NextRequest, NextResponse } from "next/server";
import { RdfTriple } from "@/services/rdf/rdf-mappers/types";
import { ISCARB_CONTEXT } from "./jsonld-context";

/**
 * Extracts the base URL (protocol + host) from a NextRequest.
 */
export function buildBaseUrl(req: NextRequest): string {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

/**
 * Creates a standard NextResponse for JSON-LD data.
 */
export function jsonldResponse(data: any): NextResponse {
  return new NextResponse(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/ld+json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

/**
 * Converts a list of RDF triples into a nested, clean JSON-LD object.
 * Strips the "iscarb:" prefix from properties and types for a perfect BRD match.
 */
export function triplesToJsonLd(subjectUri: string, typeUri: string, triples: RdfTriple[]): any {
  const nodesByUri: Record<string, any> = {};

  // First pass: initialize node objects
  for (const triple of triples) {
    if (!nodesByUri[triple.s]) {
      nodesByUri[triple.s] = { "@id": triple.s };
    }
    if (typeof triple.o === "string" && triple.o.startsWith("http")) {
      if (!nodesByUri[triple.o]) {
        nodesByUri[triple.o] = { "@id": triple.o };
      }
    }
  }

  // Ensure root subject exists
  if (!nodesByUri[subjectUri]) {
    nodesByUri[subjectUri] = { "@id": subjectUri };
  }
  
  // Clean type (remove prefix)
  const cleanType = typeUri
    .replace("https://iscarb.edu/ontology/", "")
    .replace("iscarb:", "");
    
  nodesByUri[subjectUri].type = cleanType;

  // Second pass: assign properties and build the tree
  for (const triple of triples) {
    const sNode = nodesByUri[triple.s];
    
    if (triple.p === "rdf:type") {
      sNode.type = (triple.o as string)
        .replace("https://iscarb.edu/ontology/", "")
        .replace("iscarb:", "");
      continue;
    }

    // Strip "iscarb:" prefix from property for clean JSON-LD output
    const prop = triple.p.replace("iscarb:", "");
    let val: any;

    if (typeof triple.o === "string") {
      if (triple.o.startsWith("http")) {
        // Link to nested object reference
        val = nodesByUri[triple.o];
      } else {
        // Just a string literal
        val = triple.o;
      }
    } else {
      // It's a typed literal object
      const literal = triple.o;
      if (literal.type === "xsd:boolean") {
        val = literal.value === "true";
      } else if (literal.type === "xsd:integer" || literal.type === "xsd:decimal" || literal.type === "xsd:float") {
        val = Number(literal.value);
      } else {
        val = literal.value;
      }
    }

    // Handle multiple values (arrays)
    if (sNode[prop] !== undefined) {
      if (Array.isArray(sNode[prop])) {
        sNode[prop].push(val);
      } else {
        sNode[prop] = [sNode[prop], val];
      }
    } else {
      sNode[prop] = val;
    }
  }

  // We return the root node. Because JavaScript objects are passed by reference,
  // `val = nodesByUri[triple.o]` above automatically nests the child objects!
  const root = nodesByUri[subjectUri];
  
  return {
    "@context": ISCARB_CONTEXT,
    ...root
  };
}
