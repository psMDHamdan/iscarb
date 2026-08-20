"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  Search,
  CheckCircle2,
  Eye,
  Check,
  Wand2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  UNIVERSAL_ACADEMIC_VISUALS,
  DISCIPLINE_METADATA,
  type AcademicVisual,
  type AcademicDiscipline,
} from "@/lib/lecture/academic-visuals";

interface VisualManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  slideNo: number;
  currentImageUrl?: string;
  currentTitle?: string;
  currentCaption?: string;
  onSaveVisual: (visualData: {
    imageUrl: string;
    title: string;
    caption: string;
    visualType?: string;
  }) => Promise<void> | void;
}

export function VisualManagerModal({
  isOpen,
  onClose,
  slideNo,
  currentImageUrl,
  currentTitle,
  currentCaption,
  onSaveVisual,
}: VisualManagerModalProps) {
  const [selectedUrl, setSelectedUrl] = useState<string>(currentImageUrl || "");
  const [title, setTitle] = useState<string>(currentTitle || "");
  const [caption, setCaption] = useState<string>(currentCaption || "");
  const [visualType, setVisualType] = useState<string>("Scientific Visual");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<AcademicDiscipline | "all">("all");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isAiSearching, setIsAiSearching] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedUrl(dataUrl);
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
    };
    reader.readAsDataURL(file);
  };

  const handleSelectCurated = (visual: AcademicVisual) => {
    setSelectedUrl(visual.imageUrl);
    setTitle(visual.title);
    setCaption(visual.caption);
    setVisualType(visual.visualType);
  };

  const handleAiFindImage = async (overridePrompt?: string) => {
    setIsAiSearching(true);
    try {
      const res = await fetch("/api/iscarb/lecture/ai-find-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: overridePrompt || title || `Slide ${slideNo}`,
          topic: overridePrompt || searchQuery || title || "",
          slideNo,
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setSelectedUrl(data.imageUrl);
        if (data.title) setTitle(data.title);
        if (data.caption) setCaption(data.caption);
        if (data.visualType) setVisualType(data.visualType);
      }
    } catch (err) {
      console.error("AI image search error", err);
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleSave = async () => {
    if (!selectedUrl) return;
    setIsSaving(true);
    try {
      await onSaveVisual({
        imageUrl: selectedUrl,
        title: title || `Slide ${slideNo} Visual`,
        caption: caption || "",
        visualType,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const filteredLibrary = UNIVERSAL_ACADEMIC_VISUALS.filter((v) => {
    const matchesDiscipline =
      selectedDiscipline === "all" || v.discipline === selectedDiscipline;
    if (!matchesDiscipline) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.title.toLowerCase().includes(q) ||
      v.topic.toLowerCase().includes(q) ||
      v.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const disciplines: Array<{ id: AcademicDiscipline | "all"; label: string; icon: string }> = [
    { id: "all", label: "All Disciplines", icon: "🌐" },
    { id: "cs_ai", label: "Computer Science & AI", icon: "💻" },
    { id: "physics", label: "Physics", icon: "⚛️" },
    { id: "mathematics", label: "Mathematics", icon: "📐" },
    { id: "engineering", label: "Engineering", icon: "⚙️" },
    { id: "life_sciences_medicine", label: "Medicine & Life Sci", icon: "🧬" },
    { id: "business_economics", label: "Business & Econ", icon: "📈" },
    { id: "vision_2030", label: "Saudi Vision 2030", icon: "🇸🇦" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white text-slate-900 border border-emerald-200 rounded-2xl shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50/60 p-6 border-b border-emerald-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-[#0E6C3C]">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Slide {slideNo} Universal Visual & Image Finder
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Use LLM AI to auto-find verified scientific images, choose from multi-discipline libraries, or upload custom figures.
                </DialogDescription>
              </div>
            </div>
            <Badge className="bg-[#0E6C3C] text-white text-xs px-3 py-1 font-bold">
              Slide {slideNo}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* AI One-Click Auto-Find Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-[#0F7B8A] text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-xs">
                <Wand2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold">Let LLM AI Find & Match Perfect Scientific Image</p>
                <p className="text-xs text-emerald-100 mt-0.5">
                  AI analyzes your slide topic, formulates targeted academic search queries, and retrieves verified diagrams.
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => handleAiFindImage()}
              disabled={isAiSearching}
              className="bg-white hover:bg-white/90 text-[#0E6C3C] font-bold text-xs rounded-xl h-10 px-5 shadow-sm shrink-0"
            >
              {isAiSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin text-[#0E6C3C]" />
                  AI Searching...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2 text-emerald-600" />
                  AI Auto-Find Image
                </>
              )}
            </Button>
          </div>

          <Tabs defaultValue="library" className="w-full">
            <TabsList className="grid grid-cols-3 bg-emerald-50/80 p-1 rounded-xl border border-emerald-200">
              <TabsTrigger
                value="library"
                className="data-[state=active]:bg-white data-[state=active]:text-[#0E6C3C] data-[state=active]:shadow-xs text-xs font-bold rounded-lg py-2"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5 inline text-emerald-600" />
                Universal Academic Library
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                className="data-[state=active]:bg-white data-[state=active]:text-[#0E6C3C] data-[state=active]:shadow-xs text-xs font-bold rounded-lg py-2"
              >
                <Upload className="h-3.5 w-3.5 mr-1.5 inline text-emerald-600" />
                Upload Custom Image
              </TabsTrigger>
              <TabsTrigger
                value="url"
                className="data-[state=active]:bg-white data-[state=active]:text-[#0E6C3C] data-[state=active]:shadow-xs text-xs font-bold rounded-lg py-2"
              >
                <Search className="h-3.5 w-3.5 mr-1.5 inline text-emerald-600" />
                Paste Image URL / Search
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: UNIVERSAL DISCIPLINE LIBRARY */}
            <TabsContent value="library" className="mt-4 space-y-4">
              {/* Discipline Category Filter Badges */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {disciplines.map((d) => {
                  const isActive = selectedDiscipline === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedDiscipline(d.id)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? "bg-[#0E6C3C] text-white shadow-xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60"
                      }`}
                    >
                      <span>{d.icon}</span>
                      <span>{d.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search physics, maths, CS, medicine, engineering, finance, or Vision 2030..."
                  className="pl-10 text-xs rounded-xl border-emerald-200 focus-visible:ring-[#0E6C3C]"
                />
              </div>

              {/* Visuals Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-64 overflow-y-auto p-1">
                {filteredLibrary.map((v) => {
                  const isSelected = selectedUrl === v.imageUrl;
                  return (
                    <div
                      key={v.id}
                      onClick={() => handleSelectCurated(v)}
                      className={`group relative rounded-xl border p-2.5 cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                        isSelected
                          ? "border-[#0E6C3C] bg-emerald-50/60 ring-2 ring-[#0E6C3C]/30 shadow-xs"
                          : "border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs"
                      }`}
                    >
                      <div className="relative h-28 w-full rounded-lg overflow-hidden bg-slate-100 mb-2 border border-slate-100">
                        <img
                          src={v.imageUrl}
                          alt={v.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-[#0E6C3C] text-white p-1 rounded-full shadow-md">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white font-mono text-[9px] px-1.5 py-0.5 rounded backdrop-blur-xs">
                          {DISCIPLINE_METADATA[v.discipline]?.icon || "🎓"} {v.discipline.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900 line-clamp-1">{v.title}</p>
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{v.visualType}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* TAB 2: UPLOAD IMAGE */}
            <TabsContent value="upload" className="mt-4">
              <div className="border-2 border-dashed border-emerald-200 rounded-2xl p-8 text-center bg-emerald-50/30 hover:bg-emerald-50/60 transition-colors">
                <Upload className="h-10 w-10 text-[#0E6C3C] mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-900">Upload Any Lecture Diagram or Photo</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Supports PNG, JPG, SVG, and WebP for all subjects (Physics, Math, CS, Engineering, Medicine, etc.).
                </p>
                <label className="inline-block mt-4">
                  <span className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-xs inline-flex items-center gap-1.5">
                    <Upload className="h-3.5 w-3.5" /> Browse Computer Files
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </TabsContent>

            {/* TAB 3: PASTE URL OR SEARCH */}
            <TabsContent value="url" className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Image Web Address (URL)</label>
                <div className="flex gap-2">
                  <Input
                    value={selectedUrl}
                    onChange={(e) => setSelectedUrl(e.target.value)}
                    placeholder="https://example.com/diagram.png"
                    className="text-xs rounded-xl border-emerald-200 focus-visible:ring-[#0E6C3C]"
                  />
                  <Button
                    type="button"
                    onClick={() => handleAiFindImage(selectedUrl)}
                    disabled={isAiSearching || !selectedUrl}
                    className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white text-xs font-bold rounded-xl px-4"
                  >
                    Fetch
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* ACTIVE PREVIEW & METADATA */}
          {selectedUrl && (
            <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/20 p-4 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-900">
                <Eye className="h-4 w-4 text-[#0E6C3C]" />
                <span>Selected Visual Preview & Scientific Metadata</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-40 rounded-xl overflow-hidden border border-emerald-200 bg-white shadow-xs">
                  <img
                    src={selectedUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="md:col-span-2 space-y-2.5">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-500 mb-1 block">
                      Visual Title & Scientific Model
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Wave Function Probability Distribution / Matrix Transform"
                      className="text-xs rounded-xl bg-white border-emerald-200"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-500 mb-1 block">
                      Pedagogical Caption & Key Takeaway
                    </label>
                    <Input
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="e.g. Visualizing eigenvalue projections along invariant subspace axes..."
                      className="text-xs rounded-xl bg-white border-emerald-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-xs font-bold text-slate-600 rounded-xl"
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            disabled={!selectedUrl || isSaving}
            className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white text-xs font-bold h-10 px-6 rounded-xl shadow-xs"
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            {isSaving ? "Saving Visual..." : "Apply Visual to Slide"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
