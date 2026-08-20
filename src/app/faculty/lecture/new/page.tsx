"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApiMutation } from "@/lib/use-api-query";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadDropzone } from "@/components/lecture/UploadDropzone";
import { CLOEntryForm, type CourseLearningOutcome } from "@/components/lecture/CLOEntryForm";
import { GenerationProgress } from "@/components/lecture/GenerationProgress";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  BookOpen,
  UploadCloud,
  Target,
  GraduationCap,
} from "lucide-react";

interface CreateProjectResponse {
  project: { id: string };
}

interface UploadResponse {
  jobId: string;
  projectId: string;
  status: string;
}

export default function NewLecturePage() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  // Step 1 — context
  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [audience, setAudience] = useState("Undergraduate Year 3");
  const [duration, setDuration] = useState("50 minutes");
  const [languagePolicy, setLanguagePolicy] = useState<"en" | "ar" | "bilingual">("en");

  // Step 2 — CLOs
  const [clos, setClos] = useState<CourseLearningOutcome[]>([]);

  const createProject = useApiMutation<CreateProjectResponse, { title: string; courseProfile: unknown }>(
    "/api/iscarb/lecture/projects",
    {
      onSuccess: (result) => {
        const id = result.project.id;
        setProjectId(id);
        setStep(2);
      },
    },
  );

  const uploadFile = useApiMutation<UploadResponse, FormData>(
    () => `/api/iscarb/lecture/projects/${projectId}/sources`,
    {
      onSuccess: (result) => setJobId(result.jobId),
    },
  );

  const saveClos = useApiMutation<
    { courseProfileId: string },
    { teacherEnteredClos: CourseLearningOutcome[]; selectedLectureCloIds: string[] }
  >(
    () => `/api/iscarb/lecture/projects/${projectId}/clos`,
    {
      method: "PUT",
      onSuccess: () => finish(),
    },
  );

  const handleUpload = (file: File, extractedText?: string) => {
    if (!projectId) return;
    const fd = new FormData();
    fd.append("file", file);
    if (extractedText) {
      fd.append("extractedText", extractedText);
    }
    uploadFile.mutate(fd);
  };

  const startCreate = () => {
    if (!title.trim() || !courseCode.trim() || !courseTitle.trim()) return;
    createProject.mutate({
      title: title.trim(),
      courseProfile: {
        courseCode: courseCode.trim(),
        title: courseTitle.trim(),
        specialty: specialty.trim() || "General Academic",
        audience: audience.trim() || "Undergraduate Year 3",
        duration: duration.trim() || "50 minutes",
        languagePolicy,
        teacherEnteredClos: [],
        selectedLectureCloIds: [],
      },
    });
  };

  const finish = () => {
    if (projectId) router.push(`/faculty/lecture/${projectId}/source-map`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 lg:p-6 bg-slate-50/50 min-h-screen text-slate-900">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0E6C3C] text-white shadow-xs">
              <GraduationCap className="h-5 w-5" />
            </span>
            <h1 className="text-xl lg:text-2xl font-black text-slate-900">
              {ar ? "إنشاء محاضرة جديدة معتمدة" : "Create New Certified Lecture"}
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">
            {ar
              ? "تحويل مصادر المقرر إلى حزمة محاضرات iSCARB معتمدة ومطابقة لمخرجات التعلّم."
              : "Convert source material into a structured, CLO-aligned 20-slide iSCARB lecture package."}
          </p>
        </div>

        <Badge className="bg-emerald-50 text-[#0E6C3C] border-emerald-200 text-xs px-3 py-1 font-bold shrink-0 self-start md:self-auto">
          {ar ? `الخطوة ${step} من 3` : `Step ${step} of 3`}
        </Badge>
      </div>

      {/* Step Indicator */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { num: 1, labelEn: "1. Academic Context", labelAr: "1. السياق الأكاديمي", icon: BookOpen },
          { num: 2, labelEn: "2. Source Materials", labelAr: "2. المصادر والملفات", icon: UploadCloud },
          { num: 3, labelEn: "3. Learning Outcomes", labelAr: "3. مخرجات التعلّم", icon: Target },
        ].map((s) => {
          const isDone = step > s.num;
          const isCurrent = step === s.num;
          return (
            <div
              key={s.num}
              className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
                isCurrent
                  ? "bg-white border-[#0E6C3C] shadow-md ring-2 ring-[#0E6C3C]/20"
                  : isDone
                  ? "bg-emerald-50/70 border-emerald-200 text-[#0E6C3C]"
                  : "bg-white/60 border-slate-200 text-slate-400"
              }`}
            >
              <div
                className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                  isCurrent
                    ? "bg-[#0E6C3C] text-white shadow-xs"
                    : isDone
                    ? "bg-emerald-200 text-[#0E6C3C]"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {isDone ? <Check className="h-4 w-4" /> : s.num}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold truncate ${isCurrent ? "text-slate-900" : isDone ? "text-[#0E6C3C]" : "text-slate-500"}`}>
                  {ar ? s.labelAr : s.labelEn}
                </p>
                <span className="text-[10px] text-slate-400">
                  {s.num === 1 ? "Course & Title" : s.num === 2 ? "Upload Files" : "CLO Alignment"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* STEP 1: ACADEMIC CONTEXT */}
      {step === 1 && (
        <Card className="border border-emerald-100 bg-white shadow-sm rounded-3xl">
          <CardContent className="space-y-5 p-6 sm:p-8">
            <div className="space-y-1.5">
              <Label htmlFor="p-title" className="text-xs font-bold text-slate-700">
                {ar ? "عنوان المحاضرة *" : "Lecture Title *"}
              </Label>
              <Input
                id="p-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={ar ? "أدخل عنوان المحاضرة الأكاديمية..." : "Enter academic lecture title..."}
                className="rounded-xl border-emerald-200 focus-visible:ring-[#0E6C3C] font-semibold text-sm"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-code" className="text-xs font-bold text-slate-700">
                  {ar ? "رمز المقرر *" : "Course Code *"}
                </Label>
                <Input
                  id="p-code"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g. CS101, PHYS201, MATH301"
                  className="rounded-xl border-emerald-200 focus-visible:ring-[#0E6C3C] font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-course-title" className="text-xs font-bold text-slate-700">
                  {ar ? "اسم المقرر الأكاديمي *" : "Academic Course Title *"}
                </Label>
                <Input
                  id="p-course-title"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder={ar ? "أدخل اسم المقرر الكامل..." : "Enter full course name..."}
                  className="rounded-xl border-emerald-200 focus-visible:ring-[#0E6C3C] text-sm"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-specialty" className="text-xs font-bold text-slate-700">
                  {ar ? "التخصص الجامعي" : "University Specialty & Discipline"}
                </Label>
                <Input
                  id="p-specialty"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Physics, Mathematics, Computer Science, Biology, Medicine, Engineering, etc."
                  className="rounded-xl border-emerald-200 focus-visible:ring-[#0E6C3C] text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-lang" className="text-xs font-bold text-slate-700">
                  {ar ? "لغة التدريس وسياسة المحتوى" : "Instruction Language Policy"}
                </Label>
                <Select value={languagePolicy} onValueChange={(v) => setLanguagePolicy(v as typeof languagePolicy)}>
                  <SelectTrigger id="p-lang" className="rounded-xl border-emerald-200 focus:ring-[#0E6C3C]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white border-emerald-100">
                    <SelectItem value="en">English (Official Curriculum)</SelectItem>
                    <SelectItem value="ar">العربية (Arabic)</SelectItem>
                    <SelectItem value="bilingual">Bilingual (English + Arabic Vocabulary)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-audience" className="text-xs font-bold text-slate-700">
                  {ar ? "الفئة المستهدفة / المستوى الأكاديمي" : "Target Academic Audience"}
                </Label>
                <Input
                  id="p-audience"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="Undergraduate Year 3, Postgraduate, etc."
                  className="rounded-xl border-emerald-200 focus-visible:ring-[#0E6C3C] text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-duration" className="text-xs font-bold text-slate-700">
                  {ar ? "مدة المحاضرة المخططة" : "Planned Lecture Duration"}
                </Label>
                <Input
                  id="p-duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="50 minutes, 100 minutes, 120 minutes"
                  className="rounded-xl border-emerald-200 focus-visible:ring-[#0E6C3C] text-sm"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                {ar ? "جميع البيانات تحفظ وفق معايير المركز الوطني NCAAA" : "All metadata compliant with NCAAA standards"}
              </p>

              <Button
                onClick={startCreate}
                disabled={!title.trim() || !courseCode.trim() || !courseTitle.trim() || createProject.isPending}
                className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white font-bold text-xs h-11 px-8 rounded-xl shadow-md cursor-pointer"
              >
                {createProject.isPending ? (ar ? "جارٍ إنشاء المحاضرة…" : "Creating Lecture…") : ar ? "المتابعة لرفع المصادر" : "Continue to Source Materials"}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {createProject.isError && (
              <p className="text-xs font-bold text-red-500 mt-2" role="alert">
                {createProject.error.message}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 2: SOURCES & FILE UPLOAD */}
      {step === 2 && (
        <Card className="border border-emerald-100 bg-white shadow-sm rounded-3xl">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {ar ? "ارفع المستندات والمراجع الأكاديمية" : "Upload Academic Source Files & Slides"}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {ar
                  ? "يدعم النظام: ملفات العرض PPTX، الكتب PDF، وثائق DOCX، والمستندات العلمية — حتى 50 ميجابايت."
                  : "Supported formats: PPTX presentations, PDF textbooks, DOCX syllabi, HTML — up to 50 MB."}
              </p>
            </div>

            <UploadDropzone onFile={handleUpload} busy={uploadFile.isPending} />

            {jobId && <GenerationProgress jobId={jobId} pollMs={2500} onDone={() => setStep(3)} />}

            {uploadFile.isError && (
              <p className="text-xs font-bold text-red-500" role="alert">
                {uploadFile.error.message}
              </p>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-slate-600 rounded-xl"
              >
                <ChevronLeft className="mr-1.5 h-4 w-4" /> {ar ? "العودة للسياق" : "Back to Context"}
              </Button>

              <Button
                onClick={() => setStep(3)}
                variant="outline"
                className="text-xs font-bold text-emerald-800 border-emerald-300 rounded-xl hover:bg-emerald-50"
              >
                {ar ? "تخطي إلى مخرجات التعلّم" : "Skip to Learning Outcomes"} <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: CLOS & FINISH */}
      {step === 3 && (
        <Card className="border border-emerald-100 bg-white shadow-sm rounded-3xl">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {ar ? "أدخل مخرجات التعلّم المستهدفة (CLOs)" : "Specify Course Learning Outcomes (CLOs)"}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {ar
                  ? "يتم حفظ المخرجات حرفياً وربطها بمستويات بلوم المعرفية ورؤية السعودية 2030."
                  : "Outcomes are mapped verbatim to Bloom's taxonomy levels and Saudi Vision 2030 national priorities."}
              </p>
            </div>

            <CLOEntryForm
              onSubmit={(c, ids) => {
                setClos(c);
                saveClos.mutate({ teacherEnteredClos: c, selectedLectureCloIds: ids });
              }}
              submitting={saveClos.isPending}
            />

            {saveClos.isError && (
              <p className="text-xs font-bold text-red-500" role="alert">
                {saveClos.error.message === "CLO_ALREADY_APPROVED"
                  ? (ar
                    ? "تم حفظ مخرجات التعلّم بنجاح لهذا المقرر. يمكنك المتابعة إلى استوديو المحاضرة."
                    : "Course Learning Outcomes have been approved. You can proceed directly to the Lecture Studio.")
                  : saveClos.error.message}
              </p>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setStep(2)}
                className="text-xs font-bold text-slate-600 rounded-xl"
              >
                <ChevronLeft className="mr-1.5 h-4 w-4" /> {ar ? "العودة للمصادر" : "Back to Sources"}
              </Button>

              {clos.length > 0 && (
                <Button
                  onClick={finish}
                  className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white font-bold text-xs h-11 px-8 rounded-xl shadow-md cursor-pointer"
                >
                  <Check className="mr-2 h-4 w-4" /> {ar ? "الانتقال إلى استوديو المحاضرة" : "Proceed to Lecture Studio"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
