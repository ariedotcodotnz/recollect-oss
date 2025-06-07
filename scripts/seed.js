#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🌱 Seeding Recollect database...\n');

// Sample data for testing
const seedSQL = `
-- Insert sample collections
INSERT INTO collections (slug, title, description, is_public, created_by) VALUES
  ('historical-photos', 'Historical Photographs', 'A collection of historical photographs from our archives', 1, 1),
  ('manuscripts', 'Manuscripts & Documents', 'Rare manuscripts and historical documents', 1, 1),
  ('audio-archives', 'Audio Archives', 'Historical audio recordings and oral histories', 1, 1);

-- Insert sample items
INSERT INTO items (collection_id, title, description, item_type, media_url, thumbnail_url, is_public, created_by) VALUES
  (1, 'City Hall Opening Ceremony 1920', 'Black and white photograph of the city hall opening ceremony', 'image', '/media/sample-1.jpg', '/media/sample-1-thumb.jpg', 1, 1),
  (1, 'Main Street 1935', 'Aerial view of Main Street during the 1930s', 'image', '/media/sample-2.jpg', '/media/sample-2-thumb.jpg', 1, 1),
  (2, 'Charter Document', 'Original city charter from 1850', 'document', '/media/charter.pdf', '/media/charter-thumb.jpg', 1, 1),
  (3, 'Mayor Speech 1965', 'Audio recording of mayor inaugural speech', 'audio', '/media/speech.mp3', '/media/audio-thumb.png', 1, 1);

-- Insert sample tags
INSERT INTO tags (name, slug) VALUES
  ('Architecture', 'architecture'),
  ('Government', 'government'),
  ('1920s', '1920s'),
  ('Black and White', 'black-and-white');

-- Link tags to items
INSERT INTO item_tags (item_id, tag_id) VALUES
  (1, 1), (1, 2), (1, 3), (1, 4),
  (2, 1), (2, 4),
  (3, 2);

-- Insert sample metadata values
INSERT INTO item_metadata (item_id, field_id, value) VALUES
  (1, 1, 'Unknown Photographer'),
  (1, 2, '1920-06-15'),
  (1, 3, 'City Hall, Downtown'),
  (2, 1, 'John Smith Photography'),
  (2, 2, '1935-08-22'),
  (2, 3, 'Main Street'),
  (3, 1, 'City Clerk Office'),
  (3, 2, '1850-01-01'),
  (4, 1, 'City Archives'),
  (4, 2, '1965-01-20');

-- Update FTS index for sample items
INSERT INTO items_fts (rowid, title, description, content) VALUES
  (1, 'City Hall Opening Ceremony 1920', 'Black and white photograph of the city hall opening ceremony', 'historical architecture government building ceremony 1920s'),
  (2, 'Main Street 1935', 'Aerial view of Main Street during the 1930s', 'street urban aerial photography 1930s downtown'),
  (3, 'Charter Document', 'Original city charter from 1850', 'legal document charter founding government historical'),
  (4, 'Mayor Speech 1965', 'Audio recording of mayor inaugural speech', 'speech audio government mayor political 1960s');
`;

// Create a temporary SQL file
const fs = require('fs');
const path = require('path');
const tempFile = path.join(__dirname, 'temp-seed.sql');

fs.writeFileSync(tempFile, seedSQL);

try {
    // Execute the seed SQL
    console.log('📝 Creating sample collections...');
    execSync(`npx wrangler d1 execute recollect-db --file=${tempFile}`, { stdio: 'inherit' });

    console.log('\n✅ Database seeded successfully!');
    console.log('\nSample data created:');
    console.log('- 3 collections');
    console.log('- 4 items');
    console.log('- 4 tags');
    console.log('- Sample metadata');

    console.log('\n📌 Note: Before seeding, make sure you have:');
    console.log('1. Created the database with "npx wrangler d1 create recollect-db"');
    console.log('2. Run migrations with "npm run db:migrate"');
    console.log('3. Created an admin user via the /admin/setup page');

} catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.log('\nMake sure the database exists and migrations have been run.');
} finally {
    // Clean up temp file
    if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
    }
}