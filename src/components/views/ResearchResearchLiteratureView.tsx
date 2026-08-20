"use client";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Search, ExternalLink, Calendar } from "lucide-react";

interface Literature {
  id: string;
  title: string;
  authors: string;
  abstract: string;
  year: number;
  url?: string;
  relevance: number;
}

export function ResearchResearchLiteratureView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  return (
    <StudentPageTemplate
      title="Literature"
      titleAr="الأدبيات"
      apiEndpoint="/api/research-os/publications"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "البحث" : "Research", href: "/student/research" },
        { label: ar ? "الأدبيات" : "Literature", href: "/student/research/research/literature" },
      ]}
    >
      {(data: any) => {
        const papers: Literature[] = data?.data || data?.papers || [];
        return (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder={ar ? "ابحث في الأدبيات..." : "Search literature..."}
                      className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-background"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {papers.length === 0 ? (
              <Card className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">{ar ? "لا توجد أدبيات" : "No literature found"}</p>
              </Card>
            ) : (
              papers.map((paper: Literature) => (
                <Card key={paper.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{paper.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{paper.authors}</p>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{paper.abstract}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {paper.year}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs px-2 py-1 bg-[#0E6C3C]/10 text-[#0E6C3C] rounded-full">
                          {Math.round(paper.relevance * 100)}% match
                        </span>
                        {paper.url && (
                          <a href={paper.url} target="_blank" rel="noopener noreferrer" className="text-[#0E6C3C] hover:underline text-xs flex items-center gap-1 mt-2">
                            <ExternalLink className="h-3 w-3" /> View
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        );
      }}
    </StudentPageTemplate>
  );
}
