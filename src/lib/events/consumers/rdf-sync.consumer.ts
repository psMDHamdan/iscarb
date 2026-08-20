/**
 * RDF Sync Consumer — listens for entity change events and syncs to the triple store.
 */
import { rdfSyncService } from "@/services/rdf/rdf-sync.service";
import { rdfClient } from "@/services/rdf/rdf-client.service";
import { moduleLogger } from "@/config/logger";

const log = moduleLogger("rdf-sync-consumer");

export interface GraphEntityEvent {
  entityType: string;
  entityId: string;
  universityCode: string;
  operation: "create" | "update" | "delete";
  timestamp: string;
  data?: Record<string, unknown>;
}

/**
 * Process a single graph entity event.
 * Called by the event consumer when an entity changes in PostgreSQL.
 */
export async function processGraphEvent(event: GraphEntityEvent): Promise<void> {
  const { entityType, entityId, universityCode, operation, data } = event;

  log.info(
    { entityType, entityId, universityCode, operation },
    "Processing graph entity event",
  );

  switch (operation) {
    case "create":
      if (data) {
        await rdfSyncService.insertEntity(entityType, entityId, universityCode, data);
      }
      break;
    case "update":
      if (data) {
        await rdfSyncService.updateEntity(entityType, entityId, universityCode, data);
      }
      break;
    case "delete":
      await rdfSyncService.deleteEntity(entityType, entityId, universityCode);
      break;
  }
}

/**
 * Check if the RDF sync is healthy.
 */
export async function checkSyncHealth(): Promise<{
  fuseki: boolean;
  tripleCount: number;
}> {
  const fuseki = await rdfClient.healthCheck();
  const tripleCount = fuseki ? await rdfClient.tripleCount() : 0;
  return { fuseki, tripleCount };
}
