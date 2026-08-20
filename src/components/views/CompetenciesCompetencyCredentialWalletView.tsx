"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Trash2, Download } from "lucide-react";
import { proxiedImageUrl } from "@/lib/image-proxy";

export function CompetenciesCompetencyCredentialWalletView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/student/competencies/credential-wallet?status=${statusFilter}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (credentialId: string) => {
    if (!confirm(ar ? "هل أنت متأكد؟" : "Are you sure?")) return;

    try {
      const res = await fetch(`/api/v1/student/competencies/credential-wallet?id=${credentialId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete credential");
      await fetchCredentials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete credential");
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title={ar ? "محفظة الاعتمادات" : "Credential Wallet"}
          description={ar ? "إدارة اعتماداتك الرقمية" : "Manage your digital credentials"}
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
        <PageHeader title={ar ? "محفظة الاعتمادات" : "Credential Wallet"} />
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

  const { credentials, issuers, stats } = data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "revoked":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <>
      <PageHeader
        title={ar ? "محفظة الاعتمادات" : "Credential Wallet"}
        description={ar ? "إدارة اعتماداتك الرقمية والشهادات" : "Manage your digital credentials and certificates"}
      />

      <div className="space-y-6 pb-12">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  {ar ? "إجمالي" : "Total"}
                </p>
                <p className="text-2xl font-bold mt-2">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  {ar ? "نشطة" : "Active"}
                </p>
                <p className="text-2xl font-bold mt-2 text-green-600">{stats.active}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  {ar ? "منتهية" : "Expired"}
                </p>
                <p className="text-2xl font-bold mt-2 text-red-600">{stats.expired}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  {ar ? "ملغاة" : "Revoked"}
                </p>
                <p className="text-2xl font-bold mt-2 text-gray-600">{stats.revoked}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => {
              setStatusFilter("all");
            }}
            size="sm"
          >
            {ar ? "الكل" : "All"}
          </Button>
          <Button
            variant={statusFilter === "active" ? "default" : "outline"}
            onClick={() => {
              setStatusFilter("active");
            }}
            size="sm"
          >
            {ar ? "نشطة" : "Active"}
          </Button>
          <Button
            variant={statusFilter === "expired" ? "default" : "outline"}
            onClick={() => {
              setStatusFilter("expired");
            }}
            size="sm"
          >
            {ar ? "منتهية" : "Expired"}
          </Button>
        </div>

        {/* Credentials Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {credentials.map((cred) => (
            <Card key={cred.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                {cred.badge && (
                  <img
                    src={proxiedImageUrl(cred.badge)}
                    alt={cred.name}
                    className="w-16 h-16 mx-auto mb-4 object-contain"
                  />
                )}
                <h4 className="font-semibold text-sm mb-2 line-clamp-2">{cred.name}</h4>
                <p className="text-xs text-muted-foreground mb-3">{cred.issuer}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{ar ? "الحالة" : "Status"}</span>
                    <Badge className={getStatusColor(cred.status)}>{cred.status}</Badge>
                  </div>
                  {cred.issuedAt && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{ar ? "الإصدار" : "Issued"}</span>
                      <span>{new Date(cred.issuedAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}</span>
                    </div>
                  )}
                  {cred.expiresAt && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{ar ? "انتهاء" : "Expires"}</span>
                      <span>{new Date(cred.expiresAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {cred.verifiable && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(cred.credentialUrl, "_blank")}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      {ar ? "تحقق" : "Verify"}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(cred.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {credentials.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">{ar ? "لا توجد اعتمادات" : "No credentials yet"}</p>
            </CardContent>
          </Card>
        )}

        {/* By Issuer */}
        {issuers && issuers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{ar ? "حسب الجهة" : "By Issuer"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {issuers.map((issuer) => (
                  <div key={issuer} className="flex justify-between p-3 border rounded bg-gray-50">
                    <span className="text-sm font-medium">{issuer}</span>
                    <Badge variant="secondary">{stats.byIssuer[issuer] || 0}</Badge>
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
