/**
 * Mapper interface for converting between Prisma entities and RDF triples.
 * Each entity type implements this interface.
 */

export interface RdfTriple {
  s: string; // Subject URI
  p: string; // Predicate URI
  o: string | { value: string; type: string }; // Object (URI or literal)
}

export interface MapperResult {
  graph: string; // Named graph URI
  uri: string; // Subject URI
  triples: RdfTriple[];
}

export interface RdfMapper<T = Record<string, unknown>> {
  entityType: string;
  classUri: string;

  /** Convert a Prisma entity to RDF triples */
  toTriples(entity: T, universityCode: string): MapperResult;

  /** Convert RDF triples back to a Prisma-compatible object */
  fromTriples(
    triples: RdfTriple[],
    universityCode: string,
  ): Partial<T>;
}

/**
 * Convert a value to an RDF literal string
 */
export function rdfLiteral(
  value: unknown,
  datatype: string,
): { value: string; type: string } {
  return { value: String(value), type: datatype };
}

/**
 * Build a triple with a URI object
 */
export function rdfTriple(
  subject: string,
  predicate: string,
  objectUri: string,
): RdfTriple {
  return { s: subject, p: predicate, o: objectUri };
}

/**
 * Build a triple with a literal object
 */
export function rdfLiteralTriple(
  subject: string,
  predicate: string,
  value: unknown,
  datatype: string,
): RdfTriple {
  return { s: subject, p: predicate, o: rdfLiteral(value, datatype) };
}
