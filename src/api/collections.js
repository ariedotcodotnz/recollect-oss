import slugify from 'slugify';

export async function getCollections(request, env) {
    try {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        // Only show public collections for non-authenticated requests
        const isPublicOnly = !request.user;

        const query = isPublicOnly
            ? 'SELECT * FROM collections WHERE is_public = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?'
            : 'SELECT * FROM collections ORDER BY created_at DESC LIMIT ? OFFSET ?';

        const collections = await env.DB.prepare(query)
            .bind(limit, offset)
            .all();

        // Get total count
        const countQuery = isPublicOnly
            ? 'SELECT COUNT(*) as total FROM collections WHERE is_public = 1'
            : 'SELECT COUNT(*) as total FROM collections';

        const { total } = await env.DB.prepare(countQuery).first();

        return new Response(JSON.stringify({
            collections: collections.results,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch collections' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function getCollection(request, env) {
    try {
        const id = request.params.id;

        const collection = await env.DB.prepare(
            'SELECT * FROM collections WHERE id = ? OR slug = ?'
        ).bind(id, id).first();

        if (!collection) {
            return new Response(JSON.stringify({ error: 'Collection not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if collection is public or user is authenticated
        if (!collection.is_public && !request.user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get item count
        const { count } = await env.DB.prepare(
            'SELECT COUNT(*) as count FROM items WHERE collection_id = ?'
        ).bind(collection.id).first();

        collection.item_count = count;

        return new Response(JSON.stringify(collection), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch collection' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function createCollection(request, env) {
    try {
        const { title, description, metadata, is_public = true } = await request.json();

        if (!title) {
            return new Response(JSON.stringify({ error: 'Title is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const slug = slugify(title, { lower: true, strict: true });

        // Check if slug already exists
        const existing = await env.DB.prepare(
            'SELECT id FROM collections WHERE slug = ?'
        ).bind(slug).first();

        if (existing) {
            return new Response(JSON.stringify({ error: 'Collection with this title already exists' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const result = await env.DB.prepare(
            `INSERT INTO collections (slug, title, description, metadata, is_public, created_by) 
       VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
            slug,
            title,
            description,
            JSON.stringify(metadata || {}),
            is_public ? 1 : 0,
            request.user.id
        ).run();

        const collection = await env.DB.prepare(
            'SELECT * FROM collections WHERE id = ?'
        ).bind(result.meta.last_row_id).first();

        return new Response(JSON.stringify(collection), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to create collection' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function updateCollection(request, env) {
    try {
        const id = request.params.id;
        const updates = await request.json();

        // Build update query dynamically
        const fields = [];
        const values = [];

        if (updates.title !== undefined) {
            fields.push('title = ?');
            values.push(updates.title);

            // Update slug if title changed
            const slug = slugify(updates.title, { lower: true, strict: true });
            fields.push('slug = ?');
            values.push(slug);
        }

        if (updates.description !== undefined) {
            fields.push('description = ?');
            values.push(updates.description);
        }

        if (updates.thumbnail_url !== undefined) {
            fields.push('thumbnail_url = ?');
            values.push(updates.thumbnail_url);
        }

        if (updates.metadata !== undefined) {
            fields.push('metadata = ?');
            values.push(JSON.stringify(updates.metadata));
        }

        if (updates.is_public !== undefined) {
            fields.push('is_public = ?');
            values.push(updates.is_public ? 1 : 0);
        }

        if (fields.length === 0) {
            return new Response(JSON.stringify({ error: 'No fields to update' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        values.push(id);

        await env.DB.prepare(
            `UPDATE collections SET ${fields.join(', ')} WHERE id = ?`
        ).bind(...values).run();

        const collection = await env.DB.prepare(
            'SELECT * FROM collections WHERE id = ?'
        ).bind(id).first();

        return new Response(JSON.stringify(collection), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to update collection' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function deleteCollection(request, env) {
    try {
        const id = request.params.id;

        // Check if collection exists
        const collection = await env.DB.prepare(
            'SELECT * FROM collections WHERE id = ?'
        ).bind(id).first();

        if (!collection) {
            return new Response(JSON.stringify({ error: 'Collection not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Delete all items' media files from R2
        const items = await env.DB.prepare(
            'SELECT media_url, thumbnail_url FROM items WHERE collection_id = ?'
        ).bind(id).all();

        for (const item of items.results) {
            if (item.media_url) {
                const key = item.media_url.replace('/media/', '');
                await env.MEDIA_BUCKET.delete(key);
            }
            if (item.thumbnail_url && item.thumbnail_url !== item.media_url) {
                const key = item.thumbnail_url.replace('/media/', '');
                await env.MEDIA_BUCKET.delete(key);
            }
        }

        // Delete collection (cascade will delete items)
        await env.DB.prepare(
            'DELETE FROM collections WHERE id = ?'
        ).bind(id).run();

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to delete collection' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}