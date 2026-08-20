import { describe, it, expect } from "vitest";
import {
  assertApprovedCloTextImmutable,
  assertClosApproved,
  cloTextFingerprint,
  validateCloSelection,
} from "@/lib/lecture/planner/clo-validator";

const clo = (id: string, text: string) => ({
  id,
  number: id,
  text,
  bloomLevel: "apply" as const,
  weight: 50,
});

describe("clo-validator — FR-004 / AC-15 immutability", () => {
  it("allows first approval when cloApprovedAt is unset", () => {
    const result = assertApprovedCloTextImmutable(
      null,
      [],
      [clo("1", "Analyze protocols")]
    );
    expect(result.allowed).toBe(true);
    expect(result.idempotent).toBe(false);
  });

  it("treats identical approved text as idempotent (id-insensitive)", () => {
    const existing = [clo("a", " Analyze protocols "), clo("b", "Evaluate trade-offs")];
    const incoming = [clo("x", "Evaluate trade-offs"), clo("y", "Analyze protocols")];
    const result = assertApprovedCloTextImmutable(new Date(), existing, incoming);
    expect(result.allowed).toBe(true);
    expect(result.idempotent).toBe(true);
  });

  it("rejects post-approval text changes with CLO_TEXT_IMMUTABLE", () => {
    const existing = [clo("1", "Analyze protocols")];
    const incoming = [clo("1", "CHANGED TEXT SHOULD BE REJECTED")];
    const result = assertApprovedCloTextImmutable(new Date(), existing, incoming);
    expect(result.allowed).toBe(false);
    expect(result.idempotent).toBe(false);
    expect(result.error).toBe("CLO_TEXT_IMMUTABLE");
  });

  it("fingerprints ignore empty / non-object entries", () => {
    expect(cloTextFingerprint([clo("1", "A"), null, { text: "  " }])).toBe(
      cloTextFingerprint([clo("2", "A")])
    );
  });

  it("assertClosApproved requires approvedAt", () => {
    expect(assertClosApproved(null).valid).toBe(false);
    expect(assertClosApproved(null).error).toBe("CLO_APPROVAL_REQUIRED");
    expect(assertClosApproved(new Date()).valid).toBe(true);
  });

  it("validateCloSelection still rejects empty selection", () => {
    const result = validateCloSelection([clo("1", "A")], []);
    expect(result.valid).toBe(false);
  });
});
