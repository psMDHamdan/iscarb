import { NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { chatText } from "@/lib/ai-engine";

export const POST = guard(
  { tier: "ai", roles: ["student", "faculty", "admin"] },
  async (req: Request) => {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { conceptTitle, stageName, coreInsight } = body as Record<string, unknown>;

    const title = typeof conceptTitle === "string" ? conceptTitle : "Concept";
    const stage = typeof stageName === "string" ? stageName : "";
    const insight = typeof coreInsight === "string" ? coreInsight : "";

    // Simulated RAG Retrieval: In a production system, this would query a Vector DB
    // (like Pinecone or pgvector) against course materials and external textbooks.
    // For this prototype, we simulate the retrieval by prompting the AI to act as a
    // search engine over general academic knowledge related to the concept.
    
    const systemPrompt = `You are a sophisticated Academic Retrieval-Augmented Generation (RAG) system.
Your job is to provide a "Deep Dive" for a university student.
Given a concept, you must return:
1. A real-world case study or application of this concept.
2. A formal textbook-style definition.
3. 2-3 bullet points of related advanced topics.

Format the response in clean Markdown. Use headings (###). Do not include pleasantries.`;

    const userPrompt = `Concept: ${title}\nStage: ${stage}\nCore Insight: ${insight}`;

    const result = await chatText({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.5,
      guardrails: false
    });

    return NextResponse.json({ result: result.content, model: result.model }, { status: 200 });
  }
);
