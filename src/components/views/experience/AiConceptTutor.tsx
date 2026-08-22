"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Lightbulb,
  Puzzle,
  ListOrdered,
  HelpCircle,
  RotateCcw,
  Bot,
  User,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StudentConceptViewModel } from "@/lib/lecture/projections/types";
import { StemRenderer } from "@/components/ui/StemRenderer";

interface Message {
  id: string;
  sender: "user" | "tutor";
  text: string;
  timestamp: Date;
}

interface Props {
  concept: StudentConceptViewModel;
  ar?: boolean;
  onCompleteInteraction?: () => void;
  className?: string;
}

export function AiConceptTutor({ concept, ar = false, onCompleteInteraction, className }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-greeting",
      sender: "tutor",
      text: ar
        ? `مرحباً! أنا معلمك الذكي الخاص بمفهوم "${concept.title}". كيف تحب أن نبدأ اليوم؟ يمكنك اختيار شرح مبسط، أو تشبيه، أو طرح أي سؤال لديك!`
        : `Hi! I'm your AI Concept Tutor for "${concept.title}". How can I help you learn? Try one of the quick prompts below or ask any question in simple terms!`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset conversation greeting when concept changes
  useEffect(() => {
    setMessages([
      {
        id: `greeting-${concept.id}`,
        sender: "tutor",
        text: ar
          ? `مرحباً! دعنا نتعلم مفهوم "${concept.title}". كيف تحب أن نبدأ؟`
          : `I am ready to help you understand "${concept.title}" in simple terms! Pick a quick action or ask anything about this concept.`,
        timestamp: new Date(),
      },
    ]);
  }, [concept.id, concept.title, ar]);

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async (
    textToSend: string,
    mode: "explain_simple" | "analogy" | "step_by_step" | "quiz_me" | "custom" = "custom"
  ) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/iscarb/student/lecture/tutor-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          userMessage: textToSend,
          conceptTitle: concept.title,
          stageName: concept.stage,
          coreInsight: concept.coreContent?.explanation || concept.visibleCopy || "",
          mentalModel: concept.coreContent?.analogy ? { analogy: concept.coreContent.analogy } : undefined,
          mechanism: concept.coreContent?.explanation || "",
          mechanismSteps: concept.coreContent?.steps || concept.bullets || [],
          visualCaption: concept.visual?.caption,
          hook: concept.hook || concept.headline || "",
          commonPitfalls: concept.commonPitfalls?.map(p => ({
            misconception: p.misconception,
            whyWrong: p.whyWrong,
            betterWay: p.betterWay,
          })) || [],
          realWorld: concept.realWorld?.application || "",
          sourceBlocks: (concept as any).sourceBlocks || [],
        }),
      });

      const data = await res.json();
      const tutorReply = data.reply || (ar ? "عذراً، حدث خطأ أثناء الاتصال بالمعلم الذكي." : "Sorry, I encountered an issue. Let's try again!");

      const tutorMsg: Message = {
        id: `tutor-${Date.now()}`,
        sender: "tutor",
        text: tutorReply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, tutorMsg]);
      onCompleteInteraction?.();
    } catch (err) {
      console.error("AI Tutor chat failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `tutor-err-${Date.now()}`,
          sender: "tutor",
          text: ar ? "تعذر الاتصال بالمعلم الذكي حالياً. يرجى المحاولة لاحقاً." : "Couldn't reach the AI Tutor right now. Please try again in a moment.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input, "custom");
    }
  };

  const quickActions = [
    {
      label: ar ? "💡 شرح مبسط" : "💡 Explain Simply",
      prompt: ar ? "اشرح لي هذا المفهوم بأسلوب مبسط وسهل الفهم" : "Explain this concept in simple, clear terms with zero confusing jargon.",
      mode: "explain_simple" as const,
    },
    {
      label: ar ? "🧩 تشبيه واقعي" : "🧩 Give an Analogy",
      prompt: ar ? "أعطني تشبيهاً من الحياة الواقعية لفهم هذا المفهوم" : "Give me a memorable, concrete real-world analogy to understand this concept.",
      mode: "analogy" as const,
    },
    {
      label: ar ? "🔍 خطوة بخطوة" : "🔍 Step-by-Step",
      prompt: ar ? "اشرح الآلية خطوة بخطوة بالتسلسل" : "Break down this concept step-by-step with clear numbered points.",
      mode: "step_by_step" as const,
    },
    {
      label: ar ? "🧪 اختبرني" : "🧪 Quiz Me",
      prompt: ar ? "اطرح علي سؤالاً لاختبار فهمي لهذا المفهوم" : "Quiz my understanding with an engaging question about this concept.",
      mode: "quiz_me" as const,
    },
  ];

  /** Clean text of any raw markdown symbols and format neatly */
  const renderMessageContent = (text: string) => {
    const clean = text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .replace(/^#{1,6}\s*/gm, "");

    const lines = clean.split("\n");

    return (
      <div className="space-y-1.5 leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          // Bullet points
          if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
            const bulletText = trimmed.replace(/^[•\-]\s*/, "");
            return (
              <div key={idx} className="flex items-start gap-2 text-xs font-normal">
                <span className="text-emerald-700 font-black shrink-0 mt-0.5">•</span>
                <span className="text-slate-800">
                  <StemRenderer content={bulletText} inline />
                </span>
              </div>
            );
          }

          // Numbered steps
          const stepMatch = trimmed.match(/^(\d+[\.\)])\s*(.*)$/);
          if (stepMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 text-xs font-normal">
                <span className="text-[#0F7B8A] font-bold shrink-0 mt-0.5">{stepMatch[1]}</span>
                <span className="text-slate-800">
                  <StemRenderer content={stepMatch[2]} inline />
                </span>
              </div>
            );
          }

          // Question or header-like prefix
          if (trimmed.startsWith("Question:") || trimmed.startsWith("Analogy:") || trimmed.startsWith("Core Concept:")) {
            return (
              <div key={idx} className="text-xs font-bold text-emerald-950 pb-0.5">
                <StemRenderer content={trimmed} />
              </div>
            );
          }

          return (
            <div key={idx} className="text-xs text-slate-800 font-normal">
              <StemRenderer content={trimmed} />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full rounded-2xl border border-emerald-100/90 bg-white text-slate-900 shadow-xl overflow-hidden",
        className
      )}
      dir={ar ? "rtl" : "ltr"}
    >
      {/* ── Tutor Header (Green & White) ── */}
      <div className="px-4 py-3 border-b border-emerald-100 bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-[#0F7B8A] flex items-center justify-center text-white shadow-sm">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900">
                {ar ? "المعلم المفاهيمي الذكي" : "AI Concept Tutor"}
              </span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-500 truncate max-w-[220px]">
              {concept.title}
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: `greeting-${Date.now()}`,
                sender: "tutor",
                text: ar
                  ? `جاهز لمساعدتك في فهم "${concept.title}"!`
                  : `I am ready to help you understand "${concept.title}" in simple terms!`,
                timestamp: new Date(),
              },
            ])
          }
          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
          title={ar ? "إعادة تعيين المحادثة" : "Reset conversation"}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Quick Action Prompt Chips (Green & White) ── */}
      <div className="px-3.5 py-2.5 border-b border-emerald-100/70 bg-emerald-50/30 shrink-0">
        <p className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800 mb-1.5">
          {ar ? "إجراءات سريعة للتعلّم:" : "QUICK TUTOR SHORTCUTS:"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {quickActions.map((qa, idx) => (
            <button
              key={idx}
              disabled={isLoading}
              onClick={() => sendMessage(qa.prompt, qa.mode)}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-400 border border-emerald-200 text-slate-700 transition-all duration-150 disabled:opacity-50 shadow-xs"
            >
              {qa.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Message History (Green & White) ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-white scrollbar-thin scrollbar-thumb-emerald-200 scrollbar-track-transparent"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2.5 max-w-[92%]",
              msg.sender === "user" ? (ar ? "mr-auto flex-row-reverse" : "ml-auto flex-row-reverse") : "mr-auto"
            )}
          >
            <div
              className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold",
                msg.sender === "user"
                  ? "bg-[#0E6C3C] text-white"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-300"
              )}
            >
              {msg.sender === "user" ? <User className="h-3 w-3" /> : <Bot className="h-3.5 w-3.5" />}
            </div>

            <div
              className={cn(
                "p-3 rounded-2xl text-xs leading-relaxed shadow-xs",
                msg.sender === "user"
                  ? "bg-[#0E6C3C] text-white rounded-tr-none font-medium"
                  : "bg-slate-50 border border-emerald-100/90 text-slate-800 rounded-tl-none font-normal"
              )}
            >
              {msg.sender === "user" ? <StemRenderer content={msg.text} /> : renderMessageContent(msg.text)}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 items-center mr-auto">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center shrink-0">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="p-2.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 text-slate-700 text-xs flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
              <span className="italic text-[11px] text-slate-500">
                {ar ? "المعلم يشرح المفهوم..." : "Tutor is writing simple explanation..."}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Chat Input (Green & White) ── */}
      <div className="p-3 border-t border-emerald-100 bg-emerald-50/20 shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={
              ar
                ? "اسأل المعلم الذكي عن هذا المفهوم..."
                : "Ask AI Tutor to explain anything simply..."
            }
            className="w-full pl-3.5 pr-10 py-2 text-xs rounded-xl bg-white border border-emerald-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all disabled:opacity-50 shadow-xs"
          />
          <button
            onClick={() => sendMessage(input, "custom")}
            disabled={!input.trim() || isLoading}
            className={cn(
              "absolute flex items-center justify-center w-7 h-7 rounded-lg text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm",
              ar ? "left-1.5" : "right-1.5",
              input.trim() ? "bg-[#0E6C3C] hover:bg-[#0E6C3C]/90" : "bg-slate-400"
            )}
            title={ar ? "إرسال" : "Send message"}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-[9px] text-slate-400 mt-1.5 text-center">
          {ar
            ? "المعلم الذكي يشرح المفاهيم بنقاط مبسطة وسهلة الفهم."
            : "AI Tutor explains concepts point-wise in simple, crystal-clear terms."}
        </p>
      </div>
    </div>
  );
}
