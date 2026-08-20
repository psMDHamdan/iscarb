'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/iscarb/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Briefcase, Plus, X } from 'lucide-react';
import { useApi } from '@/hooks/useApi';

export function PortfolioPortfolioExperienceView() {
  const { data: portfolio, isLoading: portfolioLoading } = useApi('/api/v1/portfolios/me');
  const { data: experienceData, loading, error, refetch } = useApi('/api/v1/student/portfolio/experience');
  const [experiences, setExperiences] = useState<any[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (experienceData?.data?.experiences) {
      setExperiences(experienceData.data.experiences);
    }
  }, [experienceData]);

  const handleDelete = async (experienceId: string) => {
    try {
      setDeleting(experienceId);
      const res = await fetch(`/api/v1/student/portfolio/experience?id=${experienceId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setExperiences((prev) => prev.filter((e) => e.id !== experienceId));
    } catch (err) {
      console.error('Error deleting experience:', err);
    } finally {
      setDeleting(null);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      work: 'bg-green-100 text-green-800',
      internship: 'bg-blue-100 text-blue-800',
      volunteer: 'bg-purple-100 text-purple-800',
      project: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatDateRange = (start: string, end: string | null) => {
    const startDate = new Date(start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (end) {
      return `${startDate} - ${new Date(end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    }
    return `${startDate} - Present`;
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
        title="Work Experience"
        description="Showcase your professional experience and career history"
        action={
          <Link href="/student/portfolio/add?category=experience">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Experience
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
        ) : experiences.length === 0 ? (
          <Card>
            <CardContent className="pt-12 text-center pb-12">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No work experience added yet.</p>
              <Link href="/student/portfolio/add?category=experience">
                <Button>Add Your First Experience</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {experiences.map((experience: any) => (
              <Card key={experience.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getTypeColor(experience.type)}>{experience.type}</Badge>
                        <span className="text-sm text-gray-600">{formatDateRange(experience.startDate, experience.endDate)}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{experience.title}</h3>
                      <p className="text-lg text-blue-600">{experience.organization}</p>
                      {experience.description && <p className="text-gray-600 mt-2">{experience.description}</p>}
                      {experience.location && <p className="text-sm text-gray-500 mt-1">{experience.location}</p>}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(experience.id)}
                      disabled={deleting === experience.id}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4 mr-1" />
                      {deleting === experience.id ? 'Deleting...' : 'Delete'}
                    </Button>
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
