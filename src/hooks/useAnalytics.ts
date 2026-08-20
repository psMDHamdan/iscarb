"use client";

import { useCallback } from "react";

interface AnalyticsEvent {
  eventName: string;
  properties?: Record<string, unknown>;
  timestamp?: Date;
}

export function useAnalytics() {
  const trackEvent = useCallback((eventName: string, properties?: Record<string, unknown>) => {
    try {
      // Use the global analytics if available (Segment, Mixpanel, etc.)
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", eventName, {
          ...properties,
          timestamp: new Date().toISOString(),
        });
      }

      // Also log to console in development
      if (process.env.NODE_ENV === "development") {
        console.log("[Analytics]", eventName, properties);
      }
    } catch (error) {
      console.error("Analytics tracking error:", error);
    }
  }, []);

  const trackPageView = useCallback((pageName: string, properties?: Record<string, unknown>) => {
    trackEvent("page_view", {
      page: pageName,
      ...properties,
    });
  }, [trackEvent]);

  const trackConversion = useCallback((eventName: string, value?: number, properties?: Record<string, unknown>) => {
    trackEvent("conversion", {
      conversion_type: eventName,
      conversion_value: value,
      ...properties,
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackConversion,
  };
}
