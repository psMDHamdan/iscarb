"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useApiQuery, useApiMutation } from "@/lib/use-api-query";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SlidePreviewCard } from "@/components/lecture/SlidePreviewCard";
import { SlideEditorPanel } from "@/components/lecture/SlideEditorPanel";
import { notify } from "@/utils/notify";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SlideContentJson } from "@/lib/lecture/generation/types";

interface ArtifactsResponse {
  project: { id: string; status: string };
  plans: { slideNo: number; function: string; title: string; approved: boolean; interactionType: string | null }[];
  artifacts: { id: string; slideNo: number; version: number; status: string; contentJson: SlideContentJson }[];
}

export default function SlideStudioPage({
  params,
}: {
  params: Promise<{ id: string; slideNo: string }>;
}) {
  const { id, slideNo } = use(params);
  const { lang } = useApp();
  const ar = lang === "ar";
  const slide = Number(slideNo);

  const { data, isLoading, error } = useApiQuery<ArtifactsResponse>(
    ["lecture", "artifacts", id],
    `/api/iscarb/lecture/projects/${id}/artifacts`,
    { staleTime: 0 },
  );

  const artifactId = data?.artifacts.find((a) => a.slideNo === slide)?.id;
  // PATCH body is Partial<SlideContentJson> — send the content fields directly.
  const saveArtifact = useApiMutation<{ artifactId: string; version: number }, SlideContentJson>(
    artifactId ? `/api/iscarb/lecture/artifacts/${artifactId}` : "/api/iscarb/lecture/artifacts/none",
    {
      method: "PATCH",
      invalidateKeys: () => [["lecture", "artifacts", id]],
      onSuccess: () => {
        notify.ok(lang, { en: "Slide saved", ar: "تم حفظ الشريحة" });
      },
      onError: (err) => {
        notify.fail(lang, { en: err.message || "Save failed", ar: err.message || "فشل الحفظ" });
      },
    },
  );

  if (!isLoading && error && !data) {
    if (error.message.includes("404")) notFound();
  }

  const plan = data?.plans.find((p) => p.slideNo === slide);
  const artifact = data?.artifacts.find((a) => a.slideNo === slide);

  // Working copy initialized from the fetched artifact (or plan placeholder).
  const [working, setWorking] = useState<SlideContentJson | null>(null);
  useEffect(() => {
    if (!working && (artifact || plan)) {
      setWorking(
        artifact?.contentJson ?? {
          title: plan?.title ?? "",
          bullets: [],
          visualIntent: "",
          studentAction: "",
          speakerNotes: "",
          citations: [],
          claims: [],
          cloIds: [],
          sourceBlockIds: [],
          wordCount: 0,
        },
      );
    }
  }, [artifact, plan, working]);

  const profileQuery = useApiQuery<{ project: { courseProfile: { languagePolicy: string } } }>(
    ["lecture", "project-profile", id],
    `/api/iscarb/lecture/projects/${id}`,
  );
  const languagePolicy = profileQuery.data?.project?.courseProfile?.languagePolicy ?? "en";

  if (!data && !isLoading) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`S${slide} — ${plan?.function?.replace(/_/g, " ") ?? ""}`}
        description={ar ? "حرر محتوى الشريحة: العنوان، النقاط، النشاط، والملاحظات." : "Edit slide content: title, bullets, student action, and notes."}
        breadcrumbs={[
          { label: ar ? "محاضراتي" : "My Lectures", href: "/faculty/lecture" },
          { label: ar ? "الاستوديو" : "Studio", href: `/faculty/lecture/${id}/studio` },
          { label: `S${slide}` },
        ]}
        actions={artifact && <Badge variant="outline">{artifact.status} · v{artifact.version}</Badge>}
      />

      {isLoading && <Skeleton className="h-96 rounded-xl" />}

      {data && plan && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <SlidePreviewCard
              slideNo={slide}
              content={working}
              projectId={id}
              onSaveVisual={async (visualData) => {
                if (visualData.facultyUploaded && visualData.visualSpec) {
                  setWorking((prev) =>
                    prev
                      ? { ...prev, visualSpec: visualData.visualSpec as any }
                      : prev
                  );
                  return;
                }
              }}
              onRemoveFacultyImage={async () => {
                setWorking((prev) => {
                  if (!prev?.visualSpec) return prev;
                  const next = { ...prev.visualSpec } as Record<string, unknown>;
                  delete next.facultyUploadedUrl;
                  delete next.facultyUploadedStorageKey;
                  delete next.facultyUploadedAt;
                  delete next.facultyUploadedOriginalName;
                  return { ...prev, visualSpec: next as any };
                });
              }}
            />
            <SlideEditorPanel
              content={working ?? { title: "", bullets: [], visualIntent: "", studentAction: "", speakerNotes: "", citations: [], claims: [], cloIds: [], sourceBlockIds: [], wordCount: 0 }}
              onChange={(next) => setWorking(next)}
              showBilingual={languagePolicy !== "en"}
              onSave={() => {
                if (working) void saveArtifact.mutate(working);
              }}
              saving={saveArtifact.isPending}
              onApprove={() => {
                if (working) void saveArtifact.mutate(working);
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            {slide > 1 ? (
              <Link href={`/faculty/lecture/${id}/studio/${slide - 1}`}>
                <Button variant="outline">
                  <ChevronLeft className="mr-2 h-4 w-4" /> S{slide - 1}
                </Button>
              </Link>
            ) : (
              <span />
            )}
            {slide < 20 ? (
              <Link href={`/faculty/lecture/${id}/studio/${slide + 1}`}>
                <Button variant="outline">
                  S{slide + 1} <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <span />
            )}
          </div>
        </>
      )}

      {!isLoading && data && !plan && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            {ar ? "لا توجد خطة لهذه الشريحة" : "No plan exists for this slide"}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
