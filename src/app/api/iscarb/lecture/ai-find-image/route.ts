import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { aiFindAcademicImage } from "@/lib/lecture/generation/visual-intelligence";
import { getAcademicVisualForSlide } from "@/lib/lecture/academic-visuals";

export const POST = guard(
  { tier: "read", roles: ["faculty", "admin", "student"] },
  async (req: Request, _ctx: GuardContext) => {
    try {
      const body = await req.json();
      const { title, topic, bullets, purpose, slideNo, searchQuery } = body;

      // Fast path — a curated concept-matched visual is instant and accurate.
      // Only when there is no strong keyword match do we fall through to the
      // LLM + Wikipedia online search.
      const curated = getAcademicVisualForSlide(
        slideNo || 1,
        title || topic || "",
        [purpose || "", topic || "", ...(bullets || [])].join(" ")
      );
      if (curated.id.startsWith("match-")) {
        return NextResponse.json({
          success: true,
          imageUrl: curated.imageUrl,
          title: curated.title,
          caption: curated.caption,
          visualType: curated.visualType,
          suggestedSearchQuery: curated.topic,
        });
      }

      if (searchQuery && typeof searchQuery === "string" && searchQuery.trim().length > 0) {
        const { searchWikipediaImage } = await import("@/lib/lecture/generation/visual-intelligence");
        const foundUrl = await searchWikipediaImage([searchQuery.trim()]);
        if (foundUrl) {
          return NextResponse.json({
            success: true,
            imageUrl: foundUrl,
            title: searchQuery,
            caption: `Scientific illustration representing ${searchQuery}.`,
            visualType: "Diagram",
          });
        }
      }

      const aiResult = await aiFindAcademicImage({
        title,
        topic,
        bullets,
        purpose,
        slideNo,
      });

      // If online search did not find an image, fallback to our rich academic discipline registry
      if (!aiResult.imageUrl) {
        aiResult.imageUrl = curated.imageUrl;
        if (!aiResult.title) aiResult.title = curated.title;
        if (!aiResult.caption) aiResult.caption = curated.caption;
      }

      return NextResponse.json({ success: true, ...aiResult });
    } catch (error: any) {
      console.error("[ai-find-image] Failed to find image with LLM:", error);
      return NextResponse.json(
        { error: "AI image search failed", message: error?.message },
        { status: 500 }
      );
    }
  }
);
