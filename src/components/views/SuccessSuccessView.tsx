"use client";
import { useState, useEffect, useRef } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, MessageCircle, Sparkles, AlertCircle } from "lucide-react";

interface CoachMessage {
  id: string;
  type: "user" | "coach";
  message: string;
  timestamp: string;
  sessionTopic?: string;
}

interface SuccessCoachData {
  recentSessions: CoachMessage[];
  sessionTopics: string[];
  nextSuggestion: string;
}

export function SuccessSuccessView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const [data, setData] = useState<SuccessCoachData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/v1/student/success/success-coach");
        if (!response.ok) throw new Error("Failed to fetch data");
        const result = await response.json();
        if (result.success) {
          setData(result.data);
          setMessages(result.data?.recentSessions || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: CoachMessage = {
      id: Date.now().toString(),
      type: "user",
      message: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/v1/student/success/success-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const result = await response.json();

      if (result.success) {
        const coachMessage: CoachMessage = {
          id: Date.now().toString() + "-coach",
          type: "coach",
          message: result.data?.response || "I apologize, I couldn't process that request.",
          timestamp: new Date().toISOString(),
          sessionTopic: result.data?.topic,
        };
        setMessages((prev) => [...prev, coachMessage]);
      }
    } catch (err) {
      console.error("Error:", err);
      const errorMessage: CoachMessage = {
        id: Date.now().toString() + "-error",
        type: "coach",
        message: ar ? "حدث خطأ أثناء معالجة رسالتك" : "An error occurred while processing your message",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSending(false);
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
        <PageHeader title={ar ? "مدرب النجاح الذكي" : "Success Coach"} breadcrumbs={breadcrumbs} />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-[#0E6C3C]" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title={ar ? "مدرب النجاح الذكي" : "Success Coach"} breadcrumbs={breadcrumbs} />
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title={ar ? "مدرب النجاح الذكي" : "Success Coach"} breadcrumbs={breadcrumbs} />

      <div className="space-y-6 pb-12">
        {/* Topics */}
        {data?.sessionTopics && data.sessionTopics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{ar ? "الموضوعات المقترحة" : "Suggested Topics"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.sessionTopics.map((topic) => (
                  <Badge
                    key={topic}
                    variant="outline"
                    className="cursor-pointer hover:bg-[#0E6C3C] hover:text-white hover:border-[#0E6C3C]"
                    onClick={() => setInput(topic)}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Interface */}
        <Card className="flex flex-col h-[500px]">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              {ar ? "محادثة مع المدرب" : "Chat with Coach"}
            </CardTitle>
          </CardHeader>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-96 text-gray-500">
                  <div className="text-center">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-40" />
                    <p className="mb-2">{ar ? "ابدأ محادثة مع مدرب النجاح" : "Start a conversation with your success coach"}</p>
                    <p className="text-sm">{ar ? "اطرح سؤالاً عن أهدافك أو تقدمك" : "Ask about your goals or progress"}</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.type === "user"
                          ? "bg-[#0E6C3C] text-white rounded-br-none"
                          : "bg-gray-100 text-gray-900 rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      {msg.sessionTopic && (
                        <Badge className="mt-2 text-xs" variant="secondary">
                          {msg.sessionTopic}
                        </Badge>
                      )}
                      <p className="text-xs mt-2 opacity-70">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <CardContent className="border-t p-4">
            <div className="flex gap-2">
              <Textarea
                placeholder={ar ? "اكتب رسالتك هنا..." : "Type your message..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={sending}
                className="min-h-12"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || sending}
                className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Next Suggestion */}
        {data?.nextSuggestion && (
          <Card className="border-l-4 border-l-[#0E6C3C]">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                {ar ? "الاقتراح التالي" : "Next Suggestion"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">{data.nextSuggestion}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
