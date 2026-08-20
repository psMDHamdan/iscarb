'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/iscarb/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Sparkles, Target, Zap, TrendingUp, FileText } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { toast } from 'sonner';

export function PortfolioPortfolioAiView() {
  const router = useRouter();

  const { data: portfolio, isLoading: portfolioLoading } = useApi('/api/v1/portfolios/me');
  const { data: aiData, loading, error } = useApi('/api/v1/student/portfolio/ai-view');
  const [targetRole, setTargetRole] = useState('');
  const [keySkills, setKeySkills] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  useEffect(() => {
    if (portfolio?.id) {
      refetch();
    }
  }, [portfolio?.id]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await fetch('/api/v1/student/portfolio/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'projects',
          targetRole,
          keySkills: keySkills.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error('Failed to generate content');
      const data = await res.json();
      setGeneratedContent(data.data);
      toast.success('AI Content Generated', {
        description: 'Review and edit the suggested content below',
      });
    } catch (err: any) {
      toast.error('Error', {
        description: err.message || 'Failed to generate content',
      });
    } finally {
      setGenerating(false);
    }
  };

  if (portfolioLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <PageHeader
        title="AI Portfolio Generator"
        description="Use AI to help create and optimize your portfolio"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Content Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Target Role</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Software Engineer, Data Scientist"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Key Skills (comma-separated)</label>
                <input
                  type="text"
                  value={keySkills}
                  onChange={(e) => setKeySkills(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., React, Node.js, Python"
                />
              </div>
              <Button onClick={handleGenerate} disabled={generating} className="w-full">
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate AI Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {generatedContent && (
            <Card>
              <CardHeader>
                <CardTitle>Suggested Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Suggestion for {generatedContent.section}:</h4>
                  <p className="text-gray-600 text-sm">{generatedContent.suggestions[0]?.description}</p>
                </div>
                <Button onClick={() => router.push('/student/portfolio/add')} variant="outline" className="w-full">
                  Add Content
                </Button>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-gray-600">Analyzing your portfolio...</p>
              </CardContent>
            </Card>
          ) : aiData?.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  Portfolio Optimization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="text-center p-4">
                    <div className="text-3xl font-bold text-blue-600">{aiData.data.completeness.score}/{aiData.data.completeness.maxScore}</div>
                    <div className="text-sm text-gray-600">Completeness Score</div>
                  </Card>
                  <Card className="text-center p-4">
                    <div className="text-3xl font-bold text-purple-600">{aiData.data.stats.projects}</div>
                    <div className="text-sm text-gray-600">Projects</div>
                  </Card>
                  <Card className="text-center p-4">
                    <div className="text-3xl font-bold text-green-600">{aiData.data.stats.skills}</div>
                    <div className="text-sm text-gray-600">Skills</div>
                  </Card>
                </div>

                {aiData.data.completeness.gaps.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">提升建议:</h4>
                    <ul className="space-y-2">
                      {aiData.data.completeness.gaps.map((gap: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-red-600">
                          <Zap className="w-4 h-4" />
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
