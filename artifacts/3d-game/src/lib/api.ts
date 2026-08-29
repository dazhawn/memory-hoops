/**
 * Where the API lives.
 *
 * On the web the game is served from the same origin as the API, so relative
 * paths work and `VITE_API_ORIGIN` is left unset.
 *
 * Inside a Capacitor WebView there is no such origin: the page is served from
 * `capacitor://localhost` (iOS) or `https://localhost` (Android), so a relative
 * `/api/...` request or a `wss://${location.host}/ws` socket points at the app
 * bundle itself and can never reach the server. Mobile builds must therefore set
 * `VITE_API_ORIGIN` to the deployed API origin — `vite.config.capacitor.ts`
 * refuses to build without it.
 */

const rawOrigin = (import.meta.env.VITE_API_ORIGIN ?? '').trim();

/** Configured API origin with any trailing slashes removed, or '' for same-origin. */
export const API_ORIGIN = rawOrigin.replace(/\/+$/, '');

function withLeadingSlash(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

/** Absolute URL for an API path when an origin is configured, relative otherwise. */
export function apiUrl(path: string): string {
  const suffix = withLeadingSlash(path);
  return API_ORIGIN ? `${API_ORIGIN}${suffix}` : suffix;
}

/** WebSocket URL, derived from the configured origin or the current page. */
export function wsUrl(path = '/ws'): string {
  const suffix = withLeadingSlash(path);
  if (API_ORIGIN) {
    // http -> ws, https -> wss
    return `${API_ORIGIN.replace(/^http/, 'ws')}${suffix}`;
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}${suffix}`;
}
