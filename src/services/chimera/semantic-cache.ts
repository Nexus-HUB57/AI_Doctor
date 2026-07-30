/**
 * CHIMERA Semantic Cache — Ported to AI_Doctor
 * SHA-256 based LRU cache for LLM responses. Zero external deps (uses Web Crypto API).
 */

export interface CacheEntry {
  id: string; inputHash: string; inputText: string; response: string;
  model: string; tokensUsed: number; costUsd: number;
  createdAt: number; hitCount: number; lastHitAt: number | null;
}

export interface SemanticCacheStats { size: number; maxSize: number; hitRate: number; missCount: number; hitCount: number; }

export interface SemanticCacheOptions { maxSize?: number; ttlMs?: number; similarityThreshold?: number; }

async function sha256(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback: simple hash for environments without crypto.subtle
  let hash = 0;
  for (let i = 0; i < text.length; i++) { const c = text.charCodeAt(i); hash = ((hash << 5) - hash + c) | 0; }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

export class SemanticCache {
  private cache: Map<string, CacheEntry>;
  private maxSize: number; private ttlMs: number; private similarityThreshold: number;
  private _hitCount: number = 0; private _missCount: number = 0;

  constructor(opts?: SemanticCacheOptions) {
    this.maxSize = opts?.maxSize ?? 500; this.ttlMs = opts?.ttlMs ?? 3600000;
    this.similarityThreshold = opts?.similarityThreshold ?? 0.92; this.cache = new Map();
  }

  async get(input: string, model?: string): Promise<CacheEntry | null> {
    const hash = await this.hashInput(input); const entry = this.cache.get(hash);
    if (!entry) { this._missCount++; return null; }
    if (model !== undefined && entry.model !== model) { this._missCount++; return null; }
    const now = Date.now();
    if (now - entry.createdAt > this.ttlMs) { this.cache.delete(hash); this._missCount++; return null; }
    entry.hitCount++; entry.lastHitAt = now; this._hitCount++;
    this.cache.delete(hash); this.cache.set(hash, entry);
    return entry;
  }

  async set(input: string, response: string, meta: { model: string; tokensUsed: number; costUsd: number }): Promise<CacheEntry> {
    const hash = await this.hashInput(input); const now = Date.now();
    if (this.cache.has(hash)) this.cache.delete(hash);
    if (this.cache.size >= this.maxSize) this.evictOldest();
    const entry: CacheEntry = {
      id: `sc_${hash.slice(0, 12)}`, inputHash: hash, inputText: input, response,
      model: meta.model, tokensUsed: meta.tokensUsed, costUsd: meta.costUsd,
      createdAt: now, hitCount: 0, lastHitAt: null,
    };
    this.cache.set(hash, entry); return entry;
  }

  private normalize(input: string): string { return input.toLowerCase().trim().replace(/\s+/g, ' '); }
  private async hashInput(input: string): Promise<string> { return sha256(this.normalize(input)); }

  invalidate(model?: string): number {
    if (!model) { const n = this.cache.size; this.cache.clear(); return n; }
    const toDelete: string[] = [];
    this.cache.forEach((entry, hash) => { if (entry.model === model) toDelete.push(hash); });
    for (const hash of toDelete) this.cache.delete(hash);
    return toDelete.length;
  }

  getStats(): SemanticCacheStats {
    const total = this._hitCount + this._missCount;
    return { size: this.cache.size, maxSize: this.maxSize,
      hitRate: total === 0 ? 0 : this._hitCount / total,
      missCount: this._missCount, hitCount: this._hitCount };
  }

  clear(): void { this.cache.clear(); this._hitCount = 0; this._missCount = 0; }

  private evictOldest(): void {
    let oldestKey: string | null = null; let oldestTime = Infinity;
    this.cache.forEach((entry, key) => { const time = entry.lastHitAt ?? entry.createdAt; if (time < oldestTime) { oldestTime = time; oldestKey = key; } });
    if (oldestKey !== null) this.cache.delete(oldestKey);
  }
}

export const semanticCache = new SemanticCache({ maxSize: 500, ttlMs: 3600000, similarityThreshold: 0.92 });
