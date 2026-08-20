"use client";

import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Book,
  FileText,
  Search,
  Download
} from "lucide-react";

export function ResourcesDashboardView() {
  const { lang, setView } = useApp();
  const ar = lang === "ar";

  return (
    <>
      <PageHeader
        title={ar ? "لوحة الموارد" : "Resources Dashboard"}
        description={ar ? "الوصول إلى جميع المعارف والأدوات الخاصة بك" : "Access all your knowledge and tools"}
      />
      <div className="space-y-6 pb-12">
        <div className="relative mb-6">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
           <input 
             type="text" 
             placeholder={ar ? "ابحث في المستندات، والكتب، وأوراق البحث..." : "Search documents, books, research papers..."} 
             className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-iscarb-cyan"
           />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><Book className="h-4 w-4 text-iscarb-cyan" /> {ar ? "الوصول الأخير" : "Recently Accessed"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
               <div className="flex items-start gap-3 p-2 rounded hover:bg-accent cursor-pointer">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                     <div className="text-sm font-medium">CS401 Final Exam Prep Guide</div>
                     <div className="text-xs text-muted-foreground">Document • Viewed 2 hrs ago</div>
                  </div>
               </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><Download className="h-4 w-4 text-iscarb-gold" /> {ar ? "تحميلات مفضلة" : "Popular Downloads"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
               <div className="flex justify-between items-center text-sm font-medium hover:text-iscarb-cyan cursor-pointer transition-colors p-2 hover:bg-accent rounded">
                  <span>University Thesis Template</span>
                  <Download className="h-4 w-4 text-muted-foreground" />
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
