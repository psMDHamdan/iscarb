'use client';

import React from 'react';
import { AppButton } from '@/components/ui';
import { useI18n } from '@/hooks/useI18n';

interface RecommendationCardProps {
  title: string;
  description: string;
  reason: string;
  confidence: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: string;
}

export function RecommendationCard({
  title,
  description,
  reason,
  confidence,
  action,
  icon = '🤖',
}: RecommendationCardProps) {
  const { t } = useI18n();

  return (
    <div className="border-2 border-[#0E6C3C] rounded-lg p-4 bg-gradient-to-br from-green-50 to-white">
      <div className="flex gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>

      <div className="bg-white rounded p-2 mb-3 text-xs text-gray-700">
        <p className="font-semibold mb-1">💡 {t('ai.whyRecommended')}:</p>
        <p>{reason}</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0E6C3C] transition-all"
              style={{ width: `${confidence}%` }}
            />
          </div>
          <span className="text-xs font-semibold">{confidence}%</span>
        </div>

        {action && (
          <AppButton label={action.label} action="custom" onClick={action.onClick} size="sm" />
        )}
      </div>
    </div>
  );
}

export default RecommendationCard;
