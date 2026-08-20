"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, Search, ExternalLink, BookOpen, Download } from "lucide-react";

export function ResearchLiteratureView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPapers, setFilteredPapers] = useState<any[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/v1/student/research/literature");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        setData(result.data);
        setFilteredPapers(result.data?.papers || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load literature");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!data?.papers) return;

    const filtered = data.papers.filter((paper: any) =>
      paper.title.toLowerCase().includes(query.toLowerCase()) ||
      paper.abstract?.toLowerCase().includes(query.toLowerCase()) ||
      paper.authors?.toLowerCase().includes(query.toLowerCase())
    );

    setFilteredPapers(filtered);
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title={ar ? "مراجعة أدبية" : "Literature Review"}
          description={ar ? "اكتشف الأوراق والدراسات البحثية ذات الصلة" : "Discover relevant research papers and studies"}
        />
        <Card>
          <CardContent className="p-12 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-iscarb-green mb-3" />
            <p className="text-muted-foreground">{ar ? "جاري التحميل..." : "Loading..."}</p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (error && !data) {
    return (
      <>
        <PageHeader
          title={ar ? "مراجعة أدبية" : "Literature Review"}
          description={ar ? "اكتشف الأوراق والدراسات البحثية ذات الصلة" : "Discover relevant research papers and studies"}
        />
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">{ar ? "خطأ" : "Error"}</h4>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={ar ? "مراجعة أدبية" : "Literature Review"}
        description={ar ? "اكتشف الأوراق والدراسات البحثية ذات الصلة" : "Discover relevant research papers and studies"}
      />

      <div className="space-y-8 pb-12">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={ar ? "ابحث عن الأوراق والدراسات..." : "Search papers and studies..."}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{ar ? "إجمالي الأوراق" : "Total Papers"}</p>
              <p className="text-2xl font-bold mt-1">{data?.papers?.length || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{ar ? "المجلات المتابعة" : "Journals Tracked"}</p>
              <p className="text-2xl font-bold mt-1">{data?.journalsCount || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{ar ? "المؤلفون المتابعون" : "Tracked Authors"}</p>
              <p className="text-2xl font-bold mt-1">{data?.authorsCount || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Papers List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {ar ? "الأوراق البحثية" : "Research Papers"}
              <span className="text-sm text-muted-foreground ml-2">({filteredPapers.length})</span>
            </h3>
          </div>

          {filteredPapers.length === 0 ? (
            <Card className="text-center p-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">{ar ? "لم يتم العثور على أوراق" : "No papers found"}</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPapers.map((paper: any) => (
                <Card
                  key={paper.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedPaper(paper)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-base hover:text-iscarb-green transition-colors">{paper.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{paper.authors}</p>
                      </div>
                      {paper.doi && (
                        <Badge variant="outline" className="shrink-0">{paper.year || "N/A"}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {paper.abstract && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{paper.abstract}</p>
                    )}
                    <div className="flex items-center justify-between pt-3">
                      <div className="flex items-center gap-2">
                        {paper.journal && <Badge variant="secondary">{paper.journal}</Badge>}
                        {paper.volume && <Badge variant="secondary">Vol. {paper.volume}</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        {paper.doi && (
                          <a
                            href={`https://doi.org/${paper.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-iscarb-green hover:underline text-sm font-semibold"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        {paper.url && (
                          <a
                            href={paper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-iscarb-green hover:underline text-sm font-semibold"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Paper Details Modal */}
        {selectedPaper && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="pr-4">{selectedPaper.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPaper(null)}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-semibold">{ar ? "المؤلفون" : "Authors"}</p>
                  <p className="text-sm text-muted-foreground">{selectedPaper.authors}</p>
                </div>

                {selectedPaper.abstract && (
                  <div>
                    <p className="text-sm font-semibold">{ar ? "ملخص" : "Abstract"}</p>
                    <p className="text-sm text-muted-foreground mt-1">{selectedPaper.abstract}</p>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  {selectedPaper.journal && (
                    <div>
                      <p className="text-sm font-semibold">{ar ? "المجلة" : "Journal"}</p>
                      <p className="text-sm text-muted-foreground">{selectedPaper.journal}</p>
                    </div>
                  )}
                  {selectedPaper.year && (
                    <div>
                      <p className="text-sm font-semibold">{ar ? "السنة" : "Year"}</p>
                      <p className="text-sm text-muted-foreground">{selectedPaper.year}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  {selectedPaper.doi && (
                    <a
                      href={`https://doi.org/${selectedPaper.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {ar ? "عرض على DOI" : "View on DOI"}
                      </Button>
                    </a>
                  )}
                  {selectedPaper.url && (
                    <a
                      href={selectedPaper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        {ar ? "تنزيل" : "Download"}
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
