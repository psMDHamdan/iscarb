"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertCircle, BookOpen, FileText, Heart, HeartOff } from "lucide-react";

export function CareerFundingView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("programs");
  const [submitting, setSubmitting] = useState(false);
  const [savedPrograms, setSavedPrograms] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/student/career/funding");
      if (!response.ok) throw new Error("Failed to fetch funding data");
      const result = await response.json();
      setData(result.data);

      if (result.data?.saves) {
        setSavedPrograms(new Set(result.data.saves.map((s: any) => s.programId)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProgram = async (programId: string) => {
    try {
      setSubmitting(true);
      const isSaved = savedPrograms.has(programId);

      const response = await fetch("/api/v1/student/career/funding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          programId,
          status: isSaved ? "saved" : "saved",
        }),
      });

      if (!response.ok) throw new Error("Failed to save program");

      setSavedPrograms(prev => {
        const newSet = new Set(prev);
        if (isSaved) {
          newSet.delete(programId);
        } else {
          newSet.add(programId);
        }
        return newSet;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApply = async (fundingId: string) => {
    try {
      setSubmitting(true);
      const response = await fetch("/api/v1/student/career/funding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply",
          fundingId,
          status: "draft",
        }),
      });

      if (!response.ok) throw new Error("Failed to apply");
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={ar ? "التمويل" : "Funding"} />
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={ar ? "التمويل" : "Funding"} />
        <Card className="border-destructive">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <span className="text-destructive">{error}</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={ar ? "التمويل" : "Funding"}
        description={ar ? "اكتشف الفرص التمويلية والمنح الدراسية" : "Discover funding opportunities and scholarships"}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="programs">
            {ar ? "البرامج" : "Programs"} ({data?.programs?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="applications">
            {ar ? "الطلبات" : "Applications"} ({data?.applications?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="saves">
            {ar ? "المحفوظة" : "Saved"} ({data?.saves?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="space-y-4">
          {data?.programs && data.programs.length > 0 ? (
            <div className="grid gap-4">
              {data.programs.map((program: any) => (
                <Card key={program.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{program.nameEn}</h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                            {program.provider}
                          </span>
                        </div>

                        {program.nameAr && (
                          <p className="text-sm text-muted-foreground mb-2">{program.nameAr}</p>
                        )}

                        <p className="text-sm text-muted-foreground mb-3">{program.descriptionEn}</p>

                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div>
                            <span className="font-medium">{ar ? "النوع:" : "Type:"}</span>
                            <p className="text-muted-foreground capitalize">{program.type}</p>
                          </div>
                          <div>
                            <span className="font-medium">{ar ? "المرحلة:" : "Stage:"}</span>
                            <p className="text-muted-foreground capitalize">{program.stage}</p>
                          </div>
                          {program.sector && (
                            <div>
                              <span className="font-medium">{ar ? "القطاع:" : "Sector:"}</span>
                              <p className="text-muted-foreground">{program.sector}</p>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground bg-muted p-2 rounded mb-3">
                          {program.amountNote}
                        </p>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleSaveProgram(program.id)}
                          variant={savedPrograms.has(program.id) ? "default" : "outline"}
                          disabled={submitting}
                        >
                          {savedPrograms.has(program.id) ? (
                            <Heart className="w-4 h-4" />
                          ) : (
                            <HeartOff className="w-4 h-4" />
                          )}
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleApply(program.id)}
                          disabled={submitting}
                        >
                          {submitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            ar ? "تقدم" : "Apply"
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-8">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {ar ? "لا توجد برامج تمويل متاحة" : "No funding programs available"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          {data?.applications && data.applications.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {data.applications.map((app: any) => (
                <Card key={app.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{app.fundingName}</CardTitle>
                    <p className="text-xs text-muted-foreground">{app.provider}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        {ar ? "الحالة" : "Status"}
                      </div>
                      <div className="inline-flex items-center px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium capitalize">
                        {app.status}
                      </div>
                    </div>

                    {app.gpa && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          {ar ? "المعدل التراكمي" : "GPA"}
                        </div>
                        <p className="text-sm font-medium">{app.gpa}</p>
                      </div>
                    )}

                    {app.awardAmount && (
                      <div className="bg-green-50 p-2 rounded">
                        <div className="text-xs font-medium text-green-700 mb-1">
                          {ar ? "المبلغ الممنوح" : "Award Amount"}
                        </div>
                        <p className="text-lg font-bold text-green-700">
                          {app.awardAmount.toLocaleString()} SAR
                        </p>
                      </div>
                    )}

                    <div className="border-t pt-3 text-xs text-muted-foreground">
                      {app.appliedAt && (
                        <p>{ar ? "تقدم:" : "Applied:"} {new Date(app.appliedAt).toLocaleDateString()}</p>
                      )}
                      {app.decisionAt && (
                        <p>{ar ? "القرار:" : "Decision:"} {new Date(app.decisionAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  {ar ? "لم تقدم على أي برامج تمويل بعد" : "No applications yet"}
                </p>
                <Button onClick={() => setActiveTab("programs")}>
                  {ar ? "تصفح البرامج" : "Browse Programs"}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="saves" className="space-y-4">
          {data?.saves && data.saves.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {data.saves.map((save: any) => (
                <Card key={save.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{save.programName}</p>
                        <p className="text-xs text-muted-foreground">{save.provider}</p>
                      </div>
                      <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                    </div>

                    {save.notes && (
                      <p className="text-sm text-muted-foreground mt-3 p-2 bg-muted rounded">
                        {save.notes}
                      </p>
                    )}

                    <div className="flex gap-2 mt-3">
                      <Button size="sm" className="flex-1" onClick={() => handleApply(save.programId)}>
                        {ar ? "تقدم الآن" : "Apply Now"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSaveProgram(save.programId)}
                        disabled={submitting}
                      >
                        {ar ? "إزالة" : "Remove"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-8">
                <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  {ar ? "لم تحفظ أي برامج بعد" : "No saved programs yet"}
                </p>
                <Button onClick={() => setActiveTab("programs")}>
                  {ar ? "اكتشف البرامج" : "Discover Programs"}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
