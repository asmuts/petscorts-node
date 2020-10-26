const NodeCache = require("node-cache");

// This is a simple wrapper around NodeCache
// I might want to change the implementation later.

class Cache {
  //myCache = null;

  constructor(stdTTL, checkperiod, maxKeys) {
    this.myCache = new NodeCache({
      stdTTL: stdTTL,
      checkperiod: checkperiod,
      maxKeys: maxKeys,
    });
  }

  has(key) {
    return this.myCache.has(key);
  }

  put(key, value) {
    this.myCache.set(key, value);
  }

  get(key) {
    return this.myCache.get(key);
  }

  flush() {
    this.myCache.flushAll();
  }
}

module.exports = Cache;
