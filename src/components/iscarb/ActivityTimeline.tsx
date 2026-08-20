import React from 'react';
import { LucideIcon, Activity } from 'lucide-react';

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  icon?: LucideIcon;
  iconColorClass?: string;
  iconBgClass?: string;
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function ActivityTimeline({ events, className = '' }: ActivityTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className={`p-8 text-center text-muted-foreground bg-card border rounded-xl shadow-sm ${className}`}>
        <Activity className="w-8 h-8 mx-auto mb-3 opacity-20" />
        <p>No recent activity</p>
      </div>
    );
  }

  return (
    <div className={`bg-card border rounded-xl p-6 shadow-sm ${className}`}>
      <h3 className="font-semibold mb-6">Recent Activity</h3>
      
      <div className="space-y-6">
        {events.map((event, idx) => {
          const Icon = event.icon || Activity;
          const isLast = idx === events.length - 1;
          
          return (
            <div key={event.id} className="relative flex gap-4">
              {!isLast && (
                <div className="absolute left-[19px] top-[32px] bottom-[-24px] w-px bg-border" />
              )}
              
              <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${event.iconBgClass || 'bg-gray-100'} ${event.iconColorClass || 'text-gray-600'}`}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex flex-col pb-1">
                <span className="text-sm font-medium">{event.title}</span>
                {event.description && (
                  <span className="text-sm text-muted-foreground mt-0.5">{event.description}</span>
                )}
                <span className="text-xs text-muted-foreground mt-1.5">{new Date(event.timestamp).toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
