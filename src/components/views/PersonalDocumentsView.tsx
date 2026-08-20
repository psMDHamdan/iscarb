'use client';
import { useState } from "react";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { FileText, Image, File, Download, Trash2, Upload, Plus } from "lucide-react";

function fileIcon(name: string) {
  const ext = name?.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <FileText className="h-5 w-5 text-red-500" />;
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') return <Image className="h-5 w-5 text-blue-500" />;
  return <File className="h-5 w-5 text-gray-500" />;
}

export function PersonalDocumentsView() {
  const { ar } = useI18n();
  const [uploading, setUploading] = useState(false);

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        await fetch('/api/v1/student/personal/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, size: `${(file.size / 1024 / 1024).toFixed(1)}MB` }),
        });
        window.location.reload();
      } catch { }
      setUploading(false);
    };
    input.click();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/v1/student/personal/documents?id=${id}`, { method: 'DELETE' });
    window.location.reload();
  };

  return (
    <StudentPageTemplate
      title="Documents"
      titleAr="المستندات"
      apiEndpoint="/api/v1/student/personal/documents"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "الملف الشخصي" : "Profile", href: "/student/personal" },
        { label: ar ? "المستندات" : "Documents", href: "/student/personal/documents" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {data?.documents?.length ?? 0} {ar ? "مستند" : "document(s)"}
            </p>
            <Button size="sm" onClick={handleUpload} disabled={uploading} className="gap-2">
              <Plus className="h-4 w-4" />
              {uploading ? (ar ? "جارٍ الرفع..." : "Uploading...") : (ar ? "رفع مستند" : "Upload Document")}
            </Button>
          </div>

          {(!data?.documents || data.documents.length === 0) ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {ar ? "لا توجد مستندات مرفوعة بعد" : "No documents uploaded yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0 divide-y">
                {data.documents.map((doc: any, i: number) => (
                  <div key={doc.id ?? i} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className="shrink-0">{fileIcon(doc.name)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.size} · {doc.uploaded}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {doc.url && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={doc.url} download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(doc.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </StudentPageTemplate>
  );
}
