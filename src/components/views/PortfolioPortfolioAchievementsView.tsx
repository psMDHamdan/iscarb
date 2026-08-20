'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/iscarb/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Trash2, Edit2, Award, Plus } from 'lucide-react';
import { useApi } from '@/hooks/useApi';

interface Achievement {
  id: string;
  title: string;
  description?: string;
  type: string;
  issuer?: string;
  issuedDate?: string;
  expiryDate?: string;
  badgeUrl?: string;
  credentialUrl?: string;
  verified: boolean;
}

export function PortfolioPortfolioAchievementsView() {
  const { data: portfolio, isLoading: portfolioLoading } = useApi('/api/v1/portfolios/me');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!portfolio?.id) return;
    fetchAchievements();
  }, [portfolio?.id]);

  const fetchAchievements = async () => {
    if (!portfolio?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/portfolios/${portfolio.id}/achievements`);
      if (!res.ok) throw new Error('Failed to fetch achievements');
      const data = await res.json();
      setAchievements(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching achievements');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (achievementId: string) => {
    if (!portfolio?.id) return;
    try {
      setDeleting(achievementId);
      const res = await fetch(`/api/v1/portfolios/${portfolio.id}/achievements/${achievementId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setAchievements((prev) => prev.filter((a) => a.id !== achievementId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting achievement');
    } finally {
      setDeleting(null);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      hackathon: 'bg-purple-100 text-purple-800',
      competition: 'bg-blue-100 text-blue-800',
      certification: 'bg-green-100 text-green-800',
      award: 'bg-yellow-100 text-yellow-800',
      publication: 'bg-indigo-100 text-indigo-800',
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
        title="My Achievements"
        description="Certifications, awards, and accomplishments"
        action={
          <Link href="/student/portfolio/add?category=achievement">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Achievement
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
        ) : achievements.length === 0 ? (
          <Card>
            <CardContent className="pt-12 text-center pb-12">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No achievements yet. Add your first achievement!</p>
              <Link href="/student/portfolio/add?category=achievement">
                <Button>Add Achievement</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {achievement.badgeUrl && (
                      <img
                        src={achievement.badgeUrl}
                        alt={achievement.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{achievement.title}</h3>
                          <p className="text-gray-600 text-sm">{achievement.issuer}</p>
                        </div>
                        <Badge className={getTypeColor(achievement.type)} variant="outline">
                          {achievement.type}
                        </Badge>
                      </div>

                      {achievement.description && <p className="text-gray-600 text-sm mb-3">{achievement.description}</p>}

                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                        {achievement.issuedDate && <span>Issued: {new Date(achievement.issuedDate).toLocaleDateString()}</span>}
                        {achievement.expiryDate && <span>Expires: {new Date(achievement.expiryDate).toLocaleDateString()}</span>}
                        {achievement.verified && <Badge variant="default">Verified</Badge>}
                      </div>

                      <div className="flex items-center gap-2">
                        {achievement.credentialUrl && (
                          <a href={achievement.credentialUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">
                              View Credential
                            </Button>
                          </a>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(achievement.id)}
                          disabled={deleting === achievement.id}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          {deleting === achievement.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
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
