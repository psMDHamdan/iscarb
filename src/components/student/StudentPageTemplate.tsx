"use client";

import { useState, ReactNode } from "react";
import { useApiQuery, useApiMutation } from "@/hooks/use-api-query";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Sparkles } from "lucide-react";

interface PageTemplateProps {
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  apiEndpoint?: string;
  breadcrumbs?: Array<{ label: string; href: string }>;
  children: ReactNode | ((data: any, isLoading: boolean, error: string | null) => ReactNode);
  aiFeature?: {
    label: string;
    labelAr: string;
    endpoint: string;
    onData?: (data: any) => void;
  };
}

/** Extract a stable query key from the API endpoint path */
function endpointToKey(endpoint: string): string[] {
  return endpoint.replace(/^\/api\//, "").split("/").filter(Boolean);
}

/**
 * Reusable template for student section pages
 * Handles data fetching, loading, error states, and AI features
 */
export function StudentPageTemplate({
  title,
  titleAr,
  description,
  descriptionAr,
  apiEndpoint,
  breadcrumbs,
  children,
  aiFeature,
}: PageTemplateProps) {
  const { data: rawData, isLoading, error: queryError } = useApiQuery<any>(
    apiEndpoint ? endpointToKey(apiEndpoint) : [],
    apiEndpoint ?? "",
    { enabled: !!apiEndpoint },
  );
  const [aiData, setAiData] = useState<any>(null);

  const aiMutation = useApiMutation<any, Record<string, never>>(
    aiFeature?.endpoint ?? "/dev/null",
    {
      method: "POST",
      onSuccess: (result) => {
        setAiData(result.data);
        aiFeature?.onData?.(result.data);
      },
    },
  );

  const data = rawData?.data ?? rawData ?? null;
  const error = queryError ? queryError.message : null;

  // Generate AI feature
  const handleAiFeature = () => {
    if (!aiFeature) return;
    aiMutation.mutate({});
  };

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
      />

      <div className="space-y-6 pb-12">
        {/* AI Feature Card */}
        {aiFeature && !aiData && (
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">{aiFeature.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Powered by AI for personalized insights
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleAiFeature}
                disabled={aiMutation.isPending}
                className="shrink-0"
              >
                {aiMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1" />
                )}
                Generate
              </Button>
            </CardContent>
          </Card>
        )}

        {/* AI Generated Content */}
        {aiData && (
          <Card className="border-iscarb-green/30 bg-iscarb-green/5">
            <CardHeader className="pb-3 border-b border-iscarb-green/20">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-iscarb-green" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {typeof aiData === "string" ? (
                <p className="text-sm text-gray-700">{aiData}</p>
              ) : (
                <pre className="text-xs overflow-auto max-h-40">
                  {JSON.stringify(aiData, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && typeof children !== "function" && (
          <Card>
            <CardContent className="p-12 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-iscarb-green mb-3" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && typeof children !== "function" && (
          <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
            <CardContent className="p-5 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-red-900 dark:text-red-200">
                  Error Loading Page
                </h4>
                <p className="text-sm text-red-800 dark:text-red-300 mt-1">{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Page Content */}
        {typeof children === "function" 
          ? children(data, isLoading, error)
          : (!isLoading && !error && children)}
      </div>
    </>
  );
}

export default StudentPageTemplate;
