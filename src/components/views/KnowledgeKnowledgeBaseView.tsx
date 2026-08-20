"use client";

import { useEffect, useState } from "react";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  difficulty: string;
  estimatedReadTime: number | null;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  topicId: string;
  topicName: string;
  isFeatured: boolean;
  tags: string[];
  publishedAt: string;
}

interface ArticlesData {
  articles: Article[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function KnowledgeKnowledgeBaseView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [data, setData] = useState<ArticlesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [sortBy, setSortBy] = useState("viewCount");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          search,
          difficulty,
          sortBy,
          page: page.toString(),
          limit: "20",
        });
        const response = await fetch(`/api/v1/student/knowledge/articles?${params}`);
        if (!response.ok) throw new Error("Failed to fetch articles");
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [search, difficulty, sortBy, page]);

  return (
    <StudentPageTemplate
      title={ar ? "قاعدة المعرفة" : "Knowledge Base"}
      description={ar ? "ابحث عن مقالات المساعدة والتعليمات" : "Search for articles and guides"}
      apiEndpoint="/api/v1/student/knowledge/articles"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "المعرفة" : "Knowledge", href: "/student/knowledge" },
        { label: ar ? "قاعدة المعرفة" : "Knowledge Base", href: "/student/knowledge/knowledge-base" },
      ]}
    >
      {() => (
        <div className="space-y-6">
          {/* Search and Filters */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={ar ? "ابحث عن المقالات..." : "Search articles..."}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={difficulty} onValueChange={(v) => {
                  setDifficulty(v);
                  setPage(1);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={ar ? "صعوبة" : "Difficulty"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{ar ? "الكل" : "All"}</SelectItem>
                    <SelectItem value="beginner">{ar ? "مبتدئ" : "Beginner"}</SelectItem>
                    <SelectItem value="intermediate">{ar ? "متوسط" : "Intermediate"}</SelectItem>
                    <SelectItem value="advanced">{ar ? "متقدم" : "Advanced"}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(v) => {
                  setSortBy(v);
                  setPage(1);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={ar ? "ترتيب حسب" : "Sort by"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewCount">{ar ? "الأكثر مشاهدة" : "Most Viewed"}</SelectItem>
                    <SelectItem value="newest">{ar ? "الأحدث" : "Newest"}</SelectItem>
                    <SelectItem value="helpful">{ar ? "الأكثر مساعدة" : "Most Helpful"}</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" className="w-full">
                  <Filter className="w-4 h-4 mr-2" />
                  {ar ? "المزيد من الفلاتر" : "More Filters"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{ar ? "جاري التحميل..." : "Loading..."}</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {/* Articles Grid */}
          {data && data.articles.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-4">
                {data.articles.map((article) => (
                  <Link key={article.id} href={`/student/knowledge/articles/${article.slug}`}>
                    <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{article.title}</h3>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{article.excerpt}</p>
                        </div>
                        <Badge className={ar ? "ml-2" : "ml-2"}>
                          {article.difficulty === "beginner" ? "🟢" : article.difficulty === "intermediate" ? "🟡" : "🔴"} {article.difficulty}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {article.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex gap-4">
                          <span>{article.topicName}</span>
                          {article.estimatedReadTime && <span>{article.estimatedReadTime} min</span>}
                          <span>{article.viewCount} views</span>
                        </div>
                        <span className="text-green-600">👍 {article.helpfulCount}</span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <Button
                    variant="outline"
                    disabled={!data.pagination.hasPrev}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    {ar ? "السابق" : "Previous"}
                  </Button>

                  <div className="text-sm text-muted-foreground">
                    {ar ? `الصفحة ${data.pagination.page} من ${data.pagination.totalPages}` : `Page ${data.pagination.page} of ${data.pagination.totalPages}`}
                  </div>

                  <Button
                    variant="outline"
                    disabled={!data.pagination.hasNext}
                    onClick={() => setPage(page + 1)}
                  >
                    {ar ? "التالي" : "Next"}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {data && data.articles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {ar ? "لم يتم العثور على مقالات" : "No articles found"}
              </p>
            </div>
          )}
        </div>
      )}
    </StudentPageTemplate>
  );
}
