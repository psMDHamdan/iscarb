'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface ProgressIndicatorProps {
  current: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'primary' | 'success' | 'warning';
  animated?: boolean;
}

export function ProgressIndicator({
  current,
  total,
  label,
  showPercentage = true,
  variant = 'primary',
  animated = true,
}: ProgressIndicatorProps) {
  const percentage = Math.round((current / total) * 100);

  const colors = {
    primary: 'bg-[#0E6C3C]',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
  };

  return (
    <div className="w-full">
      {label && <p className="text-sm font-semibold mb-2">{label}</p>}

      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-500',
            colors[variant],
            animated && 'animate-pulse',
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {showPercentage && (
        <div className="flex justify-between mt-1 text-xs text-gray-600">
          <span>
            {current}/{total}
          </span>
          <span className="font-semibold">{percentage}%</span>
        </div>
      )}
    </div>
  );
}

export default ProgressIndicator;
