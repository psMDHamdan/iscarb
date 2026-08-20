'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Target, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface Risk {
  category: string;
  score: number;
  status: string;
}

export function SuccessSnapshot() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching risk data
    setRisks([
      { category: 'Academic', score: 25, status: 'low' },
      { category: 'Attendance', score: 15, status: 'low' },
      { category: 'Wellbeing', score: 30, status: 'medium' },
      { category: 'Career', score: 45, status: 'medium' },
      { category: 'Financial', score: 10, status: 'low' },
    ]);
    setLoading(false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'medium': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-[#0E6C3C]" />
          <CardTitle className="text-sm font-semibold">Success Snapshot</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2">
          {risks.map((risk) => (
            <div key={risk.category} className="text-center p-2 rounded-lg bg-muted/50">
              <div className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${getStatusColor(risk.status)}`}>
                {getStatusIcon(risk.status)}
              </div>
              <p className="text-lg font-bold mt-1">{risk.score}%</p>
              <p className="text-[10px] text-muted-foreground">{risk.category}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
