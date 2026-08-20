'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/iscarb/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Plus, X, FileText, Calendar } from 'lucide-react';
import { useApi } from '@/hooks/useApi';

export function PortfolioPortfolioPublicationsView() {
  const { data: portfolio, isLoading: portfolioLoading } = useApi('/api/v1/portfolios/me');
  const { data: publicationsData, loading, error, refetch } = useApi('/api/v1/student/portfolio/publications');
  const [publications, setPublications] = useState<any[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (publicationsData?.data?.publications) {
      setPublications(publicationsData.data.publications);
    }
  }, [publicationsData]);

  const handleDelete = async (publicationId: string) => {
    try {
      setDeleting(publicationId);
      const res = await fetch(`/api/v1/student/portfolio/publications?id=${publicationId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setPublications((prev) => prev.filter((p) => p.id !== publicationId));
    } catch (err) {
      console.error('Error deleting publication:', err);
    } finally {
      setDeleting(null);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      article: 'bg-blue-100 text-blue-800',
      paper: 'bg-purple-100 text-purple-800',
      thesis: 'bg-green-100 text-green-800',
      book: 'bg-orange-100 text-orange-800',
      chapter: 'bg-indigo-100 text-indigo-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
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
        title="Publications"
        description="Your academic and professional publications"
        action={
          <Link href="/student/portfolio/add?category=publication">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Publication
            </Button>
          </Link>
        }
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : publications.length === 0 ? (
          <Card>
            <CardContent className="pt-12 text-center pb-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No publications added yet.</p>
              <Link href="/student/portfolio/add?category=publication">
                <Button>Add Your First Publication</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {publications.map((pub: any) => (
              <Card key={pub.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{pub.title}</h3>
                        <Badge className={getTypeColor(pub.type)}>{pub.type}</Badge>
                      </div>
                      <p className="text-gray-700 italic mb-2">by {pub.authors}</p>
                      {pub.journal && <p className="text-gray-600 mb-2">{pub.journal}</p>}
                      {pub.publishedAt && (
                        <p className="text-sm text-gray-500 mb-2">
                          <Calendar className="inline w-3 h-3 mr-1" />
                          Published: {new Date(pub.publishedAt).toLocaleDateString()}
                        </p>
                      )}
                      {pub.abstract && <p className="text-gray-600 text-sm mt-2">{pub.abstract}</p>}
                      {pub.doi && <p className="text-sm text-blue-600 mt-1">DOI: {pub.doi}</p>}
                    </div>
                    <div className="flex gap-2">
                      {pub.url && (
                        <a href={pub.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <FileText className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(pub.id)}
                        disabled={deleting === pub.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                        {deleting === pub.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
