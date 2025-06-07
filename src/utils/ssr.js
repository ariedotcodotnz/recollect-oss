import { generateOpenGraphTags, generateItemStructuredData } from './seo';

export async function renderPage(page, data, env) {
    const baseUrl = env.SITE_URL || 'https://collections.example.com';
    const siteName = env.SITE_NAME || 'Digital Collection';

    // Generate page-specific content
    let title = siteName;
    let content = '';
    let structuredData = null;

    switch (page) {
        case 'home':
            content = renderHomePage(data.collections);
            break;

        case 'collection':
            title = `${data.collection.title} - ${siteName}`;
            content = renderCollectionPage(data.collection, data.items);
            break;

        case 'item':
            title = `${data.item.title} - ${siteName}`;
            content = renderItemPage(data.item);
            structuredData = generateItemStructuredData(data.item, baseUrl);
            break;

        case 'search':
            title = `Search - ${siteName}`;
            content = renderSearchPage();
            break;

        case 'admin':
            title = `Admin - ${siteName}`;
            content = renderAdminPage();
            break;

        default:
            content = '<h1>Page not found</h1>';
    }

    // Generate meta tags
    const ogTags = generateOpenGraphTags(page, { ...data, baseUrl, siteName });
    const metaTags = Object.entries(ogTags)
        .map(([property, content]) => `<meta property="${property}" content="${content}">`)
        .join('\n    ');

    // Generate the HTML
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(data.description || 'Explore our digital collections')}">
    ${metaTags}
    ${structuredData ? `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>` : ''}
    <link rel="stylesheet" href="/css/styles.css">
    <link rel="canonical" href="${baseUrl}${page === 'home' ? '' : `/${page}`}">
    <style>
      /* Critical CSS for initial render */
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
      header { background: #1a1a1a; color: white; padding: 1rem 0; }
      nav a { color: white; text-decoration: none; margin-right: 1rem; }
      .hero { background: #f5f5f5; padding: 3rem 0; text-align: center; }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem; margin: 2rem 0; }
      .card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.2s; }
      .card:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
      .card img { width: 100%; height: 200px; object-fit: cover; }
      .card-content { padding: 1rem; }
      .search-box { width: 100%; max-width: 600px; margin: 2rem auto; }
      .search-box input { width: 100%; padding: 0.75rem; font-size: 1rem; border: 2px solid #ddd; border-radius: 4px; }
      .item-viewer { background: #f9f9f9; padding: 2rem; border-radius: 8px; margin: 2rem 0; }
      .metadata { background: white; padding: 1.5rem; border-radius: 8px; margin-top: 2rem; }
      .metadata dt { font-weight: bold; margin-top: 1rem; }
      .metadata dd { margin-left: 0; color: #666; }
      footer { background: #333; color: white; padding: 2rem 0; margin-top: 4rem; text-align: center; }
      @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <header>
        <nav class="container">
            <a href="/" style="font-size: 1.25rem; font-weight: bold;">${escapeHtml(siteName)}</a>
            <div style="float: right;">
                <a href="/">Home</a>
                <a href="/search">Search</a>
                <a href="/admin">Admin</a>
            </div>
        </nav>
    </header>
    
    <main>
        ${content}
    </main>
    
    <footer>
        <div class="container">
            <p>&copy; ${new Date().getFullYear()} ${escapeHtml(siteName)}. Powered by Recollect OSS.</p>
        </div>
    </footer>
    
    <script src="/js/app.js" defer></script>
</body>
</html>`;

    return new Response(html, {
        headers: {
            'Content-Type': 'text/html;charset=UTF-8',
            'Cache-Control': page === 'admin' ? 'private, no-cache' : 'public, max-age=300'
        }
    });
}

function renderHomePage(collections) {
    return `
    <section class="hero">
        <div class="container">
            <h1>Welcome to Our Digital Collections</h1>
            <p>Explore, discover, and engage with our curated collections</p>
            <div class="search-box">
                <form action="/search" method="get">
                    <input type="search" name="q" placeholder="Search all collections..." aria-label="Search">
                </form>
            </div>
        </div>
    </section>
    
    <section class="container">
        <h2>Featured Collections</h2>
        <div class="grid">
            ${collections.collections.map(collection => `
                <article class="card">
                    <a href="/collections/${collection.slug}" style="text-decoration: none; color: inherit;">
                        ${collection.thumbnail_url ?
        `<img src="${collection.thumbnail_url}" alt="${escapeHtml(collection.title)}" loading="lazy">` :
        '<div style="height: 200px; background: #e0e0e0; display: flex; align-items: center; justify-content: center;">No Image</div>'
    }
                        <div class="card-content">
                            <h3>${escapeHtml(collection.title)}</h3>
                            ${collection.description ? `<p>${escapeHtml(truncate(collection.description, 150))}</p>` : ''}
                            <p style="color: #666; font-size: 0.9rem; margin-top: 0.5rem;">
                                ${collection.item_count || 0} items
                            </p>
                        </div>
                    </a>
                </article>
            `).join('')}
        </div>
    </section>
  `;
}

function renderCollectionPage(collection, items) {
    return `
    <section class="hero">
        <div class="container">
            <h1>${escapeHtml(collection.title)}</h1>
            ${collection.description ? `<p>${escapeHtml(collection.description)}</p>` : ''}
            <p style="margin-top: 1rem; color: #666;">${items.pagination.total} items</p>
        </div>
    </section>
    
    <section class="container">
        <div style="margin: 2rem 0;">
            <form id="filter-form" style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <select name="type" onchange="this.form.submit()">
                    <option value="">All Types</option>
                    <option value="image">Images</option>
                    <option value="document">Documents</option>
                    <option value="audio">Audio</option>
                    <option value="video">Video</option>
                    <option value="3d">3D Objects</option>
                </select>
            </form>
        </div>
        
        <div class="grid">
            ${items.items.map(item => `
                <article class="card">
                    <a href="/items/${item.id}" style="text-decoration: none; color: inherit;">
                        ${item.thumbnail_url ?
        `<img src="${item.thumbnail_url}" alt="${escapeHtml(item.title)}" loading="lazy">` :
        `<div style="height: 200px; background: #e0e0e0; display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 3rem; color: #999;">${getItemIcon(item.item_type)}</span>
                          </div>`
    }
                        <div class="card-content">
                            <h3>${escapeHtml(item.title)}</h3>
                            ${item.description ? `<p>${escapeHtml(truncate(item.description, 100))}</p>` : ''}
                            <p style="color: #666; font-size: 0.9rem; margin-top: 0.5rem;">
                                ${item.item_type}
                            </p>
                        </div>
                    </a>
                </article>
            `).join('')}
        </div>
        
        ${items.pagination.hasMore ? `
            <div style="text-align: center; margin: 3rem 0;">
                <a href="?offset=${items.pagination.offset + items.pagination.limit}" 
                   style="display: inline-block; padding: 0.75rem 2rem; background: #333; color: white; text-decoration: none; border-radius: 4px;">
                    Load More
                </a>
            </div>
        ` : ''}
    </section>
  `;
}

function renderItemPage(item) {
    return `
    <div class="container">
        <nav style="margin: 2rem 0; color: #666;">
            <a href="/" style="color: #666;">Home</a> / 
            <a href="/collections/${item.collection_slug}" style="color: #666;">${escapeHtml(item.collection_title)}</a> / 
            ${escapeHtml(item.title)}
        </nav>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin: 2rem 0;">
            <div class="item-viewer">
                ${renderItemViewer(item)}
            </div>
            
            <div>
                <h1>${escapeHtml(item.title)}</h1>
                ${item.description ? `<p style="margin: 1rem 0; color: #666;">${escapeHtml(item.description)}</p>` : ''}
                
                ${item.rights_statement ? `
                    <div style="background: #fff3cd; padding: 1rem; border-radius: 4px; margin: 1rem 0;">
                        <strong>Rights:</strong> ${escapeHtml(item.rights_statement)}
                    </div>
                ` : ''}
                
                <div class="metadata">
                    <h2>Details</h2>
                    <dl>
                        <dt>Type</dt>
                        <dd>${item.item_type}</dd>
                        
                        <dt>Views</dt>
                        <dd>${item.view_count}</dd>
                        
                        ${item.metadata_fields?.map(field => `
                            <dt>${escapeHtml(field.name)}</dt>
                            <dd>${escapeHtml(field.value)}</dd>
                        `).join('')}
                    </dl>
                    
                    ${item.tags?.length > 0 ? `
                        <div style="margin-top: 1.5rem;">
                            <strong>Tags:</strong>
                            ${item.tags.map(tag => `
                                <a href="/search?tag=${tag.slug}" 
                                   style="display: inline-block; padding: 0.25rem 0.75rem; margin: 0.25rem; background: #e0e0e0; text-decoration: none; border-radius: 4px; font-size: 0.9rem;">
                                    ${escapeHtml(tag.name)}
                                </a>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <div style="margin-top: 2rem;">
                    <a href="${item.media_url}" download 
                       style="display: inline-block; padding: 0.75rem 1.5rem; background: #333; color: white; text-decoration: none; border-radius: 4px;">
                        Download Original
                    </a>
                </div>
            </div>
        </div>
        
        ${item.related_items?.length > 0 ? `
            <section style="margin-top: 4rem;">
                <h2>Related Items</h2>
                <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
                    ${item.related_items.map(related => `
                        <a href="/items/${related.id}" class="card" style="text-decoration: none; color: inherit;">
                            ${related.thumbnail_url ?
        `<img src="${related.thumbnail_url}" alt="${escapeHtml(related.title)}" style="height: 150px;">` :
        `<div style="height: 150px; background: #e0e0e0; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 2rem; color: #999;">${getItemIcon(related.item_type)}</span>
                              </div>`
    }
                            <div class="card-content">
                                <h4>${escapeHtml(related.title)}</h4>
                            </div>
                        </a>
                    `).join('')}
                </div>
            </section>
        ` : ''}
    </div>
  `;
}

function renderItemViewer(item) {
    switch (item.item_type) {
        case 'image':
            return `<img src="${item.media_url}" alt="${escapeHtml(item.title)}" style="width: 100%; height: auto;">`;

        case 'document':
            if (item.media_url.endsWith('.pdf')) {
                return `<iframe src="${item.media_url}" style="width: 100%; height: 600px; border: none;"></iframe>`;
            }
            return `<div style="text-align: center; padding: 3rem;">
        <span style="font-size: 4rem;">📄</span>
        <p>Document preview not available</p>
      </div>`;

        case 'audio':
            return `<audio controls style="width: 100%;">
        <source src="${item.media_url}" type="audio/mpeg">
        Your browser does not support the audio element.
      </audio>`;

        case 'video':
            return `<video controls style="width: 100%; height: auto;">
        <source src="${item.media_url}" type="video/mp4">
        Your browser does not support the video element.
      </video>`;

        case '3d':
            return `<div style="text-align: center; padding: 3rem;">
        <span style="font-size: 4rem;">🎲</span>
        <p>3D viewer requires JavaScript</p>
      </div>`;

        default:
            return `<div style="text-align: center; padding: 3rem;">
        <p>Preview not available</p>
      </div>`;
    }
}

function renderSearchPage() {
    return `
    <div class="container" style="margin-top: 3rem;">
        <h1>Search Collections</h1>
        <div class="search-box" style="max-width: none; margin: 2rem 0;">
            <form action="/search" method="get">
                <input type="search" name="q" placeholder="Search items, collections, and metadata..." 
                       aria-label="Search" autofocus>
            </form>
        </div>
        
        <div id="search-results" style="margin-top: 3rem;">
            <!-- Results will be loaded here -->
        </div>
    </div>
  `;
}

function renderAdminPage() {
    return `
    <div class="container" style="margin-top: 2rem;">
        <h1>Admin Dashboard</h1>
        <div id="admin-root">
            <p>Loading admin interface...</p>
            <noscript>
                <p style="color: red;">JavaScript is required for the admin interface.</p>
            </noscript>
        </div>
    </div>
  `;
}

// Utility functions
function escapeHtml(str) {
    if (!str) return '';
    const htmlEntities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return String(str).replace(/[&<>"']/g, (match) => htmlEntities[match]);
}

function truncate(str, length) {
    if (!str || str.length <= length) return str;
    return str.substring(0, length) + '...';
}

function getItemIcon(type) {
    const icons = {
        image: '🖼️',
        document: '📄',
        audio: '🎵',
        video: '🎬',
        '3d': '🎲'
    };
    return icons[type] || '📁';
}