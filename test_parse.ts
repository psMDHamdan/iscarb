import { parsePdf } from "./src/lib/lecture/ingestion/parsers/pdf-parser";
import { parsePptx } from "./src/lib/lecture/ingestion/parsers/pptx-parser";
import fs from "fs";

async function main() {
  console.log("Loading...");
  // just verify it doesn't crash on import
  console.log(typeof parsePdf, typeof parsePptx);
}
main();
