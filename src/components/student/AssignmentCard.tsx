'use client';

import React from 'react';
import { AppButton } from '@/components/ui';

interface AssignmentCardProps {
  assignmentId: string;
  title: string;
  courseCode: string;
  dueDate: string;
  status: 'submitted' | 'pending' | 'graded' | 'overdue';
  grade?: string;
  feedback?: string;
  onSubmit?: () => void;
  onView?: () => void;
}

export function AssignmentCard({
  assignmentId,
  title,
  courseCode,
  dueDate,
  status,
  grade,
  feedback,
  onSubmit,
  onView,
}: AssignmentCardProps) {
  const statusColors = {
    submitted: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    graded: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
  };

  const statusLabels = {
    submitted: 'Submitted',
    pending: 'Pending',
    graded: 'Graded',
    overdue: 'Overdue',
  };

  return (
    <div className="border rounded-lg p-4 bg-white hover:shadow-md transition">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold">{title}</h3>
          <p className="text-sm text-gray-600">{courseCode}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded font-semibold ${statusColors[status]}`}>
          {statusLabels[status]}
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-3">Due: {dueDate}</p>

      {grade && <p className="text-sm font-semibold mb-2">Grade: {grade}</p>}
      {feedback && <p className="text-sm text-gray-600 mb-3">Feedback: {feedback}</p>}

      <div className="flex gap-2">
        {status === 'pending' && onSubmit && (
          <AppButton label="Submit" action="submit" onClick={onSubmit} size="sm" />
        )}
        {onView && (
          <AppButton label="View Details" action="custom" onClick={onView} size="sm" variant="secondary" />
        )}
      </div>
    </div>
  );
}

export default AssignmentCard;
