'use client';

import React from 'react';

interface DeadlineAlertProps {
  title: string;
  dueDate: string;
  courseCode: string;
  daysUntil: number;
  priority: 'high' | 'medium' | 'low';
}

export function DeadlineAlert({
  title,
  dueDate,
  courseCode,
  daysUntil,
  priority,
}: DeadlineAlertProps) {
  const priorityColors = {
    high: 'bg-red-100 border-red-300 text-red-800',
    medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    low: 'bg-blue-100 border-blue-300 text-blue-800',
  };

  const urgencyIcon = {
    high: '⚠️',
    medium: '📌',
    low: 'ℹ️',
  };

  return (
    <div className={`border rounded-lg p-3 ${priorityColors[priority]}`}>
      <div className="flex items-start gap-2">
        <span className="text-lg">{urgencyIcon[priority]}</span>
        <div className="flex-1">
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs mt-1">
            {courseCode} • Due {dueDate} ({daysUntil} days)
          </p>
        </div>
      </div>
    </div>
  );
}

export default DeadlineAlert;
