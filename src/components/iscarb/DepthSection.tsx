'use client';

import { motion } from 'framer-motion';
import { useScrollDepth } from '@/hooks/useScrollDepth';
import { ReactNode } from 'react';

export function DepthSection({
  children,
  className = '',
  distance = 500,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
}) {
  const { ref, rotateX, rotateY, scale, opacity } = useScrollDepth({ distance });

  return (
    <motion.div
      ref={ref}
      style={{
        rotateX,
        rotateY,
        scale,
        opacity,
        transformStyle: 'preserve-3d',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
