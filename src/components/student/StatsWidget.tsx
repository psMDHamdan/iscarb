'use client';

import React from 'react';

interface StatsWidgetProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

export function StatsWidget({ label, value, unit, icon, trend, trendValue }: StatsWidgetProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-gray-600',
  };

  const trendIcons = {
    up: '📈',
    down: '📉',
    stable: '➡️',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">{label}</p>
        {icon && <span className="text-xl">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold">{value}</span>
        {unit && <span className="text-gray-500">{unit}</span>}
      </div>

      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-sm ${trendColors[trend]}`}>
          <span>{trendIcons[trend]}</span>
          {trendValue && <span>{trendValue}</span>}
        </div>
      )}
    </div>
  );
}

export default StatsWidget;
