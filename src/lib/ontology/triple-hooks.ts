/**
 * Triple Hooks — auto-generate RDF triples on CRUD operations and workflow transitions.
 * These hooks bridge the application layer with the RDF triple generation layer.
 * Uses OntologyEngine as the single source of truth.
 */
import { RdfGenerator, type Triple } from "./rdf-generator";
import { type OntologyEngine } from "./engine";
import crypto from 'crypto';

const generator = new RdfGenerator();

/**
 * Generate triples when an entity is created.
 */
export function onEntityCreated(
  entityType: string,
  data: any,
  ontology: OntologyEngine
): Triple[] {
  const triples = generator.generateTriples(entityType, data, ontology);

  // Add audit trail triple
  if (data.id) {
    triples.push({
      subject: `iSCARB:${data.id}`,
      predicate: "https://iscarb.edu/ontology/createdAt",
      object: `"${new Date().toISOString()}"^^http://www.w3.org/2001/XMLSchema#dateTime`,
      timestamp: new Date(),
    });
  }

  return triples;
}

/**
 * Generate triples when an entity is updated.
 * Archives old triples (marks with previousVersion) and adds new ones.
 */
export function onEntityUpdated(
  entityType: string,
  oldData: any,
  newData: any,
  ontology: OntologyEngine
): Triple[] {
  const triples: Triple[] = [];
  const subject = `iSCARB:${newData.id || oldData.id}`;
  const newVersion = (oldData.version || 0) + 1;

  // Archive: add a version marker to old state
  triples.push({
    subject,
    predicate: "https://iscarb.edu/ontology/previousVersion",
    object: `"${JSON.stringify(oldData).slice(0, 500)}"^^http://www.w3.org/2001/XMLSchema#string`,
    timestamp: new Date(),
    version: newVersion,
  });

  // Generate new triples from updated data
  const newTriples = generator.generateTriples(entityType, newData, ontology);
  for (const t of newTriples) {
    t.version = newVersion;
  }
  triples.push(...newTriples);

  // Update timestamp
  triples.push({
    subject,
    predicate: "https://iscarb.edu/ontology/updatedAt",
    object: `"${new Date().toISOString()}"^^http://www.w3.org/2001/XMLSchema#dateTime`,
    timestamp: new Date(),
    version: newVersion,
  });

  return triples;
}

/**
 * Generate triples when an entity is deleted.
 * Never actually deletes — marks as deprecated.
 */
export function onEntityDeleted(
  entityType: string,
  data: any
): Triple[] {
  const subject = `iSCARB:${data.id}`;
  const now = new Date();

  return [
    {
      subject,
      predicate: "https://iscarb.edu/ontology/hasStatus",
      object: `"deprecated"^^http://www.w3.org/2001/XMLSchema#string`,
      timestamp: now,
    },
    {
      subject,
      predicate: "https://iscarb.edu/ontology/deprecatedAt",
      object: `"${now.toISOString()}"^^http://www.w3.org/2001/XMLSchema#dateTime`,
      timestamp: now,
    },
    {
      subject,
      predicate: "http://www.w3.org/2002/07/owl#deprecated",
      object: `"true"^^http://www.w3.org/2001/XMLSchema#boolean`,
      timestamp: now,
    },
  ];
}

/**
 * Generate triples when a relationship between entities changes.
 */
export function onRelationshipChanged(
  from: string,
  to: string,
  property: string,
  action: "add" | "remove"
): Triple[] {
  const timestamp = new Date();

  if (action === "add") {
    return [
      {
        subject: `iSCARB:${from}`,
        predicate: `iSCARB:${property}`,
        object: `iSCARB:${to}`,
        timestamp,
      },
    ];
  }

  // For remove: mark the relationship as inactive in the deprecated graph
  return [
    {
      subject: `iSCARB:${from}`,
      predicate: `iSCARB:${property}`,
      object: `iSCARB:${to}`,
      timestamp,
      graph: "urn:iscarb:deprecated",
    },
  ];
}

/**
 * Generate triples for workflow state transitions.
 */
export function onWorkflowTransition(
  entityType: string,
  entityId: string,
  fromState: string,
  toState: string
): Triple[] {
  const subject = `iSCARB:${entityId}`;
  const timestamp = new Date();
  const transitionId = `${entityId}-transition-${Date.now()}`;

  return [
    {
      subject,
      predicate: "https://iscarb.edu/ontology/hasStatus",
      object: `"${toState}"^^http://www.w3.org/2001/XMLSchema#string`,
      timestamp,
    },
    {
      subject: `iSCARB:${transitionId}`,
      predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
      object: "iSCARB:WorkflowExecution",
      timestamp,
    },
    {
      subject: `iSCARB:${transitionId}`,
      predicate: "https://iscarb.edu/ontology/fromState",
      object: `"${fromState}"^^http://www.w3.org/2001/XMLSchema#string`,
      timestamp,
    },
    {
      subject: `iSCARB:${transitionId}`,
      predicate: "https://iscarb.edu/ontology/toState",
      object: `"${toState}"^^http://www.w3.org/2001/XMLSchema#string`,
      timestamp,
    },
  ];
}

/**
 * Generate triples for audit events.
 */
export function onAuditEvent(
  actor: string,
  action: string,
  entity: string,
  details: any
): Triple[] {
  const eventId = `audit-${Date.now()}-${crypto.randomUUID()}`;
  const subject = `iSCARB:${eventId}`;
  const timestamp = new Date();

  return [
    {
      subject,
      predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
      object: "iSCARB:AuditLog",
      timestamp,
    },
    {
      subject,
      predicate: "https://iscarb.edu/ontology/auditAction",
      object: `"${action}"^^http://www.w3.org/2001/XMLSchema#string`,
      timestamp,
    },
    {
      subject,
      predicate: "https://iscarb.edu/ontology/auditActor",
      object: `iSCARB:${actor}`,
      timestamp,
    },
    {
      subject,
      predicate: "https://iscarb.edu/ontology/auditEntity",
      object: `iSCARB:${entity}`,
      timestamp,
    },
    {
      subject,
      predicate: "https://iscarb.edu/ontology/auditDetails",
      object: `"${JSON.stringify(details)}"^^http://www.w3.org/2001/XMLSchema#string`,
      timestamp,
    },
    {
      subject,
      predicate: "http://www.w3.org/ns/prov#generatedAtTime",
      object: `"${timestamp.toISOString()}"^^http://www.w3.org/2001/XMLSchema#dateTime`,
      timestamp,
    },
  ];
}
