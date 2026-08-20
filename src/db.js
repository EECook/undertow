const mysql = require('mysql2/promise');

// Connection pool — reads credentials from environment variables only.
// Locally these come from a .env file (via dotenv, loaded in index.js);
// on Railway they come from the project's Variables tab.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

async function testConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
    console.log('[db] Connected to', process.env.DB_NAME, 'at', process.env.DB_HOST);
  } finally {
    conn.release();
  }
}

module.exports = { pool, testConnection };
