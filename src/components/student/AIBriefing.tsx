'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Loader2, Sparkles } from 'lucide-react';

interface Briefing {
  greeting: string;
  summary: string;
  tasks: Array<{ title: string; priority: string; dueDate: string }>;
  recommendations: string[];
}

export function AIBriefing() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/student/coach/daily-plan')
      .then((r) => r.json())
      .then((d) => setBriefing(d.data))
      .catch(() => {
        setBriefing({
          greeting: 'Welcome back!',
          summary: 'You have 3 tasks due today.',
          tasks: [
            { title: 'Complete CS201 Assignment', priority: 'high', dueDate: 'Today' },
            { title: 'Review ML Notes', priority: 'medium', dueDate: 'Tomorrow' },
            { title: 'Update Portfolio', priority: 'low', dueDate: 'This Week' },
          ],
          recommendations: ['Focus on your weak areas', 'Review yesterday\'s notes'],
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

  if (!briefing) return null;

  return (
    <Card className="border-[#0E6C3C]/20 bg-gradient-to-br from-[#0E6C3C]/5 to-background">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#0E6C3C]" />
          <CardTitle className="text-sm font-semibold">AI Daily Briefing</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm font-medium">{briefing.greeting}</p>
        <p className="text-xs text-muted-foreground">{briefing.summary}</p>
        {briefing.tasks.length > 0 && (
          <div className="space-y-2">
            {briefing.tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className={`h-2 w-2 rounded-full ${
                  task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                }`} />
                <span className="flex-1">{task.title}</span>
                <span className="text-muted-foreground">{task.dueDate}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
