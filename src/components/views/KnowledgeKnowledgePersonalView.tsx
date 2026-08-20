"use client";

import { useEffect, useState } from "react";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { BookOpen, TrendingUp, BarChart3, Search, Heart } from "lucide-react";

interface PersonalGraphData {
  graph: {
    nodes: Array<{
      id: string;
      type: string;
      label: string;
      title: string;
      topicId: string;
      topicName: string;
      difficulty: string;
      lastViewed: string;
      timeSpent: number | null;
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      label: string;
    }>;
  };
  learningPatterns: {
    preferredDifficulties: Record<string, number>;
    preferredTopics: Record<string, number>;
    learningStyle: string;
    totalArticlesRead: number;
    totalTimeSpent: number;
  };
  recentActivity: {
    articlesRead: Array<{
      id: string;
      title: string;
      viewedAt: string;
      timeSpent: number | null;
    }>;
    searches: Array<{
      query: string;
      timestamp: string;
      resultCount: number;
    }>;
    feedback: Array<{
      articleId: string;
      articleTitle: string;
      isHelpful: boolean | null;
      rating: number | null;
      submittedAt: string;
    }>;
  };
}

export function KnowledgeKnowledgePersonalView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [data, setData] = useState<PersonalGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPersonalGraph = async () => {
      try {
        const response = await fetch("/api/v1/student/knowledge/personal-graph");
        if (!response.ok) throw new Error("Failed to fetch personal graph");
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchPersonalGraph();
  }, []);

  if (loading) {
    return (
      <StudentPageTemplate
        title={ar ? "الرسم البياني الشخصي" : "Personal Knowledge Graph"}
        apiEndpoint="/api/v1/student/knowledge/personal-graph"
        breadcrumbs={[
          { label: ar ? "الرئيسية" : "Home", href: "/student" },
          { label: ar ? "المعرفة" : "Knowledge", href: "/student/knowledge" },
          { label: ar ? "الرسم البياني الشخصي" : "Personal Graph", href: "/student/knowledge/personal-graph" },
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
        title={ar ? "الرسم البياني الشخصي" : "Personal Knowledge Graph"}
        apiEndpoint="/api/v1/student/knowledge/personal-graph"
        breadcrumbs={[
          { label: ar ? "الرئيسية" : "Home", href: "/student" },
          { label: ar ? "المعرفة" : "Knowledge", href: "/student/knowledge" },
          { label: ar ? "الرسم البياني الشخصي" : "Personal Graph", href: "/student/knowledge/personal-graph" },
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

  const totalHours = Math.round((data?.learningPatterns.totalTimeSpent || 0) / 3600);
  const avgTimePerArticle = data?.learningPatterns.totalArticlesRead ? Math.round((data.learningPatterns.totalTimeSpent || 0) / data.learningPatterns.totalArticlesRead / 60) : 0;

  return (
    <StudentPageTemplate
      title={ar ? "الرسم البياني الشخصي" : "Personal Knowledge Graph"}
      description={ar ? "إدارة رحلة تعلمك الشخصية" : "Manage your personal learning journey"}
      apiEndpoint="/api/v1/student/knowledge/personal-graph"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "المعرفة" : "Knowledge", href: "/student/knowledge" },
        { label: ar ? "الرسم البياني الشخصي" : "Personal Graph", href: "/student/knowledge/personal-graph" },
      ]}
    >
      {() => (
        <div className="space-y-6">
          {/* Learning Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{ar ? "المقالات المقروءة" : "Articles Read"}</p>
                  <p className="text-2xl font-bold">{data?.learningPatterns.totalArticlesRead || 0}</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{ar ? "الوقت المستغرق" : "Time Spent"}</p>
                  <p className="text-2xl font-bold">{totalHours}h</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{ar ? "متوسط الوقت" : "Avg Time"}</p>
                  <p className="text-2xl font-bold">{avgTimePerArticle}m</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500 opacity-50" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{ar ? "أسلوب التعلم" : "Learning Style"}</p>
                  <p className="text-lg font-bold capitalize">{data?.learningPatterns.learningStyle || "balanced"}</p>
                </div>
                <Badge>{ar ? "متوازن" : "Balanced"}</Badge>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="articles" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="articles">{ar ? "المقالات" : "Articles"}</TabsTrigger>
              <TabsTrigger value="searches">{ar ? "البحث" : "Searches"}</TabsTrigger>
              <TabsTrigger value="feedback">{ar ? "التغذية الراجعة" : "Feedback"}</TabsTrigger>
            </TabsList>

            {/* Articles Tab */}
            <TabsContent value="articles" className="space-y-4">
              <h3 className="text-lg font-semibold">{ar ? "المقالات المقروءة مؤخراً" : "Recently Read Articles"}</h3>
              {data?.recentActivity.articlesRead && data.recentActivity.articlesRead.length > 0 ? (
                <div className="space-y-3">
                  {data.recentActivity.articlesRead.map((article) => (
                    <Card key={article.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{article.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {ar ? "شوهد" : "Viewed"} {new Date(article.viewedAt).toLocaleDateString(ar ? 'ar-SA' : 'en-US')}
                          </p>
                        </div>
                        <div className="text-right">
                          {article.timeSpent && <p className="text-sm font-medium">{Math.round(article.timeSpent / 60)}m</p>}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">{ar ? "لا توجد مقالات مقروءة" : "No articles read yet"}</p>
              )}
            </TabsContent>

            {/* Searches Tab */}
            <TabsContent value="searches" className="space-y-4">
              <h3 className="text-lg font-semibold">{ar ? "سجل البحث" : "Search History"}</h3>
              {data?.recentActivity.searches && data.recentActivity.searches.length > 0 ? (
                <div className="space-y-3">
                  {data.recentActivity.searches.map((search, idx) => (
                    <Card key={idx} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Search className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">"{search.query}"</p>
                            <p className="text-xs text-muted-foreground">
                              {search.resultCount} {ar ? "نتيجة" : "results"}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(search.timestamp).toLocaleDateString(ar ? 'ar-SA' : 'en-US')}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">{ar ? "لا يوجد سجل بحث" : "No search history"}</p>
              )}
            </TabsContent>

            {/* Feedback Tab */}
            <TabsContent value="feedback" className="space-y-4">
              <h3 className="text-lg font-semibold">{ar ? "التغذية الراجعة" : "Your Feedback"}</h3>
              {data?.recentActivity.feedback && data.recentActivity.feedback.length > 0 ? (
                <div className="space-y-3">
                  {data.recentActivity.feedback.map((fb) => (
                    <Card key={fb.articleId} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{fb.articleTitle}</p>
                          <div className="flex gap-2 mt-2">
                            {fb.isHelpful !== null && (
                              <Badge variant={fb.isHelpful ? "default" : "outline"}>
                                {fb.isHelpful ? "👍 Helpful" : "👎 Not Helpful"}
                              </Badge>
                            )}
                            {fb.rating && (
                              <Badge variant="secondary">
                                ⭐ {fb.rating}/5
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(fb.submittedAt).toLocaleDateString(ar ? 'ar-SA' : 'en-US')}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">{ar ? "لا توجد تغذية راجعة" : "No feedback yet"}</p>
              )}
            </TabsContent>
          </Tabs>

          {/* Difficulty Preferences */}
          {Object.keys(data?.learningPatterns.preferredDifficulties || {}).length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">{ar ? "مستويات الصعوبة المفضلة" : "Preferred Difficulty Levels"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(data?.learningPatterns.preferredDifficulties || {}).map(([difficulty, count]) => (
                  <div key={difficulty} className="flex items-center gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">{difficulty}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${(count / (data?.learningPatterns.totalArticlesRead || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <p className="font-bold">{count}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </StudentPageTemplate>
  );
}
