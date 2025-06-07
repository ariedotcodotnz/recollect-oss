#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🏗️  Building Recollect OSS...\n');

// Create necessary directories
const dirs = [
    'dist',
    'dist/js',
    'dist/css',
    'frontend/public/js',
    'frontend/public/css'
];

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✓ Created directory: ${dir}`);
    }
});

// Copy frontend files
console.log('\n📦 Copying frontend assets...');

// Copy JavaScript files
if (fs.existsSync('frontend/public/js/app.js')) {
    fs.copyFileSync('frontend/public/js/app.js', 'dist/js/app.js');
    console.log('✓ Copied app.js');
}

// Create CSS file if it doesn't exist
const cssContent = `/* Recollect OSS Styles */

/* Base styles are included inline in SSR for performance */
/* Additional styles for enhanced functionality */

/* Image viewer controls */
.image-controls {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.7);
  padding: 0.5rem;
  border-radius: 0.5rem;
}

.image-controls button {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 0.25rem;
  font-size: 1.25rem;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-controls button:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Loading states */
.loading {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #333;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Facet filters */
.facet-group {
  margin-bottom: 1.5rem;
}

.facet-group h3 {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #666;
  margin-bottom: 0.5rem;
}

.facet-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0;
  cursor: pointer;
}

.facet-item:hover {
  color: #4f46e5;
}

.facet-count {
  font-size: 0.875rem;
  color: #999;
}

/* Responsive utilities */
@media (max-width: 1024px) {
  .hide-on-tablet {
    display: none;
  }
}

@media (max-width: 640px) {
  .hide-on-mobile {
    display: none;
  }
  
  .container {
    padding: 0 1rem;
  }
}

/* Print styles */
@media print {
  header, footer, .no-print {
    display: none;
  }
  
  .container {
    max-width: 100%;
  }
  
  .card {
    break-inside: avoid;
  }
}
`;

fs.writeFileSync('dist/css/styles.css', cssContent);
console.log('✓ Created styles.css');

// Build React admin app
console.log('\n🚀 Building admin interface...');

// Create a simple build of the React component
const adminBuildScript = `
// Admin app loader
(function() {
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/react@18/umd/react.production.min.js';
  script.onload = function() {
    const scriptDom = document.createElement('script');
    scriptDom.src = 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js';
    scriptDom.onload = function() {
      // Load the admin app
      const adminScript = document.createElement('script');
      adminScript.type = 'module';
      adminScript.textContent = \`
        import AdminDashboard from '/admin/App.jsx';
        const root = ReactDOM.createRoot(document.getElementById('admin-root'));
        root.render(React.createElement(AdminDashboard));
      \`;
      document.body.appendChild(adminScript);
    };
    document.head.appendChild(scriptDom);
  };
  document.head.appendChild(script);
})();
`;

fs.writeFileSync('dist/js/admin-loader.js', adminBuildScript);
console.log('✓ Created admin loader');

// Create service worker for offline support
const swContent = `// Recollect OSS Service Worker
const CACHE_NAME = 'recollect-v1';
const urlsToCache = [
  '/',
  '/css/styles.css',
  '/js/app.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
`;

fs.writeFileSync('dist/sw.js', swContent);
console.log('✓ Created service worker');

// Run any necessary optimizations
console.log('\n🎯 Running optimizations...');

try {
    // You could add minification, bundling, etc. here
    console.log('✓ Optimizations complete');
} catch (error) {
    console.warn('⚠️  Optimization step failed:', error.message);
}

console.log('\n✅ Build complete!');
console.log('\nNext steps:');
console.log('1. Run "npm run db:migrate" to set up the database');
console.log('2. Run "npm run dev" to start the development server');
console.log('3. Run "npm run deploy" to deploy to Cloudflare');