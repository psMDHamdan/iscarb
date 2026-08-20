import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard } from "@/lib/api-guard";
import {
  extractText,
  semanticChunk,
  persistCourseContent,
  tagChunksWithCLOs,
  type ContentChunk,
  type CourseLearningOutcomeRef,
} from "@/lib/assessment/content-extraction";

/**
 * POST /api/iscarb/assessment/upload-content
 *
 * Faculty uploads course content (PDF, text) for AI question generation.
 * Extracts text, chunks semantically, tags with CLOs, and persists.
 *
 * Expects FormData with:
 *   - file: The uploaded file
 *   - courseId: string
 *   - clos: JSON string of CourseLearningOutcomeRef[]
 */
export const POST = guard({ tier: "write", roles: ["faculty", "admin"] }, async (req) => {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const courseId = formData.get("courseId") as string | null;
  const closJson = formData.get("clos") as string | null;

  if (!file || !courseId) {
    return NextResponse.json(
      { error: "Missing required fields: file, courseId" },
      { status: 400 }
    );
  }

  // Parse CLOs if provided
  let clos: CourseLearningOutcomeRef[] = [];
  if (closJson) {
    try {
      clos = JSON.parse(closJson);
    } catch {
      return NextResponse.json({ error: "Invalid CLOs JSON" }, { status: 400 });
    }
  }

  // 1. Extract text from the uploaded file
  const text = await extractText(file);

  if (!text || text.length < 50) {
    return NextResponse.json(
      { error: "Could not extract meaningful text from the uploaded file" },
      { status: 422 }
    );
  }

  // 2. Chunk the text semantically
  const rawChunks = semanticChunk(text, 800, 100);
  let chunks: ContentChunk[] = rawChunks.map((chunkText, idx) => ({
    id: `chunk_${courseId}_${idx}`,
    text: chunkText,
    sourceFile: file.name,
    cloTags: [],
  }));

  // 3. Tag chunks with CLOs if CLOs were provided
  if (clos.length > 0) {
    chunks = tagChunksWithCLOs(chunks, clos);
  }

  // 4. Persist to database
  await persistCourseContent(courseId, chunks, file.name);

  return NextResponse.json({
    success: true,
    data: {
      courseId,
      fileName: file.name,
      totalChunks: chunks.length,
      totalCharacters: text.length,
      chunksWithCLOs: chunks.filter((c) => c.cloTags.length > 0).length,
      closCovered: [...new Set(chunks.flatMap((c) => c.cloTags))].length,
    },
  });
});
