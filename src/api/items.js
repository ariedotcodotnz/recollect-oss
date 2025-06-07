export async function getItems(request, env) {
    try {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const collectionId = url.searchParams.get('collection');
        const type = url.searchParams.get('type');
        const tag = url.searchParams.get('tag');

        // Build query with filters
        let query = 'SELECT i.*, c.title as collection_title, c.slug as collection_slug FROM items i JOIN collections c ON i.collection_id = c.id WHERE 1=1';
        const params = [];

        // Only show public items for non-authenticated requests
        if (!request.user) {
            query += ' AND i.is_public = 1 AND c.is_public = 1';
        }

        if (collectionId) {
            query += ' AND i.collection_id = ?';
            params.push(collectionId);
        }

        if (type) {
            query += ' AND i.item_type = ?';
            params.push(type);
        }

        if (tag) {
            query += ' AND EXISTS (SELECT 1 FROM item_tags it JOIN tags t ON it.tag_id = t.id WHERE it.item_id = i.id AND t.slug = ?)';
            params.push(tag);
        }

        // Add metadata filters
        const metadataFilters = {};
        for (const [key, value] of url.searchParams) {
            if (key.startsWith('meta_')) {
                const fieldName = key.replace('meta_', '');
                metadataFilters[fieldName] = value;
            }
        }

        for (const [field, value] of Object.entries(metadataFilters)) {
            query += ` AND EXISTS (
        SELECT 1 FROM item_metadata im 
        JOIN metadata_fields mf ON im.field_id = mf.id 
        WHERE im.item_id = i.id AND mf.name = ? AND im.value = ?
      )`;
            params.push(field, value);
        }

        query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const items = await env.DB.prepare(query).bind(...params).all();

        // Get tags for each item
        for (const item of items.results) {
            const tags = await env.DB.prepare(
                'SELECT t.* FROM tags t JOIN item_tags it ON t.id = it.tag_id WHERE it.item_id = ?'
            ).bind(item.id).all();
            item.tags = tags.results;

            // Parse metadata JSON
            if (item.metadata) {
                item.metadata = JSON.parse(item.metadata);
            }
        }

        // Get total count
        let countQuery = query.replace('SELECT i.*, c.title as collection_title, c.slug as collection_slug', 'SELECT COUNT(*) as total');
        countQuery = countQuery.replace(' ORDER BY i.created_at DESC LIMIT ? OFFSET ?', '');
        const countParams = params.slice(0, -2);

        const { total } = await env.DB.prepare(countQuery).bind(...countParams).first();

        // Get facets if requested
        let facets = null;
        if (url.searchParams.get('facets') === 'true') {
            facets = await getFacets(env, request.user);
        }

        return new Response(JSON.stringify({
            items: items.results,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            },
            facets
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Failed to fetch items' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function getItem(request, env) {
    try {
        const id = request.params.id;

        const item = await env.DB.prepare(
            `SELECT i.*, c.title as collection_title, c.slug as collection_slug 
       FROM items i 
       JOIN collections c ON i.collection_id = c.id 
       WHERE i.id = ?`
        ).bind(id).first();

        if (!item) {
            return new Response(JSON.stringify({ error: 'Item not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if item is public or user is authenticated
        if (!item.is_public && !request.user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get tags
        const tags = await env.DB.prepare(
            'SELECT t.* FROM tags t JOIN item_tags it ON t.id = it.tag_id WHERE it.item_id = ?'
        ).bind(item.id).all();
        item.tags = tags.results;

        // Get metadata fields
        const metadata = await env.DB.prepare(
            `SELECT mf.name, mf.field_type, im.value 
       FROM item_metadata im 
       JOIN metadata_fields mf ON im.field_id = mf.id 
       WHERE im.item_id = ?`
        ).bind(item.id).all();

        item.metadata_fields = metadata.results;

        // Parse metadata JSON
        if (item.metadata) {
            item.metadata = JSON.parse(item.metadata);
        }

        // Get related items (same collection or tags)
        const related = await env.DB.prepare(
            `SELECT DISTINCT i.id, i.title, i.thumbnail_url, i.item_type 
       FROM items i 
       WHERE i.id != ? 
       AND i.is_public = 1
       AND (
         i.collection_id = ? 
         OR EXISTS (
           SELECT 1 FROM item_tags it1 
           JOIN item_tags it2 ON it1.tag_id = it2.tag_id 
           WHERE it1.item_id = i.id AND it2.item_id = ?
         )
       )
       LIMIT 6`
        ).bind(item.id, item.collection_id, item.id).all();

        item.related_items = related.results;

        // Increment view count
        await env.DB.prepare(
            'UPDATE items SET view_count = view_count + 1 WHERE id = ?'
        ).bind(item.id).run();

        return new Response(JSON.stringify(item), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch item' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function createItem(request, env) {
    try {
        const data = await request.json();
        const {
            collection_id,
            title,
            description,
            item_type,
            media_url,
            thumbnail_url,
            metadata,
            rights_statement,
            is_public = true,
            tags = [],
            metadata_fields = {}
        } = data;

        if (!collection_id || !title || !item_type) {
            return new Response(JSON.stringify({
                error: 'collection_id, title, and item_type are required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verify collection exists
        const collection = await env.DB.prepare(
            'SELECT id FROM collections WHERE id = ?'
        ).bind(collection_id).first();

        if (!collection) {
            return new Response(JSON.stringify({ error: 'Collection not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Insert item
        const result = await env.DB.prepare(
            `INSERT INTO items (
        collection_id, title, description, item_type, media_url, 
        thumbnail_url, metadata, rights_statement, is_public, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            collection_id,
            title,
            description,
            item_type,
            media_url,
            thumbnail_url || media_url,
            JSON.stringify(metadata || {}),
            rights_statement,
            is_public ? 1 : 0,
            request.user.id
        ).run();

        const itemId = result.meta.last_row_id;

        // Add tags
        for (const tagName of tags) {
            const slug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            // Insert or get tag
            await env.DB.prepare(
                'INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)'
            ).bind(tagName, slug).run();

            const tag = await env.DB.prepare(
                'SELECT id FROM tags WHERE slug = ?'
            ).bind(slug).first();

            // Link tag to item
            await env.DB.prepare(
                'INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)'
            ).bind(itemId, tag.id).run();
        }

        // Add metadata fields
        for (const [fieldName, value] of Object.entries(metadata_fields)) {
            const field = await env.DB.prepare(
                'SELECT id FROM metadata_fields WHERE name = ?'
            ).bind(fieldName).first();

            if (field) {
                await env.DB.prepare(
                    'INSERT INTO item_metadata (item_id, field_id, value) VALUES (?, ?, ?)'
                ).bind(itemId, field.id, value).run();
            }
        }

        // Update FTS index with content if provided
        if (data.content) {
            await env.DB.prepare(
                'UPDATE items_fts SET content = ? WHERE rowid = ?'
            ).bind(data.content, itemId).run();
        }

        const item = await getItem({ params: { id: itemId } }, env);
        return item;
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Failed to create item' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function updateItem(request, env) {
    try {
        const id = request.params.id;
        const updates = await request.json();

        // Build update query
        const fields = [];
        const values = [];

        const allowedFields = [
            'title', 'description', 'media_url', 'thumbnail_url',
            'metadata', 'rights_statement', 'is_public'
        ];

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                fields.push(`${field} = ?`);
                if (field === 'metadata') {
                    values.push(JSON.stringify(updates[field]));
                } else if (field === 'is_public') {
                    values.push(updates[field] ? 1 : 0);
                } else {
                    values.push(updates[field]);
                }
            }
        }

        if (fields.length === 0) {
            return new Response(JSON.stringify({ error: 'No fields to update' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        values.push(id);

        await env.DB.prepare(
            `UPDATE items SET ${fields.join(', ')} WHERE id = ?`
        ).bind(...values).run();

        // Update tags if provided
        if (updates.tags) {
            // Remove existing tags
            await env.DB.prepare(
                'DELETE FROM item_tags WHERE item_id = ?'
            ).bind(id).run();

            // Add new tags
            for (const tagName of updates.tags) {
                const slug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

                await env.DB.prepare(
                    'INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)'
                ).bind(tagName, slug).run();

                const tag = await env.DB.prepare(
                    'SELECT id FROM tags WHERE slug = ?'
                ).bind(slug).first();

                await env.DB.prepare(
                    'INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)'
                ).bind(id, tag.id).run();
            }
        }

        // Update metadata fields if provided
        if (updates.metadata_fields) {
            for (const [fieldName, value] of Object.entries(updates.metadata_fields)) {
                const field = await env.DB.prepare(
                    'SELECT id FROM metadata_fields WHERE name = ?'
                ).bind(fieldName).first();

                if (field) {
                    await env.DB.prepare(
                        'INSERT OR REPLACE INTO item_metadata (item_id, field_id, value) VALUES (?, ?, ?)'
                    ).bind(id, field.id, value).run();
                }
            }
        }

        // Update FTS content if provided
        if (updates.content) {
            await env.DB.prepare(
                'UPDATE items_fts SET content = ? WHERE rowid = ?'
            ).bind(updates.content, id).run();
        }

        const item = await getItem({ params: { id } }, env);
        return item;
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to update item' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function deleteItem(request, env) {
    try {
        const id = request.params.id;

        // Get item to delete media files
        const item = await env.DB.prepare(
            'SELECT media_url, thumbnail_url FROM items WHERE id = ?'
        ).bind(id).first();

        if (!item) {
            return new Response(JSON.stringify({ error: 'Item not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Delete media files from R2
        if (item.media_url) {
            const key = item.media_url.replace('/media/', '');
            await env.MEDIA_BUCKET.delete(key);
        }
        if (item.thumbnail_url && item.thumbnail_url !== item.media_url) {
            const key = item.thumbnail_url.replace('/media/', '');
            await env.MEDIA_BUCKET.delete(key);
        }

        // Delete item (cascades will handle related records)
        await env.DB.prepare('DELETE FROM items WHERE id = ?').bind(id).run();

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to delete item' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function searchItems(request, env) {
    try {
        const url = new URL(request.url);
        const query = url.searchParams.get('q');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        if (!query) {
            return new Response(JSON.stringify({ error: 'Query parameter required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Search using FTS
        const results = await env.DB.prepare(
            `SELECT i.*, c.title as collection_title, c.slug as collection_slug,
       snippet(items_fts, -1, '<mark>', '</mark>', '...', 32) as snippet
       FROM items i
       JOIN collections c ON i.collection_id = c.id
       JOIN items_fts ON i.id = items_fts.rowid
       WHERE items_fts MATCH ?
       ${!request.user ? 'AND i.is_public = 1 AND c.is_public = 1' : ''}
       ORDER BY rank
       LIMIT ? OFFSET ?`
        ).bind(query, limit, offset).all();

        // Get total count
        const { total } = await env.DB.prepare(
            `SELECT COUNT(*) as total
       FROM items i
       JOIN collections c ON i.collection_id = c.id
       JOIN items_fts ON i.id = items_fts.rowid
       WHERE items_fts MATCH ?
       ${!request.user ? 'AND i.is_public = 1 AND c.is_public = 1' : ''}`
        ).bind(query).first();

        return new Response(JSON.stringify({
            items: results.results,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            },
            query
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Search failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function getFacets(env, user) {
    const facets = {};

    // Get facetable fields
    const fields = await env.DB.prepare(
        'SELECT * FROM metadata_fields WHERE is_facet = 1 ORDER BY display_order'
    ).all();

    for (const field of fields.results) {
        const values = await env.DB.prepare(
            `SELECT im.value, COUNT(DISTINCT i.id) as count
       FROM item_metadata im
       JOIN items i ON im.item_id = i.id
       JOIN collections c ON i.collection_id = c.id
       WHERE im.field_id = ?
       ${!user ? 'AND i.is_public = 1 AND c.is_public = 1' : ''}
       GROUP BY im.value
       ORDER BY count DESC
       LIMIT 10`
        ).bind(field.id).all();

        if (values.results.length > 0) {
            facets[field.name] = {
                field_type: field.field_type,
                values: values.results
            };
        }
    }

    // Add item type facet
    const types = await env.DB.prepare(
        `SELECT item_type as value, COUNT(*) as count
     FROM items i
     JOIN collections c ON i.collection_id = c.id
     WHERE 1=1
     ${!user ? 'AND i.is_public = 1 AND c.is_public = 1' : ''}
     GROUP BY item_type
     ORDER BY count DESC`
    ).all();

    facets.type = {
        field_type: 'text',
        values: types.results
    };

    return facets;
}