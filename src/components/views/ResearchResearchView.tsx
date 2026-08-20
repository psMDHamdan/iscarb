"use client";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Send, Lightbulb, BookOpen } from "lucide-react";
import { useState } from "react";

export function ResearchResearchView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [query, setQuery] = useState("");

  return (
    <StudentPageTemplate
      title="Research Assistant"
      titleAr="مساعد البحث"
      apiEndpoint="/api/v1/student/research/ai-coach"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "البحث" : "Research", href: "/student/research" },
        { label: ar ? "مساعد البحث" : "Research Assistant", href: "/student/research/research-assistant" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <Bot className="h-6 w-6 text-[#0E6C3C]" />
                <h3 className="font-semibold">{ar ? "اسأل مساعد البحث" : "Ask Research Assistant"}</h3>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={ar ? "اسأل أي سؤال عن البحث..." : "Ask any research question..."}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg bg-background text-sm"
                />
                <button className="px-4 py-2 bg-[#0E6C3C] text-white rounded-lg text-sm flex items-center gap-2">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-medium text-sm">{ar ? "أفكار البحث" : "Research Ideas"}</p>
                  <p className="text-xs text-muted-foreground">{ar ? "احصل على أفكار لمشاريع بحثية" : "Get research project ideas"}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium text-sm">{ar ? "مراجعة الأدبيات" : "Literature Review"}</p>
                  <p className="text-xs text-muted-foreground">{ar ? "ساعد في مراجعة الأدبيات" : "Help with literature review"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </StudentPageTemplate>
  );
}
