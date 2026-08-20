'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/iscarb/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Award } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useSession } from 'next-auth/react';

export function PortfolioPortfolioCompetencyView() {
  const { data: portfolio, isLoading: portfolioLoading } = useApi('/api/v1/portfolios/me');
  const { data: competenciesData, loading, error } = useApi('/api/v1/student/portfolio/competencies');
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (competenciesData?.data?.competencies) {
      setCompetencies(competenciesData.data.competencies);
      setCategoryGroups(competenciesData.data.categoryGroups || {});
    }
  }, [competenciesData]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      technical: 'bg-blue-100 text-blue-800',
      leadership: 'bg-purple-100 text-purple-800',
      communication: 'bg-green-100 text-green-800',
      problem_solving: 'bg-yellow-100 text-yellow-800',
      creativity: 'bg-orange-100 text-orange-800',
      default: 'bg-gray-100 text-gray-800',
    };
    return colors[category?.toLowerCase().replace(/_/g, '_')] || colors.default;
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
      <PageHeader title="Competencies" description="Professional competencies and skill development" />

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
          {Object.entries(categoryGroups).map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                  <Badge className={getCategoryColor(category)}>{items.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {items.map((competency: any) => (
                    <div key={competency.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{competency.name}</h4>
                        <p className="text-sm text-gray-600">{competency.description}</p>
                      </div>
                      {competency.verified && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Verified
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {Object.keys(categoryGroups).length === 0 && (
            <Card>
              <CardContent className="pt-12 text-center pb-12">
                <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No competencies yet.</p>
                <p className="text-sm text-gray-500">
                  Competencies are automatically extracted from your skills, projects, and achievements.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
