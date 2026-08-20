-- The Undertow — database schema
-- Run this once against your Hostinger MySQL database (via phpMyAdmin,
-- or `mysql -h <host> -u <user> -p <db> < schema.sql`).

-- ============ Residents / Player Profiles ============
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  discord_id VARCHAR(32) UNIQUE,
  discord_username VARCHAR(64),
  minecraft_username VARCHAR(32),
  minecraft_uuid VARCHAR(36),
  display_name VARCHAR(64),
  bio TEXT,
  avatar_url VARCHAR(512),
  role ENUM('resident', 'moderator', 'admin') NOT NULL DEFAULT 'resident',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============ Character Sheets ============
-- A user can hold more than one character sheet (server rules may cap it —
-- enforce that in the app layer, not here).
CREATE TABLE IF NOT EXISTS character_sheets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  character_name VARCHAR(64) NOT NULL,
  portrait_url VARCHAR(512),
  occupation VARCHAR(64),
  backstory TEXT,
  traits TEXT,               -- freeform, or JSON string of tags/quirks
  status ENUM('active', 'missing', 'deceased', 'retired') NOT NULL DEFAULT 'active',
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============ Gallery ============
CREATE TABLE IF NOT EXISTS gallery_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,                -- nullable: admin-uploaded images have no owner
  image_url VARCHAR(512) NOT NULL,
  caption VARCHAR(255),
  category ENUM('screenshot', 'character_portrait', 'event', 'other') DEFAULT 'other',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============ News Posts ============
CREATE TABLE IF NOT EXISTS news_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  author_id INT,
  title VARCHAR(160) NOT NULL,
  slug VARCHAR(180) UNIQUE NOT NULL,
  body TEXT NOT NULL,
  cover_image_url VARCHAR(512),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============ Rules & Guidelines ============
-- Sectioned so "Server Rules", "Discord", "Minecraft", "Lore" (from your
-- sidebar plan) can each be a row, ordered and editable independently.
CREATE TABLE IF NOT EXISTS rules_sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section_key VARCHAR(64) UNIQUE NOT NULL,   -- e.g. 'server-rules', 'discord', 'minecraft', 'lore'
  title VARCHAR(120) NOT NULL,
  content TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============ Stubs for the rest of the sidebar plan (not built yet) ============
CREATE TABLE IF NOT EXISTS whitelist_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  discord_username VARCHAR(64) NOT NULL,
  minecraft_username VARCHAR(32) NOT NULL,
  reason TEXT,
  status ENUM('pending', 'approved', 'denied') NOT NULL DEFAULT 'pending',
  reviewed_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS wallets (
  user_id INT PRIMARY KEY,
  balance INT NOT NULL DEFAULT 0,
  last_daily_redeem DATE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed a starting set of rules sections so the Rules page isn't empty on first load.
INSERT IGNORE INTO rules_sections (section_key, title, content, sort_order) VALUES
  ('server-rules', 'Server Rules', 'Rules go here.', 1),
  ('discord', 'Discord Guidelines', 'Discord-specific guidelines go here.', 2),
  ('minecraft', 'In-Game Guidelines', 'Minecraft-specific guidelines go here.', 3),
  ('lore', 'Lore & Setting', 'World lore and setting notes go here.', 4);
