"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Wallet, Award, ExternalLink, QrCode, X, Filter } from "lucide-react";
import { proxiedImageUrl } from "@/lib/image-proxy";

interface CredentialItem {
  id: string;
  name: string;
  issuer: string;
  description: string | null;
  issuedAt: string;
  expiresAt: string | null;
  status: string;
  credentialUrl: string | null;
  imageUrl: string | null;
  type: string;
  verifiable: boolean;
}

interface WalletData {
  credentials: CredentialItem[];
  issuers: string[];
  stats: {
    total: number;
    active: number;
    expired: number;
    revoked: number;
  };
  total: number;
}

function QRModal({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(canvasRef.current, url, { width: 200, margin: 2 }, (err) => {
        if (err) console.error("QR generation failed:", err);
      });
    });
  }, [url]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl max-w-xs w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm truncate pr-2">{name}</h3>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-center mb-3">
          <canvas ref={canvasRef} />
        </div>
        <p className="text-xs text-muted-foreground text-center break-all">{url}</p>
      </div>
    </div>
  );
}

export function CompetenciesCredentialWalletView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [qrModal, setQrModal] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    const url = activeFilter === "all"
      ? "/api/v1/student/competencies/credential-wallet"
      : `/api/v1/student/competencies/credential-wallet?status=${activeFilter}`;
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((result) => setData(result.data))
      .catch((err) => setError(err.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [activeFilter]);

  if (loading) {
    return (
      <>
        <PageHeader
          title={ar ? "محفظة الاعتمادات" : "Credential Wallet"}
          description={ar ? "جميع اعتماداتك الرقمية في مكان واحد" : "All your digital credentials in one place"}
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
        <PageHeader title={ar ? "محفظة الاعتمادات" : "Credential Wallet"} />
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

  const STATUS_BADGE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    active: "default",
    expired: "destructive",
    revoked: "destructive",
  };

  return (
    <>
      <PageHeader
        title={ar ? "محفظة الاعتمادات" : "Credential Wallet"}
        description={ar ? "مجموعة شاملة من جميع اعتماداتك الرقمية والشهادات" : "Your complete collection of digital credentials and certificates"}
      />

      {qrModal && (
        <QRModal url={qrModal.url} name={qrModal.name} onClose={() => setQrModal(null)} />
      )}

      <div className="space-y-6 pb-12">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: ar ? "إجمالي" : "Total", value: data.stats.total, color: "" },
            { label: ar ? "نشطة" : "Active", value: data.stats.active, color: "text-green-600" },
            { label: ar ? "منتهية" : "Expired", value: data.stats.expired, color: "text-amber-600" },
            { label: ar ? "ملغاة" : "Revoked", value: data.stats.revoked, color: "text-red-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
                <p className={`text-2xl font-bold mt-2 ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {["all", "active", "expired", "revoked"].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${activeFilter === f
                  ? "bg-iscarb-green text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              {f === "all" ? (ar ? "الكل" : "All") : f}
            </button>
          ))}
        </div>

        {/* Credential Cards */}
        {data.credentials.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.credentials.map((cred) => (
              <Card key={cred.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      {cred.imageUrl ? (
                        <img src={proxiedImageUrl(cred.imageUrl)} alt={cred.name} className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-iscarb-blue/10 flex items-center justify-center">
                          <Award className="h-5 w-5 text-iscarb-blue" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm leading-tight truncate">{cred.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{cred.issuer}</p>
                      </div>
                    </div>
                    <Badge variant={STATUS_BADGE[cred.status] || "outline"} className="text-xs ml-2 shrink-0">
                      {cred.status}
                    </Badge>
                  </div>

                  {/* Description */}
                  {cred.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{cred.description}</p>
                  )}

                  {/* Type badge */}
                  <Badge variant="outline" className="text-xs capitalize mb-3">{cred.type}</Badge>

                  {/* Dates */}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>{ar ? "صادر" : "Issued"}:</span>
                      <span>{new Date(cred.issuedAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}</span>
                    </div>
                    {cred.expiresAt && (
                      <div className="flex justify-between">
                        <span>{ar ? "ينتهي" : "Expires"}:</span>
                        <span className={new Date(cred.expiresAt) < new Date() ? "text-red-500" : ""}>
                          {new Date(cred.expiresAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-3 border-t">
                    {cred.verifiable && cred.credentialUrl && (
                      <>
                        <a href={cred.credentialUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <Button variant="outline" size="sm" className="w-full h-7 text-xs">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {ar ? "تحقق" : "Verify"}
                          </Button>
                        </a>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => setQrModal({ url: cred.credentialUrl!, name: cred.name })}
                        >
                          <QrCode className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {!cred.verifiable && (
                      <p className="text-xs text-muted-foreground">{ar ? "لا يوجد رابط تحقق" : "No verification link"}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">{ar ? "لا توجد اعتمادات" : "No credentials"}</h3>
              <p className="text-sm text-muted-foreground">
                {activeFilter === "all"
                  ? (ar ? "لم تحصل على أي اعتمادات رقمية بعد" : "You haven't earned any digital credentials yet")
                  : (ar ? `لا توجد اعتمادات بحالة "${activeFilter}"` : `No ${activeFilter} credentials`)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
