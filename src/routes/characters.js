const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { upload } = require('../middleware/upload');

// List public character sheets (for a browsable "residents of the town" page)
router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT cs.*, u.display_name AS player_name
     FROM character_sheets cs JOIN users u ON u.id = cs.user_id
     WHERE cs.is_public = TRUE ORDER BY cs.created_at DESC`
  );
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const [[sheet]] = await pool.query(`SELECT * FROM character_sheets WHERE id = ?`, [req.params.id]);
  if (!sheet) return res.status(404).json({ error: 'Character sheet not found' });
  res.json(sheet);
});

router.post('/', async (req, res) => {
  const { user_id, character_name, occupation, backstory, traits, is_public } = req.body;
  const [result] = await pool.query(
    `INSERT INTO character_sheets (user_id, character_name, occupation, backstory, traits, is_public)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [user_id, character_name, occupation, backstory, traits, is_public ?? true]
  );
  res.status(201).json({ id: result.insertId });
});

router.patch('/:id', async (req, res) => {
  const { character_name, occupation, backstory, traits, status, is_public } = req.body;
  await pool.query(
    `UPDATE character_sheets SET character_name = ?, occupation = ?, backstory = ?, traits = ?, status = ?, is_public = ?
     WHERE id = ?`,
    [character_name, occupation, backstory, traits, status, is_public, req.params.id]
  );
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await pool.query(`DELETE FROM character_sheets WHERE id = ?`, [req.params.id]);
  res.json({ ok: true });
});

router.post('/:id/portrait', upload.single('portrait'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const portraitUrl = `/uploads/${req.file.filename}`;
  await pool.query(`UPDATE character_sheets SET portrait_url = ? WHERE id = ?`, [
    portraitUrl,
    req.params.id,
  ]);
  res.json({ portrait_url: portraitUrl });
});

module.exports = router;
