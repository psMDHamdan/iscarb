"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Plus, Edit2, Trash2, CheckCircle, Clock } from "lucide-react";

export function ResearchPublicationsView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/v1/student/research/publications");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load publications");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (publicationId: string) => {
    if (!confirm(ar ? "هل أنت متأكد من حذف هذا المنشور؟" : "Are you sure you want to delete this publication?")) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/student/research/publications/${publicationId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete publication");

      setData((prev: any) => ({
        ...prev,
        publications: prev.publications.filter((p: any) => p.id !== publicationId),
      }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete publication");
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: "outline",
      submitted: "secondary",
      under_review: "secondary",
      accepted: "secondary",
      published: "default",
      rejected: "destructive",
    };
    return statusMap[status] || "outline";
  };

  const getStatusIcon = (status: string) => {
    if (status === "published") return <CheckCircle className="h-4 w-4" />;
    if (status === "submitted" || status === "under_review") return <Clock className="h-4 w-4" />;
    return null;
  };

  const filteredPublications = !data?.publications
    ? []
    : filter === "all"
    ? data.publications
    : data.publications.filter((p: any) => p.status === filter);

  if (loading) {
    return (
      <>
        <PageHeader
          title={ar ? "المنشورات" : "Publications"}
          description={ar ? "إدارة منشوراتك البحثية والأكاديمية" : "Manage your research and academic publications"}
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
          title={ar ? "المنشورات" : "Publications"}
          description={ar ? "إدارة منشوراتك البحثية والأكاديمية" : "Manage your research and academic publications"}
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
        title={ar ? "المنشورات" : "Publications"}
        description={ar ? "إدارة منشوراتك البحثية والأكاديمية" : "Manage your research and academic publications"}
      />

      <div className="space-y-8 pb-12">
        {/* Stats */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{ar ? "إجمالي المنشورات" : "Total Publications"}</p>
              <p className="text-2xl font-bold mt-1">{data?.stats?.total || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{ar ? "منشورة" : "Published"}</p>
              <p className="text-2xl font-bold mt-1 text-iscarb-green">{data?.stats?.published || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{ar ? "قيد المراجعة" : "Under Review"}</p>
              <p className="text-2xl font-bold mt-1 text-yellow-600">{data?.stats?.underReview || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{ar ? "مسودات" : "Drafts"}</p>
              <p className="text-2xl font-bold mt-1 text-blue-600">{data?.stats?.drafts || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {["all", "draft", "submitted", "under_review", "published", "rejected"].map((status) => (
              <Button
                key={status}
                variant={filter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(status)}
              >
                {status === "all" && (ar ? "الكل" : "All")}
                {status === "draft" && (ar ? "مسودات" : "Draft")}
                {status === "submitted" && (ar ? "مرسلة" : "Submitted")}
                {status === "under_review" && (ar ? "قيد المراجعة" : "Under Review")}
                {status === "published" && (ar ? "منشورة" : "Published")}
                {status === "rejected" && (ar ? "مرفوضة" : "Rejected")}
              </Button>
            ))}
          </div>

          <Button
            onClick={() => window.location.href = "/student/research/publications/new"}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {ar ? "إضافة منشور" : "New Publication"}
          </Button>
        </div>

        {/* Publications List */}
        {filteredPublications.length === 0 ? (
          <Card className="text-center p-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">
              {ar ? "لا توجد منشورات في هذه الفئة" : "No publications in this category"}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPublications.map((publication: any) => (
              <Card key={publication.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{publication.title}</CardTitle>
                        {getStatusIcon(publication.status) && (
                          <div className="text-iscarb-green">{getStatusIcon(publication.status)}</div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{publication.authors}</p>
                    </div>
                    <Badge variant={getStatusColor(publication.status) as any}>
                      {publication.status?.replace("_", " ").charAt(0).toUpperCase() + publication.status?.slice(1).replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {publication.abstract && (
                    <p className="text-sm text-muted-foreground">{publication.abstract.substring(0, 200)}...</p>
                  )}

                  <div className="grid gap-3 md:grid-cols-4">
                    {publication.journal && (
                      <div>
                        <p className="text-xs text-muted-foreground">{ar ? "المجلة" : "Journal"}</p>
                        <p className="text-sm font-medium">{publication.journal}</p>
                      </div>
                    )}
                    {publication.volume && (
                      <div>
                        <p className="text-xs text-muted-foreground">{ar ? "المجلد" : "Volume"}</p>
                        <p className="text-sm font-medium">{publication.volume}</p>
                      </div>
                    )}
                    {publication.year && (
                      <div>
                        <p className="text-xs text-muted-foreground">{ar ? "السنة" : "Year"}</p>
                        <p className="text-sm font-medium">{publication.year}</p>
                      </div>
                    )}
                    {publication.impactFactor && (
                      <div>
                        <p className="text-xs text-muted-foreground">{ar ? "معامل التأثير" : "Impact Factor"}</p>
                        <p className="text-sm font-medium">{publication.impactFactor.toFixed(2)}</p>
                      </div>
                    )}
                  </div>

                  {publication.doi && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">{ar ? "معرف الكائن الرقمي" : "DOI"}</p>
                      <a
                        href={`https://doi.org/${publication.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-iscarb-green hover:underline text-sm font-semibold"
                      >
                        {publication.doi}
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = `/student/research/publications/${publication.id}/edit`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(publication.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
