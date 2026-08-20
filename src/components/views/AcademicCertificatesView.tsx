"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, AlertTriangle, Award, BadgeCheck, Brain, CheckCircle, Download, ExternalLink, FileBadge, GraduationCap, Shield, Sparkles, Star, Trophy, X } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";

interface AcademicCertificatesViewProps {
  apiEndpoint?: string;
}

export function AcademicCertificatesView({ apiEndpoint = "/api/v1/student/academic/certificates" }: AcademicCertificatesViewProps) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [tab, setTab] = useState<"certificates" | "badges" | "skills">("certificates");
  const [selectedCert, setSelectedCert] = useState<any>(null);

  const { data, isLoading: loading, error } = useApiQuery<any>(
    ["academic", "certificates", apiEndpoint],
    apiEndpoint
  );

  if (loading) {
    return (
      <><PageHeader title={ar ? "الشهادات" : "Certificates"} />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map(i => <Card key={i}><CardContent className="p-12 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-iscarb-green" /></CardContent></Card>)}
        </div>
      </>
    );
  }

  if (error || !data?.data) {
    return (
      <><PageHeader title={ar ? "الشهادات" : "Certificates"} />
        <Card className="border-red-200 bg-red-50/50"><CardContent className="p-5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div><h4 className="font-semibold text-sm">{ar ? "خطأ" : "Error"}</h4>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>{ar ? "إعادة تحميل" : "Retry"}</Button></div>
        </CardContent></Card>
      </>
    );
  }

  const d = data.data;
  const certificates = d.certificates || [];
  const badges = d.badges || [];
  const total = d.total || 0;

  const earnedBadges = badges.filter((b: any) => b.earned);
  const pendingBadges = badges.filter((b: any) => !b.earned);

  return (
    <>
      <PageHeader title={ar ? "الشهادات والإنجازات" : "Certificates & Achievements"}
        description={ar ? `${certificates.length} شهادة، ${earnedBadges.length} شارة` : `${certificates.length} certificates, ${earnedBadges.length} badges`} />

      <div className="space-y-6 pb-12">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="bg-gradient-to-br from-iscarb-cyan/5 to-transparent border-iscarb-cyan/20">
            <CardContent className="p-4 text-center">
              <FileBadge className="h-5 w-5 text-iscarb-cyan mx-auto mb-1" />
              <p className="text-2xl font-bold text-iscarb-cyan">{certificates.length}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "الشهادات" : "Certificates"}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-transparent border-emerald-200/50">
            <CardContent className="p-4 text-center">
              <Trophy className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-emerald-600">{earnedBadges.length}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "الشارات" : "Badges"}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-transparent border-amber-200/50">
            <CardContent className="p-4 text-center">
              <Brain className="h-5 w-5 text-amber-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-amber-600">{pendingBadges.length}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "قيد الإنجاز" : "In Progress"}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-transparent border-purple-200/50">
            <CardContent className="p-4 text-center">
              <Shield className="h-5 w-5 text-purple-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-purple-600">{total}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "الإجمالي" : "Total"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <Button size="sm" variant={tab === "certificates" ? "default" : "outline"} onClick={() => setTab("certificates")}
            className={tab === "certificates" ? "bg-iscarb-cyan hover:bg-iscarb-cyan/90" : ""}>
            <FileBadge className="h-3 w-3 mr-1.5" />{ar ? "الشهادات" : "Certificates"}
          </Button>
          <Button size="sm" variant={tab === "badges" ? "default" : "outline"} onClick={() => setTab("badges")}
            className={tab === "badges" ? "bg-iscarb-cyan hover:bg-iscarb-cyan/90" : ""}>
            <Trophy className="h-3 w-3 mr-1.5" />{ar ? "الشارات" : "Badges"}
          </Button>
          <Button size="sm" variant={tab === "skills" ? "default" : "outline"} onClick={() => setTab("skills")}
            className={tab === "skills" ? "bg-iscarb-cyan hover:bg-iscarb-cyan/90" : ""}>
            <Star className="h-3 w-3 mr-1.5" />{ar ? "المهارات" : "Skills"}
          </Button>
        </div>

        {/* Certificates Tab */}
        {tab === "certificates" && (
          <>
            {certificates.length > 0 ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  {certificates.map((cert: any, i: number) => (
                    <Card key={i} className="hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer border-border/50"
                      onClick={() => setSelectedCert(selectedCert?.id === cert.id ? null : cert)}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 rounded-xl bg-iscarb-green-soft shrink-0">
                            <Award className="h-5 w-5 text-iscarb-green" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{cert.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{cert.issuer}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge variant="outline" className="text-[9px] bg-iscarb-green-soft text-iscarb-green border-iscarb-green/20">
                                <CheckCircle className="h-2.5 w-2.5 mr-1" />{ar ? "نشط" : "Active"}
                              </Badge>
                              <span className="text-[9px] text-muted-foreground">
                                {new Date(cert.issuedDate).toLocaleDateString(ar ? "ar-SA" : "en-US")}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {cert.credentialUrl && (
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); window.open(cert.credentialUrl, "_blank"); }}>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* ── Certificate Modal — Glassmorphism Green/White ───────────── */}
                {selectedCert && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: "linear-gradient(135deg, rgba(0,74,40,0.85) 0%, rgba(10,25,15,0.92) 100%)" }}
                    onClick={() => setSelectedCert(null)}
                  >
                    {/* Blurred green bokeh blobs behind the card */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                      <div className="absolute -top-24 -left-24 size-72 rounded-full bg-iscarb-green/30 blur-3xl" />
                      <div className="absolute -bottom-24 -right-24 size-72 rounded-full bg-iscarb-green/20 blur-3xl" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-white/5 blur-3xl" />
                    </div>

                    {/* Card container */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="relative max-w-2xl w-full mx-auto"
                    >
                      {/* Floating close button */}
                      <button
                        onClick={() => setSelectedCert(null)}
                        className="absolute -top-4 -right-4 z-20 flex size-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white hover:text-iscarb-green transition-all shadow-lg"
                        aria-label="Close"
                      >
                        <X className="size-4" />
                      </button>

                      {/* ── The Certificate itself ── */}
                      <div
                        className="rounded-3xl overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.12)] relative"
                        style={{
                          background: "linear-gradient(160deg, rgba(255,255,255,0.97) 0%, rgba(240,255,245,0.99) 100%)",
                          backdropFilter: "blur(24px)",
                        }}
                      >
                        {/* Decorative watermark circles */}
                        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
                          <div className="absolute -top-16 -right-16 size-56 rounded-full border-[32px] border-iscarb-green/5" />
                          <div className="absolute -bottom-16 -left-16 size-56 rounded-full border-[32px] border-iscarb-green/5" />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-80 rounded-full border-[1px] border-iscarb-green/8" />
                        </div>

                        {/* ── Header band ── */}
                        <div
                          className="relative px-8 py-6 flex items-center justify-between overflow-hidden"
                          style={{ background: "linear-gradient(135deg, #006633 0%, #004d26 50%, #003319 100%)" }}
                        >
                          {/* Subtle diagonal shine */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
                          {/* Pattern dots */}
                          <div className="absolute right-0 top-0 bottom-0 w-32 opacity-10"
                            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "12px 12px" }} />

                          <div className="relative flex items-center gap-4">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-inner">
                              <GraduationCap className="size-7 text-white" />
                            </div>
                            <div>
                              <p className="text-white font-bold text-base tracking-[0.15em]">iSCARB</p>
                              <p className="text-white/60 text-[10px] uppercase tracking-[0.25em] mt-0.5">Saudi Higher Education Readiness</p>
                            </div>
                          </div>

                          <div className="relative text-right">
                            <p className="text-white/50 text-[9px] uppercase tracking-[0.3em]">{ar ? "شهادة" : "Certificate of"}</p>
                            <p className="text-white font-bold text-base tracking-wide">{ar ? "إنجاز" : "Achievement"}</p>
                          </div>
                        </div>

                        {/* ── Body ── */}
                        <div className="px-8 py-8 text-center space-y-5 relative">

                          {/* "This certifies that" */}
                          <div className="space-y-1">
                            <p className="text-[11px] uppercase tracking-[0.35em] text-iscarb-green/60 font-semibold">
                              {ar ? "يُقرّ بأن" : "This is to certify that"}
                            </p>
                            {/* Student name */}
                            <h2 className="font-display text-4xl font-bold text-iscarb-green leading-tight">
                              {selectedCert.studentName || (ar ? "الطالب" : "The Student")}
                            </h2>
                          </div>

                          <p className="text-sm text-gray-500">
                            {ar ? "قد أتمّ بنجاح متطلبات" : "has successfully completed the requirements of"}
                          </p>

                          {/* Course/cert name pill */}
                          <div className="mx-auto inline-block">
                            <div
                              className="rounded-2xl px-8 py-4 border"
                              style={{
                                background: "linear-gradient(135deg, rgba(0,102,51,0.06) 0%, rgba(0,153,76,0.04) 100%)",
                                borderColor: "rgba(0,102,51,0.18)",
                              }}
                            >
                              <p className="font-bold text-iscarb-ink text-xl leading-snug">{selectedCert.name}</p>
                              {selectedCert.issuer && (
                                <p className="text-xs text-gray-400 mt-1 font-medium tracking-wide">{selectedCert.issuer}</p>
                              )}
                            </div>
                          </div>

                          {/* Seal row */}
                          <div className="flex items-center gap-6 py-2">
                            <div className="flex-1 border-t border-dashed border-iscarb-green/20" />
                            <div className="flex flex-col items-center gap-1.5">
                              <div
                                className="flex size-16 items-center justify-center rounded-full shadow-xl"
                                style={{
                                  background: "linear-gradient(135deg, #00994d 0%, #006633 60%, #003319 100%)",
                                  boxShadow: "0 8px 24px rgba(0,102,51,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
                                }}
                              >
                                <BadgeCheck className="size-8 text-white" />
                              </div>
                              <p className="text-[9px] font-bold text-iscarb-green uppercase tracking-[0.3em]">Verified</p>
                            </div>
                            <div className="flex-1 border-t border-dashed border-iscarb-green/20" />
                          </div>

                          {/* Footer row — date / ID */}
                          <div className="flex justify-between items-end text-xs border-t border-iscarb-green/10 pt-5">
                            <div className="text-left space-y-0.5">
                              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                                {ar ? "تاريخ الإصدار" : "Date Issued"}
                              </p>
                              <p className="font-semibold text-iscarb-ink text-[13px]">
                                {selectedCert.issuedDate
                                  ? new Date(selectedCert.issuedDate).toLocaleDateString(ar ? "ar-SA" : "en-US", {
                                    year: "numeric", month: "long", day: "numeric",
                                  })
                                  : "—"}
                              </p>
                            </div>

                            {/* Centre watermark */}
                            <div className="text-center opacity-20 select-none">
                              <p className="font-display text-4xl font-black text-iscarb-green leading-none">iS</p>
                            </div>

                            <div className="text-right space-y-0.5">
                              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                                {ar ? "رقم الشهادة" : "Certificate No."}
                              </p>
                              <p className="font-mono font-semibold text-iscarb-ink text-[13px]">
                                {selectedCert.id?.slice(0, 14) || "—"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* ── Bottom action strip ── */}
                        <div
                          className="px-8 py-4 flex gap-3 justify-center border-t"
                          style={{
                            background: "linear-gradient(135deg, rgba(0,102,51,0.04) 0%, rgba(0,153,76,0.02) 100%)",
                            borderColor: "rgba(0,102,51,0.1)",
                          }}
                        >
                          <Button
                            className="gap-2 rounded-xl h-10 px-6 font-semibold text-sm shadow-lg"
                            style={{
                              background: "linear-gradient(135deg, #006633 0%, #004d26 100%)",
                              boxShadow: "0 4px 14px rgba(0,102,51,0.35)",
                            }}
                            onClick={() => window.print()}
                          >
                            <Download className="size-4" />
                            {ar ? "تنزيل / طباعة" : "Download / Print"}
                          </Button>
                          {selectedCert.credentialUrl && (
                            <Button
                              variant="outline"
                              className="gap-2 rounded-xl h-10 px-5 font-semibold text-sm border-iscarb-green/30 text-iscarb-green hover:bg-iscarb-green-soft/50"
                              onClick={() => window.open(selectedCert.credentialUrl, "_blank")}
                            >
                              <ExternalLink className="size-4" />
                              {ar ? "المصدر" : "Original"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Card><CardContent className="p-12 text-center">
                <Award className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold">{ar ? "لا توجد شهادات بعد" : "No certificates yet"}</p>
                <p className="text-xs text-muted-foreground mt-1">{ar ? "احصل على شهاداتك الأولى من المقررات والدورات" : "Earn certificates from courses and programs"}</p>
              </CardContent></Card>
            )}
          </>
        )}

        {/* Badges Tab */}
        {tab === "badges" && (
          <>
            {/* Earned badges */}
            {earnedBadges.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-emerald-500" />{ar ? "الشارات المكتسبة" : "Earned Badges"}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {earnedBadges.map((badge: any, i: number) => (
                    <Card key={i} className="hover:shadow-md transition-all hover:-translate-y-0.5">
                      <CardContent className="p-4 text-center">
                        <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-950/20 w-fit mx-auto mb-2">
                          <Trophy className="h-6 w-6 text-emerald-600" />
                        </div>
                        <p className="font-semibold text-sm">{badge.name}</p>
                        <p className="text-[9px] text-muted-foreground mt-1">{badge.description}</p>
                        {badge.earnedDate && (
                          <Badge variant="outline" className="text-[8px] mt-2 border-emerald-200 text-emerald-700">
                            {new Date(badge.earnedDate).toLocaleDateString()}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Pending badges */}
            {pendingBadges.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-amber-500" />{ar ? "قيد الإنجاز" : "In Progress"}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {pendingBadges.map((badge: any, i: number) => (
                    <Card key={i} className="opacity-60 hover:opacity-80 transition-opacity">
                      <CardContent className="p-4 text-center">
                        <div className="p-3 rounded-full bg-muted w-fit mx-auto mb-2">
                          <Trophy className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="font-semibold text-sm text-muted-foreground">{badge.name}</p>
                        <p className="text-[9px] text-muted-foreground mt-1">{badge.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {badges.length === 0 && (
              <Card><CardContent className="p-12 text-center">
                <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold">{ar ? "لا توجد شارات" : "No badges"}</p>
              </CardContent></Card>
            )}
          </>
        )}

        {/* Skills Tab */}
        {tab === "skills" && (
          <Card className="border-iscarb-cyan/20 bg-gradient-to-br from-iscarb-cyan/5 via-blue-50/30 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4 text-iscarb-cyan" /><Sparkles className="h-3 w-3 text-iscarb-gold" />
                {ar ? "توصيات iSCARB AI" : "iSCARB AI Recommendations"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {ar
                  ? `لديك ${certificates.length} شهادة و ${earnedBadges.length} شارة. نقترح الحصول على شهادات في:`
                  : `You have ${certificates.length} certificates and ${earnedBadges.length} badges. We suggest:`
                }
              </p>
              <div className="space-y-2">
                {["Cloud Computing", "Data Science", "Cybersecurity"].map((skill, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/60 dark:bg-background/40 border border-border/40">
                    <div className="p-1.5 rounded-lg bg-iscarb-cyan/10">
                      <Star className="h-4 w-4 text-iscarb-cyan" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{ar
                        ? ["الحوسبة السحابية", "علم البيانات", "الأمن السيبراني"][i]
                        : skill}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {ar ? "مطلوب في سوق العمل" : "In-demand skill"}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[9px]">{ar ? "يوصى به" : "Recommended"}</Badge>
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
