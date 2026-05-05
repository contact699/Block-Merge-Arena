// Block Merge analytics — see docs/decisions/0001-analytics-platform.md.
// All event taxonomy lives here. New events go in `EventMap`; never call
// posthog.capture() inline anywhere else.
import PostHog from 'posthog-react-native';

let client: PostHog | null = null;

export async function initAnalytics(): Promise<void> {
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
  if (!apiKey) {
    console.warn('[analytics] EXPO_PUBLIC_POSTHOG_KEY not set — analytics disabled');
    return;
  }
  client = new PostHog(apiKey, { host, captureAppLifecycleEvents: true });
  await client.ready;
}

type EventMap = {
  app_opened: { source?: 'push' | 'cold_launch' | 'deeplink' };
  daily_started: { puzzle_id: string };
  daily_completed: { puzzle_id: string; score: number; max_multiplier: number };
  endless_started: Record<string, never>;
  endless_completed: { score: number; max_multiplier: number };
  share_grid_tapped: { source: 'daily' | 'endless'; score: number };
  paywall_viewed: { source: 'archive' | 'gif_export' | 'theme_apply' };
  paywall_dismissed: { source: 'archive' | 'gif_export' | 'theme_apply' };
  subscription_purchased: { tier: 'monthly' | 'annual'; trial: boolean };
};

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type JsonProps = { [key: string]: JsonValue };

export function track<K extends keyof EventMap>(event: K, props: EventMap[K]): void {
  if (!client) return;
  client.capture(event, props as unknown as JsonProps);
}

export function identify(userId: string, traits?: JsonProps): void {
  if (!client) return;
  client.identify(userId, traits);
}
