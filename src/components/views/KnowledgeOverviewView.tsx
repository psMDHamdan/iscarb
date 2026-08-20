"use client";

import { useEffect, useState } from "react";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, BookOpen, TrendingUp, Users } from "lucide-react";

interface OverviewData {
  stats: {
    totalTopics: number;
    totalArticles: number;
    totalViews: number;
    userViews: number;
    userViewPercentage: number;
  };
  featuredArticles: Array<{
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
  }>;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    color: string;
    articleCount: number;
    subcategoryCount: number;
    viewCount: number;
  }>;
}

export function KnowledgeOverviewView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/v1/student/knowledge/overview");
        if (!response.ok) throw new Error("Failed to fetch overview");
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <StudentPageTemplate
        title={ar ? "نظرة عامة على المعرفة" : "Knowledge Overview"}
        apiEndpoint="/api/v1/student/knowledge/overview"
        breadcrumbs={[
          { label: ar ? "الرئيسية" : "Home", href: "/student" },
          { label: ar ? "المعرفة" : "Knowledge", href: "/student/knowledge" },
        ]}
      >
        {() => (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">{ar ? "جاري التحميل..." : "Loading..."}</p>
          </div>
        )}
      </StudentPageTemplate>
    );
  }

  if (error) {
    return (
      <StudentPageTemplate
        title={ar ? "نظرة عامة على المعرفة" : "Knowledge Overview"}
        apiEndpoint="/api/v1/student/knowledge/overview"
        breadcrumbs={[
          { label: ar ? "الرئيسية" : "Home", href: "/student" },
          { label: ar ? "المعرفة" : "Knowledge", href: "/student/knowledge" },
        ]}
      >
        {() => (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        )}
      </StudentPageTemplate>
    );
  }

  return (
    <StudentPageTemplate
      title={ar ? "نظرة عامة على المعرفة" : "Knowledge Overview"}
      description={ar ? "استكشف قاعدة المعرفة" : "Explore our knowledge base"}
      apiEndpoint="/api/v1/student/knowledge/overview"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "المعرفة" : "Knowledge", href: "/student/knowledge" },
      ]}
    >
      {() => (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{ar ? "الموضوعات" : "Topics"}</p>
                  <p className="text-2xl font-bold">{data?.stats.totalTopics || 0}</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{ar ? "المقالات" : "Articles"}</p>
                  <p className="text-2xl font-bold">{data?.stats.totalArticles || 0}</p>
                </div>
                <BookOpen className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{ar ? "إجمالي المشاهدات" : "Total Views"}</p>
                  <p className="text-2xl font-bold">{data?.stats.totalViews || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500 opacity-50" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{ar ? "مشاهداتك" : "Your Views"}</p>
                  <p className="text-2xl font-bold">{data?.stats.userViews || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {data?.stats.userViewPercentage || 0}% {ar ? "من الإجمالي" : "of total"}
                  </p>
                </div>
                <Users className="w-8 h-8 text-orange-500 opacity-50" />
              </div>
            </Card>
          </div>

          {/* Featured Articles */}
          {data?.featuredArticles && data.featuredArticles.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{ar ? "مقالات مميزة" : "Featured Articles"}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.featuredArticles.map((article) => (
                  <Card key={article.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg">{article.title}</h3>
                        <Badge variant={article.difficulty === "beginner" ? "secondary" : "default"}>
                          {article.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
                      <div className="flex flex-wrap gap-1">
                        {article.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                        <span>{article.topicName}</span>
                        {article.estimatedReadTime && <span>{article.estimatedReadTime} min read</span>}
                      </div>
                      <Link href={`/student/knowledge/articles/${article.slug}`}>
                        <Button variant="ghost" size="sm" className="w-full justify-between">
                          {ar ? "اقرأ المزيد" : "Read Article"}
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {data?.categories && data.categories.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{ar ? "الفئات" : "Categories"}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.categories.map((category) => (
                  <Link key={category.id} href={`/student/knowledge/articles?topic=${category.id}`}>
                    <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer h-full">
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-3xl">{category.icon}</div>
                        <Badge variant="outline">{category.articleCount}</Badge>
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{category.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{category.description}</p>
                      <div className="text-xs text-muted-foreground">
                        <p>{category.articleCount} {ar ? "مقالة" : "articles"}</p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </StudentPageTemplate>
  );
}
