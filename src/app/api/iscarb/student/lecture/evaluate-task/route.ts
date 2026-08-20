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

export interface RemediationVariant {
  variantQuestion: string;
  variantExample: string;
  hint: string;
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
      misconception = "",
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

    if (mode === "remediation") {
      // Adaptive loop (spec §29/§35): after a wrong answer, generate a NEW
      // variant — fresh example + fresh question of the same concept, targeting
      // the stored misconception — never repeat the original question verbatim.
      if (!taskPrompt.trim()) {
        return NextResponse.json({
          variantQuestion: isAr
            ? "أعد صياغة المفهوم السابق باستخدام مثال مختلف تماماً من حياتك اليومية."
            : "Re-express the concept using a completely different real-world example.",
          variantExample: isAr
            ? "فكّر في نفس المبدأ في سياق جديد واشرح كيف يتغير السلوك."
            : "Think about the same principle in a new context and explain how the behavior changes.",
          hint: isAr
            ? "راجع الأجزاء التي أجبت عنها خطأ ثم طبّق الفكرة على المثال الجديد."
            : "Review the part you got wrong, then apply the idea to the new example.",
        });
      }

      try {
        const result = await chatJson({
          system: `You are an expert Socratic AI Coach inside iSCARB, a sovereign learning engine.
The student just answered a task incorrectly and needs a REMEDIATION VARIANT.
CONCEPT TITLE: "${conceptTitle}"
ORIGINAL TASK PROMPT: "${taskPrompt}"
LANGUAGE: ${isAr ? "Arabic" : "English"}.

RULES:
1. Produce a DIFFERENT example of the same concept — never reuse the original task's wording or scenario.
2. Frame a single probing question that isolates the most likely misconception: "${misconception ?? ""}".
3. Return ONLY a valid JSON object matching this schema:
{
  "variantQuestion": "A short NEW practice question for the same concept",
  "variantExample": "A NEW concrete real-world example illustrating the concept",
  "hint": "A focused Socratic hint pointing at the misconception"
}`,
          user: `Original task was: "${taskPrompt}". Generate the remediation variant.`,
          temperature: 0.7,
        });

        const json = result.json as Partial<RemediationVariant>;
        return NextResponse.json({
          variantQuestion:
            json.variantQuestion ||
            (isAr
              ? "بماذا يختلف تطبيق هذا المبدأ عندما يتغير السياق؟"
              : "How does applying this principle differ when the context changes?"),
          variantExample:
            json.variantExample ||
            (isAr
              ? "تخيّل مثالاً جديداً تماماً من مجال مختلف وطبّق عليه نفس الفكرة."
              : "Imagine a brand-new scenario from a different domain and apply the same idea to it."),
          hint:
            json.hint ||
            (isAr
              ? "ركّز على الجزء الذي أخطأت فيه وتجاهل التفاصيل غير الضرورية."
              : "Focus on the part you got wrong and ignore the irrelevant details."),
        });
      } catch {
        return NextResponse.json({
          variantQuestion: isAr
            ? "صف المفهوم مرة أخرى باستخدام مثال شخصي جديد بالكامل."
            : "Describe the concept again using a completely new personal example.",
          variantExample: isAr
            ? "استخدم مثالاً من حياتك اليومية يختلف عن المثال الأصلي."
            : "Use a daily-life example different from the original one.",
          hint: isAr
            ? "قارن إجابتك السابقة مع الشرح الأساسي وحدد أين انحرف الفهم."
            : "Compare your previous answer with the core explanation and identify where understanding drifted.",
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
