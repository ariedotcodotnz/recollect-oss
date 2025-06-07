# Recollect OSS - Open Source Digital Collection Management

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/yourusername/recollect-oss)

A modern, open-source digital collection management system built on Cloudflare's infrastructure. Create beautiful, searchable online collections with powerful metadata management, SEO optimization, and support for various media types.

## Features

### 🔍 Discovery
- **Faceted Search**: Filter collections by multiple attributes
- **Linked Metadata**: Navigate through related items seamlessly
- **Full-Text Search**: OCR support for documents and images
- **SEO Optimized**: Built-in SEO features for maximum visibility

### 🎨 Media Support
- **Images**: High-resolution viewing with pan/zoom
- **Documents**: PDF viewing and text extraction
- **Audio/Video**: Streaming playback with timeline markers
- **3D Objects**: Interactive 3D model viewer

### 👤 Access Control
- **Public Collections**: Browse without authentication
- **Admin Dashboard**: Secure admin-only editing
- **Bulk Operations**: Efficient collection management
- **Rights Management**: Copyright and usage rights support

### 🚀 Performance
- **Global CDN**: Cloudflare's edge network
- **Smart Caching**: Optimized for speed
- **Responsive Design**: Works on all devices
- **Progressive Enhancement**: Fast initial loads

## Tech Stack

- **Backend**: Cloudflare Workers
- **Database**: D1 (SQLite)
- **Storage**: R2 (Object Storage)
- **Sessions**: Workers KV
- **Frontend**: React with Server-Side Rendering
- **Search**: D1 Full-Text Search

## Quick Start

### One-Click Deploy

Click the "Deploy to Cloudflare" button above to automatically:
1. Fork this repository to your account
2. Create required Cloudflare resources (D1, R2, KV)
3. Deploy the application
4. Set up CI/CD with Workers Builds

### Manual Setup

1. **Clone and Install**
```bash
git clone https://github.com/yourusername/recollect-oss.git
cd recollect-oss
npm install
```

2. **Run Setup Script**
```bash
npm run setup
```

This interactive script will:
- Check Cloudflare authentication
- Configure your site settings
- Create all required resources (D1, R2, KV)
- Run database migrations
- Build the project

3. **Start Development**
```bash
npm run dev
```

4. **Create Admin Account**
   Visit `http://localhost:8787/admin/setup` to create your first admin account.

5. **Deploy to Production**
```bash
npm run deploy
```

## Configuration

### Environment Variables

Set these in your `wrangler.toml` or Cloudflare dashboard:

```toml
[vars]
ADMIN_EMAIL = "admin@example.com"
JWT_SECRET = "your-secret-key"
SITE_URL = "https://your-collection.com"
SITE_NAME = "My Digital Collection"
```

### First Run

1. Deploy the application
2. Visit `/admin/setup` to create your admin account
3. Start building your collection!

## Project Structure

```
recollect-oss/
├── src/
│   ├── index.js          # Main Worker entry
│   ├── api/              # API routes
│   ├── db/               # Database schemas
│   ├── middleware/       # Auth, CORS, etc
│   └── utils/            # Helpers
├── frontend/
│   ├── public/           # Public interface
│   ├── admin/            # Admin dashboard
│   └── shared/           # Shared components
├── migrations/           # D1 migrations
├── wrangler.toml        # Cloudflare config
└── package.json
```

## API Documentation

### Public Endpoints

- `GET /api/collections` - List public collections
- `GET /api/collections/:id` - Get collection details
- `GET /api/items` - Browse items with faceted search
- `GET /api/items/:id` - Get item details
- `GET /api/search` - Full-text search

### Admin Endpoints (Auth Required)

- `POST /api/collections` - Create collection
- `PUT /api/collections/:id` - Update collection
- `DELETE /api/collections/:id` - Delete collection
- `POST /api/items` - Create item with metadata
- `POST /api/upload` - Upload media files
- `POST /api/bulk` - Bulk operations

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development

```bash
# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

Inspired by professional collection management systems, built for the modern web on Cloudflare's developer platform.

## Support

- [Documentation](https://github.com/yourusername/recollect-oss/wiki)
- [Issues](https://github.com/yourusername/recollect-oss/issues)
- [Discussions](https://github.com/yourusername/recollect-oss/discussions)