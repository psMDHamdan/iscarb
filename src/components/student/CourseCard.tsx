'use client';

import React from 'react';
import { ProgressIndicator } from './ProgressIndicator';
import { AppButton } from '@/components/ui';

interface CourseCardProps {
  courseId: string;
  title: string;
  instructor?: string;
  progress: number;
  grade?: string;
  nextDeadline?: string;
  credits?: number;
  onEnter?: () => void;
}

export function CourseCard({
  courseId,
  title,
  instructor,
  progress,
  grade,
  nextDeadline,
  credits,
  onEnter,
}: CourseCardProps) {
  return (
    <div className="border rounded-lg p-4 bg-white hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg">{title}</h3>
          {instructor && <p className="text-sm text-gray-600">{instructor}</p>}
        </div>
        {credits && (
          <span className="bg-[#0E6C3C] text-white text-xs px-2 py-1 rounded">{credits} credits</span>
        )}
      </div>

      <div className="space-y-3 mb-4">
        <ProgressIndicator current={progress} total={100} label="Progress" />

        {grade && <p className="text-sm font-semibold">Current Grade: {grade}</p>}

        {nextDeadline && <p className="text-xs text-orange-600">📅 Next deadline: {nextDeadline}</p>}
      </div>

      <AppButton
        label="Enter Course"
        action="custom"
        onClick={onEnter}
        variant="primary"
        size="sm"
        fullWidth
      />
    </div>
  );
}

export default CourseCard;
