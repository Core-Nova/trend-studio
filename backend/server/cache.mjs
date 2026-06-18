/**
 * Minimal in-memory TTL cache. Avoids a dependency on node-cache / redis
 * for simple short-lived proxy results.
 */
export class Cache {
  #store = new Map()

  /** Returns the cached value, or undefined if missing/expired. */
  get(key) {
    const entry = this.#store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.#store.delete(key)
      return undefined
    }
    return entry.value
  }

  /** Stores a value with a TTL in milliseconds. */
  set(key, value, ttlMs) {
    this.#store.set(key, { value, expiresAt: Date.now() + ttlMs })
  }

  /** Removes a specific key. */
  del(key) {
    this.#store.delete(key)
  }

  /** Returns basic stats for the metrics endpoint. */
  stats() {
    const now = Date.now()
    let alive = 0
    for (const entry of this.#store.values()) {
      if (now <= entry.expiresAt) alive++
    }
    return { total: this.#store.size, alive }
  }
}

export const cache = new Cache()
