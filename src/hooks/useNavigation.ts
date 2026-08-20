// ═══════════════════════════════════════════════════════════════════════════════
// iSCARB — useNavigation Hook
// Permission-aware navigation with loading states and analytics.
// ═══════════════════════════════════════════════════════════════════════════════

'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useSession } from '@/lib/use-session';

interface NavigateOptions {
  params?: Record<string, string>;
  replace?: boolean;
  scroll?: boolean;
}

export function useNavigation() {
  const router = useRouter();
  const { role } = useSession();
  const [isNavigating, setIsNavigating] = useState(false);

  const navigate = useCallback(
    async (target: string, options: NavigateOptions = {}) => {
      setIsNavigating(true);
      try {
        // Build URL with params
        let url = target;
        if (options.params) {
          for (const [key, value] of Object.entries(options.params)) {
            url = url.replace(`[${key}]`, value);
          }
        }

        if (options.replace) {
          router.replace(url, { scroll: options.scroll ?? true });
        } else {
          router.push(url, { scroll: options.scroll ?? true });
        }
      } catch (err) {
        console.error('Navigation error:', err);
      } finally {
        // Small delay to show loading state
        setTimeout(() => setIsNavigating(false), 300);
      }
    },
    [router],
  );

  return { navigate, isNavigating, role };
}
