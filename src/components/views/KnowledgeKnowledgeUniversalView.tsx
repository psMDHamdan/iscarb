"use client";

import { useEffect, useState } from "react";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Search, Zap, BookOpen, Tag } from "lucide-react";

interface SearchResult {
  id: string;
  type: 'article' | 'topic';
  title: string;
  slug: string;
  excerpt?: string;
  description?: string;
  topicId?: string;
  topicName?: string;
  difficulty?: string;
  tags?: string[];
  viewCount: number;
  helpfulCount?: number;
  icon?: string;
  articleCount?: number;
}

interface SearchData {
  query: string;
  results: {
    articles: SearchResult[];
    topics: SearchResult[];
  };
  aiSuggestions: string[];
  total: number;
}

export function KnowledgeKnowledgeUniversalView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [data, setData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = async (query: string) => {
    if (!query || query.length < 2) {
      setData(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/v1/student/knowledge/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Search failed");
      const result = await response.json();
      setData(result.data);
      setHasSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  return (
    <StudentPageTemplate
      title={ar ? "البحث الشامل" : "Universal Search"}
      description={ar ? "ابحث عن جميع المحتوى بدلالة دلالية" : "Search all content with semantic understanding"}
      apiEndpoint="/api/v1/student/knowledge/search"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "المعرفة" : "Knowledge", href: "/student/knowledge" },
        { label: ar ? "البحث الشامل" : "Universal Search", href: "/student/knowledge/universal-search" },
      ]}
    >
      {() => (
        <div className="space-y-6">
          {/* Search Bar */}
          <Card className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder={ar ? "ابحث عن أي شيء..." : "Search anything..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 py-6 text-lg"
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                <Zap className="w-4 h-4 mr-2" />
                {ar ? "بحث ذكي" : "Smart Search"}
              </Button>
            </form>

            {/* AI Suggestions */}
            {data?.aiSuggestions && data.aiSuggestions.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{ar ? "اقتراحات ذات صلة" : "Related Topics"}</p>
                <div className="flex flex-wrap gap-2">
                  {data.aiSuggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery(suggestion);
                        performSearch(suggestion);
                      }}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{ar ? "جاري البحث..." : "Searching..."}</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {/* No Search Yet */}
          {!hasSearched && (
            <div className="text-center py-12">
              <Zap className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">{ar ? "ابدأ بالبحث عما تريد" : "Start typing to search"}</p>
            </div>
          )}

          {/* Results */}
          {hasSearched && data && (
            <>
              {/* Articles Results */}
              {data.results.articles.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    {ar ? "المقالات" : "Articles"} ({data.results.articles.length})
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    {data.results.articles.map((article) => (
                      <Link key={article.id} href={`/student/knowledge/articles/${article.slug}`}>
                        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-base">{article.title}</h3>
                            {article.difficulty && (
                              <Badge variant="outline" className="ml-2">
                                {article.difficulty}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{article.excerpt}</p>
                          {article.tags && article.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {article.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{article.topicName}</span>
                            <span>{article.viewCount} views</span>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Topics Results */}
              {data.results.topics.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    {ar ? "الموضوعات" : "Topics"} ({data.results.topics.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.results.topics.map((topic) => (
                      <Link key={topic.id} href={`/student/knowledge/articles?topic=${topic.id}`}>
                        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div className="text-3xl">{topic.icon}</div>
                            <div className="flex-1">
                              <h3 className="font-semibold">{topic.title}</h3>
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{topic.description}</p>
                              <div className="text-xs text-muted-foreground">
                                {topic.articleCount} {ar ? "مقالة" : "articles"}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {data.total === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {ar ? "لم يتم العثور على نتائج لـ" : "No results found for"} "{searchQuery}"
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </StudentPageTemplate>
  );
}
