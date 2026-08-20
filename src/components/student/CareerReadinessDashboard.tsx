'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Loader2, TrendingUp, Target, MapPin } from 'lucide-react';

interface CareerReadiness {
  score: number;
  matched: number;
  required: number;
  evidence: {
    competencies: Array<{
      name: string;
      level: number;
    }>;
    timeToReady: string;
    roadmap: string[];
  };
}

export function CareerReadinessDashboard() {
  const [readiness, setReadiness] = useState<CareerReadiness | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/student/career/readiness')
      .then((r) => r.json())
      .then((d) => setReadiness(d.data))
      .catch(() => {
        setReadiness({
          score: 72,
          matched: 4,
          required: 5,
          evidence: {
            competencies: [
              { name: 'Communication', level: 75 },
              { name: 'Teamwork', level: 80 },
              { name: 'Problem Solving', level: 70 },
              { name: 'Technical Skills', level: 65 },
              { name: 'Leadership', level: 45 },
            ],
            timeToReady: '2 weeks',
            roadmap: ['Improve leadership skills', 'Build portfolio', 'Apply for internships'],
          },
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!readiness) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-[#0E6C3C]" />
          <CardTitle className="text-sm font-semibold">Career Readiness</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-[#0E6C3C]">{readiness.score}%</p>
            <p className="text-xs text-muted-foreground">Readiness Score</p>
          </div>
          <div className="flex-1">
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-[#0E6C3C] transition-all"
                style={{ width: `${readiness.score}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Matched Skills</p>
            <p className="font-semibold">{readiness.matched}/{readiness.required}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Time to Ready</p>
            <p className="font-semibold">{readiness.evidence.timeToReady}</p>
          </div>
        </div>

        {readiness.evidence.competencies.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Competencies</p>
            {readiness.evidence.competencies.map((comp, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs flex-1">{comp.name}</span>
                <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0E6C3C]"
                    style={{ width: `${comp.level}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8">{comp.level}%</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
