"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle, Edit, Trash2, Save, X, Zap, Brain, MemoryStick } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-query";

export function AiMemoryView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [editingMemory, setEditingMemory] = useState<any>(null);

  const { data, isLoading: loading, error, refetch } = useApiQuery<{
    data: { memories: any[]; learningMemories: any[]; stats: any }
  }>(["ai", "memory"], "/api/v1/student/ai/memory");

  const { mutate: updateMemory } = useApiMutation<{ success: boolean; data: any }>(
    (data) => ({ url: "/api/v1/student/ai/memory", method: "PUT", body: data })
  );

  const { mutate: deleteMemory } = useApiMutation<{ success: boolean; data: any }>(
    (data) => ({ url: `/api/v1/student/ai/memory?id=${data.id}`, method: "DELETE" })
  );

  const handleUpdateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const result = await updateMemory({
      id: editingMemory?.id,
      content: formData.get("content") as string,
      summary: formData.get("summary") as string,
    });

    if (result?.success) {
      setEditingMemory(null);
      refetch();
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (confirm(ar ? "هل أنت متأكد من الحذف؟" : "Are you sure you want to delete?")) {
      await deleteMemory({ id });
      refetch();
    }
  };

  if (loading) return (
    <><PageHeader title={ar ? "ذاكرة الذكاء الاصطناعي" : "AI Memory"} />
      <div className="space-y-3">{[1, 2, 3].map(i => <Card key={i}><CardContent className="p-12 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-iscarb-green" /></CardContent></Card>)}</div></>
  );
  if (error || !data?.data) return errorState(ar);

  const { memories, learningMemories, stats } = data.data;

  return (
    <>
      <PageHeader title={ar ? "ذاكرة الذكاء الاصطناعي" : "AI Memory"}
        description={ar ? `${stats.totalMemories} مدخلة | ${Object.entries(stats.typeCount || {}).length} أنواع` : `${stats.totalMemories} entries | ${Object.entries(stats.typeCount || {}).length} types`} />

      <div className="space-y-6 pb-12">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <MemoryStick className="h-6 w-6 text-iscarb-green mb-2" />
              <p className="text-2xl font-bold text-iscarb-green">{stats.totalMemories}</p>
              <p className="text-xs text-muted-foreground">{ar ? "الذكريات" : "Memories"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Brain className="h-6 w-6 text-iscarb-cyan mb-2" />
              <p className="text-2xl font-bold text-iscarb-cyan">{learningMemories.length}</p>
              <p className="text-xs text-muted-foreground">{ar ? "التعلم" : "Learning"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Zap className="h-6 w-6 text-purple-600 mb-2" />
              <p className="text-2xl font-bold text-purple-600">
                {Object.keys(stats.typeCount || {}).length}
              </p>
              <p className="text-xs text-muted-foreground">{ar ? "الأنواع" : "Types"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Memory Entries */}
        <div className="grid gap-4 md:grid-cols-2">
          {memories.map((memory: any) => (
            <Card key={memory.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 border-b border-border/40 flex flex-row items-start justify-between">
                <div>
                  <Badge variant="outline" className="text-xs mb-1 block">{memory.type}</Badge>
                  <CardTitle className="text-base truncate max-w-[200px]">{memory.summary || "No summary"}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingMemory(memory)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => handleDeleteMemory(memory.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground line-clamp-3">{memory.content}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(memory.createdAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {ar ? "درجة الأهمية" : "Relevance"}: {(memory.relevance * 100).toFixed(0)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Modal */}
        {editingMemory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{ar ? "تعديل الذكرى" : "Edit Memory"}</CardTitle>
              </CardHeader>
              <form onSubmit={handleUpdateMemory}>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">{ar ? "الملخص" : "Summary"}</label>
                    <Input name="summary" defaultValue={editingMemory.summary} required />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">{ar ? "المحتوى" : "Content"}</label>
                    <Textarea name="content" defaultValue={editingMemory.content} required rows={4} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingMemory(null)}>
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

        {/* Learning Memories */}
        {learningMemories.length > 0 && (
          <Card>
            <CardHeader className="pb-2 border-b border-border/40">
              <CardTitle className="text-base">{ar ? "ذكريات التعلم" : "Learning Memories"}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {learningMemories.slice(0, 3).map((memory: any) => (
                <div key={memory.id} className="p-3 rounded-lg bg-accent/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{memory.topic || memory.summary}</span>
                    <Badge variant="outline" className="text-[10px]">Learning</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{memory.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

function errorState(ar: boolean) {
  return (
    <><PageHeader title={ar ? "ذاكرة الذكاء الاصطناعي" : "AI Memory"} />
      <Card className="border-red-200 bg-red-50/50"><CardContent className="p-5 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <div><h4 className="font-semibold text-sm">{ar ? "خطأ" : "Error"}</h4>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>{ar ? "إعادة تحميل" : "Retry"}</Button></div>
      </CardContent></Card></>
  );
}
