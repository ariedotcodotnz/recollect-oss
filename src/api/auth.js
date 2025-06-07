import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function login(request, env) {
    try {
        const { email, password } = await request.json();

        // Get user from database
        const user = await env.DB.prepare(
            'SELECT * FROM users WHERE email = ?'
        ).bind(email).first();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verify password
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Create JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Store session in KV
        const sessionId = crypto.randomUUID();
        await env.SESSIONS.put(sessionId, JSON.stringify({
            userId: user.id,
            token,
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
        }), {
            expirationTtl: 7 * 24 * 60 * 60 // 7 days in seconds
        });

        return new Response(JSON.stringify({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': `session=${sessionId}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/`
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Login failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function logout(request, env) {
    const cookie = request.headers.get('Cookie');
    const sessionId = cookie?.match(/session=([^;]+)/)?.[1];

    if (sessionId) {
        await env.SESSIONS.delete(sessionId);
    }

    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': 'session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
        }
    });
}

export async function setup(request, env) {
    try {
        // Check if any users exist
        const userCount = await env.DB.prepare(
            'SELECT COUNT(*) as count FROM users'
        ).first();

        if (userCount.count > 0) {
            return new Response(JSON.stringify({ error: 'Setup already completed' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { email, password, name } = await request.json();

        // Validate input
        if (!email || !password || !name) {
            return new Response(JSON.stringify({ error: 'All fields required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create first admin user
        const result = await env.DB.prepare(
            'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
        ).bind(email, passwordHash, name, 'admin').run();

        return new Response(JSON.stringify({
            success: true,
            message: 'Admin user created successfully'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Setup failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function checkAuth(request, env) {
    const cookie = request.headers.get('Cookie');
    const sessionId = cookie?.match(/session=([^;]+)/)?.[1];

    if (!sessionId) {
        return new Response(JSON.stringify({ authenticated: false }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const session = await env.SESSIONS.get(sessionId, 'json');

    if (!session || session.expires < Date.now()) {
        return new Response(JSON.stringify({ authenticated: false }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const decoded = jwt.verify(session.token, env.JWT_SECRET);
        return new Response(JSON.stringify({
            authenticated: true,
            user: {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ authenticated: false }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}