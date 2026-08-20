import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, className = '' }: StatCardProps) {
  return (
    <div className={`relative group overflow-hidden rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 flex flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div>
        <h3 className="text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">{value}</h3>
        {trend && (
          <p className="text-xs mt-2 flex items-center gap-1">
            <span className={`font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-muted-foreground">{trend.label}</span>
          </p>
        )}
      </div>
    </div>
  );
}
