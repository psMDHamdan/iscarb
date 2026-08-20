"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, CheckCircle2, FileText } from "lucide-react";

export function CompetenciesCompetencyPassportView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/v1/student/competencies/passport");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load passport");
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
          title={ar ? "جواز كفاءات" : "Competency Passport"}
          description={ar ? "شهادة موثقة لكفاءاتك المثبتة" : "Verified credential document of your competencies"}
        />
        <Card>
          <CardContent className="p-12 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-iscarb-green" />
          </CardContent>
        </Card>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title={ar ? "جواز كفاءات" : "Competency Passport"} />
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

  const { passport, verifiedCompetencies, issuedCredentials, stats, framework } = data;

  return (
    <>
      <PageHeader
        title={ar ? "جواز كفاءات" : "Competency Passport"}
        description={ar ? "وثيقة موثقة لكفاءاتك المثبتة والمعتمدة" : "Verified document of your verified competencies and credentials"}
      />

      <div className="space-y-6 pb-12">
        {/* Passport Header */}
        <Card className="bg-gradient-to-r from-iscarb-blue/10 to-iscarb-green/10 border-iscarb-blue">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">{ar ? "جواز كفاءات موثق" : "Verified Competency Passport"}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {ar ? "صادر في" : "Issued"}: {new Date(passport.issuedAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}
                </p>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">{ar ? "المستوى الكلي" : "Avg Level"}</p>
                    <p className="text-2xl font-bold">{stats.avgLevel}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{ar ? "المعتمدات" : "Credentials"}</p>
                    <p className="text-2xl font-bold">{stats.credentialsIssued}</p>
                  </div>
                </div>
              </div>
              <FileText className="h-12 w-12 text-iscarb-blue/20" />
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  {ar ? "الكفاءات الموثقة" : "Verified Competencies"}
                </p>
                <p className="text-2xl font-bold mt-2">{stats.totalVerified}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  {ar ? "متوسط المستوى" : "Average Level"}
                </p>
                <p className="text-2xl font-bold mt-2">{stats.avgLevel}%</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  {ar ? "المعتمدات الرقمية" : "Digital Credentials"}
                </p>
                <p className="text-2xl font-bold mt-2">{stats.credentialsIssued}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Verified Competencies */}
        {verifiedCompetencies && verifiedCompetencies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{ar ? "الكفاءات الموثقة" : "Verified Competencies"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {verifiedCompetencies.map((comp) => (
                  <div key={comp.competencyId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm">{comp.name}</h4>
                      <Badge variant={comp.status === "verified" ? "default" : "secondary"}>
                        {comp.level}%
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                        <span>{ar ? "مستوى الكفاءة" : "Proficiency"}</span>
                        <span className="text-muted-foreground">{comp.level}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                        <span>{ar ? "الأدلة" : "Evidence"}</span>
                        <span className="text-muted-foreground">{comp.evidenceCount}</span>
                      </div>
                      {comp.verifiedAt && (
                        <div className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                          <span>{ar ? "التحقق في" : "Verified"}</span>
                          <span className="text-muted-foreground">
                            {new Date(comp.verifiedAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Issued Credentials */}
        {issuedCredentials && issuedCredentials.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{ar ? "المعتمدات الموثقة" : "Issued Credentials"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {issuedCredentials.map((cred) => (
                  <div key={cred.id} className="flex items-center justify-between p-4 border rounded bg-green-50">
                    <div>
                      <h4 className="font-semibold text-sm">{cred.name}</h4>
                      <p className="text-xs text-muted-foreground">{ar ? "الجهة الإصدارية" : "Issuer"}: {cred.issuer}</p>
                    </div>
                    <Badge className="bg-green-600">{cred.status}</Badge>
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
