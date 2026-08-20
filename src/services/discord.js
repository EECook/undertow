// Talks to Discord's API for two separate purposes:
//  1. OAuth (using the person's own access token) — confirms who they are.
//  2. Bot lookup (using DISCORD_BOT_TOKEN) — reads their roles in your
//     specific server, since Discord's OAuth scopes alone don't reliably
//     hand back guild roles. The bot must be a member of your Undertow
//     Discord server with permission to view members.

const DISCORD_API = 'https://discord.com/api/v10';

function getOAuthURL(state) {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify',
    state,
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
  });

  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Discord token exchange failed: ${res.status} ${await res.text()}`);
  return res.json(); // { access_token, ... }
}

async function fetchDiscordIdentity(accessToken) {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Discord identity fetch failed: ${res.status}`);
  return res.json(); // { id, username, avatar, ... }
}

// Uses the BOT token, not the user's — this is what lets us see their
// roles in your specific server without needing extra OAuth scopes.
async function fetchGuildMember(discordUserId) {
  const guildId = process.env.DISCORD_GUILD_ID;
  const res = await fetch(`${DISCORD_API}/guilds/${guildId}/members/${discordUserId}`, {
    headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
  });
  if (res.status === 404) return null; // not a member of the server
  if (!res.ok) throw new Error(`Discord guild member fetch failed: ${res.status} ${await res.text()}`);
  return res.json(); // { roles: [roleId, ...], nick, ... }
}

// DISCORD_ROLE_MAP is a JSON object env var: { "discordRoleId": "admin", ... }
// A member can hold several mapped roles — the highest tier wins.
const ROLE_RANK = { resident: 0, moderator: 1, admin: 2 };

function resolveAppRole(memberRoleIds) {
  let roleMap = {};
  try {
    roleMap = JSON.parse(process.env.DISCORD_ROLE_MAP || '{}');
  } catch {
    console.error('[discord] DISCORD_ROLE_MAP is not valid JSON — defaulting everyone to resident');
  }

  let best = 'resident';
  for (const discordRoleId of memberRoleIds || []) {
    const mapped = roleMap[discordRoleId];
    if (mapped && ROLE_RANK[mapped] > ROLE_RANK[best]) best = mapped;
  }
  return best;
}

function avatarUrl(discordUser) {
  if (!discordUser.avatar) return null;
  const ext = discordUser.avatar.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.${ext}`;
}

module.exports = {
  getOAuthURL,
  exchangeCodeForToken,
  fetchDiscordIdentity,
  fetchGuildMember,
  resolveAppRole,
  avatarUrl,
  ROLE_RANK,
};
