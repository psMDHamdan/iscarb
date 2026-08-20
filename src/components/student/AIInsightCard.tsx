'use client';

import React from 'react';
import { AppButton } from '@/components/ui';

interface AIInsightCardProps {
  title: string;
  insight: string;
  category: 'recommendation' | 'alert' | 'tip' | 'achievement';
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
}

export function AIInsightCard({
  title,
  insight,
  category,
  actionLabel,
  onAction,
  icon,
}: AIInsightCardProps) {
  const categoryStyles = {
    recommendation: 'border-l-4 border-blue-500 bg-blue-50',
    alert: 'border-l-4 border-red-500 bg-red-50',
    tip: 'border-l-4 border-yellow-500 bg-yellow-50',
    achievement: 'border-l-4 border-green-500 bg-green-50',
  };

  return (
    <div className={`p-4 rounded-lg ${categoryStyles[category]}`}>
      <div className="flex items-start gap-3">
        {icon && <span className="text-2xl mt-1">{icon}</span>}
        <div className="flex-1">
          <h4 className="font-bold text-sm mb-1">{title}</h4>
          <p className="text-sm text-gray-700 mb-3">{insight}</p>

          {actionLabel && onAction && (
            <AppButton label={actionLabel} action="custom" onClick={onAction} size="sm" />
          )}
        </div>
      </div>
    </div>
  );
}

export default AIInsightCard;
