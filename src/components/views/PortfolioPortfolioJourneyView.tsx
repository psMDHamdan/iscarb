'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/iscarb/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Briefcase, Plus } from 'lucide-react';
import { useApi } from '@/hooks/useApi';

export function PortfolioPortfolioJourneyView() {
  const { data: portfolio, isLoading: portfolioLoading } = useApi('/api/v1/portfolios/me');
  const { data: journeyData, loading, error, refetch } = useApi('/api/v1/student/portfolio/journey');
  const [milestones, setMilestones] = useState<any[]>([]);

  useEffect(() => {
    if (journeyData?.data?.milestones) {
      setMilestones(journeyData.data.milestones);
    }
  }, [journeyData]);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      academic: 'bg-blue-100 text-blue-800',
      professional: 'bg-green-100 text-green-800',
      personal: 'bg-purple-100 text-purple-800',
      project: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'academic': return '🎓';
      case 'professional': return '💼';
      case 'personal': return '👤';
      case 'project': return '🚀';
      default: return '📌';
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
        title="Career Journey"
        description="Your professional growth and milestones timeline"
        action={
          <Link href="/student/portfolio/add?category=journey">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Milestone
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

        <div className="space-y-12 pb-8">
          {milestones.length > 0 ? (
            milestones.map((milestone: any) => (
              <div key={milestone.id} className="relative pl-8">
                <div className="absolute -left-3 top-0 w-6 h-6 bg-blue-600 rounded-full border-4 border-white" />
                <div className="absolute -left-px top-6 w-1 h-8 bg-blue-200" />
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm text-gray-600 font-semibold">{new Date(milestone.date).toLocaleDateString()}</span>
                  <Badge className={getTypeColor(milestone.type)}>{milestone.type}</Badge>
                </div>
                <div className="text-xl font-bold text-gray-900">{milestone.title}</div>
                {milestone.description && <p className="text-gray-600 mt-2">{milestone.description}</p>}
                {milestone.location && <p className="text-sm text-gray-500 mt-1">{milestone.location}</p>}
              </div>
            ))
          ) : (
            <Card>
              <CardContent className="pt-12 text-center pb-12">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No milestones yet.</p>
                <Link href="/student/portfolio/add?category=journey">
                  <Button>Add Your First Milestone</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {milestones.length > 0 && (
          <div className="mt-12 pt-8 border-t">
            <h3 className="font-bold text-gray-900 mb-4">Key Milestones</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Academic', value: milestones.filter(m => m.type === 'academic').length, icon: '🎓' },
                { label: 'Professional', value: milestones.filter(m => m.type === 'professional').length, icon: '💼' },
                { label: 'Personal', value: milestones.filter(m => m.type === 'personal').length, icon: '👤' },
              ].map((category, idx) => (
                <Card key={idx} className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <div className="text-sm text-gray-600">{category.label}</div>
                    <div className="text-lg font-bold text-blue-600">{category.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
