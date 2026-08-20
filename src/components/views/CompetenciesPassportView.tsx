"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle2, Award, Shield, FileText, ExternalLink } from "lucide-react";

interface VerifiedCompetency {
  competencyId: string;
  name: string;
  level: number;
  verifiedAt: string;
  evidenceCount: number;
  status: "verified" | "in_progress";
}

interface IssuedCredential {
  id: string;
  name: string;
  issuer: string;
  issuedAt: string;
  expiresAt: string | null;
  credentialUrl: string | null;
  status: string;
}

interface PassportData {
  passport: {
    id: string;
    studentId: string;
    issuedAt: string;
    expiresAt: string;
    status: string;
    verificationUrl: string;
  };
  verifiedCompetencies: VerifiedCompetency[];
  issuedCredentials: IssuedCredential[];
  stats: { totalVerified: number; avgLevel: number; credentialsIssued: number };
  framework: { id: string; name: string } | null;
}

export function CompetenciesPassportView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data: rawRes, isLoading: loading, error: queryError, refetch } = useApiQuery<any>(
    ["student", "competencies", "passport"],
    "/api/v1/student/competencies/passport",
  );
  const data = rawRes?.data ?? rawRes as PassportData | null;
  const error = queryError?.message ?? null;

  if (loading) {
    return (
      <>
        <PageHeader
          title={ar ? "جواز الكفاءات" : "Competency Passport"}
          description={ar ? "وثيقتك الرقمية لكفاءاتك الموثقة" : "Your verified digital competency credential"}
        />
        <Card>
          <CardContent className="p-12 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-iscarb-green mb-3" />
            <p className="text-sm text-muted-foreground">{ar ? "جاري التحميل..." : "Loading..."}</p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title={ar ? "جواز الكفاءات" : "Competency Passport"} />
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">{ar ? "خطأ" : "Error"}</h4>
              <p className="text-sm mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
                {ar ? "إعادة المحاولة" : "Retry"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={ar ? "جواز الكفاءات" : "Competency Passport"}
        description={ar ? "وثيقة موثقة لكفاءاتك المثبتة والمعتمدة" : "Verified document of your competencies and credentials"}
      />

      <div className="space-y-6 pb-12">
        {/* Passport Card — styled like a physical passport */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-iscarb-blue/30 bg-gradient-to-br from-iscarb-blue/10 via-white to-iscarb-green/10 p-6 shadow-lg dark:from-iscarb-blue/20 dark:via-gray-900 dark:to-iscarb-green/20">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-iscarb-green/10 dark:bg-iscarb-green/20" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-iscarb-blue/10 dark:bg-iscarb-blue/20" />

          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-6 w-6 text-iscarb-blue" />
                <span className="text-xs font-bold uppercase tracking-widest text-iscarb-blue">
                  {ar ? "جواز الكفاءات الرقمي" : "Digital Competency Passport"}
                </span>
              </div>
              {data.framework && (
                <p className="text-xs text-muted-foreground mb-4">{data.framework.name}</p>
              )}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{ar ? "الكفاءات الموثقة" : "Verified"}</p>
                  <p className="text-3xl font-bold text-iscarb-green">{data.stats.totalVerified}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{ar ? "متوسط المستوى" : "Avg Level"}</p>
                  <p className="text-3xl font-bold">{data.stats.avgLevel}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{ar ? "الاعتمادات" : "Credentials"}</p>
                  <p className="text-3xl font-bold text-iscarb-blue">{data.stats.credentialsIssued}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Award className="h-16 w-16 text-iscarb-blue/20" />
            </div>
          </div>

          <div className="relative mt-4 pt-4 border-t border-iscarb-blue/20 flex items-center justify-between">
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>{ar ? "صادر في" : "Issued"}: {new Date(data.passport.issuedAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}</p>
              <p>{ar ? "صالح حتى" : "Expires"}: {new Date(data.passport.expiresAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}</p>
              <p className="font-mono text-[10px] opacity-60">ID: {data.passport.id.slice(-12).toUpperCase()}</p>
            </div>
            <Badge className="bg-green-600 text-white">{ar ? "نشط" : "Active"}</Badge>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: ar ? "الكفاءات الموثقة" : "Verified Competencies", value: data.stats.totalVerified, color: "text-green-600" },
            { label: ar ? "متوسط المستوى" : "Average Level", value: `${data.stats.avgLevel}%`, color: "" },
            { label: ar ? "الاعتمادات الرقمية" : "Digital Credentials", value: data.stats.credentialsIssued, color: "text-iscarb-blue" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
                <p className={`text-2xl font-bold mt-2 ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Verified Competencies */}
        {data.verifiedCompetencies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {ar ? "الكفاءات الموثقة" : "Verified Competencies"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {data.verifiedCompetencies.map((comp) => (
                  <div key={comp.competencyId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">{comp.name}</h4>
                      <Badge
                        variant={comp.status === "verified" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {comp.level}%
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>{ar ? "الأدلة" : "Evidence"}</span>
                        <span className="font-semibold">{comp.evidenceCount} {ar ? "عناصر" : "items"}</span>
                      </div>
                      {comp.verifiedAt && (
                        <div className="flex justify-between">
                          <span>{ar ? "التحقق في" : "Verified"}</span>
                          <span>{new Date(comp.verifiedAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}</span>
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
        {data.issuedCredentials.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />
                {ar ? "الاعتمادات الصادرة" : "Issued Credentials"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.issuedCredentials.map((cred) => (
                  <div key={cred.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50/50 dark:bg-green-900/10">
                    <div>
                      <h4 className="font-semibold text-sm">{cred.name}</h4>
                      <p className="text-xs text-muted-foreground">{ar ? "الجهة" : "Issuer"}: {cred.issuer}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(cred.issuedAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}
                        {cred.expiresAt && ` → ${new Date(cred.expiresAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-600 text-white text-xs">{cred.status}</Badge>
                      {cred.credentialUrl && (
                        <a href={cred.credentialUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {ar ? "تحقق" : "Verify"}
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {data.verifiedCompetencies.length === 0 && data.issuedCredentials.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">{ar ? "لا توجد كفاءات موثقة بعد" : "No verified competencies yet"}</h3>
              <p className="text-sm text-muted-foreground">
                {ar ? "أضف أدلة لكفاءاتك للحصول على التوثيق" : "Add evidence to your competencies to get verified"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
