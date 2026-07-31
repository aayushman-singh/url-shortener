process.env.DB_DRIVER = 'memory';
process.env.RATE_LIMIT_MAX = '1';
process.env.RATE_LIMIT_WINDOW_MS = '60000';

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

const { app } = require('../src/index');
const { resetRateLimit } = require('../src/routes');
const db = require('../src/db');

describe('url shortener', () => {
  before(async () => {
    await db.init();
  });

  beforeEach(async () => {
    await resetRateLimit();
  });

  after(async () => {
    await db.pool.end();
  });

  it('shortens a valid URL and redirects to it', async () => {
    const longUrl = 'https://example.com/some/path';
    const createRes = await request(app)
      .post('/shorten')
      .send({ url: longUrl })
      .expect(201);

    assert.ok(createRes.body.shortCode);
    assert.strictEqual(createRes.body.longUrl, longUrl);
    assert.ok(createRes.body.shortUrl.endsWith(`/${createRes.body.shortCode}`));

    await request(app)
      .get(`/${createRes.body.shortCode}`)
      .expect(302)
      .expect('Location', longUrl);
  });

  it('returns 400 for missing url', async () => {
    await request(app).post('/shorten').send({}).expect(400);
  });

  it('returns 400 for invalid url', async () => {
    await request(app)
      .post('/shorten')
      .send({ url: 'not-a-url' })
      .expect(400);
  });

  it('returns 404 for unknown short code', async () => {
    await request(app).get('/unknown1').expect(404);
  });

  it('rate limits repeated shorten requests', async () => {
    await request(app)
      .post('/shorten')
      .send({ url: 'https://example.com/one' })
      .expect(201);

    await request(app)
      .post('/shorten')
      .send({ url: 'https://example.com/two' })
      .expect(429);
  });
});
