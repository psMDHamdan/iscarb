"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Network } from "lucide-react";

export function CompetenciesCompetencyView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/v1/student/competencies/graph");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load graph");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <>
        <PageHeader
          title={ar ? "رسم بياني للكفاءات" : "Competency Graph"}
          description={ar ? "تصور العلاقات بين الكفاءات" : "Visualize competency relationships and prerequisites"}
        />
        <Card>
          <CardContent className="p-12 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-iscarb-green mb-3" />
          </CardContent>
        </Card>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title={ar ? "رسم بياني للكفاءات" : "Competency Graph"} />
        <Card className="border-red-200 bg-red-50/50">
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

  const { graph, metrics, framework } = data;

  return (
    <>
      <PageHeader
        title={ar ? "رسم بياني للكفاءات" : "Competency Graph"}
        description={ar ? "خريطة تفاعلية لكفاءاتك والعلاقات بينها" : "Interactive map of your competencies and their relationships"}
      />

      <div className="space-y-6 pb-12">
        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">{ar ? "العقد الكلية" : "Total Nodes"}</p>
                  <p className="text-2xl font-bold mt-2">{metrics.totalNodes}</p>
                </div>
                <Network className="h-8 w-8 text-iscarb-blue/30" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">{ar ? "المقيّمة" : "Assessed"}</p>
                <p className="text-2xl font-bold mt-2">{metrics.assessedNodes}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">{ar ? "متوسط الإتقان" : "Avg Mastery"}</p>
                <p className="text-2xl font-bold mt-2">{metrics.avgMastery.toFixed(1)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">{ar ? "اكتمال %" : "Completion %"}</p>
                <p className="text-2xl font-bold mt-2">{metrics.completionRate}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graph Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{ar ? "شبكة الكفاءات" : "Competency Network"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 min-h-96 flex items-center justify-center">
              <div className="text-center">
                <Network className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-muted-foreground">
                  {ar ? "رسم بياني تفاعلي يعرض" : "Interactive graph showing"} {metrics.totalNodes} {ar ? "عقدة" : "nodes"} {ar ? "و" : "and"} {graph.edges.length} {ar ? "اتصال" : "connections"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nodes List */}
        {graph.nodes && graph.nodes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{ar ? "الكفاءات" : "Competencies"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {graph.nodes.slice(0, 12).map((node: any) => (
                  <div key={node.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm">{node.name}</h4>
                      <Badge variant={node.assessed ? "default" : "outline"} className="text-xs">
                        {node.assessed ? (ar ? "مقيّم" : "Assessed") : (ar ? "جديد" : "New")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 capitalize">{node.category}</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>{ar ? "الحالي" : "Current"}:</span>
                        <span className="font-semibold">{Math.round(node.currentLevel)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{ar ? "الهدف" : "Target"}:</span>
                        <span className="font-semibold">{Math.round(node.targetLevel)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
