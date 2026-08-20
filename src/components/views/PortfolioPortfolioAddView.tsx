'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/iscarb/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Plus, X } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';

export function PortfolioPortfolioAddView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const category = searchParams.get('category') || 'project';
  const entryId = searchParams.get('id');

  const { data: portfolio, isLoading: portfolioLoading } = useApi('/api/v1/portfolios/me');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category,
    content: '',
    url: '',
    imageUrl: '',
    tags: [''],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entryId && portfolio?.id) {
      fetchEntry();
    }
  }, [entryId, portfolio?.id]);

  const fetchEntry = async () => {
    try {
      const res = await fetch(`/api/v1/student/portfolio/${category}/${entryId}`);
      if (!res.ok) throw new Error('Failed to fetch entry');
      const data = await res.json();
      const entry = data.data;
      setFormData({
        title: entry.title,
        description: entry.description,
        category: entry.category,
        content: entry.content || '',
        url: entry.url || '',
        imageUrl: entry.imageUrl || '',
        tags: typeof entry.tags === 'string' ? JSON.parse(entry.tags) : entry.tags || [''],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entry');
    }
  };

  const handleTagChange = (index: number, value: string) => {
    const newTags = [...formData.tags];
    newTags[index] = value;
    setFormData({ ...formData, tags: newTags });
  };

  const addTag = () => {
    setFormData({ ...formData, tags: [...formData.tags, ''] });
  };

  const removeTag = (index: number) => {
    setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolio?.id) {
      setError('Portfolio not found');
      return;
    }

    try {
      setLoading(true);
      const validTags = formData.tags.filter((t) => t.trim());
      const endpoint = category === 'project' ? 'projects' : category === 'skill' ? 'skills' : category === 'achievement' ? 'achievements' : category === 'experience' ? 'experience' : category === 'certification' ? 'certifications' : category === 'publication' ? 'publications' : category === 'journey' ? 'journey' : 'entries';
      const method = entryId ? 'PUT' : 'POST';
      const url = entryId
        ? `/api/v1/student/portfolio/${endpoint}/${entryId}`
        : `/api/v1/student/portfolio/${endpoint}`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, tags: validTags }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save entry');
      }

      toast({
        title: entryId ? 'Entry updated' : 'Entry created',
        description: 'Your entry has been successfully saved',
      });

      router.push(
        `/student/portfolio/${category === 'achievement' ? 'achievements' : category === 'skill' ? 'skills' : category === 'journey' ? 'journey' : category === 'certification' ? 'certifications' : category === 'publication' ? 'publications' : category === 'experience' ? 'experience' : 'projects'}`,
      );
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error saving entry',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
      <PageHeader title={entryId ? 'Edit Entry' : 'Add Portfolio Entry'} description="Add or update your portfolio content" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Entry Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Project title or achievement name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Description *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your project or achievement"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">URL</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Image URL</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Full content or detailed description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">Tags</label>
                <div className="space-y-2">
                  {formData.tags.map((tag, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={tag}
                        onChange={(e) => handleTagChange(idx, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder={`Tag ${idx + 1}`}
                      />
                      {formData.tags.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTag(idx)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addTag}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Tag
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : entryId ? 'Update Entry' : 'Create Entry'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
