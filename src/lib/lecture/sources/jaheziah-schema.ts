/**
 * Official Sources Hub — Jaheziah schema hint for the parser prompt.
 * ===========================================================================
 * A compact JSON shape description given to the model so it returns exactly
 * the structure the typed NationalStandard expects.
 */
export const NATIONAL_STANDARD_SCHEMA_HINT = `{
  "klos": [{ "id": string, "title": string, "description"?: string }],
  "gkus": [{ "id": string, "title": string, "description"?: string }],
  "skus": [{ "id": string, "title": string, "topics": string[], "slos": [{ "id": string, "text": string }] }],
  "slos": [{ "id": string, "text": string }],
  "topics": string[],
  "weights": { topicName: number }
}`;
