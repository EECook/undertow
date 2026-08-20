const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAdmin } = require('../middleware/auth');

// Public: all sections, in order (Server Rules, Discord, Minecraft, Lore, ...)
router.get('/', async (req, res) => {
  const [rows] = await pool.query(`SELECT * FROM rules_sections ORDER BY sort_order ASC`);
  res.json(rows);
});

router.get('/:key', async (req, res) => {
  const [[section]] = await pool.query(`SELECT * FROM rules_sections WHERE section_key = ?`, [
    req.params.key,
  ]);
  if (!section) return res.status(404).json({ error: 'Section not found' });
  res.json(section);
});

// Admin: edit a section's content, or add a new one
router.put('/:key', requireAdmin, async (req, res) => {
  const { title, content, sort_order } = req.body;
  await pool.query(
    `INSERT INTO rules_sections (section_key, title, content, sort_order)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content), sort_order = VALUES(sort_order)`,
    [req.params.key, title, content, sort_order || 0]
  );
  res.json({ ok: true });
});

module.exports = router;
