'use client';

import React from 'react';

interface SkillBadgeProps {
  skill: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  score?: number;
  icon?: string;
  verified?: boolean;
}

export function SkillBadge({ skill, level, score, icon, verified }: SkillBadgeProps) {
  const levelColors = {
    Beginner: 'bg-gray-100 text-gray-800',
    Intermediate: 'bg-blue-100 text-blue-800',
    Advanced: 'bg-purple-100 text-purple-800',
    Expert: 'bg-[#0E6C3C]/10 text-[#0E6C3C]',
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full ${levelColors[level]}`}>
      {icon && <span className="text-lg">{icon}</span>}
      <span className="font-semibold text-sm">{skill}</span>
      {verified && <span className="text-xs">✓</span>}
      {score && <span className="text-xs font-bold">{score}%</span>}
    </div>
  );
}

export default SkillBadge;
