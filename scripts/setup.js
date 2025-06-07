#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

console.log('🚀 Welcome to Recollect OSS Setup!\n');
console.log('This script will help you set up your Recollect instance.\n');

async function setup() {
    try {
        // Check if wrangler is installed
        try {
            execSync('npx wrangler --version', { stdio: 'ignore' });
        } catch {
            console.error('❌ Wrangler CLI not found. Please install it first:');
            console.log('   npm install -g wrangler');
            process.exit(1);
        }

        // Check if logged in to Cloudflare
        console.log('📡 Checking Cloudflare authentication...');
        try {
            execSync('npx wrangler whoami', { stdio: 'ignore' });
            console.log('✓ Authenticated with Cloudflare\n');
        } catch {
            console.log('⚠️  Not logged in to Cloudflare');
            console.log('Running: npx wrangler login\n');
            execSync('npx wrangler login', { stdio: 'inherit' });
        }

        // Get configuration values
        console.log('\n📝 Configuration\n');

        const siteName = await question('Site name (My Digital Collection): ') || 'My Digital Collection';
        const siteUrl = await question('Site URL (https://collections.example.com): ') || 'https://collections.example.com';
        const adminEmail = await question('Admin email: ');

        if (!adminEmail) {
            console.error('❌ Admin email is required');
            process.exit(1);
        }

        // Generate JWT secret
        const jwtSecret = require('crypto').randomBytes(32).toString('hex');
        console.log('\n✓ Generated secure JWT secret');

        // Update wrangler.toml
        console.log('\n📄 Updating wrangler.toml...');
        let wranglerContent = fs.readFileSync('wrangler.toml', 'utf8');

        wranglerContent = wranglerContent
            .replace('SITE_NAME = "My Digital Collection"', `SITE_NAME = "${siteName}"`)
            .replace('SITE_URL = "https://collections.example.com"', `SITE_URL = "${siteUrl}"`)
            .replace('ADMIN_EMAIL = "admin@example.com"', `ADMIN_EMAIL = "${adminEmail}"`)
            .replace('JWT_SECRET = "change-this-secret-key"', `JWT_SECRET = "${jwtSecret}"`);

        fs.writeFileSync('wrangler.toml', wranglerContent);
        console.log('✓ Updated configuration');

        // Create D1 database
        console.log('\n🗄️  Creating D1 database...');
        try {
            const dbOutput = execSync('npx wrangler d1 create recollect-db', { encoding: 'utf8' });

            // Extract database ID from output
            const dbIdMatch = dbOutput.match(/database_id = "([^"]+)"/);
            if (dbIdMatch) {
                const dbId = dbIdMatch[1];

                // Update wrangler.toml with database ID
                wranglerContent = fs.readFileSync('wrangler.toml', 'utf8');
                wranglerContent = wranglerContent.replace('database_id = "DATABASE_ID"', `database_id = "${dbId}"`);
                fs.writeFileSync('wrangler.toml', wranglerContent);

                console.log('✓ Created D1 database:', dbId);
            }
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('✓ Database already exists');
            } else {
                throw error;
            }
        }

        // Create R2 bucket
        console.log('\n📦 Creating R2 bucket...');
        try {
            execSync('npx wrangler r2 bucket create recollect-media', { stdio: 'inherit' });
            console.log('✓ Created R2 bucket');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('✓ R2 bucket already exists');
            } else {
                throw error;
            }
        }

        // Create KV namespace
        console.log('\n🔑 Creating KV namespace...');
        try {
            const kvOutput = execSync('npx wrangler kv:namespace create SESSIONS', { encoding: 'utf8' });

            // Extract namespace ID from output
            const kvIdMatch = kvOutput.match(/id = "([^"]+)"/);
            if (kvIdMatch) {
                const kvId = kvIdMatch[1];

                // Update wrangler.toml with KV ID
                wranglerContent = fs.readFileSync('wrangler.toml', 'utf8');
                wranglerContent = wranglerContent.replace('id = "SESSIONS_KV_ID"', `id = "${kvId}"`);
                fs.writeFileSync('wrangler.toml', wranglerContent);

                console.log('✓ Created KV namespace:', kvId);
            }
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('✓ KV namespace already exists');
            } else {
                throw error;
            }
        }

        // Run database migrations
        console.log('\n🏗️  Running database migrations...');
        execSync('npx wrangler d1 migrations apply recollect-db', { stdio: 'inherit' });
        console.log('✓ Database schema created');

        // Build the project
        console.log('\n🔨 Building project...');
        execSync('npm run build', { stdio: 'inherit' });

        // Final instructions
        console.log('\n✅ Setup complete!\n');
        console.log('Next steps:');
        console.log('1. Run "npm run dev" to start the development server');
        console.log('2. Visit http://localhost:8787/admin/setup to create your admin account');
        console.log('3. (Optional) Run "npm run db:seed" to add sample data');
        console.log('4. When ready, run "npm run deploy" to deploy to Cloudflare\n');

        const startDev = await question('Start development server now? (Y/n): ');
        if (!startDev || startDev.toLowerCase() === 'y') {
            console.log('\n🚀 Starting development server...\n');
            execSync('npm run dev', { stdio: 'inherit' });
        }

    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Run setup
setup();