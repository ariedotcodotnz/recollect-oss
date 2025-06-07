import jwt from 'jsonwebtoken';

// CORS middleware
export function withCors(request) {
    // For preflight requests
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400',
            }
        });
    }

    // Add CORS headers to the response
    return (response) => {
        const newResponse = new Response(response.body, response);
        newResponse.headers.set('Access-Control-Allow-Origin', '*');
        newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return newResponse;
    };
}

// Authentication middleware
export async function withAuth(request, env) {
    try {
        // Check for session cookie first
        const cookie = request.headers.get('Cookie');
        const sessionId = cookie?.match(/session=([^;]+)/)?.[1];

        if (sessionId) {
            const session = await env.SESSIONS.get(sessionId, 'json');

            if (session && session.expires > Date.now()) {
                try {
                    const decoded = jwt.verify(session.token, env.JWT_SECRET);
                    request.user = decoded;
                    return request;
                } catch (e) {
                    // Invalid token, continue to check Authorization header
                }
            }
        }

        // Check Authorization header as fallback
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.substring(7);

        try {
            const decoded = jwt.verify(token, env.JWT_SECRET);
            request.user = decoded;
            return request;
        } catch (error) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Authentication failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Error handling middleware
export function withError(error, request) {
    console.error('Error:', error);

    // Log to analytics if available
    if (request.cf) {
        // You could send to an analytics service here
    }

    // Don't expose internal errors in production
    const isDev = request.url.includes('localhost');
    const message = isDev ? error.message : 'Internal server error';

    return new Response(JSON.stringify({
        error: message,
        ...(isDev && { stack: error.stack })
    }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
}

// Rate limiting middleware
export async function withRateLimit(request, env) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const key = `ratelimit:${ip}`;

    const limit = 100; // requests per minute
    const window = 60; // seconds

    const current = await env.SESSIONS.get(key);
    const count = current ? parseInt(current) : 0;

    if (count >= limit) {
        return new Response(JSON.stringify({
            error: 'Too many requests'
        }), {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': window.toString()
            }
        });
    }

    await env.SESSIONS.put(key, (count + 1).toString(), {
        expirationTtl: window
    });

    return request;
}

// Cache middleware for GET requests
export function withCache(request, env, ctx) {
    // Only cache GET requests
    if (request.method !== 'GET') {
        return request;
    }

    // Don't cache authenticated requests
    if (request.headers.get('Authorization') || request.headers.get('Cookie')) {
        return request;
    }

    const cacheUrl = new URL(request.url);
    const cacheKey = new Request(cacheUrl.toString(), request);
    const cache = caches.default;

    return {
        async handle(handler) {
            // Check cache first
            let response = await cache.match(cacheKey);

            if (!response) {
                // Cache miss, get fresh response
                response = await handler(request, env, ctx);

                // Cache successful responses
                if (response.status === 200) {
                    // Clone response since it can only be read once
                    response = new Response(response.body, response);

                    // Add cache headers if not present
                    if (!response.headers.has('Cache-Control')) {
                        response.headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes
                    }

                    // Store in cache
                    ctx.waitUntil(cache.put(cacheKey, response.clone()));
                }
            }

            return response;
        }
    };
}