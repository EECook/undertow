const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const discord = require('../services/discord');

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 12 * 60 * 60 * 1000, // 12h, matches token expiry below
};

// Step 1: send them to Discord to log in / authorize.
// `state` is a throwaway random value stored in its own short-lived cookie,
// then checked against what Discord sends back — standard CSRF protection
// for OAuth redirects.
router.get('/discord/login', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('undertow_oauth_state', state, { httpOnly: true, maxAge: 5 * 60 * 1000, sameSite: 'lax' });
  res.redirect(discord.getOAuthURL(state));
});

// Step 2: Discord redirects back here with a code (and our state echoed back).
router.get('/discord/callback', asyncHandler(async (req, res) => {
  const { code, state } = req.query;
  const expectedState = req.cookies && req.cookies.undertow_oauth_state;

  if (!code || !state || state !== expectedState) {
    return res.status(400).send('Login failed: invalid or expired state. Please try logging in again.');
  }
  res.clearCookie('undertow_oauth_state');

  // Identify who they are
  const tokenData = await discord.exchangeCodeForToken(code);
  const discordUser = await discord.fetchDiscordIdentity(tokenData.access_token);

  // Look up their roles in YOUR server via the bot, to decide their tier.
  // If they're not in the server, they still get an account, just at the
  // base 'resident' tier — adjust here if residency should require membership.
  const member = await discord.fetchGuildMember(discordUser.id);
  const appRole = discord.resolveAppRole(member ? member.roles : []);
  const avatarUrl = discord.avatarUrl(discordUser);

  // Temporary diagnostic logging — remove once role resolution is confirmed
  // working. Safe to leave in short-term: no secrets, just IDs.
  console.log('[discord] login attempt for', discordUser.username, discordUser.id);
  console.log('[discord] guild member found:', !!member);
  console.log('[discord] their Discord role IDs:', member ? member.roles : '(not a guild member)');
  console.log('[discord] raw DISCORD_ROLE_MAP env var:', process.env.DISCORD_ROLE_MAP);
  console.log('[discord] resolved app role:', appRole);

  // Upsert into users — first login creates the account, later logins just
  // refresh username/avatar/role in case any of those changed on Discord's side.
  const [existingRows] = await pool.query(`SELECT id FROM users WHERE discord_id = ?`, [discordUser.id]);

  let userId;
  if (existingRows.length) {
    userId = existingRows[0].id;
    await pool.query(
      `UPDATE users SET discord_username = ?, avatar_url = COALESCE(?, avatar_url), role = ? WHERE id = ?`,
      [discordUser.username, avatarUrl, appRole, userId]
    );
  } else {
    const [result] = await pool.query(
      `INSERT INTO users (discord_id, discord_username, display_name, avatar_url, role)
       VALUES (?, ?, ?, ?, ?)`,
      [discordUser.id, discordUser.username, discordUser.username, avatarUrl, appRole]
    );
    userId = result.insertId;
  }

  const sessionToken = jwt.sign(
    { id: userId, discord_id: discordUser.id, discord_username: discordUser.username, role: appRole },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );
  res.cookie('undertow_session', sessionToken, COOKIE_OPTS);

  // Back to the site. Adjust this path if you want a dedicated "welcome" page.
  res.redirect('/');
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const [[user]] = await pool.query(
    `SELECT id, discord_id, discord_username, minecraft_username, display_name, bio, avatar_url, role
     FROM users WHERE id = ?`,
    [req.user.id]
  );
  if (!user) return res.status(404).json({ error: 'Account not found' });
  res.json(user);
}));

router.post('/logout', (req, res) => {
  res.clearCookie('undertow_session');
  res.json({ ok: true });
});

module.exports = router;
