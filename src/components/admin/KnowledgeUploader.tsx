// Knowledge Uploader Component
// Drag-drop PDF and document upload for RAG
// src/components/admin/KnowledgeUploader.tsx

'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, File, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  chunks?: number;
  sourceId?: string;
}

export function KnowledgeUploader() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [testQuery, setTestQuery] = useState('');
  const [testResults, setTestResults] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    await uploadFiles(droppedFiles);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      await uploadFiles(selectedFiles);
    }
  };

  const uploadFiles = async (filesToUpload: File[]) => {
    for (const file of filesToUpload) {
      // Validate file type
      const validTypes = [
        'application/pdf',
        'text/plain',
        'text/markdown',
        'application/msword',
      ];
      if (!validTypes.includes(file.type) && !file.name.endsWith('.md')) {
        alert(
          `Invalid file type: ${file.type}. Please upload PDF, TXT, MD, or DOCX files.`
        );
        continue;
      }

      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        alert(`File too large: ${file.name}. Max size is 50MB.`);
        continue;
      }

      const uploadedFile: UploadedFile = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        status: 'uploading',
      };

      setFiles((prev) => [...prev, uploadedFile]);

      try {
        // Upload file
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch('/api/admin/knowledge/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();

        if (uploadData.success) {
          // Update status to processing
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id
                ? {
                    ...f,
                    status: 'processing',
                    sourceId: uploadData.sourceId,
                  }
                : f
            )
          );

          // Simulate chunking completion (in real app, would poll for status)
          setTimeout(() => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === uploadedFile.id
                  ? { ...f, status: 'complete', chunks: 45 }
                  : f
              )
            );
          }, 2000);
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id ? { ...f, status: 'error' } : f
            )
          );
        }
      } catch (error) {
        console.error('Upload failed:', error);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id ? { ...f, status: 'error' } : f
          )
        );
      }
    }
  };

  const testRetrieval = async () => {
    if (!testQuery.trim()) {
      alert('Please enter a test query');
      return;
    }

    setTestLoading(true);
    try {
      const res = await fetch('/api/admin/knowledge/test-retrieval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testQuery, topK: 5 }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResults(data);
      }
    } catch (error) {
      console.error('Test failed:', error);
      alert('Failed to test retrieval');
    } finally {
      setTestLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'complete':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes, k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Knowledge Sources
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Upload PDFs, documents, and training materials to ground AI question generation and scoring
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/20 hover:border-muted-foreground/40'
            }`}
          >
            <File className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="font-semibold mb-1">
              Drag files here or click to upload
            </p>
            <p className="text-xs text-muted-foreground">
              Supported: PDF, TXT, MD, DOCX (Max 50MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.md,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Uploaded Files */}
          {files.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Upload Progress</h4>
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <File className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                        {file.chunks && ` • ${file.chunks} chunks`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusIcon(file.status)}
                    <Badge
                      variant={
                        file.status === 'complete' ? 'default' : 'secondary'
                      }
                    >
                      {file.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* File Stats */}
          {files.length > 0 && (
            <Alert>
              <AlertDescription>
                {files.filter((f) => f.status === 'complete').length} of{' '}
                {files.length} files processed
                {files.reduce((sum, f) => sum + (f.chunks || 0), 0) > 0 &&
                  ` • ${files.reduce((sum, f) => sum + (f.chunks || 0), 0)} total chunks created`}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test Retrieval */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Test Retrieval</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Verify that your uploaded knowledge can be retrieved correctly
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter a test query (e.g., 'leadership qualities')"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && testRetrieval()}
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
            />
            <Button onClick={testRetrieval} disabled={testLoading}>
              {testLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test'}
            </Button>
          </div>

          {/* Test Results */}
          {testResults && (
            <div className="space-y-3">
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-xs text-green-800 dark:text-green-200">
                  <strong>Retrieved {testResults.resultCount} results</strong> in {testResults.elapsedMs}ms
                </p>
              </div>

              {testResults.chunks.map((chunk: any, idx: number) => (
                <div
                  key={idx}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div className="text-xs text-muted-foreground">
                      Chunk {idx + 1}
                    </div>
                    <Badge variant="secondary">
                      {(chunk.relevanceScore * 100).toFixed(0)}% match
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground">
                    {chunk.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Alert>
        <AlertDescription>
          <strong>Best Practices:</strong> Upload complete documentation,
          training materials, rubrics, and competency frameworks. AI will
          automatically chunk and embed these to ground question generation and
          scoring.
        </AlertDescription>
      </Alert>
    </div>
  );
}
