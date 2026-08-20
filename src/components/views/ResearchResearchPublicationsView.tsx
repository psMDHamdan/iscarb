"use client";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ExternalLink, Calendar, Users } from "lucide-react";

interface Publication {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  url?: string;
  citations: number;
}

export function ResearchResearchPublicationsView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  return (
    <StudentPageTemplate
      title="Publications"
      titleAr="المنشورات"
      apiEndpoint="/api/research-os/publications"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "البحث" : "Research", href: "/student/research" },
        { label: ar ? "المنشورات" : "Publications", href: "/student/research/research/publications" },
      ]}
    >
      {(data: any) => {
        const publications: Publication[] = data?.data || data?.publications || [];
        return (
          <div className="space-y-4">
            {publications.length === 0 ? (
              <Card className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">{ar ? "لا توجد منشورات" : "No publications found"}</p>
              </Card>
            ) : (
              publications.map((pub: Publication) => (
                <Card key={pub.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{pub.title}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Users className="h-3 w-3" /> {pub.authors}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {pub.journal} · {pub.year}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{pub.citations} citations</p>
                        {pub.url && (
                          <a href={pub.url} target="_blank" rel="noopener noreferrer" className="text-[#0E6C3C] hover:underline text-xs flex items-center gap-1 mt-1">
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
