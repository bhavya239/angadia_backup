export const config = {
  matcher: '/api/:path*',
};

/**
 * Proxies browser calls to /api/* → {BACKEND_URL}/api/* (same-origin on Vercel, no CORS).
 * Set BACKEND_URL to your Spring Boot origin (e.g. https://your-api.onrender.com), no trailing slash.
 */
export default function middleware(request: Request): Promise<Response> | Response {
  const backend = process.env.BACKEND_URL?.replace(/\/$/, '');
  if (!backend) {
    return new Response(
      JSON.stringify({
        data: null,
        message:
          'Set BACKEND_URL on Vercel to your Spring Boot URL (e.g. https://your-api.onrender.com).',
        timestamp: new Date().toISOString(),
      }),
      { status: 503, headers: { 'content-type': 'application/json' } }
    );
  }

  const url = new URL(request.url);
  const target = `${backend}${url.pathname}${url.search}`;

  return fetch(target, {
    method: request.method,
    headers: request.headers,
    body:
      request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    redirect: 'manual',
  });
}
