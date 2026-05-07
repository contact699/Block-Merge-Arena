// src/lib/observability/sentry.ts
//
// Thin wrapper around @sentry/react-native. No-ops when DSN is not set
// (dev mode without Sentry credentials).
import * as Sentry from '@sentry/react-native';

let initialized = false;

export function initSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    console.warn('[sentry] DSN not set — crash reporting disabled');
    return;
  }
  if (initialized) return;
  Sentry.init({
    dsn,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    // Sample 100% of errors in v1; sample 10% of perf transactions.
    tracesSampleRate: 0.1,
  });
  initialized = true;
}

export function identifySentryUser(userId: string): void {
  if (!initialized) return;
  Sentry.setUser({ id: userId });
}

export function breadcrumb(category: string, message: string, data?: Record<string, unknown>): void {
  if (!initialized) return;
  Sentry.addBreadcrumb({
    category,
    message,
    level: 'info',
    data,
  });
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!initialized) {
    console.error('[sentry] not initialized; error:', error);
    return;
  }
  Sentry.captureException(error, { extra: context });
}

export const SentryErrorBoundary = Sentry.ErrorBoundary;
