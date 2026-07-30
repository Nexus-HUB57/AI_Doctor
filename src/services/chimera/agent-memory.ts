/** CHIMERA Long-Term Agent Memory — Ported to AI_Doctor */

export type MemoryType = 'episodic' | 'semantic' | 'working' | 'procedural';

export interface MemoryEntry {
  id: string; agentId: string; type: MemoryType; content: string;
  metadata: Record<string, unknown>; importance: number; accessCount: number;
  createdAt: number; lastAccessedAt: number; expiresAt: number | null;
}

export interface AgentMemoryOptions {
  maxPerAgent?: number; workingTtlMs?: number; episodicTtlMs?: number;
  semanticTtlMs?: number; proceduralTtlMs?: number;
}

export interface RecallOptions { type?: MemoryType; query?: string; limit?: number; minImportance?: number; }

export interface MemoryStats { total: number; byType: Record<MemoryType, number>; avgImportance: number; }

function generateRandomSuffix(): string { return Math.random().toString(36).substring(2, 10); }

export class AgentMemory {
  private memories: Map<string, MemoryEntry[]>;
  private maxPerAgent: number;
  private workingTtlMs: number; private episodicTtlMs: number;
  private semanticTtlMs: number; private proceduralTtlMs: number;

  constructor(opts: AgentMemoryOptions = {}) {
    this.memories = new Map();
    this.maxPerAgent = opts.maxPerAgent ?? 1000;
    this.workingTtlMs = opts.workingTtlMs ?? 10 * 60 * 1000;
    this.episodicTtlMs = opts.episodicTtlMs ?? 24 * 60 * 60 * 1000;
    this.semanticTtlMs = opts.semanticTtlMs ?? 30 * 24 * 60 * 60 * 1000;
    this.proceduralTtlMs = opts.proceduralTtlMs ?? 90 * 24 * 60 * 60 * 1000;
  }

  private getTtlForType(type: MemoryType): number {
    switch (type) {
      case 'working': return this.workingTtlMs;
      case 'episodic': return this.episodicTtlMs;
      case 'semantic': return this.semanticTtlMs;
      case 'procedural': return this.proceduralTtlMs;
    }
  }

  private getOrCreateAgentEntries(agentId: string): MemoryEntry[] {
    let entries = this.memories.get(agentId);
    if (!entries) { entries = []; this.memories.set(agentId, entries); }
    return entries;
  }

  store(agentId: string, type: MemoryType, content: string, metadata: Record<string, unknown> = {}, importance = 0.5): MemoryEntry {
    const entry: MemoryEntry = {
      id: `mem_${Date.now()}_${generateRandomSuffix()}`, agentId, type, content,
      metadata, importance: Math.max(0, Math.min(1, importance)),
      accessCount: 0, createdAt: Date.now(), lastAccessedAt: Date.now(),
      expiresAt: Date.now() + this.getTtlForType(type),
    };
    const entries = this.getOrCreateAgentEntries(agentId);
    entries.push(entry);
    if (entries.length > this.maxPerAgent) this.evictLowestImportance(agentId);
    return entry;
  }

  recall(agentId: string, opts: RecallOptions = {}): MemoryEntry[] {
    const entries = this.getOrCreateAgentEntries(agentId);
    this.pruneExpired(agentId);
    let results = entries.filter(e => !this.isExpired(e));
    if (opts.type) results = results.filter(e => e.type === opts.type);
    if (opts.minImportance !== undefined) results = results.filter(e => e.importance >= opts.minImportance!);
    if (opts.query) {
      const queryLower = opts.query.toLowerCase();
      const queryWords = new Set(queryLower.split(/\s+/).filter(w => w.length > 1));
      results = results.map(e => {
        const contentLower = e.content.toLowerCase();
        let score = 0;
        for (const w of queryWords) { if (contentLower.includes(w)) score++; }
        return { entry: e, score };
      }).filter(r => r.score > 0).sort((a, b) => b.score - a.score).map(r => r.entry);
    } else {
      results.sort((a, b) => b.importance - a.importance || b.lastAccessedAt - a.lastAccessedAt);
    }
    for (const e of results) { e.accessCount++; e.lastAccessedAt = Date.now(); }
    return opts.limit ? results.slice(0, opts.limit) : results;
  }

  forget(agentId: string, memoryId: string): boolean {
    const entries = this.memories.get(agentId);
    if (!entries) return false;
    const idx = entries.findIndex(e => e.id === memoryId);
    if (idx === -1) return false;
    entries.splice(idx, 1); return true;
  }

  forgetAll(agentId: string): number {
    const entries = this.memories.get(agentId);
    if (!entries) return 0;
    const count = entries.length; this.memories.delete(agentId); return count;
  }

  getStats(agentId?: string): MemoryStats {
    let allEntries: MemoryEntry[] = [];
    if (agentId) { allEntries = this.getOrCreateAgentEntries(agentId); }
    else { for (const entries of this.memories.values()) allEntries.push(...entries); }
    allEntries = allEntries.filter(e => !this.isExpired(e));
    const byType: Record<MemoryType, number> = { episodic: 0, semantic: 0, working: 0, procedural: 0 };
    let totalImportance = 0;
    for (const e of allEntries) { byType[e.type]++; totalImportance += e.importance; }
    return { total: allEntries.length, byType, avgImportance: allEntries.length > 0 ? totalImportance / allEntries.length : 0 };
  }

  consolidate(agentId: string): number {
    const entries = this.memories.get(agentId);
    if (!entries) return 0;
    let pruned = this.pruneExpired(agentId);
    if (entries.length > this.maxPerAgent) {
      pruned += this.evictLowestImportance(agentId);
    }
    return pruned;
  }

  private isExpired(entry: MemoryEntry): boolean { return entry.expiresAt !== null && Date.now() > entry.expiresAt; }

  private pruneExpired(agentId: string): number {
    const entries = this.memories.get(agentId);
    if (!entries) return 0;
    const before = entries.length;
    const filtered = entries.filter(e => !this.isExpired(e));
    entries.length = 0; entries.push(...filtered);
    return before - filtered.length;
  }

  private evictLowestImportance(agentId: string): number {
    const entries = this.memories.get(agentId);
    if (!entries || entries.length <= this.maxPerAgent) return 0;
    entries.sort((a, b) => a.importance - b.importance || a.accessCount - b.accessCount);
    const toRemove = entries.length - this.maxPerAgent;
    entries.splice(0, toRemove);
    return toRemove;
  }
}

export const agentMemory = new AgentMemory();
