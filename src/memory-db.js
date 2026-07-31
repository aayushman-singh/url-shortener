const store = new Map();

const pool = {
  query: async () => ({ rows: [] }),
  end: async () => {},
};

async function init() {
  // no schema needed, Map is the store
}

async function createUrl(shortCode, longUrl) {
  const record = {
    short_code: shortCode,
    long_url: longUrl,
    created_at: new Date().toISOString(),
  };
  store.set(shortCode, record);
  return record;
}

async function getUrl(shortCode) {
  const record = store.get(shortCode);
  return record ? { long_url: record.long_url } : null;
}

async function codeExists(shortCode) {
  return store.has(shortCode);
}

module.exports = { pool, init, createUrl, getUrl, codeExists };
