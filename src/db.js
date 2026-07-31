require('dotenv').config();

if (process.env.DB_DRIVER === 'memory') {
  module.exports = require('./memory-db');
  return;
}

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS urls (
      id SERIAL PRIMARY KEY,
      short_code VARCHAR(12) UNIQUE NOT NULL,
      long_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

async function createUrl(shortCode, longUrl) {
  const { rows } = await pool.query(
    'INSERT INTO urls (short_code, long_url) VALUES ($1, $2) RETURNING short_code, long_url, created_at',
    [shortCode, longUrl]
  );
  return rows[0];
}

async function getUrl(shortCode) {
  const { rows } = await pool.query(
    'SELECT long_url FROM urls WHERE short_code = $1',
    [shortCode]
  );
  return rows[0] || null;
}

async function codeExists(shortCode) {
  const { rows } = await pool.query(
    'SELECT 1 FROM urls WHERE short_code = $1',
    [shortCode]
  );
  return rows.length > 0;
}

module.exports = { pool, init, createUrl, getUrl, codeExists };
