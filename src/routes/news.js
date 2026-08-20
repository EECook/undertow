const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { upload } = require('../middleware/upload');
const { requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Public: published posts only
router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT n.id, n.title, n.slug, n.cover_image_url, n.published_at, u.display_name AS author_name
     FROM news_posts n LEFT JOIN users u ON u.id = n.author_id
     WHERE n.is_published = TRUE ORDER BY n.published_at DESC`
  );
  res.json(rows);
}));

router.get('/:slug', asyncHandler(async (req, res) => {
  const [[post]] = await pool.query(
    `SELECT n.*, u.display_name AS author_name FROM news_posts n
     LEFT JOIN users u ON u.id = n.author_id WHERE n.slug = ? AND n.is_published = TRUE`,
    [req.params.slug]
  );
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
}));

// Admin: create/publish a post, with optional cover image
router.post('/', requireAdmin, upload.single('cover'), asyncHandler(async (req, res) => {
  const { title, body, is_published } = req.body;
  const slug = slugify(title);
  const coverUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const [result] = await pool.query(
    `INSERT INTO news_posts (author_id, title, slug, body, cover_image_url, is_published, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user.id || null,
      title,
      slug,
      body,
      coverUrl,
      !!is_published,
      is_published ? new Date() : null,
    ]
  );
  res.status(201).json({ id: result.insertId, slug });
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  await pool.query(`DELETE FROM news_posts WHERE id = ?`, [req.params.id]);
  res.json({ ok: true });
}));

module.exports = router;
