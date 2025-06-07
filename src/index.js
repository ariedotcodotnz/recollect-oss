import { Router } from 'itty-router';
import { withAuth, withCors, withError } from './middleware';
import { handleUpload } from './api/upload';
import {
    getCollections,
    getCollection,
    createCollection,
    updateCollection,
    deleteCollection
} from './api/collections';
import {
    getItems,
    getItem,
    createItem,
    updateItem,
    deleteItem,
    searchItems
} from './api/items';
import { login, logout, setup, checkAuth } from './api/auth';
import { renderPage } from './utils/ssr';
import { generateSitemap, generateRobots } from './utils/seo';

const router = Router();

// Health check route
router.get('/health', async (request, env) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        checks: {}
    };

    // Check database
    try {
        const result = await env.DB.prepare('SELECT 1 as test').first();
        health.checks.database = result?.test === 1 ? 'ok' : 'error';
    } catch (err) {
        health.checks.database = 'error: ' + err.message;
        health.status = 'degraded';
    }

    // Check KV
    try {
        await env.SESSIONS.put('health-check', 'ok', { expirationTtl: 60 });
        const value = await env.SESSIONS.get('health-check');
        health.checks.kv = value === 'ok' ? 'ok' : 'error';
    } catch (err) {
        health.checks.kv = 'error: ' + err.message;
        health.status = 'degraded';
    }

    // Check R2
    try {
        // Just check if binding exists
        health.checks.r2 = env.MEDIA_BUCKET ? 'ok' : 'not configured';
    } catch (err) {
        health.checks.r2 = 'error: ' + err.message;
        health.status = 'degraded';
    }

    return new Response(JSON.stringify(health, null, 2), {
        status: health.status === 'ok' ? 200 : 503,
        headers: { 'Content-Type': 'application/json' }
    });
});

// Public API routes
router.get('/api/collections', withCors, getCollections);
router.get('/api/collections/:id', withCors, getCollection);
router.get('/api/items', withCors, getItems);
router.get('/api/items/:id', withCors, getItem);
router.get('/api/search', withCors, searchItems);

// Auth routes
router.post('/api/auth/login', withCors, login);
router.post('/api/auth/logout', withCors, withAuth, logout);
router.post('/api/auth/setup', withCors, setup);
router.get('/api/auth/check', withCors, checkAuth);

// Admin API routes (protected)
router.post('/api/collections', withCors, withAuth, createCollection);
router.put('/api/collections/:id', withCors, withAuth, updateCollection);
router.delete('/api/collections/:id', withCors, withAuth, deleteCollection);

router.post('/api/items', withCors, withAuth, createItem);
router.put('/api/items/:id', withCors, withAuth, updateItem);
router.delete('/api/items/:id', withCors, withAuth, deleteItem);

router.post('/api/upload', withCors, withAuth, handleUpload);

// SEO routes
router.get('/sitemap.xml', generateSitemap);
router.get('/robots.txt', generateRobots);

// Media routes (serve from R2)
router.get('/media/*', async (request, env) => {
    const url = new URL(request.url);
    const key = url.pathname.replace('/media/', '');

    const object = await env.MEDIA_BUCKET.get(key);
    if (!object) {
        return new Response('Not found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Cache-Control', 'public, max-age=31536000');

    return new Response(object.body, { headers });
});

// Frontend routes (SSR)
router.get('/', async (request, env) => {
    try {
        const response = await getCollections(request, env);
        const data = response.ok ? await response.json() : { collections: [], pagination: { total: 0 } };
        return renderPage('home', { collections: data }, env);
    } catch (error) {
        console.error('Error loading homepage:', error);
        return renderPage('home', { collections: { collections: [], pagination: { total: 0 } } }, env);
    }
});

router.get('/collections/:id', async (request, env) => {
    try {
        const collectionResponse = await getCollection(request, env);
        const itemsResponse = await getItems(request, env);

        if (!collectionResponse.ok) {
            return new Response('Collection not found', { status: 404 });
        }

        const collection = await collectionResponse.json();
        const items = itemsResponse.ok ? await itemsResponse.json() : { items: [], pagination: { total: 0 } };

        return renderPage('collection', { collection, items }, env);
    } catch (error) {
        console.error('Error loading collection:', error);
        return new Response('Error loading collection', { status: 500 });
    }
});

router.get('/items/:id', async (request, env) => {
    try {
        const response = await getItem(request, env);

        if (!response.ok) {
            return new Response('Item not found', { status: 404 });
        }

        const item = await response.json();
        return renderPage('item', { item }, env);
    } catch (error) {
        console.error('Error loading item:', error);
        return new Response('Error loading item', { status: 500 });
    }
});

router.get('/search', async (request, env) => {
    return renderPage('search', {}, env);
});

// Admin routes
router.get('/admin/setup', async (request, env) => {
    // Check if setup is already complete
    try {
        const userCount = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
        if (userCount && userCount.count > 0) {
            return new Response('Setup already complete. <a href="/admin">Go to admin dashboard</a>', {
                status: 200,
                headers: { 'Content-Type': 'text/html' }
            });
        }
    } catch (err) {
        // Database might not be initialized yet
    }

    return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Setup - Recollect OSS</title>
      <style>
        body { font-family: system-ui; max-width: 400px; margin: 100px auto; padding: 20px; }
        input { width: 100%; padding: 8px; margin: 8px 0; border: 1px solid #ddd; border-radius: 4px; }
        button { width: 100%; padding: 10px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #555; }
        .error { color: red; margin: 10px 0; }
        .success { color: green; margin: 10px 0; }
      </style>
    </head>
    <body>
      <h1>Create Admin Account</h1>
      <div id="setup-form">
        <input type="text" id="name" placeholder="Your Name" required>
        <input type="email" id="email" placeholder="Email Address" required>
        <input type="password" id="password" placeholder="Password" required>
        <button onclick="createAdmin()">Create Admin Account</button>
        <div id="message"></div>
      </div>
      <script>
        async function createAdmin() {
          const name = document.getElementById('name').value;
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          const messageEl = document.getElementById('message');
          
          if (!name || !email || !password) {
            messageEl.innerHTML = '<p class="error">All fields are required</p>';
            return;
          }
          
          try {
            const response = await fetch('/api/auth/setup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
              messageEl.innerHTML = '<p class="success">Admin account created! Redirecting to login...</p>';
              setTimeout(() => window.location.href = '/admin', 2000);
            } else {
              messageEl.innerHTML = '<p class="error">' + (data.error || 'Setup failed') + '</p>';
            }
          } catch (err) {
            messageEl.innerHTML = '<p class="error">Setup failed: ' + err.message + '</p>';
          }
        }
      </script>
    </body>
    </html>
  `, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
    });
});

router.get('/admin/*', async (request, env) => {
    return renderPage('admin', {}, env);
});

// 404 handler
router.all('*', () => new Response('Not Found', { status: 404 }));

// Export handler
export default {
    async fetch(request, env, ctx) {
        try {
            // Check if database is initialized
            if (!env.DB) {
                return new Response('Database not configured. Please check your wrangler.toml configuration.', {
                    status: 500,
                    headers: { 'Content-Type': 'text/plain' }
                });
            }

            return await router
                .handle(request, env, ctx)
                .catch(err => withError(err, request));
        } catch (err) {
            console.error('Worker error:', err);
            return new Response('Internal server error', { status: 500 });
        }
    },

    // Scheduled handler for maintenance tasks
    async scheduled(event, env, ctx) {
        switch (event.cron) {
            case '0 0 * * *': // Daily at midnight
                await cleanupSessions(env);
                break;
        }
    }
};

async function cleanupSessions(env) {
    // Clean up expired sessions from KV
    const list = await env.SESSIONS.list();
    const now = Date.now();

    for (const key of list.keys) {
        const session = await env.SESSIONS.get(key.name, 'json');
        if (session && session.expires < now) {
            await env.SESSIONS.delete(key.name);
        }
    }
}