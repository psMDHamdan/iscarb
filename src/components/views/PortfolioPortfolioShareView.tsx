'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/iscarb/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, CheckCircle, AlertCircle, Globe, Lock } from 'lucide-react';
import { useApi } from '@/hooks/useApi';

export function PortfolioPortfolioShareView() {
  const { data: portfolio, isLoading } = useApi('/api/v1/portfolios/me');
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateShareLink = async () => {
    if (!portfolio?.id) return;
    try {
      setGenerating(true);
      const res = await fetch(`/api/v1/portfolios/${portfolio.id}/share`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to generate share link');
      const data = await res.json();
      setShareToken(data.data?.token);
    } catch (err) {
      console.error('Error generating share link:', err);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareToken) return;
    const url = `${window.location.origin}/portfolio/share/${shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      <PageHeader title="Share Your Portfolio" description="Control access and share your portfolio with others" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Portfolio Visibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge className={portfolio?.visibility === 'public' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {portfolio?.visibility || 'private'}
                </Badge>
                <p className="text-gray-600 text-sm mt-2">Current visibility status of your portfolio</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Shareable Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {shareToken ? (
                <>
                  <div className="p-4 bg-gray-100 rounded-lg font-mono text-sm break-all">
                    {`${window.location.origin}/portfolio/share/${shareToken}`}
                  </div>
                  <Button onClick={copyToClipboard} className="w-full">
                    {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-gray-600">Generate a secure link to share your portfolio with others</p>
                  <Button onClick={generateShareLink} disabled={generating} className="w-full">
                    {generating ? 'Generating...' : 'Generate Share Link'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Share Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-gray-900 mb-2">Who can see your portfolio?</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✓ You can always see your own portfolio</li>
                  <li>✓ People with share link can view if enabled</li>
                  <li>✓ Endorsements from other students visible on skills</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
