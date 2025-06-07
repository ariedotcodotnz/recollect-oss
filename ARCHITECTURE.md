# Recollect OSS Architecture

## Overview

Recollect OSS is a modern digital collection management system built entirely on Cloudflare's developer platform. It provides a complete solution for managing, displaying, and searching digital collections with excellent performance and minimal operational overhead.

## Technology Stack

### Backend
- **Cloudflare Workers**: Serverless compute at the edge
- **D1 Database**: SQLite-compatible database for structured data
- **R2 Storage**: Object storage for media files
- **Workers KV**: Key-value storage for sessions
- **Full-Text Search**: Built into D1 for powerful search capabilities

### Frontend
- **Server-Side Rendering**: Fast initial page loads with SEO optimization
- **Progressive Enhancement**: JavaScript enhances functionality when available
- **React Admin Dashboard**: Modern admin interface
- **Responsive Design**: Works on all devices

## Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Public Users   │     │  Admin Users    │     │  Search Bots    │
│                 │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                         │
         └───────────────────────┴─────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │                         │
                    │   Cloudflare Workers    │
                    │   (Edge Computing)      │
                    │                         │
                    └────┬──────┬──────┬──────┘
                         │      │      │
              ┌──────────┘      │      └──────────┐
              │                 │                 │
    ┌─────────▼────────┐  ┌────▼────┐  ┌────────▼────────┐
    │                  │  │         │  │                 │
    │   D1 Database    │  │   KV    │  │   R2 Storage    │
    │   (Metadata)     │  │(Session)│  │   (Media)       │
    │                  │  │         │  │                 │
    └──────────────────┘  └─────────┘  └─────────────────┘
```

## Key Components

### 1. API Layer (`src/api/`)
- **Collections**: CRUD operations for collections
- **Items**: CRUD operations for items with metadata
- **Search**: Full-text search across all content
- **Auth**: JWT-based authentication for admins
- **Upload**: Handles file uploads to R2

### 2. Database Schema (`migrations/`)
- **Collections**: Organize items into logical groups
- **Items**: Core content with type-specific handling
- **Metadata**: Flexible field system for faceted search
- **Tags**: Folksonomy for user-driven organization
- **FTS Index**: Automatic full-text indexing

### 3. Media Handling
- **Upload Processing**: Automatic thumbnail generation
- **Type Detection**: Smart content type handling
- **CDN Delivery**: Global edge caching via Cloudflare
- **Access Control**: Public/private media support

### 4. Frontend Systems

#### Public Interface
- **SSR Pages**: SEO-optimized server rendering
- **Progressive Enhancement**: Works without JavaScript
- **Search**: Real-time search with highlighting
- **Media Viewers**: Type-specific viewers (image zoom, video player, etc.)

#### Admin Dashboard
- **React SPA**: Modern, responsive interface
- **Bulk Operations**: Efficient collection management
- **Drag & Drop**: Easy media uploads
- **Real-time Preview**: See changes immediately

## Data Flow

### Read Path (Public)
1. User requests page/item
2. Worker checks cache
3. If miss, queries D1 for metadata
4. Constructs page with SSR
5. Returns HTML with embedded data
6. Browser enhances with JavaScript

### Write Path (Admin)
1. Admin uploads file to Worker
2. Worker validates and stores in R2
3. Creates metadata record in D1
4. Updates FTS index
5. Invalidates relevant caches
6. Returns success response

### Search Flow
1. User enters search query
2. Worker queries FTS index
3. Joins with metadata tables
4. Returns paginated results
5. Frontend displays with snippets

## Security Model

### Authentication
- JWT tokens for API access
- Secure session storage in KV
- HTTP-only cookies for web sessions
- Automatic session expiry

### Authorization
- Public read access for published content
- Admin-only write access
- Collection-level privacy controls
- IP-based rate limiting

### Data Protection
- All data encrypted at rest
- TLS for all communications
- CORS configured for API access
- Input validation and sanitization

## Performance Optimizations

### Edge Caching
- Static assets cached at edge
- Dynamic content with smart TTLs
- Conditional requests support
- Cache purging on updates

### Database Optimization
- Indexed queries for common paths
- Denormalized view counts
- Efficient pagination
- Connection pooling

### Media Delivery
- Responsive image sizing
- Lazy loading support
- Progressive enhancement
- Bandwidth optimization

## Scalability

### Horizontal Scaling
- Workers scale automatically
- D1 handles millions of records
- R2 scales to petabytes
- KV supports high read rates

### Global Distribution
- Workers run at 200+ locations
- Data replicated globally
- Automatic failover
- Low latency worldwide

## Monitoring & Maintenance

### Health Checks
- Automated uptime monitoring
- Database connection testing
- Storage availability checks
- Search index integrity

### Maintenance Tasks
- Scheduled session cleanup
- Search index optimization
- Orphaned media cleanup
- Usage analytics

## Development Workflow

### Local Development
1. Wrangler dev server
2. Local D1 database
3. Miniflare for testing
4. Hot reload support

### CI/CD Pipeline
1. GitHub Actions on push
2. Automated testing
3. Preview deployments
4. Production releases

## Future Considerations

### Potential Enhancements
- AI-powered auto-tagging
- Advanced OCR for documents
- Video transcription
- Multi-language support
- Federation protocol
- Import/export tools

### Scaling Strategies
- Read replicas for high traffic
- CDN for media thumbnails
- Queue for background jobs
- Analytics pipeline

## Conclusion

Recollect OSS demonstrates how modern serverless architectures can deliver enterprise-grade functionality with minimal operational complexity. By leveraging Cloudflare's integrated platform, we achieve global scale, excellent performance, and reduced costs compared to traditional architectures.