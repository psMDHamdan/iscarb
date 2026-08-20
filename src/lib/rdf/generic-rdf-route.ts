import { NextRequest, NextResponse } from "next/server";
import { getMapper } from "@/services/rdf/rdf-mappers";
import { triplesToJsonLd, jsonldResponse } from "./jsonld-helpers";

/**
 * Factory function to create standard JSON-LD GET routes for entities.
 * 
 * @param entityType The name of the entity type in mapperRegistry (e.g., "Organization")
 * @param fetchEntity A function that retrieves the entity by ID from the database
 */
export function createRdfRoute<T = any>(
  entityType: string,
  fetchEntity: (id: string) => Promise<T | null>
) {
  return async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const id = params.id;
      if (!id) {
        return NextResponse.json({ error: "Missing entity id" }, { status: 400 });
      }

      const entity = await fetchEntity(id);
      if (!entity) {
        return NextResponse.json({ error: `${entityType} not found` }, { status: 404 });
      }

      const mapper = getMapper(entityType);
      if (!mapper) {
        return NextResponse.json({ error: `No RDF mapper found for ${entityType}` }, { status: 500 });
      }

      // We need a universityCode for the mapper. Fallback to "system" if not available
      const universityCode = (entity as any).universityId || (entity as any).orgId || "system";
      
      const result = mapper.toTriples(entity, universityCode);
      const jsonld = triplesToJsonLd(result.uri, mapper.classUri, result.triples);

      return jsonldResponse(jsonld);
    } catch (error) {
      console.error(`RDF Export Error for ${entityType}:`, error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}
