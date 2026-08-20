'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface LoadingSkeletonProps {
  count?: number;
  type?: 'text' | 'card' | 'table' | 'list' | 'profile' | 'custom';
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  className?: string;
}

export function LoadingSkeleton({
  count = 1,
  type = 'text',
  width,
  height,
  circle = false,
  className,
}: LoadingSkeletonProps) {
  const skeletonClass = cn(
    'bg-gray-200 animate-pulse rounded',
    circle && 'rounded-full',
    className,
  );

  const renderText = () => (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn(skeletonClass, 'h-4 w-full')} />
      ))}
    </div>
  );

  const renderCard = () => (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className={cn(skeletonClass, 'h-6 w-1/2')} />
          <div className={cn(skeletonClass, 'h-4 w-full')} />
          <div className={cn(skeletonClass, 'h-4 w-3/4')} />
        </div>
      ))}
    </div>
  );

  const renderTable = () => (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-2">
          <div className={cn(skeletonClass, 'h-8 w-1/6')} />
          <div className={cn(skeletonClass, 'h-8 w-1/3')} />
          <div className={cn(skeletonClass, 'h-8 w-1/4')} />
          <div className={cn(skeletonClass, 'h-8 w-1/6')} />
        </div>
      ))}
    </div>
  );

  const renderList = () => (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className={cn(skeletonClass, 'h-10 w-10 flex-shrink-0 rounded-full')} />
          <div className="flex-1 space-y-2">
            <div className={cn(skeletonClass, 'h-4 w-1/3')} />
            <div className={cn(skeletonClass, 'h-3 w-2/3')} />
          </div>
        </div>
      ))}
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className={cn(skeletonClass, 'h-16 w-16 flex-shrink-0 rounded-full')} />
        <div className="flex-1 space-y-2">
          <div className={cn(skeletonClass, 'h-5 w-1/2')} />
          <div className={cn(skeletonClass, 'h-4 w-2/3')} />
        </div>
      </div>
      <div className="space-y-3">
        <div className={cn(skeletonClass, 'h-4 w-full')} />
        <div className={cn(skeletonClass, 'h-4 w-5/6')} />
      </div>
    </div>
  );

  const renderCustom = () => (
    <div
      className={skeletonClass}
      style={{
        width: width || '100%',
        height: height || '100px',
      }}
    />
  );

  switch (type) {
    case 'text':
      return renderText();
    case 'card':
      return renderCard();
    case 'table':
      return renderTable();
    case 'list':
      return renderList();
    case 'profile':
      return renderProfile();
    case 'custom':
      return renderCustom();
    default:
      return renderText();
  }
}

export default LoadingSkeleton;
