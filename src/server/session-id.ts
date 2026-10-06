/**
 * A session id: the millisecond the telemetry subscription began, so records of separate
 * subscriptions tell apart.
 */
export function newSessionId(): number {
  return Date.now();
}
