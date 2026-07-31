class MemoryStore {
  constructor(windowMs) {
    this.windowMs = windowMs;
    this.hits = new Map();
    this.resetTime = new Date(Date.now() + windowMs);

    const interval = setInterval(() => {
      this.resetAll();
    }, windowMs);

    if (interval.unref) {
      interval.unref();
    }
  }

  async increment(key) {
    const current = this.hits.get(key) || 0;
    const next = current + 1;
    this.hits.set(key, next);
    return {
      totalHits: next,
      resetTime: this.resetTime,
    };
  }

  async decrement(key) {
    const current = this.hits.get(key) || 0;
    if (current > 0) {
      this.hits.set(key, current - 1);
    }
  }

  async resetKey(key) {
    this.hits.delete(key);
  }

  async resetAll() {
    this.hits.clear();
    this.resetTime = new Date(Date.now() + this.windowMs);
  }
}

module.exports = MemoryStore;
