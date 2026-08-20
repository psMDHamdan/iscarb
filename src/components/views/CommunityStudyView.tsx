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
import { Users, Plus, BookOpen, Search, Filter } from "lucide-react";

export function CommunityStudyView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const labels = {
    title: ar ? "مجموعات الدراسة" : "Study Groups",
    description: ar ? "جد أو أنشئ مجموعات دراسية للتعلم معاً" : "Find or create study groups to learn together",
    myGroups: ar ? "مجموعاتي" : "My Groups",
    create: ar ? "إنشاء مجموعة" : "Create Group",
    browseGroups: ar ? "استكشاف المجموعات" : "Browse Study Groups",
    groupName: ar ? "اسم المجموعة" : "Group Name",
    subject: ar ? "الموضوع" : "Subject",
    description: ar ? "الوصف" : "Description",
    members: ar ? "أعضاء" : "Members",
    join: ar ? "انضم" : "Join",
    noGroups: ar ? "لم تنضم لأي مجموعات بعد" : "You haven't joined any groups yet",
    noResults: ar ? "لا توجد مجموعات متطابقة" : "No matching study groups",
    searchPlaceholder: ar ? "ابحث عن مجموعات..." : "Search study groups...",
  };

  return (
    <StudentPageTemplate
      title={labels.title}
      titleAr={labels.title}
      description={labels.description}
      descriptionAr={labels.description}
      apiEndpoint="/api/v1/student/community/study-groups"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "المجتمع" : "Community", href: "/student/community" },
        { label: labels.title, href: "/student/community/study-groups" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-6">
          {/* My Groups Section */}
          {data?.myGroups && data.myGroups.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{labels.myGroups}</CardTitle>
                <Dialog open={creating} onOpenChange={setCreating}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      {labels.create}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{labels.create}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input placeholder={labels.groupName} />
                      <Input placeholder={labels.subject} />
                      <Textarea placeholder={labels.description} rows={3} />
                      <Button onClick={() => setCreating(false)} className="w-full">
                        {labels.create}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {data.myGroups.map((group: any) => (
                    <div
                      key={group.id}
                      className="p-4 border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base mb-1">{group.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {group.subject}
                          </Badge>
                        </div>
                        <BookOpen className="h-5 w-5 text-muted-foreground opacity-50" />
                      </div>
                      <p className="text-xs text-muted-foreground my-2 line-clamp-2">
                        {group.description}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
                        <Users className="h-3 w-3" />
                        <span>{group.memberCount || 0} {labels.members}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Browse Groups Section */}
          <Card>
            <CardHeader>
              <CardTitle>{labels.browseGroups}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={labels.searchPlaceholder}
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {data?.subjects && data.subjects.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setSelectedSubject(selectedSubject ? null : data.subjects[0])}
                  >
                    <Filter className="h-4 w-4" />
                    {ar ? "تصفية" : "Filter"}
                  </Button>
                )}
              </div>

              {/* Groups Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data?.groups && data.groups.length > 0 ? (
                  data.groups
                    .filter(
                      (group: any) =>
                        !searchQuery ||
                        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        group.subject.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .filter(
                      (group: any) =>
                        !selectedSubject || group.subject === selectedSubject
                    )
                    .map((group: any) => (
                      <div
                        key={group.id}
                        className="p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-base mb-1">{group.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {group.subject}
                            </Badge>
                          </div>
                          <BookOpen className="h-5 w-5 text-muted-foreground opacity-50" />
                        </div>
                        <p className="text-xs text-muted-foreground my-3 line-clamp-2">
                          {group.description?.substring(0, 100)}
                          {group.description?.length > 100 ? "..." : ""}
                        </p>
                        <div className="flex items-center justify-between pt-3 border-t">
                          <span className="text-xs flex items-center gap-1 text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {group.memberCount || 0}
                          </span>
                          <Button size="sm">{labels.join}</Button>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                    <p className="text-muted-foreground">{labels.noResults}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Create Group Button (if no groups) */}
          {(!data?.myGroups || data.myGroups.length === 0) && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">{labels.noGroups}</p>
                <Dialog open={creating} onOpenChange={setCreating}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      {labels.create}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{labels.create}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input placeholder={labels.groupName} />
                      <Input placeholder={labels.subject} />
                      <Textarea placeholder={labels.description} rows={3} />
                      <Button onClick={() => setCreating(false)} className="w-full">
                        {labels.create}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </StudentPageTemplate>
  );
}
