/** Equity ledger — stub for microservices migration. */
export async function recomputeLedger(...args: any[]) { 
  return { 
    ok: true,
    equity: { equityScore: 0 },
    scoreDelta: 0
  }; 
}
export type LedgerDelta = { field: string; delta: number };
