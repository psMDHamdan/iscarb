"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { WordCountBadge } from "./WordCountBadge";
import { Save, Check, RefreshCw, AlertCircle, Edit3, MessageSquare, Layers, Zap, Languages } from "lucide-react";
import type { SlideContentJson } from "@/lib/lecture/generation/types";
import { StemRenderer } from "@/components/ui/StemRenderer";

interface Props {
  content: SlideContentJson;
  onChange: (next: SlideContentJson) => void;
  onSave?: () => void;
  onRegenerate?: () => void;
  onApprove?: () => void;
  saving?: boolean;
  showBilingual?: boolean;
  className?: string;
}

function visibleWordCount(title: string, bullets: string[]): number {
  return [title, ...bullets].join(" ").split(/\s+/).filter(Boolean).length;
}

/** Professional slide content editor panel matching BRD §11 specifications. */
export function SlideEditorPanel({
  content,
  onChange,
  onSave,
  onRegenerate,
  onApprove,
  saving,
  showBilingual,
  className,
}: Props) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [activeTab, setActiveTab] = useState<"en" | "ar">("en");

  const [title, setTitle] = useState(content.title ?? "");
  const [bulletsText, setBulletsText] = useState((content.bullets ?? []).join("\n"));
  const [visualIntent, setVisualIntent] = useState(content.visualIntent ?? "");
  const [speakerNotes, setSpeakerNotes] = useState(content.speakerNotes ?? content.instructorScript ?? "");
  const [studentAction, setStudentAction] = useState(
    typeof content.studentAction === "object" ? (content.studentAction as any).prompt ?? "" : content.studentAction ?? ""
  );

  // Arabic Bilingual State
  const [titleAr, setTitleAr] = useState(content.textAr?.title ?? "");
  const [bulletsArText, setBulletsArText] = useState((content.textAr?.bullets ?? []).join("\n"));

  const bullets = useMemo(() => bulletsText.split("\n").map((s) => s.trim()).filter(Boolean), [bulletsText]);
  const bulletsAr = useMemo(() => bulletsArText.split("\n").map((s) => s.trim()).filter(Boolean), [bulletsArText]);

  const wordCount = visibleWordCount(title, bullets);
  const overBullets = bullets.length > 5;
  const overWordCount = wordCount > 40;

  useEffect(() => {
    const textArObj =
      titleAr || bulletsAr.length > 0
        ? { title: titleAr, bullets: bulletsAr }
        : content.textAr;

    onChange({
      ...content,
      title,
      bullets,
      visualIntent,
      speakerNotes,
      instructorScript: speakerNotes,
      studentAction: typeof content.studentAction === "object" ? { ...(content.studentAction as Record<string, unknown>), prompt: studentAction } : studentAction,
      wordCount,
      textAr: textArObj,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, bulletsText, visualIntent, speakerNotes, studentAction, titleAr, bulletsArText]);

  return (
    <div className={cn("space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm", className)}>
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="font-display font-bold text-base flex items-center gap-2">
          <Edit3 className="h-4 w-4 text-[#0F7B8A]" />
          {ar ? "محرر محتوى الشريحة" : "Slide Content Editor"}
        </h3>
        <WordCountBadge count={wordCount} />
      </div>

      {/* Real-time Inline Validation Warnings */}
      {overWordCount && (
        <div className="animate-fade-in flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 animate-pulse-soft" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Deterministic Gate Warning</h4>
            <p className="text-xs">
              This slide has {wordCount} words, which exceeds the BRD maximum of 40 words. You will not be able to publish this project until this is resolved.
            </p>
          </div>
        </div>
      )}

      {/* Language Switcher Tab Bar */}
      {showBilingual && (
        <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30 border border-border/60">
          <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 px-1">
            <Languages className="h-3.5 w-3.5 text-[#0F7B8A]" />
            {ar ? "لغة التحرير:" : "Language:"}
          </span>
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant={activeTab === "en" ? "default" : "ghost"}
              onClick={() => setActiveTab("en")}
              className={`h-7 text-xs rounded-lg font-semibold ${activeTab === "en" ? "bg-[#0F7B8A] text-white" : ""}`}
            >
              English
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === "ar" ? "default" : "ghost"}
              onClick={() => setActiveTab("ar")}
              className={`h-7 text-xs rounded-lg font-arabic font-bold ${activeTab === "ar" ? "bg-emerald-600 text-white" : ""}`}
            >
              عربي (Arabic)
            </Button>
          </div>
        </div>
      )}

      {/* ENGLISH CONTENT FIELDS */}
      {activeTab === "en" && (
        <>
          {/* Slide Title */}
          <div className="space-y-2">
            <Label htmlFor="slide-title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {ar ? "عنوان الشريحة (English)" : "Slide Title (English)"}
            </Label>
            <Input
              id="slide-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              className="font-semibold text-base"
            />
          </div>

          {/* Slide Bullets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="slide-bullets" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {ar ? "نقاط المحتوى (سلسة وقصيرة، 5 كحد أقصى)" : "Content Bullets (1 per line, max 5)"}
              </Label>
              <span className={cn("text-xs font-semibold", overBullets ? "text-red-500" : "text-muted-foreground")}>
                {bullets.length}/5 bullets
              </span>
            </div>
            <Textarea
              id="slide-bullets"
              value={bulletsText}
              onChange={(e) => setBulletsText(e.target.value)}
              rows={5}
              className="font-mono text-sm leading-relaxed"
              placeholder="First key point&#10;Second key point..."
            />
          </div>
        </>
      )}

      {/* ARABIC BILINGUAL CONTENT FIELDS */}
      {showBilingual && activeTab === "ar" && (
        <>
          {/* Slide Title Arabic */}
          <div className="space-y-2">
            <Label htmlFor="slide-title-ar" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>العنوان بالعربية (Arabic Title)</span>
              <span className="font-arabic text-emerald-600 dark:text-emerald-400">عربي</span>
            </Label>
            <Input
              id="slide-title-ar"
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              maxLength={120}
              dir="rtl"
              className="font-arabic text-base font-bold text-right"
              placeholder="أدخل العنوان بالعربية..."
            />
          </div>

          {/* Slide Bullets Arabic */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="slide-bullets-ar" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                النقاط بالعربية (Arabic Bullets - 1 per line)
              </Label>
              <span className="text-xs font-mono text-muted-foreground">
                {bulletsAr.length}/5 نقاط
              </span>
            </div>
            <Textarea
              id="slide-bullets-ar"
              value={bulletsArText}
              onChange={(e) => setBulletsArText(e.target.value)}
              rows={5}
              dir="rtl"
              className="font-arabic text-sm leading-relaxed text-right"
              placeholder="النقطة الأولى بالعربية&#10;النقطة الثانية بالعربية..."
            />
          </div>
        </>
      )}

      {/* Visual & Academic Diagram Studio */}
      <div className="space-y-3 p-4 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/30 via-white to-emerald-50/10">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-[#0E6C3C]" />
            {ar ? "المخطط العلمي والصورة التعليمية" : "Scientific Visual & Educational Diagram"}
          </Label>
          <Badge variant="outline" className="text-[10px] font-bold border-emerald-300 text-[#0E6C3C] bg-white">
            {content.visualSpec?.visualType || "Diagram"}
          </Badge>
        </div>

        {/* Current Visual Preview */}
        {content.visualSpec?.imageUrl && (
          <div className="relative rounded-xl overflow-hidden border border-emerald-100 bg-white p-2 flex items-center gap-3">
            <img
              src={
                content.visualSpec.imageUrl.startsWith("http")
                  ? `/api/iscarb/image-proxy?url=${encodeURIComponent(content.visualSpec.imageUrl)}`
                  : content.visualSpec.imageUrl
              }
              alt={content.visualSpec.title || "Visual preview"}
              className="h-16 w-24 object-cover rounded-lg border border-slate-100 flex-shrink-0"
            />
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="text-xs font-bold text-slate-900 truncate">
                <StemRenderer content={content.visualSpec.title || "Scientific Diagram"} inline />
              </div>
              <div className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                <StemRenderer content={content.visualSpec.caption || visualIntent || "Visual model illustrating the central mechanism."} inline />
              </div>
            </div>
          </div>
        )}

        {/* Visual Search & AI Finder Actions */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={async () => {
                try {
                  const res = await fetch("/api/iscarb/lecture/ai-find-image", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title,
                      bullets,
                      purpose: visualIntent || "Concept illustration",
                    }),
                  });
                  const json = await res.json();
                  if (json.imageUrl) {
                    onChange({
                      ...content,
                      visualIntent: json.caption || visualIntent,
                      visualSpec: {
                        ...content.visualSpec,
                        visualType: json.visualType || content.visualSpec?.visualType || "PROCESS",
                        purpose: json.purpose || content.visualSpec?.purpose || "",
                        learningMessage: json.learningMessage || content.visualSpec?.learningMessage || "",
                        layout: json.layout || content.visualSpec?.layout || "",
                        elements: json.elements || content.visualSpec?.elements || [],
                        connections: content.visualSpec?.connections || [],
                        labels: content.visualSpec?.labels || [],
                        annotations: content.visualSpec?.annotations || [],
                        emphasis: content.visualSpec?.emphasis || [],
                        studentQuestion: content.visualSpec?.studentQuestion || "",
                        title: json.title || title,
                        caption: json.caption || "",
                        imageUrl: json.imageUrl,
                        fetchedImageUrl: json.imageUrl,
                        suggestedSearchQuery: json.suggestedSearchQuery || title,
                      },
                    });
                  }
                } catch (e) {
                  console.error("Failed to AI find visual:", e);
                }
              }}
              className="flex-1 bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white rounded-xl text-xs font-bold shadow-xs py-1.5"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              {ar ? "✨ اسأل الذكاء الاصطناعي وجلب الصورة تلقائياً" : "✨ Ask AI What Visual is Needed & Auto-Find"}
            </Button>
          </div>

          <div className="space-y-1">
            <Label htmlFor="visual-intent" className="text-[11px] font-semibold text-slate-600">
              {ar ? "وصف القصد البصري أو رابط صورة مخصص:" : "Visual Description / Custom Image URL:"}
            </Label>
            <Input
              id="visual-intent"
              value={content.visualSpec?.imageUrl || visualIntent}
              onChange={(e) => {
                const val = e.target.value;
                if (val.startsWith("http")) {
                  onChange({
                    ...content,
                    visualSpec: {
                      visualType: content.visualSpec?.visualType || "PROCESS",
                      purpose: content.visualSpec?.purpose || "",
                      learningMessage: content.visualSpec?.learningMessage || "",
                      layout: content.visualSpec?.layout || "",
                      elements: content.visualSpec?.elements || [],
                      connections: content.visualSpec?.connections || [],
                      labels: content.visualSpec?.labels || [],
                      annotations: content.visualSpec?.annotations || [],
                      emphasis: content.visualSpec?.emphasis || [],
                      studentQuestion: content.visualSpec?.studentQuestion || "",
                      title: content.visualSpec?.title || title,
                      caption: content.visualSpec?.caption || "",
                      imageUrl: val,
                      fetchedImageUrl: val,
                    },
                  });
                } else {
                  setVisualIntent(val);
                }
              }}
              className="text-xs rounded-xl border-emerald-200"
              placeholder={ar ? "أدخل رابط صورة مباشر أو وصف المخطط..." : "Enter direct image URL or search keywords..."}
            />
          </div>
        </div>
      </div>

      {/* Student Active Task */}
      <div className="space-y-2">
        <Label htmlFor="student-action" className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5" />
          {ar ? "المهمة التفاعلية للطالب" : "Student Active Task (Interactive Pause)"}
        </Label>
        <Textarea
          id="student-action"
          value={studentAction}
          onChange={(e) => setStudentAction(e.target.value)}
          rows={2}
          className="text-xs font-semibold"
          placeholder="e.g., Turn to partner and discuss the bottleneck in Slide 5."
        />
      </div>

      {/* Instructor Script / Speaker Notes */}
      <div className="space-y-2">
        <Label htmlFor="speaker-notes" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5 text-[#0F7B8A]" />
          {ar ? "سيناريو وشرح المحاضر (Speaker Notes)" : "Instructor Script / Speaker Notes"}
        </Label>
        <Textarea
          id="speaker-notes"
          value={speakerNotes}
          onChange={(e) => setSpeakerNotes(e.target.value)}
          rows={4}
          className="text-xs font-mono leading-relaxed"
          placeholder="Script text for the instructor to read during lecture delivery..."
        />
      </div>

      {/* Save / Approve Footer Bar */}
      {(onSave || onApprove || onRegenerate) && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex gap-2">
            {onRegenerate && (
              <Button type="button" variant="outline" size="sm" onClick={onRegenerate} className="rounded-xl text-xs font-semibold">
                <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-[#0F7B8A]" />
                {ar ? "إعادة التوليد" : "Regenerate"}
              </Button>
            )}
            {onApprove && (
              <Button type="button" variant="outline" size="sm" onClick={onApprove} className="rounded-xl text-xs font-semibold border-emerald-500/40 text-emerald-600">
                <Check className="mr-1.5 h-3.5 w-3.5" />
                {ar ? "اعتماد الشريحة" : "Approve Slide"}
              </Button>
            )}
          </div>

          {onSave && (
            <Button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white rounded-xl text-xs font-bold px-6 shadow-md"
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {saving ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ التغييرات" : "Save Changes")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
