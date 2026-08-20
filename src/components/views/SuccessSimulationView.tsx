"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  AlertCircle,
  Play,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAnalytics } from "@/hooks/useAnalytics";

interface Simulation {
  id: string;
  scenarioType: string;
  scenarioName: string;
  description?: string;
  startedAt: string;
  completedAt?: string;
  outcome: string;
  score: number;
  feedbackGiven?: string;
}

export function SuccessSimulationView() {
  const { lang } = useApp();
  const { trackEvent } = useAnalytics();
  const ar = lang === "ar";

  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);
  const [showStartDialog, setShowStartDialog] = useState(false);

  useEffect(() => {
    fetchSimulations();
  }, []);

  const fetchSimulations = async () => {
    try {
      setLoading(true);
      trackEvent("page_view", { section: "success", page: "simulation" });

      const response = await fetch("/api/v1/student/simulation");
      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      if (result.success) {
        setSimulations(result.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      trackEvent("error", { section: "success", page: "simulation", error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const startSimulation = async (scenarioType: string) => {
    try {
      const response = await fetch("/api/v1/student/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioType,
          scenarioName: `${scenarioType} Simulation`,
          description: `Practice ${scenarioType} scenario`,
        }),
      });

      if (response.ok) {
        trackEvent("simulation_started", { type: scenarioType });
        setShowStartDialog(false);
        fetchSimulations();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const breadcrumbs = [
    { label: ar ? "الرئيسية" : "Home", href: "/student" },
    { label: ar ? "النجاح" : "Success", href: "/student/success" },
    { label: ar ? "المحاكاة" : "Simulation", href: "/student/success/simulation" },
  ];

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "المحاكاة" : "Simulation"} breadcrumbs={breadcrumbs} />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={ar ? "محاكاة المسار الوظيفي" : "Career Simulation"}
        description={ar ? "جرب سيناريوهات مختلفة" : "Practice different scenarios"}
        breadcrumbs={breadcrumbs}
      />

      <div className="space-y-6 pb-12">
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Start New Simulation */}
        <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
          <DialogTrigger asChild>
            <Card className="border-2 border-dashed border-green-300 bg-green-50 hover:border-green-500 hover:shadow-md transition cursor-pointer">
              <CardContent className="pt-8 pb-8 text-center">
                <Play className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h3 className="font-bold text-lg text-green-900 mb-2">
                  {ar ? "ابدأ محاكاة جديدة" : "Start New Simulation"}
                </h3>
                <p className="text-sm text-green-700">
                  {ar ? "تدرب على سيناريوهات جديدة" : "Practice new scenarios"}
                </p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{ar ? "اختر السيناريو" : "Choose Scenario"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Button
                onClick={() => startSimulation("careerPath")}
                className="w-full justify-start"
              >
                {ar ? "مسار الوظيفة" : "Career Path"}
              </Button>
              <Button
                onClick={() => startSimulation("interview")}
                variant="outline"
                className="w-full justify-start"
              >
                {ar ? "مقابلة العمل" : "Job Interview"}
              </Button>
              <Button
                onClick={() => startSimulation("negotiation")}
                variant="outline"
                className="w-full justify-start"
              >
                {ar ? "التفاوض" : "Negotiation"}
              </Button>
              <Button
                onClick={() => startSimulation("decisionMaking")}
                variant="outline"
                className="w-full justify-start"
              >
                {ar ? "اتخاذ القرار" : "Decision Making"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Simulations Grid */}
        {simulations.length === 0 ? (
          <Card>
            <CardContent className="pt-12 text-center pb-12">
              <Zap className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{ar ? "لا توجد محاكاات بعد" : "No simulations yet"}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {simulations.map((sim) => (
              <Card
                key={sim.id}
                className="hover:shadow-md transition cursor-pointer"
                onClick={() => setSelectedSimulation(sim)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{sim.scenarioName}</h3>
                      <p className="text-sm text-gray-600 capitalize">{sim.scenarioType}</p>
                    </div>
                    {sim.completedAt && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{sim.score}%</div>
                        <p className="text-xs text-green-600">{ar ? "النتيجة" : "Score"}</p>
                      </div>
                    )}
                  </div>

                  {sim.description && (
                    <p className="text-sm text-gray-600 mb-3">{sim.description}</p>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">
                      {ar ? "البدء:" : "Started:"} {new Date(sim.startedAt).toLocaleDateString()}
                    </p>
                    {sim.completedAt && (
                      <p className="text-xs text-gray-500">
                        {ar ? "النهاية:" : "Completed:"} {new Date(sim.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {!sim.completedAt && (
                    <Button className="w-full mt-4" size="sm">
                      {ar ? "استكمل" : "Continue"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Simulation Types */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg">{ar ? "أنواع المحاكاة" : "Available Simulations"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
              <p className="text-sm font-medium text-blue-900">{ar ? "مسار الوظيفة" : "Career Path"}</p>
              <p className="text-xs text-blue-700 mt-1">
                {ar ? "اختبر قرارات المسار الوظيفي المختلفة" : "Test different career path decisions"}
              </p>
            </div>
            <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
              <p className="text-sm font-medium text-green-900">{ar ? "مقابلة العمل" : "Job Interview"}</p>
              <p className="text-xs text-green-700 mt-1">
                {ar ? "تدرب على مقابلات العمل" : "Practice job interview skills"}
              </p>
            </div>
            <div className="p-3 bg-orange-50 border-l-4 border-orange-500 rounded">
              <p className="text-sm font-medium text-orange-900">{ar ? "التفاوض" : "Negotiation"}</p>
              <p className="text-xs text-orange-700 mt-1">
                {ar ? "تطور مهارات التفاوض" : "Develop negotiation skills"}
              </p>
            </div>
            <div className="p-3 bg-purple-50 border-l-4 border-purple-500 rounded">
              <p className="text-sm font-medium text-purple-900">{ar ? "اتخاذ القرار" : "Decision Making"}</p>
              <p className="text-xs text-purple-700 mt-1">
                {ar ? "تحسين اتخاذ القرارات" : "Improve decision making"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
