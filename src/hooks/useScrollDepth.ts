'use client';

/**
 * useScrollDepth — hook that transforms scroll position into rotateX, rotateY, scale,
 * and opacity for CSS 3D depth effects on sections as the user scrolls past them.
 *
 * Cards tilt into view, rotate on the vertical axis, and scale from depth as they
 * enter the viewport. Respects prefers-reduced-motion.
 */

import { useEffect, useRef } from 'react';
import { useMotionValue, useTransform, useSpring } from 'framer-motion';

type ScrollDepthConfig = {
  /** How far (px) above/below viewport edge does the element need to travel to reach 1.0 progress? */
  distance?: number;
  /** Clamp to [0, 1]? Default true. */
  clamp?: boolean;
  /** Reduce motion setting affects this hook. */
  respectReducedMotion?: boolean;
};

/**
 * Returns an object with `rotateX`, `rotateY`, `scale`, `opacity` motion values
 * tied to scroll position. Pass to a motion.div's `style` prop.
 */
export function useScrollDepth(config: ScrollDepthConfig = {}) {
  const { distance = 500, clamp: shouldClamp = true, respectReducedMotion = true } = config;

  const rawProgress = useMotionValue(0);
  const rotateX = useSpring(useTransform(rawProgress, [0, 1], [25, 0]), {
    stiffness: 100,
    damping: 25,
  });
  const rotateY = useSpring(useTransform(rawProgress, [0, 1], [-15, 0]), {
    stiffness: 100,
    damping: 25,
  });
  const scale = useSpring(useTransform(rawProgress, [0, 1], [0.92, 1]), {
    stiffness: 110,
    damping: 20,
  });
  const opacity = useTransform(rawProgress, [0, 1], [0.5, 1]);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const onScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Distance from center of viewport to element center.
      const elementCenter = rect.top + rect.height / 2;
      const viewportCenter = viewportHeight / 2;
      const elementDistance = elementCenter - viewportCenter;

      let prog = 1 - Math.abs(elementDistance) / distance;
      if (shouldClamp) prog = Math.max(0, Math.min(1, prog));

      rawProgress.set(prog);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [rawProgress, distance, shouldClamp, respectReducedMotion]);

  return { ref, rotateX, rotateY, scale, opacity };
}
