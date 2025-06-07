console.log('Happy developing ✨')
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
    const collections = await getCollections(request, env);
    return renderPage('home', { collections: await collections.json() }, env);
});

router.get('/collections/:id', async (request, env) => {
    const collection = await getCollection(request, env);
    const items = await getItems(request, env);
    return renderPage('collection', {
        collection: await collection.json(),
        items: await items.json()
    }, env);
});

router.get('/items/:id', async (request, env) => {
    const item = await getItem(request, env);
    return renderPage('item', { item: await item.json() }, env);
});

router.get('/search', async (request, env) => {
    return renderPage('search', {}, env);
});

// Admin routes
router.get('/admin/*', async (request, env) => {
    return renderPage('admin', {}, env);
});

// 404 handler
router.all('*', () => new Response('Not Found', { status: 404 }));

// Export handler
export default {
    async fetch(request, env, ctx) {
        return router
            .handle(request, env, ctx)
            .catch(err => withError(err, request));
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