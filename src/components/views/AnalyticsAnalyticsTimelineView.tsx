'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Loader2, AlertCircle, Calendar, GraduationCap, Briefcase, Award, Filter } from "lucide-react";
import { useState } from "react";

export function AnalyticsAnalyticsTimelineView() {
  const { t, ar, dir } = useI18n();
  const [filter, setFilter] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  return (
    <StudentPageTemplate
      title="Timeline Analytics"
      titleAr="تحليلات الخط الزمني"
      apiEndpoint="/api/v1/student/analytics/timeline"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "التحليلات" : "Analytics", href: "/student/analytics" },
        { label: ar ? "الخط الزمني" : "Timeline", href: "/student/analytics/timeline" },
      ]}
    >
      {(data: any, loading: boolean, error: string | null) => {
        if (loading) {
          return (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-iscarb-green mb-3" />
              <p className="text-sm text-muted-foreground">{ar ? "جارٍ التحميل..." : "Loading..."}</p>
            </div>
          );
        }

        if (error) {
          return (
            <div className="bg-red-50/50 dark:bg-red-950/20 p-4 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-red-900 dark:text-red-200">
                  {ar ? "خطأ في التحميل" : "Error Loading Page"}
                </h4>
                <p className="text-sm text-red-800 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          );
        }

        // Derive filtered timeline items — no hooks allowed inside the callback
        const allItems: any[] = data?.allItems || [];
        const filteredTimeline = selectedCategory === "all"
          ? allItems
          : allItems.filter((item: any) => item.category === selectedCategory);

        // Get unique categories for filter
        const categorySet = new Set(allItems.map((item: any) => item.category as string));
        const categories: string[] = Array.from(categorySet);

        return (
          <div className="space-y-6">
            {/* Header with Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">{ar ? "الخط الزمني للأنشطة" : "Activity Timeline"}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {ar ? "من تاريخ التسجيل حتى اليوم" : "From registration to today"}
                    </p>
                  </div>

                  {/* Category Filter */}
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="text-sm rounded-md border border-input bg-background px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
                      dir={dir}
                    >
                      <option value="all">{ar ? "الكل" : "All"}</option>
                      {categories.map((cat: string) => (
                        <option key={cat} value={cat}>
                          {cat === "academic" && (ar ? "أكاديمي" : "Academic")}
                          {cat === "career" && (ar ? "وظيفي" : "Career")}
                          {cat === "achievement" && (ar ? "إنجاز" : "Achievement")}
                          {cat === "learning" && (ar ? "تعلمي" : "Learning")}
                          {cat === "activity" && (ar ? "نشاط" : "Activity")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">
                    {data?.summary?.totalActivities || 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {ar ? "أنشطة مسجلة" : "Activity Feed Items"}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">
                    {data?.summary?.totalInternships || 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {ar ? "تدريب" : "Internships"}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">
                    {data?.summary?.totalJobApplications || 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {ar ? "طلبات وظائف" : "Job Applications"}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">
                    {data?.summary?.totalAchievements || 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {ar ? "إنجازات" : "Achievements"}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Timeline */}
            {filteredTimeline.length > 0 ? (
              <div className="relative pl-8 pb-8 space-y-8">
                {filteredTimeline.map((item: any, index: number) => (
                  <div key={`${item.id}-${index}`} className="relative">
                    {/* Timeline Dot */}
                    <div className={`absolute left-[-10px] top-2 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${item.category === 'achievement' ? 'bg-amber-500' :
                      item.category === 'career' ? 'bg-blue-500' :
                        item.category === 'learning' ? 'bg-purple-500' :
                          item.category === 'academic' ? 'bg-iscarb-green' :
                            'bg-gray-500'
                      }`}></div>

                    {/* Timeline Content */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {/* Icon based on category */}
                          {item.category === 'achievement' && <Award className="h-4 w-4 text-amber-500" />}
                          {item.category === 'career' && <Briefcase className="h-4 w-4 text-blue-500" />}
                          {item.category === 'learning' && <GraduationCap className="h-4 w-4 text-purple-500" />}
                          {item.category === 'academic' && <GraduationCap className="h-4 w-4 text-iscarb-green" />}
                          {!['achievement', 'career', 'learning', 'academic'].includes(item.category) && (
                            <Calendar className="h-4 w-4 text-gray-500" />
                          )}

                          <span className={`text-xs font-bold ${item.category === 'achievement' ? 'text-amber-500' :
                            item.category === 'career' ? 'text-blue-500' :
                              item.category === 'learning' ? 'text-purple-500' :
                                item.category === 'academic' ? 'text-iscarb-green' :
                                  'text-gray-500'
                            }`}>
                            {new Date(item.date).toLocaleDateString(ar ? "ar-SA" : "en-US", {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>

                        {/* Category Badge */}
                        <Badge variant="secondary" className="text-xs">
                          {item.category}
                        </Badge>
                      </div>

                      <h4 className="font-medium text-sm">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>

                      {/* Type Label */}
                      <div className="mt-2 text-[10px] text-muted-foreground uppercase tracking-wider">
                        {item.type === 'activity' && (ar ? "نشاط" : "Activity")}
                        {item.type === 'career' && (ar ? "مهني" : "Career")}
                        {item.type === 'achievement' && (ar ? "إنجاز" : "Achievement")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                  <h3 className="text-lg font-semibold">
                    {ar ? "لا توجد أنشطة مسجلة" : "No activities recorded"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                    {ar ? "ابدأ بتسجيل الأنشطة للحصول على خط زمني" : "Start recording activities to build your timeline"}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Categories Tabs */}
            <Tabs defaultValue="academic" className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="academic">
                  {ar ? "أكاديمي" : "Academic"}
                </TabsTrigger>
                <TabsTrigger value="career">
                  {ar ? "وظيفي" : "Career"}
                </TabsTrigger>
                <TabsTrigger value="learning">
                  {ar ? "تعلمي" : "Learning"}
                </TabsTrigger>
                <TabsTrigger value="achievement">
                  {ar ? "إنجازات" : "Achievements"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="academic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{ar ? "الخط الزمني الأكاديمي" : "Academic Timeline"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data?.timeline?.academic && data.timeline.academic.length > 0 ? (
                      <div className="space-y-3">
                        {data.timeline.academic.map((item: any, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <GraduationCap className="h-5 w-5 text-iscarb-green shrink-0 mt-0.5" />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm">{item.title}</h4>
                                <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {new Date(item.date).toLocaleDateString(ar ? "ar-SA" : "en-US")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        {ar ? "لا توجد بيانات أكاديمية متوفرة" : "No academic data available"}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="career" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{ar ? "الخط الزمني الوظيفي" : "Career Timeline"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data?.timeline?.career && data.timeline.career.length > 0 ? (
                      <div className="space-y-3">
                        {data.timeline.career.map((item: any, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <Briefcase className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm">{item.title}</h4>
                                <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {new Date(item.date).toLocaleDateString(ar ? "ar-SA" : "en-US")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        {ar ? "لا توجد بيانات وظيفية متوفرة" : "No career data available"}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="learning" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{ar ? "الخط الزمني التعليمي" : "Learning Timeline"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data?.timeline?.learning && data.timeline.learning.length > 0 ? (
                      <div className="space-y-3">
                        {data.timeline.learning.map((item: any, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <GraduationCap className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm">{item.title}</h4>
                                <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {new Date(item.date).toLocaleDateString(ar ? "ar-SA" : "en-US")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        {ar ? "لا توجد بيانات تعلم متوفرة" : "No learning data available"}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="achievement" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{ar ? "الخط الزمني للإنجازات" : "Achievements Timeline"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data?.timeline?.achievements && data.timeline.achievements.length > 0 ? (
                      <div className="space-y-3">
                        {data.timeline.achievements.map((item: any, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <Award className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm">{item.title}</h4>
                                <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {new Date(item.date).toLocaleDateString(ar ? "ar-SA" : "en-US")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        {ar ? "لا توجد بيانات إنجازات متوفرة" : "No achievement data available"}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Recommendations */}
            {data?.recommendations && data.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-iscarb-green">
                      <Award className="h-5 w-5" />
                    </span>
                    {ar ? "التوصيات" : "Recommendations"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.recommendations.map((rec: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-iscarb-green/5 dark:bg-iscarb-green/10">
                        <div className="flex-shrink-0 mt-1">
                          <Filter className="h-5 w-5 text-iscarb-green" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{rec.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                          <Button size="sm" variant="ghost" className="h-6 text-xs mt-2">
                            {rec.action}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      }}
    </StudentPageTemplate>
  );
}
