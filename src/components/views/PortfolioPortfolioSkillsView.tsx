'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/iscarb/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Trash2, Plus, Star } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function PortfolioPortfolioSkillsView() {
  const { data: portfolio, isLoading: portfolioLoading } = useApi('/api/v1/portfolios/me');
  const { data: skillsData, loading, error, refetch } = useApi('/api/v1/student/portfolio/skills');
  const [skills, setSkills] = useState<any[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (skillsData?.data?.skills) {
      setSkills(skillsData.data.skills);
    }
  }, [skillsData]);

  const handleDelete = async (skillId: string) => {
    if (!portfolio?.id) return;
    try {
      setDeleting(skillId);
      const res = await fetch(`/api/v1/student/portfolio/skills?id=${skillId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setSkills((prev) => prev.filter((s) => s.id !== skillId));
    } catch (err) {
      console.error('Error deleting skill:', err);
    } finally {
      setDeleting(null);
    }
  };

  // Prepare data for chart
  const chartData = skills.map((skill) => ({
    name: skill.name,
    level: skill.level,
  }));

  const levelNames = {
    1: 'Beginner',
    2: 'Intermediate',
    3: 'Advanced',
    4: 'Expert',
    5: 'Master',
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
        title="My Skills"
        description="Showcase your technical and professional skills"
        action={
          <Link href="/student/portfolio/add?category=skill">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Skill
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
        ) : skills.length === 0 ? (
          <Card>
            <CardContent className="pt-12 text-center pb-12">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No skills yet. Add your first skill!</p>
              <Link href="/student/portfolio/add?category=skill">
                <Button>Add Skill</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Skills Proficiency Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical">
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip
                        formatter={(value) => levelNames[value as number] || `Level ${value}`}
                      />
                      <Bar dataKey="level" fill="#0E6C3C" barSize={30}>
                        {chartData.map((entry, index) => (
                          <cell key={`cell-${index}`} fill="#0E6C3C" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {skills
                .sort((a, b) => b.level - a.level)
                .map((skill) => (
                  <Card key={skill.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{skill.name}</h3>
                            {skill.verified && <Badge className="bg-green-100 text-green-800">Verified</Badge>}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            {skill.yearsExperience > 0 && <span>{skill.yearsExperience} years experience</span>}
                            <span className="flex items-center gap-1">
                              <span className="font-semibold">{skill.endorsementCount || 0}</span>
                              endorsement{skill.endorsementCount !== 1 ? 's' : ''}
                            </span>
                            <span className="font-medium text-blue-600">{levelNames[skill.level]}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Level:</span>
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div
                                key={level}
                                className={`w-6 h-6 rounded ${skill.level >= level ? 'bg-blue-600' : 'bg-gray-200'}`}
                              />
                            ))}
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(skill.id)}
                          disabled={deleting === skill.id}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          {deleting === skill.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
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
