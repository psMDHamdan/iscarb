"use client";

import { useState, useEffect, useRef } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Send,
  AlertCircle,
  MessageSquare,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

interface CoachSession {
  id: string;
  sessionTopic: string;
  userPrompt: string;
  aiResponse: string;
  createdAt: string;
  feedbackProvided?: boolean;
  supportOffered?: string;
}

interface ResponseOptions {
  topic: "academic" | "career" | "personal" | "wellbeing" | "motivation";
  topicLabel: string;
  prompt: string;
}

const RESPONSE_TOPICS: ResponseOptions[] = [
  {
    topic: "academic",
    topicLabel: "Academic Support",
    prompt: "Help me improve my academic performance and study strategies",
  },
  {
    topic: "career",
    topicLabel: "Career Planning",
    prompt: "Guide me in planning my career path and professional development",
  },
  {
    topic: "personal",
    topicLabel: "Personal Growth",
    prompt: "Help me grow personally and overcome challenges",
  },
  {
    topic: "wellbeing",
    topicLabel: "Wellbeing",
    prompt: "Support my mental and physical wellbeing",
  },
  {
    topic: "motivation",
    topicLabel: "Motivation",
    prompt: "Help me stay motivated and focused on my goals",
  },
];

export function SuccessCoachView() {
  const { lang } = useApp();
  const { trackEvent } = useAnalytics();
  const ar = lang === "ar";

  const [sessions, setSessions] = useState<CoachSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<CoachSession | null>(null);

  // Chat input
  const [topic, setTopic] = useState<string>("academic");
  const [message, setMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamingResponse]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      trackEvent("page_view", { section: "success", page: "success-coach" });

      const response = await fetch("/api/v1/student/ai/success-coach");
      if (!response.ok) throw new Error("Failed to fetch sessions");

      const result = await response.json();
      if (result.success) {
        setSessions(result.data || []);
        if (result.data?.length > 0) {
          setSelectedSession(result.data[0]);
        }
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      trackEvent("error", { section: "success", page: "success-coach", error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      setIsStreaming(true);
      setStreamingResponse("");
      trackEvent("ai_feature_used", { feature: "success_coach", topic });

      const response = await fetch("/api/v1/student/ai/success-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          message: message.trim(),
          context: {
            previousSessions: sessions.length,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const result = await response.json();
      if (result.success && result.data) {
        const newSession = result.data;
        setSessions([newSession, ...sessions]);
        setSelectedSession(newSession);
        setMessage("");
        setStreamingResponse("");
      } else {
        throw new Error(result.error || "Failed to process message");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      trackEvent("error", { section: "success", page: "success-coach-send", error: String(err) });
    } finally {
      setIsStreaming(false);
    }
  };

  const breadcrumbs = [
    { label: ar ? "الرئيسية" : "Home", href: "/student" },
    { label: ar ? "النجاح" : "Success", href: "/student/success" },
    { label: ar ? "مدرب النجاح" : "Success Coach", href: "/student/success/success-coach" },
  ];

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "مدرب النجاح" : "Success Coach"} breadcrumbs={breadcrumbs} />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={ar ? "مدرب النجاح الذكي" : "AI Success Coach"}
        description={ar ? "احصل على إرشادات شخصية من مدربك الذكي" : "Get personalized guidance from your AI coach"}
        breadcrumbs={breadcrumbs}
      />

      <div className="space-y-6 pb-12">
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-900">{ar ? "خطأ" : "Error"}</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="flex flex-col h-[600px]">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-600" />
                  {ar ? "محادثة مع مدربك" : "Chat with Your Coach"}
                </CardTitle>
              </CardHeader>

              {/* Messages Display */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedSession ? (
                  <>
                    {/* User Message */}
                    <div className="flex justify-end">
                      <div className="max-w-xs lg:max-w-md bg-blue-500 text-white rounded-lg p-3 rounded-tr-none">
                        <p className="text-sm">{selectedSession.userPrompt}</p>
                        <p className="text-xs text-blue-100 mt-1">
                          {new Date(selectedSession.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    {/* AI Response */}
                    <div className="flex justify-start">
                      <div className="max-w-xs lg:max-w-md bg-gray-100 text-gray-900 rounded-lg p-3 rounded-tl-none">
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {selectedSession.aiResponse}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-center text-gray-500">
                    <div>
                      <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p>{ar ? "ابدأ محادثة مع مدربك" : "Start a conversation with your coach"}</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t p-4 space-y-3">
                {/* Topic Selector */}
                <div className="flex gap-2 flex-wrap">
                  {RESPONSE_TOPICS.map((t) => (
                    <Button
                      key={t.topic}
                      variant={topic === t.topic ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTopic(t.topic)}
                      disabled={isStreaming}
                    >
                      {ar
                        ? t.topic === "academic"
                          ? "أكاديمي"
                          : t.topic === "career"
                            ? "مهني"
                            : t.topic === "personal"
                              ? "شخصي"
                              : t.topic === "wellbeing"
                                ? "الصحة"
                                : "دافع"
                        : t.topicLabel}
                    </Button>
                  ))}
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder={ar ? "اكتب رسالتك..." : "Type your message..."}
                    disabled={isStreaming}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isStreaming || !message.trim()}
                    size="icon"
                  >
                    {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sessions History */}
          <div>
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5" />
                  {ar ? "المحادثات" : "Conversations"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">{ar ? "لا توجد محادثات" : "No conversations yet"}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className={`w-full text-left p-3 rounded-lg border transition ${selectedSession?.id === session.id
                          ? "bg-blue-50 border-blue-300"
                          : "hover:bg-gray-50"
                          }`}
                      >
                        <p className="text-sm font-medium line-clamp-2">
                          {session.sessionTopic}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Start Guide */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {ar ? "نصائح" : "Tips"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2 text-gray-600">
                <p>✓ {ar ? "كن واضحاً في أسئلتك" : "Be clear with your questions"}</p>
                <p>✓ {ar ? "شارك السياق والتفاصيل" : "Share context and details"}</p>
                <p>✓ {ar ? "اسأل متابعات للحصول على عمق أكثر" : "Ask follow-ups for deeper insights"}</p>
                <p>✓ {ar ? "احفظ النصائح المفيدة" : "Save helpful advice"}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
