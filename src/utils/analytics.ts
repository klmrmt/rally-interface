/**
 * Lightweight frontend analytics tracker. Events are logged to console in
 * development and can be wired to a real service (Mixpanel, PostHog, etc.)
 * by replacing the implementation.
 */
export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.log(`[analytics] ${event}`, properties);
  }

  // When ready, replace with:
  // posthog.capture(event, properties);
  // mixpanel.track(event, properties);
}
