export async function handleUpload(request, env) {
    try {
        const contentType = request.headers.get('content-type') || '';

        if (!contentType.includes('multipart/form-data')) {
            return new Response(JSON.stringify({
                error: 'Content-Type must be multipart/form-data'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const formData = await request.formData();
        const file = formData.get('file');
        const generateThumbnail = formData.get('thumbnail') === 'true';

        if (!file || !(file instanceof File)) {
            return new Response(JSON.stringify({ error: 'No file provided' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check file size
        const maxSize = parseInt(env.MAX_UPLOAD_SIZE || '104857600'); // 100MB default
        if (file.size > maxSize) {
            return new Response(JSON.stringify({
                error: `File size exceeds maximum of ${maxSize / 1048576}MB`
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate file type
        const allowedTypes = {
            // Images
            'image/jpeg': ['jpg', 'jpeg'],
            'image/png': ['png'],
            'image/gif': ['gif'],
            'image/webp': ['webp'],
            'image/svg+xml': ['svg'],

            // Documents
            'application/pdf': ['pdf'],

            // Audio
            'audio/mpeg': ['mp3'],
            'audio/wav': ['wav'],
            'audio/ogg': ['ogg'],
            'audio/webm': ['webm'],

            // Video
            'video/mp4': ['mp4'],
            'video/webm': ['webm'],
            'video/ogg': ['ogv'],

            // 3D
            'model/gltf-binary': ['glb'],
            'model/gltf+json': ['gltf'],
            'application/octet-stream': ['glb', 'obj', 'stl'] // For 3D files
        };

        const fileType = file.type || 'application/octet-stream';
        const extension = file.name.split('.').pop().toLowerCase();

        let isAllowed = false;
        for (const [mime, exts] of Object.entries(allowedTypes)) {
            if (fileType === mime || exts.includes(extension)) {
                isAllowed = true;
                break;
            }
        }

        if (!isAllowed) {
            return new Response(JSON.stringify({
                error: 'File type not allowed'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `${timestamp}-${random}-${safeName}`;

        // Upload to R2
        const arrayBuffer = await file.arrayBuffer();
        await env.MEDIA_BUCKET.put(key, arrayBuffer, {
            httpMetadata: {
                contentType: fileType,
                cacheControl: 'public, max-age=31536000'
            },
            customMetadata: {
                originalName: file.name,
                uploadedBy: request.user.id.toString(),
                uploadedAt: new Date().toISOString()
            }
        });

        const mediaUrl = `/media/${key}`;
        let thumbnailUrl = mediaUrl;

        // Generate thumbnail for images
        if (generateThumbnail && fileType.startsWith('image/') && fileType !== 'image/svg+xml') {
            thumbnailUrl = await generateImageThumbnail(
                arrayBuffer,
                fileType,
                key,
                env
            );
        }

        // Extract text content for searchability
        let extractedText = '';
        if (fileType === 'application/pdf') {
            // In a real implementation, you'd use a PDF parsing library
            // For now, we'll leave this as a placeholder
            extractedText = ''; // PDF text extraction would go here
        }

        return new Response(JSON.stringify({
            success: true,
            media_url: mediaUrl,
            thumbnail_url: thumbnailUrl,
            file_type: fileType,
            file_size: file.size,
            extracted_text: extractedText
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Upload error:', error);
        return new Response(JSON.stringify({ error: 'Upload failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function generateImageThumbnail(arrayBuffer, mimeType, originalKey, env) {
    // For the Worker environment, we'll use the Image Resizing API
    // This requires the image to be served through Cloudflare's CDN

    // First, we need to upload the original image
    // Then we can use URL-based transformations

    // For now, we'll create a thumbnail key that the frontend can use
    // with Cloudflare's image resizing parameters
    const thumbnailKey = `thumb-${originalKey}`;

    // In a production environment, you might want to use the Images API
    // or implement actual image processing here

    // For this demo, we'll use the same image with transformation params
    return `/media/${originalKey}?width=400&height=400&fit=cover`;
}

// Utility function to determine item type from MIME type
export function getItemTypeFromMime(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'document';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('model/') ||
        ['glb', 'gltf', 'obj', 'stl'].some(ext => mimeType.includes(ext))) {
        return '3d';
    }
    return 'document';
}