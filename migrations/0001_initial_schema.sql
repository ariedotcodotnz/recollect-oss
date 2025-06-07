-- Users table (admin only)
CREATE TABLE IF NOT EXISTS users (
                                     id INTEGER PRIMARY KEY AUTOINCREMENT,
                                     email TEXT UNIQUE NOT NULL,
                                     password_hash TEXT NOT NULL,
                                     name TEXT NOT NULL,
                                     role TEXT DEFAULT 'admin',
                                     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
                                           id INTEGER PRIMARY KEY AUTOINCREMENT,
                                           slug TEXT UNIQUE NOT NULL,
                                           title TEXT NOT NULL,
                                           description TEXT,
                                           thumbnail_url TEXT,
                                           metadata JSON,
                                           is_public BOOLEAN DEFAULT 1,
                                           created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

-- Items table
CREATE TABLE IF NOT EXISTS items (
                                     id INTEGER PRIMARY KEY AUTOINCREMENT,
                                     collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    item_type TEXT NOT NULL, -- image, document, audio, video, 3d
    media_url TEXT,
    thumbnail_url TEXT,
    metadata JSON,
    rights_statement TEXT,
    is_public BOOLEAN DEFAULT 1,
    view_count INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                    name TEXT UNIQUE NOT NULL,
                                    slug TEXT UNIQUE NOT NULL
);

-- Item tags junction table
CREATE TABLE IF NOT EXISTS item_tags (
                                         item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (item_id, tag_id)
    );

-- Metadata fields table (for faceted search)
CREATE TABLE IF NOT EXISTS metadata_fields (
                                               id INTEGER PRIMARY KEY AUTOINCREMENT,
                                               name TEXT NOT NULL,
                                               field_type TEXT NOT NULL, -- text, number, date, boolean
                                               is_facet BOOLEAN DEFAULT 0,
                                               is_searchable BOOLEAN DEFAULT 1,
                                               display_order INTEGER DEFAULT 0
);

-- Item metadata values
CREATE TABLE IF NOT EXISTS item_metadata (
                                             id INTEGER PRIMARY KEY AUTOINCREMENT,
                                             item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    field_id INTEGER REFERENCES metadata_fields(id),
    value TEXT,
    INDEX idx_item_field (item_id, field_id)
    );

-- Full-text search virtual table
CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
  title,
  description,
  content,
  content_rowid=id
);

-- Indexes for performance
CREATE INDEX idx_collections_slug ON collections(slug);
CREATE INDEX idx_items_collection ON items(collection_id);
CREATE INDEX idx_items_type ON items(item_type);
CREATE INDEX idx_items_public ON items(is_public);
CREATE INDEX idx_metadata_item ON item_metadata(item_id);
CREATE INDEX idx_metadata_field ON item_metadata(field_id);

-- Triggers to update timestamps
CREATE TRIGGER update_collections_timestamp
    AFTER UPDATE ON collections
BEGIN
    UPDATE collections SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_items_timestamp
    AFTER UPDATE ON items
BEGIN
    UPDATE items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Triggers to maintain FTS index
CREATE TRIGGER items_fts_insert
    AFTER INSERT ON items
BEGIN
    INSERT INTO items_fts (rowid, title, description)
    VALUES (NEW.id, NEW.title, NEW.description);
END;

CREATE TRIGGER items_fts_update
    AFTER UPDATE ON items
BEGIN
    UPDATE items_fts
    SET title = NEW.title, description = NEW.description
    WHERE rowid = NEW.id;
END;

CREATE TRIGGER items_fts_delete
    AFTER DELETE ON items
BEGIN
    DELETE FROM items_fts WHERE rowid = OLD.id;
END;

-- Insert default metadata fields
INSERT INTO metadata_fields (name, field_type, is_facet, display_order) VALUES
                                                                            ('creator', 'text', 1, 1),
                                                                            ('date', 'date', 1, 2),
                                                                            ('location', 'text', 1, 3),
                                                                            ('subject', 'text', 1, 4),
                                                                            ('format', 'text', 1, 5),
                                                                            ('language', 'text', 1, 6),
                                                                            ('source', 'text', 0, 7),
                                                                            ('identifier', 'text', 0, 8);