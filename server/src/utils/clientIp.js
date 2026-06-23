/**
 * Reliably extract the client IP from an Express request.
 *
 * When the server runs behind a reverse proxy (e.g. Nginx, Render, Cloudflare),
 * the real client IP is forwarded via the X-Forwarded-For header.  The header
 * may contain a comma-separated list of IPs (client, proxy1, proxy2, …); we
 * always take the first (left-most) entry which is the original client address.
 *
 * IMPORTANT: trust this header only when your infrastructure guarantees that
 * the proxy sets/strips it correctly.  If app.set('trust proxy', …) is
 * configured in Express, req.ip already resolves the forwarded address and
 * this function falls through to that value as a safe default.
 */
export function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    const firstIp = xff.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}
