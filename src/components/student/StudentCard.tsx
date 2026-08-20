'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface StudentCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
  isPriority?: boolean;
}

export function StudentCard({
  title,
  subtitle,
  children,
  className,
  variant = 'default',
  onClick,
  isPriority,
}: StudentCardProps) {
  const variantStyles = {
    default: 'border-gray-200 bg-white hover:shadow-md',
    success: 'border-green-200 bg-green-50 hover:shadow-md',
    warning: 'border-yellow-200 bg-yellow-50 hover:shadow-md',
    danger: 'border-red-200 bg-red-50 hover:shadow-md',
    info: 'border-blue-200 bg-blue-50 hover:shadow-md',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'border rounded-lg p-4 transition-all duration-200',
        onClick && 'cursor-pointer',
        isPriority && 'ring-2 ring-[#0E6C3C]',
        variantStyles[variant],
        className,
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
        {isPriority && <span className="text-xs bg-[#0E6C3C] text-white px-2 py-1 rounded">Priority</span>}
      </div>
      {children}
    </div>
  );
}

export default StudentCard;
