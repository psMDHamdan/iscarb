'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/iscarb/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Award, Lock, Share2 } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useSession } from 'next-auth/react';

export function PortfolioPortfolioBadgeView() {
  const { data: portfolio, isLoading: portfolioLoading } = useApi('/api/v1/portfolios/me');
  const { data: badgesData, loading, error, refetch } = useApi('/api/v1/student/portfolio/badges');
  const [badges, setBadges] = useState<any[]>([]);
  const [earned, setEarned] = useState<any[]>([]);
  const [available, setAvailable] = useState<any[]>([]);

  useEffect(() => {
    if (badgesData?.data?.badges) {
      setBadges(badgesData.data.badges);
      setEarned(badgesData.data.earned || []);
      setAvailable(badgesData.data.available || []);
    }
  }, [badgesData]);

  const getBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      hackathon: 'bg-purple-100 text-purple-800',
      competition: 'bg-blue-100 text-blue-800',
      certification: 'bg-green-100 text-green-800',
      award: 'bg-yellow-100 text-yellow-800',
      publication: 'bg-indigo-100 text-indigo-800',
      default: 'bg-gray-100 text-gray-800',
    };
    return colors[category?.toLowerCase()] || colors.default;
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
        title="Badges & Recognition"
        description="Earn badges and showcase your achievements"
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

        <div className="grid gap-6">
          {earned.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-600" />
                  Earned Badges ({earned.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {earned.map((badge: any) => (
                    <div key={badge.id} className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                      <div className="text-4xl mb-2">🏆</div>
                      <h4 className="font-bold text-gray-900 mb-1">{badge.title}</h4>
                      <p className="text-xs text-gray-600 mb-2">{badge.category}</p>
                      {badge.earnedAt && (
                        <span className="text-xs text-green-700 font-medium">
                          Earned: {new Date(badge.earnedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {available.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-yellow-600" />
                  Available Badges ({available.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {available.map((badge: any) => (
                    <div key={badge.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 opacity-70">
                      <div className="text-4xl mb-2">🔒</div>
                      <h4 className="font-bold text-gray-900 mb-1">{badge.title}</h4>
                      <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
                      <Badge className={getBadgeColor(badge.category)}>{badge.category}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {badges.length === 0 && (
            <Card>
              <CardContent className="pt-12 text-center pb-12">
                <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No badges yet.</p>
                <p className="text-sm text-gray-500">
                  Earn badges by completing achievements, projects, and milestones.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
