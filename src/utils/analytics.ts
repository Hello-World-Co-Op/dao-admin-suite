/**
 * Analytics Tracking Utility
 *
 * Supports multiple analytics providers:
 * - PostHog
 * - Google Analytics (gtag)
 * - Mixpanel
 * - Custom backend endpoint
 *
 * Bridge pattern: This is a suite-specific analytics utility.
 * If @hello-world-co-op/api exports analytics utilities in the future,
 * this can be replaced with that import.
 */

// Type-safe property value types for analytics
type AnalyticsPropertyValue = string | number | boolean | null | undefined | Date;
type AnalyticsProperties = Record<string, AnalyticsPropertyValue>;

// Extend Window interface for analytics providers
interface MixpanelInstance {
  track: (event: string, properties?: AnalyticsProperties) => void;
  identify: (userId: string) => void;
  people: {
    set: (properties: AnalyticsProperties) => void;
  };
}

type GtagFunction = (command: string, targetOrEvent: string, config?: AnalyticsProperties) => void;

declare global {
  interface Window {
    gtag?: GtagFunction;
    mixpanel?: MixpanelInstance;
  }
}

/**
 * Track an analytics event
 */
export function trackEvent(event: string, properties?: AnalyticsProperties): void {
  const eventData = {
    ...properties,
    timestamp: new Date().toISOString(),
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.log('Analytics Event:', event, eventData);
  }

  // PostHog
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture(event, eventData);
  }

  // Google Analytics (gtag)
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, eventData);
  }

  // Mixpanel
  if (typeof window !== 'undefined' && window.mixpanel) {
    window.mixpanel.track(event, eventData);
  }

  // Custom backend endpoint (optional)
  sendToBackend(event, eventData);
}

/**
 * Send event to custom backend endpoint
 */
async function sendToBackend(event: string, data: AnalyticsProperties): Promise<void> {
  const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;

  if (!analyticsEndpoint) {
    return;
  }

  try {
    await fetch(analyticsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event,
        data,
        user_id: getUserId(),
      }),
    });
  } catch (_error) {
    // Silently fail - don't break user experience for analytics
    if (import.meta.env.DEV) {
      console.error('Failed to send analytics to backend:', _error);
    }
  }
}

/**
 * Get or create anonymous user ID for tracking
 */
function getUserId(): string {
  const USER_ID_KEY = 'analytics_user_id';

  let userId = localStorage.getItem(USER_ID_KEY);

  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }

  return userId;
}
