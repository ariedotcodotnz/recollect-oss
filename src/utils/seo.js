export async function generateSitemap(request, env) {
    try {
        const baseUrl = env.SITE_URL || `https://${request.headers.get('host')}`;

        // Start XML
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Add homepage
        xml += createUrlEntry(baseUrl, '1.0', 'daily');

        // Add static pages
        const staticPages = ['/search', '/about', '/contact'];
        for (const page of staticPages) {
            xml += createUrlEntry(`${baseUrl}${page}`, '0.8', 'weekly');
        }

        // Add public collections
        const collections = await env.DB.prepare(
            'SELECT slug, updated_at FROM collections WHERE is_public = 1 ORDER BY updated_at DESC'
        ).all();

        for (const collection of collections.results) {
            xml += createUrlEntry(
                `${baseUrl}/collections/${collection.slug}`,
                '0.9',
                'weekly',
                collection.updated_at
            );
        }

        // Add public items (limit to most recent 1000)
        const items = await env.DB.prepare(
            `SELECT i.id, i.updated_at, c.slug as collection_slug 
       FROM items i 
       JOIN collections c ON i.collection_id = c.id 
       WHERE i.is_public = 1 AND c.is_public = 1 
       ORDER BY i.updated_at DESC 
       LIMIT 1000`
        ).all();

        for (const item of items.results) {
            xml += createUrlEntry(
                `${baseUrl}/items/${item.id}`,
                '0.7',
                'monthly',
                item.updated_at
            );
        }

        xml += '</urlset>';

        return new Response(xml, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
            }
        });
    } catch (error) {
        console.error('Sitemap generation error:', error);
        return new Response('Error generating sitemap', { status: 500 });
    }
}

export async function generateRobots(request, env) {
    const baseUrl = env.SITE_URL || `https://${request.headers.get('host')}`;

    const robots = `User-agent: *
Allow: /

# Directories
Allow: /collections/
Allow: /items/
Allow: /search
Disallow: /admin/
Disallow: /api/auth/
Disallow: /api/upload

# Files
Allow: /media/*
Allow: /*.js
Allow: /*.css
Allow: /*.jpg
Allow: /*.jpeg
Allow: /*.png
Allow: /*.gif
Allow: /*.svg
Allow: /*.webp

# Crawl-delay
Crawl-delay: 1

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml`;

    return new Response(robots, {
        headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
        }
    });
}

function createUrlEntry(loc, priority = '0.5', changefreq = 'monthly', lastmod = null) {
    let entry = '  <url>\n';
    entry += `    <loc>${escapeXml(loc)}</loc>\n`;

    if (lastmod) {
        const date = new Date(lastmod).toISOString().split('T')[0];
        entry += `    <lastmod>${date}</lastmod>\n`;
    }

    entry += `    <changefreq>${changefreq}</changefreq>\n`;
    entry += `    <priority>${priority}</priority>\n`;
    entry += '  </url>\n';

    return entry;
}

function escapeXml(str) {
    const xmlEntities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;'
    };

    return str.replace(/[&<>"']/g, (match) => xmlEntities[match]);
}

// Generate structured data for items
export function generateItemStructuredData(item, baseUrl) {
    const data = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: item.title,
        description: item.description,
        url: `${baseUrl}/items/${item.id}`,
        dateCreated: item.created_at,
        dateModified: item.updated_at,
        isPartOf: {
            '@type': 'Collection',
            name: item.collection_title,
            url: `${baseUrl}/collections/${item.collection_slug}`
        }
    };

    // Add image if available
    if (item.thumbnail_url) {
        data.image = `${baseUrl}${item.thumbnail_url}`;
    }

    // Add creator if available
    const creator = item.metadata_fields?.find(f => f.name === 'creator');
    if (creator) {
        data.creator = {
            '@type': 'Person',
            name: creator.value
        };
    }

    // Add date if available
    const date = item.metadata_fields?.find(f => f.name === 'date');
    if (date) {
        data.datePublished = date.value;
    }

    // Add specific type based on item_type
    switch (item.item_type) {
        case 'image':
            data['@type'] = 'ImageObject';
            data.contentUrl = `${baseUrl}${item.media_url}`;
            break;
        case 'video':
            data['@type'] = 'VideoObject';
            data.contentUrl = `${baseUrl}${item.media_url}`;
            break;
        case 'audio':
            data['@type'] = 'AudioObject';
            data.contentUrl = `${baseUrl}${item.media_url}`;
            break;
        case '3d':
            data['@type'] = '3DModel';
            data.contentUrl = `${baseUrl}${item.media_url}`;
            break;
    }

    return data;
}

// Generate Open Graph meta tags
export function generateOpenGraphTags(page, data) {
    const tags = {
        'og:site_name': data.siteName || 'Digital Collection',
        'og:locale': 'en_US',
        'twitter:card': 'summary_large_image'
    };

    switch (page) {
        case 'home':
            tags['og:type'] = 'website';
            tags['og:title'] = data.siteName || 'Digital Collection';
            tags['og:description'] = 'Explore our digital collections';
            break;

        case 'collection':
            tags['og:type'] = 'article';
            tags['og:title'] = data.collection.title;
            tags['og:description'] = data.collection.description || `Browse the ${data.collection.title} collection`;
            if (data.collection.thumbnail_url) {
                tags['og:image'] = `${data.baseUrl}${data.collection.thumbnail_url}`;
            }
            break;

        case 'item':
            tags['og:type'] = 'article';
            tags['og:title'] = data.item.title;
            tags['og:description'] = data.item.description || data.item.title;
            if (data.item.thumbnail_url) {
                tags['og:image'] = `${data.baseUrl}${data.item.thumbnail_url}`;
            }
            break;
    }

    return tags;
}