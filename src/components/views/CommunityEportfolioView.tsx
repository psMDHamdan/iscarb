"use client";
import { useState } from "react";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Eye, Share2, Plus, Star, Award, Zap } from "lucide-react";

export function CommunityEportfolioView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [adding, setAdding] = useState(false);

  const labels = {
    title: ar ? "حافظتي الإلكترونية" : "E-Portfolio",
    description: ar ? "عرض أعمالك والمشاريع التي أنجزتها" : "Showcase your work and projects",
    entries: ar ? "الإدخالات" : "Entries",
    skills: ar ? "المهارات" : "Skills",
    achievements: ar ? "الإنجازات" : "Achievements",
    addEntry: ar ? "إضافة إدخال" : "Add Entry",
    visibility: ar ? "الرؤية" : "Visibility",
    share: ar ? "مشاركة" : "Share",
    preview: ar ? "معاينة" : "Preview",
    published: ar ? "منشورة" : "Published",
    draft: ar ? "مسودة" : "Draft",
    category: ar ? "الفئة" : "Category",
    project: ar ? "مشروع" : "Project",
    achievement: ar ? "إنجاز" : "Achievement",
    certificate: ar ? "شهادة" : "Certificate",
    viewPortfolio: ar ? "عرض المحفظة" : "View Portfolio",
    noEntries: ar ? "لم تضف أي إدخالات بعد" : "No entries added yet",
  };

  return (
    <StudentPageTemplate
      title={labels.title}
      titleAr={labels.title}
      description={labels.description}
      descriptionAr={labels.description}
      apiEndpoint="/api/v1/student/community/eportfolio"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "المجتمع" : "Community", href: "/student/community" },
        { label: labels.title, href: "/student/community/eportfolio" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-6">
          {/* Header with Stats */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">{labels.entries}</p>
                  <p className="text-3xl font-bold">{data?.portfolio?.stats?.totalEntries || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{labels.skills}</p>
                  <p className="text-3xl font-bold">{data?.portfolio?.stats?.totalSkills || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{labels.achievements}</p>
                  <p className="text-3xl font-bold">{data?.portfolio?.stats?.totalAchievements || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{ar ? "المشاهدات" : "Views"}</p>
                  <p className="text-3xl font-bold">{data?.portfolio?.stats?.views || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Actions */}
          <div className="flex gap-2 flex-wrap">
            <Dialog open={adding} onOpenChange={setAdding}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  {labels.addEntry}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{labels.addEntry}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder={ar ? "العنوان" : "Title"} />
                  <Textarea placeholder={ar ? "الوصف" : "Description"} rows={4} />
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option>{labels.project}</option>
                    <option>{labels.achievement}</option>
                    <option>{labels.certificate}</option>
                  </select>
                  <Button onClick={() => setAdding(false)} className="w-full">
                    {labels.addEntry}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              {labels.share}
            </Button>
            <Button variant="outline" className="gap-2">
              <Eye className="h-4 w-4" />
              {labels.preview}
            </Button>
          </div>

          {/* Entries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                {labels.entries}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.portfolio?.entries && data.portfolio.entries.length > 0 ? (
                <div className="grid gap-4">
                  {data.portfolio.entries.map((entry: any) => (
                    <div
                      key={entry.id}
                      className="p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base mb-1">{entry.title}</h4>
                          <Badge className="text-xs">{entry.category}</Badge>
                        </div>
                        <Badge variant={entry.published ? "default" : "secondary"} className="text-xs">
                          {entry.published ? labels.published : labels.draft}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground my-3">{entry.description}</p>
                      {entry.link && (
                        <a
                          href={entry.link}
                          className="text-xs text-primary hover:underline inline-block mt-2"
                        >
                          {ar ? "عرض →" : "View →"}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                  <p className="text-muted-foreground">{labels.noEntries}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          {data?.portfolio?.skills && data.portfolio.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  {labels.skills}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-2">
                  {data.portfolio.skills.map((skill: any) => (
                    <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium text-sm">{skill.name}</span>
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-2 w-2 rounded-full ${
                              i < skill.level ? "bg-primary" : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Achievements */}
          {data?.portfolio?.achievements && data.portfolio.achievements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  {labels.achievements}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {data.portfolio.achievements.map((achievement: any) => (
                    <div
                      key={achievement.id}
                      className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-5 w-5 text-amber-500" />
                        <h4 className="font-semibold text-sm">{achievement.title}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">{achievement.issuer}</p>
                      {achievement.earnedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(achievement.earnedAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </StudentPageTemplate>
  );
}
