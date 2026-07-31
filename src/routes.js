const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('./db');
const MemoryStore = require('./rate-limit-store');

const router = express.Router();

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const codeLength = 7;

function generateCode() {
  let code = '';
  for (let i = 0; i < codeLength; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

async function uniqueCode() {
  let code;
  do {
    code = generateCode();
  } while (await db.codeExists(code));
  return code;
}

function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
const rateLimitStore = new MemoryStore(windowMs);

const shortenLimiter = rateLimit({
  windowMs,
  max: Number(process.env.RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: rateLimitStore,
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests, slow down' });
  },
});

function resetRateLimit() {
  return rateLimitStore.resetAll();
}

router.post('/shorten', shortenLimiter, express.json(), async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url is required' });
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'url must be a valid http or https URL' });
  }

  const shortCode = await uniqueCode();
  const record = await db.createUrl(shortCode, url);

  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  res.status(201).json({
    shortCode: record.short_code,
    shortUrl: `${baseUrl}/${record.short_code}`,
    longUrl: record.long_url,
  });
});

router.get('/:shortCode', async (req, res) => {
  const record = await db.getUrl(req.params.shortCode);

  if (!record) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.redirect(302, record.long_url);
});

module.exports = { router, resetRateLimit };
