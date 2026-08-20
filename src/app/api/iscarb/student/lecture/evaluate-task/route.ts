import { NextRequest, NextResponse } from "next/server";
import { chatJson } from "@/lib/ai-engine";

export interface EvaluateTaskResponse {
  isCorrect: boolean;
  score: number; // 1 to 5
  feedback: string;
  misconception: string | null;
  nextHint: string | null;
  coachReply?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      conceptTitle = "Concept",
      taskPrompt = "",
      studentAnswer = "",
      lang = "en",
      mode = "evaluation",
      userQuestion = "",
    } = body;

    const isAr = lang === "ar";

    if (mode === "coach_chat") {
      const questionText = userQuestion || studentAnswer;
      if (!questionText.trim()) {
        return NextResponse.json({
          coachReply: isAr
            ? "يرجى كتابة سؤالك وسأقوم بمساعدتك في فهم المفهوم."
            : "Please type a question so I can help you master this concept.",
        });
      }

      try {
        const result = await chatJson({
          system: `You are an expert Socratic AI Coach inside iSCARB, a sovereign learning engine.
Your goal is to guide higher education students to deep conceptual understanding.
CONCEPT TITLE: "${conceptTitle}"
TASK PROMPT: "${taskPrompt}"
LANGUAGE: ${isAr ? "Arabic" : "English"}.

RULES:
1. Be encouraging, precise, and pedagogically clear.
2. Provide a concise explanation followed by a probing Socratic question.
3. Return ONLY a valid JSON object matching this schema:
{
  "coachReply": "string"
}`,
          user: `Student Question: "${questionText}"`,
          temperature: 0.5,
        });

        const json = result.json as { coachReply?: string };
        return NextResponse.json({
          coachReply:
            json.coachReply ||
            (isAr
              ? `بخصوص ${conceptTitle}: فكّر في المبدأ الأساسي وكيف يرتبط بالمثال الإضافي.`
              : `Regarding ${conceptTitle}: consider how the core principle applies directly here. What key variable changes?`),
        });
      } catch {
        return NextResponse.json({
          coachReply: isAr
            ? `ممتاز! في مفهوم ${conceptTitle}، تذكر دائماً ربط الآلية بالنظريات الأساسية.`
            : `Great question! In ${conceptTitle}, focus on how each structural component impacts the final outcome.`,
        });
      }
    }

    // Default: Task Evaluation Mode
    if (!studentAnswer.trim()) {
      return NextResponse.json({
        isCorrect: false,
        score: 1,
        feedback: isAr
          ? "يرجى كتابة إجابتك أو تحليلك قبل الإرسال."
          : "Please write your explanation or analysis before submitting.",
        misconception: null,
        nextHint: isAr
          ? "ركز على النقاط الرئيسية في المفهوم واشرحها في جملة واحدة."
          : "Focus on the main mechanisms described in the slide.",
      });
    }

    try {
      const result = await chatJson({
        system: `You are an expert Socratic AI Evaluator inside iSCARB, a sovereign learning platform.
Your task is to evaluate a student's answer for a specific learning concept.

CONCEPT TITLE: "${conceptTitle}"
TASK PROMPT: "${taskPrompt}"
LANGUAGE: ${isAr ? "Arabic" : "English"}.

Evaluate the student response for conceptual depth, reasoning accuracy, and terminology.
Return ONLY a valid JSON object with the following schema:
{
  "isCorrect": true/false,
  "score": number between 1 and 5,
  "feedback": "Concise Socratic feedback praising valid points and probing remaining gaps",
  "misconception": "Short sentence highlighting any misconception identified, or null if none",
  "nextHint": "Helpful Socratic hint guiding them to the next step, or null"
}`,
        user: `Student Answer: "${studentAnswer}"`,
        temperature: 0.3,
      });

      const json = result.json as Partial<EvaluateTaskResponse>;
      return NextResponse.json({
        isCorrect: json.isCorrect ?? true,
        score: Math.min(5, Math.max(1, json.score ?? 4)),
        feedback:
          json.feedback ||
          (isAr
            ? "تحليل جيد للغاية! أظهرت فهماً ممتازاً للمبدأ الأساسي."
            : "Great response! You captured the key mechanism effectively."),
        misconception: json.misconception || null,
        nextHint: json.nextHint || null,
      });
    } catch {
      // Heuristic fallback evaluation if AI endpoint is offline/unreachable
      const wordCount = studentAnswer.trim().split(/\s+/).length;
      const isStrong = wordCount >= 8;

      return NextResponse.json({
        isCorrect: isStrong,
        score: isStrong ? 4 : 3,
        feedback: isAr
          ? isStrong
            ? "✓ إجابة رائعة وصياغة واضحة! قمت بتحليل المفهوم بشكل ممتاز."
            : "محاولة جيدة. حاول التوسع في الشرح وإضافة تفاصيل أكثر حول آلية العمل."
          : isStrong
          ? "✓ Well crafted answer! You demonstrated solid understanding of the core mechanism."
          : "Good start. Try adding more specific details on how this principle applies.",
        misconception: null,
        nextHint: isAr
          ? "تأكد من ربط النتيجة النهائية بالخطوات الأولى الموضحة في الخريطة الذهنية."
          : "Connect the initial cause to the final structural result shown in the concept map.",
      });
    }
  } catch (err: unknown) {
    console.error("Task Evaluation API Error:", err);
    return NextResponse.json(
      { error: "Failed to evaluate task response" },
      { status: 500 }
    );
  }
}
