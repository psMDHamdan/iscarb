export class TripleStoreService {
  async query(sparql: string) { return []; }
  async insert(..._args: any[]) { return true; }
}
export function getTripleStore() { return new TripleStoreService(); }
export const tripleStoreService = new TripleStoreService();
