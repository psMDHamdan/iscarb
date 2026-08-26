export class RdfClientService {
  async query(sparql: string) { return []; }
  async healthCheck(): Promise<boolean> { return false; }
}
export const rdfClient = new RdfClientService();
export const rdfClientService = new RdfClientService();
