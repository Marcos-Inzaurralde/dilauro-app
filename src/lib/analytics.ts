// ─────────────────────────────────────────────────────────────
// AION — Lightweight Analytics (Supabase)
// ─────────────────────────────────────────────────────────────
// Tracks user events in a Supabase `analytics_events` table.
// Falls back silently when table doesn't exist or Supabase isn't configured.
// ─────────────────────────────────────────────────────────────
import { supabase, isSupabaseConfigured } from "../config/supabase";

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Track an event. Fire-and-forget — never blocks UI.
 */
export function trackEvent(
  eventName: string,
  properties?: EventProperties
): void {
  if (!isSupabaseConfigured) return;

  // Non-blocking insert
  supabase
    .from("analytics_events")
    .insert({
      event_name: eventName,
      properties: properties || {},
      user_agent: navigator.userAgent,
      screen_width: window.innerWidth,
      pathname: window.location.pathname,
      timestamp: new Date().toISOString(),
    })
    .then(({ error }) => {
      if (error) {
        // Table probably doesn't exist yet — silently ignore
        console.debug("[AION Analytics] Event skipped:", eventName);
      }
    });
}

/**
 * Track a page view.
 */
export function trackPageView(path: string): void {
  trackEvent("page_view", { path });
}

/**
 * Track AI usage.
 */
export function trackAIUsage(mode: string, tokenEstimate: number): void {
  trackEvent("ai_usage", { mode, tokens: tokenEstimate });
}

/**
 * Track strategy session.
 */
export function trackStrategy(sessionType: string): void {
  trackEvent("strategy_session", { session_type: sessionType });
}

/**
 * Track MCP integration usage.
 */
export function trackMCPUsage(integration: string): void {
  trackEvent("mcp_usage", { integration });
}
