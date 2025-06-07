// Main frontend JavaScript for Recollect OSS
(function() {
    'use strict';

    // API client
    const api = {
        baseUrl: '/api',

        async fetch(endpoint, options = {}) {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Request failed');
            }

            return response.json();
        },

        // Collections
        getCollections: (params) => api.fetch(`/collections?${new URLSearchParams(params)}`),
        getCollection: (id) => api.fetch(`/collections/${id}`),

        // Items
        getItems: (params) => api.fetch(`/items?${new URLSearchParams(params)}`),
        getItem: (id) => api.fetch(`/items/${id}`),
        searchItems: (query) => api.fetch(`/search?q=${encodeURIComponent(query)}`),

        // Auth
        checkAuth: () => api.fetch('/auth/check'),
        login: (credentials) => api.fetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        }),
        logout: () => api.fetch('/auth/logout', { method: 'POST' })
    };

    // Image viewer
    class ImageViewer {
        constructor(container) {
            this.container = container;
            this.scale = 1;
            this.translateX = 0;
            this.translateY = 0;
            this.isDragging = false;

            this.init();
        }

        init() {
            const img = this.container.querySelector('img');
            if (!img) return;

            // Add controls
            const controls = document.createElement('div');
            controls.className = 'image-controls';
            controls.innerHTML = `
        <button class="zoom-in" title="Zoom in">+</button>
        <button class="zoom-out" title="Zoom out">-</button>
        <button class="reset" title="Reset">⟲</button>
        <button class="fullscreen" title="Fullscreen">⛶</button>
      `;
            this.container.appendChild(controls);

            // Add event listeners
            controls.querySelector('.zoom-in').addEventListener('click', () => this.zoom(1.2));
            controls.querySelector('.zoom-out').addEventListener('click', () => this.zoom(0.8));
            controls.querySelector('.reset').addEventListener('click', () => this.reset());
            controls.querySelector('.fullscreen').addEventListener('click', () => this.fullscreen());

            // Mouse events for panning
            img.addEventListener('mousedown', (e) => this.startDrag(e));
            img.addEventListener('mousemove', (e) => this.drag(e));
            img.addEventListener('mouseup', () => this.endDrag());
            img.addEventListener('mouseleave', () => this.endDrag());

            // Wheel event for zooming
            img.addEventListener('wheel', (e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                this.zoom(delta);
            });

            // Touch events
            let lastDistance = 0;
            img.addEventListener('touchstart', (e) => {
                if (e.touches.length === 2) {
                    lastDistance = this.getDistance(e.touches);
                }
            });

            img.addEventListener('touchmove', (e) => {
                if (e.touches.length === 2) {
                    e.preventDefault();
                    const distance = this.getDistance(e.touches);
                    const scale = distance / lastDistance;
                    this.zoom(scale);
                    lastDistance = distance;
                }
            });
        }

        zoom(factor) {
            this.scale *= factor;
            this.scale = Math.min(Math.max(0.5, this.scale), 5);
            this.updateTransform();
        }

        reset() {
            this.scale = 1;
            this.translateX = 0;
            this.translateY = 0;
            this.updateTransform();
        }

        fullscreen() {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                this.container.requestFullscreen();
            }
        }

        startDrag(e) {
            if (this.scale <= 1) return;
            this.isDragging = true;
            this.startX = e.clientX - this.translateX;
            this.startY = e.clientY - this.translateY;
            e.target.style.cursor = 'grabbing';
        }

        drag(e) {
            if (!this.isDragging) return;
            e.preventDefault();
            this.translateX = e.clientX - this.startX;
            this.translateY = e.clientY - this.startY;
            this.updateTransform();
        }

        endDrag() {
            this.isDragging = false;
            const img = this.container.querySelector('img');
            if (img) img.style.cursor = this.scale > 1 ? 'grab' : 'default';
        }

        getDistance(touches) {
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            return Math.sqrt(dx * dx + dy * dy);
        }

        updateTransform() {
            const img = this.container.querySelector('img');
            if (img) {
                img.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
            }
        }
    }

    // 3D Model viewer
    class ModelViewer {
        constructor(container, modelUrl) {
            this.container = container;
            this.modelUrl = modelUrl;

            // Check if model-viewer is available
            if (customElements.get('model-viewer')) {
                this.initModelViewer();
            } else {
                this.loadModelViewer();
            }
        }

        loadModelViewer() {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
            script.onload = () => this.initModelViewer();
            document.head.appendChild(script);
        }

        initModelViewer() {
            this.container.innerHTML = `
        <model-viewer
          src="${this.modelUrl}"
          alt="3D Model"
          auto-rotate
          camera-controls
          shadow-intensity="1"
          style="width: 100%; height: 600px;">
        </model-viewer>
      `;
        }
    }

    // Search functionality
    class Search {
        constructor() {
            this.searchResults = document.getElementById('search-results');

            if (this.searchResults) {
                this.init();
            }
        }

        init() {
            // Check if there's a query in URL on load
            const urlParams = new URLSearchParams(window.location.search);
            const query = urlParams.get('q');
            if (query && this.searchResults) {
                this.performSearch(query);
            }
        }

        async performSearch(query) {
            if (!this.searchResults) return;

            this.searchResults.innerHTML = '<p>Searching...</p>';

            try {
                const results = await api.searchItems(query);
                this.displayResults(results);
            } catch (error) {
                this.searchResults.innerHTML = `<p>Search failed: ${error.message}</p>`;
            }
        }

        displayResults(results) {
            if (results.items.length === 0) {
                this.searchResults.innerHTML = '<p>No results found.</p>';
                return;
            }

            const html = `
        <p>${results.pagination.total} results found</p>
        <div class="grid">
          ${results.items.map(item => `
            <article class="card">
              <a href="/items/${item.id}">
                ${item.thumbnail_url ?
                `<img src="${item.thumbnail_url}" alt="${this.escapeHtml(item.title)}" loading="lazy">` :
                `<div style="height: 200px; background: #e0e0e0; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 3rem; color: #999;">${this.getItemIcon(item.item_type)}</span>
                  </div>`
            }
                <div class="card-content">
                  <h3>${this.escapeHtml(item.title)}</h3>
                  ${item.snippet ? `<p>${item.snippet}</p>` : ''}
                  <p style="color: #666; font-size: 0.9rem;">
                    ${this.escapeHtml(item.collection_title)} • ${item.item_type}
                  </p>
                </div>
              </a>
            </article>
          `).join('')}
        </div>
        
        ${results.pagination.hasMore ? `
          <div style="text-align: center; margin: 2rem 0;">
            <button class="load-more" data-offset="${results.pagination.offset + results.pagination.limit}">
              Load More
            </button>
          </div>
        ` : ''}
      `;

            this.searchResults.innerHTML = html;

            // Add load more functionality
            const loadMoreBtn = this.searchResults.querySelector('.load-more');
            if (loadMoreBtn) {
                loadMoreBtn.addEventListener('click', async () => {
                    const offset = parseInt(loadMoreBtn.dataset.offset);
                    const moreResults = await api.searchItems(results.query + `&offset=${offset}`);
                    this.appendResults(moreResults, loadMoreBtn);
                });
            }
        }

        appendResults(results, button) {
            const grid = this.searchResults.querySelector('.grid');
            const newItems = results.items.map(item => {
                const article = document.createElement('article');
                article.className = 'card';
                article.innerHTML = `
          <a href="/items/${item.id}">
            ${item.thumbnail_url ?
                    `<img src="${item.thumbnail_url}" alt="${this.escapeHtml(item.title)}" loading="lazy">` :
                    `<div style="height: 200px; background: #e0e0e0; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 3rem; color: #999;">${this.getItemIcon(item.item_type)}</span>
              </div>`
                }
            <div class="card-content">
              <h3>${this.escapeHtml(item.title)}</h3>
              ${item.snippet ? `<p>${item.snippet}</p>` : ''}
              <p style="color: #666; font-size: 0.9rem;">
                ${this.escapeHtml(item.collection_title)} • ${item.item_type}
              </p>
            </div>
          </a>
        `;
                return article;
            });

            newItems.forEach(item => grid.appendChild(item));

            if (results.pagination.hasMore) {
                button.dataset.offset = results.pagination.offset + results.pagination.limit;
            } else {
                button.remove();
            }
        }

        escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }

        getItemIcon(type) {
            const icons = {
                image: '🖼️',
                document: '📄',
                audio: '🎵',
                video: '🎬',
                '3d': '🎲'
            };
            return icons[type] || '📁';
        }
    }

    // Initialize components
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize search
        new Search();

        // Initialize image viewers
        document.querySelectorAll('.item-viewer').forEach(viewer => {
            const img = viewer.querySelector('img');
            if (img) {
                new ImageViewer(viewer);
            }

            // Initialize 3D viewer if needed
            const modelUrl = viewer.dataset.modelUrl;
            if (modelUrl) {
                new ModelViewer(viewer, modelUrl);
            }
        });

        // Handle search input on homepage
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.target.value) {
                    window.location.href = '/search?q=' + encodeURIComponent(e.target.value);
                }
            });
        }

        // Handle search query input on search page
        const searchQuery = document.getElementById('search-query');
        if (searchQuery) {
            searchQuery.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.target.value) {
                    window.location.href = '/search?q=' + encodeURIComponent(e.target.value);
                }
            });

            // Check for query in URL
            const urlParams = new URLSearchParams(window.location.search);
            const query = urlParams.get('q');
            if (query) {
                searchQuery.value = query;
            }
        }

        // Add smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Add lazy loading for images
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img.lazy').forEach(img => {
                imageObserver.observe(img);
            });
        }
    });

    // Export for use in other modules
    window.RecollectApp = {
        api,
        ImageViewer,
        ModelViewer,
        Search
    };
})();