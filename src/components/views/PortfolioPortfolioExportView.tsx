'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/iscarb/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, FileText } from 'lucide-react';
import { useApi } from '@/hooks/useApi';

export function PortfolioPortfolioExportView() {
  const { data: portfolio, isLoading } = useApi('/api/v1/portfolios/me');
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (format: 'pdf' | 'json') => {
    if (!portfolio?.id) return;
    try {
      setExporting(format);
      const res = await fetch(`/api/v1/portfolios/${portfolio.id}/export?format=${format}`);
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio.${format === 'pdf' ? 'pdf' : 'json'}`;
      a.click();
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <PageHeader title="Export Portfolio" description="Download your portfolio in various formats" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => handleExport('pdf')}
                  disabled={exporting === 'pdf'}
                  className="h-20 flex-col justify-center items-center"
                >
                  <FileText className="w-6 h-6 mb-2" />
                  {exporting === 'pdf' ? 'Generating...' : 'Export as PDF'}
                </Button>

                <Button
                  onClick={() => handleExport('json')}
                  disabled={exporting === 'json'}
                  className="h-20 flex-col justify-center items-center"
                >
                  <FileText className="w-6 h-6 mb-2" />
                  {exporting === 'json' ? 'Generating...' : 'Export as JSON'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What's Included</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Portfolio headline and bio</li>
                <li>✓ All projects and entries</li>
                <li>✓ Achievements and certifications</li>
                <li>✓ Skills and endorsements</li>
                <li>✓ Career preferences</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
