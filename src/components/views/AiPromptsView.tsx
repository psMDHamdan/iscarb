"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle, Plus, Trash2, Edit, Save, X, Sparkles } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-query";

export function AiPromptsView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data, isLoading: loading, error, refetch } = useApiQuery<{
    data: { userPrompts: any[]; systemPrompts: any[]; total: number }
  }>(["ai", "prompts"], "/api/v1/student/ai/prompts");

  const { mutate: createPrompt } = useApiMutation<{ success: boolean; data: any }>(
    (data) => ({ url: "/api/v1/student/ai/prompts", method: "POST", body: data })
  );

  const { mutate: updatePrompt } = useApiMutation<{ success: boolean; data: any }>(
    (data) => ({ url: "/api/v1/student/ai/prompts", method: "PUT", body: data })
  );

  const { mutate: deletePrompt } = useApiMutation<{ success: boolean; data: any }>(
    (data) => ({ url: `/api/v1/student/ai/prompts?id=${data.id}`, method: "DELETE" })
  );

  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const result = await createPrompt({
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      category: formData.get("category") as string,
    });

    if (result?.success) {
      setShowCreateModal(false);
      refetch();
    }
  };

  const handleUpdatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const result = await updatePrompt({
      id: editingPrompt?.id,
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      category: formData.get("category") as string,
    });

    if (result?.success) {
      setEditingPrompt(null);
      refetch();
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (confirm(ar ? "هل أنت متأكد من الحذف؟" : "Are you sure you want to delete?")) {
      await deletePrompt({ id });
      refetch();
    }
  };

  if (loading) return (
    <><PageHeader title={ar ? "النماذج المحفوظة" : "Saved Prompts"} />
      <div className="space-y-3">{[1, 2, 3].map(i => <Card key={i}><CardContent className="p-12 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-iscarb-green" /></CardContent></Card>)}</div></>
  );
  if (error || !data?.data) return errorState(ar);

  const { userPrompts, systemPrompts } = data.data;
  const filteredPrompts = selectedCategory === "all"
    ? userPrompts
    : userPrompts.filter(p => p.category === selectedCategory);

  const categories = ["all", ...Array.from(new Set(userPrompts.map((p: any) => p.category)))];

  return (
    <>
      <PageHeader title={ar ? "النماذج المحفوظة" : "Saved Prompts"}
        description={ar ? `${userPrompts.length} نموذج محفوظ` : `${userPrompts.length} saved prompts`} />

      <div className="space-y-6 pb-12">
        {/* Categories Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat: string) => (
            <Button
              key={cat}
              size="sm"
              variant={selectedCategory === cat ? "default" : "outline"}
              className={selectedCategory === cat ? "bg-iscarb-green hover:bg-iscarb-green/90" : ""}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === "all" ? (ar ? "الكل" : "All") : cat}
            </Button>
          ))}
        </div>

        {/* Create Button */}
        <div className="flex justify-end">
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {ar ? "نموذج جديد" : "New Prompt"}
          </Button>
        </div>

        {/* User Prompts */}
        <div className="grid gap-4 md:grid-cols-2">
          {filteredPrompts.map((prompt: any) => (
            <Card key={prompt.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 border-b border-border/40 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">{prompt.title}</CardTitle>
                  <Badge variant="outline" className="mt-1 text-xs">{prompt.category}</Badge>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingPrompt(prompt)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => handleDeletePrompt(prompt.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <p className="text-xs text-muted-foreground line-clamp-3">{prompt.content}</p>
                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-iscarb-cyan" />
                    <span className="text-[10px] text-muted-foreground">{ar ? "استخدم" : "Use"}</span>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs">
                    {ar ? "إضافة للدردشة" : "Add to Chat"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* System Prompts Section */}
        {systemPrompts.length > 0 && (
          <Card>
            <CardHeader className="pb-2 border-b border-border/40">
              <CardTitle className="text-base">{ar ? "نماذج النظام" : "System Prompts"}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {systemPrompts.slice(0, 3).map((prompt: any) => (
                <div key={prompt.id} className="p-3 rounded-lg bg-accent/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{prompt.title}</span>
                    <Badge variant="outline" className="text-[10px]">System</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{prompt.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{ar ? "نموذج جديد" : "New Prompt"}</CardTitle>
              </CardHeader>
              <form onSubmit={handleCreatePrompt}>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">{ar ? "العنوان" : "Title"}</label>
                    <Input name="title" required placeholder={ar ? "عنوان النموذج" : "Prompt title"} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">{ar ? "الفئة" : "Category"}</label>
                    <Input name="category" placeholder={ar ? "مثال: دراسة، مهني، شخصي" : "e.g., study, career, personal"} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">{ar ? "المحتوى" : "Content"}</label>
                    <Textarea name="content" required placeholder={ar ? "اكتب محتوى النموذج..." : "Type prompt content..."} rows={4} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                      {ar ? "إلغاء" : "Cancel"}
                    </Button>
                    <Button type="submit" className="bg-iscarb-green flex-1">
                      {ar ? "حفظ" : "Save"}
                    </Button>
                  </div>
                </CardContent>
              </form>
            </Card>
          </div>
        )}

        {/* Edit Modal */}
        {editingPrompt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{ar ? "تعديل النموذج" : "Edit Prompt"}</CardTitle>
              </CardHeader>
              <form onSubmit={handleUpdatePrompt}>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">{ar ? "العنوان" : "Title"}</label>
                    <Input name="title" defaultValue={editingPrompt.title} required />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">{ar ? "الفئة" : "Category"}</label>
                    <Input name="category" defaultValue={editingPrompt.category} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">{ar ? "المحتوى" : "Content"}</label>
                    <Textarea name="content" defaultValue={editingPrompt.content} required rows={4} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingPrompt(null)}>
                      <X className="h-4 w-4 mr-2" />{ar ? "إلغاء" : "Cancel"}
                    </Button>
                    <Button type="submit" className="bg-iscarb-green flex-1">
                      <Save className="h-4 w-4 mr-2" />{ar ? "حفظ" : "Save"}
                    </Button>
                  </div>
                </CardContent>
              </form>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

function errorState(ar: boolean) {
  return (
    <><PageHeader title={ar ? "النماذج المحفوظة" : "Saved Prompts"} />
      <Card className="border-red-200 bg-red-50/50"><CardContent className="p-5 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <div><h4 className="font-semibold text-sm">{ar ? "خطأ" : "Error"}</h4>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>{ar ? "إعادة تحميل" : "Retry"}</Button></div>
      </CardContent></Card></>
  );
}
