/** RDF Sync Service — resilient stub for microservices migration. */
export class RdfSyncService {
  async syncEntity(..._args: any[]) { return true; }
  async insertEntity(..._args: any[]) { return true; }
  async deleteEntity(..._args: any[]) { return true; }
}
export const rdfSyncService = new RdfSyncService();
