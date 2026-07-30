/** CHIMERA Agent Message Bus — Ported to AI_Doctor
 * Bidirectional agent communication: point-to-point, broadcast, request/reply, handoff, blackboard. */

export type MessageType = 'task_request' | 'task_result' | 'handoff' | 'query' | 'answer' | 'event' | 'heartbeat' | 'negotiation' | 'blackboard_write' | 'blackboard_read';

export interface AgentMessage {
  id: string; from: string; to: string; type: MessageType;
  payload: unknown; replyTo?: string; correlationId?: string;
  createdAt: number; ttl: number;
}

export type MessageHandler = (msg: AgentMessage) => void | Promise<void>;

function generateMessageId(): string { return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`; }
function isExpired(msg: AgentMessage): boolean { return Date.now() - msg.createdAt > msg.ttl; }

export class AgentMessageBus {
  private inbox: Map<string, AgentMessage[]>;
  private handlers: Map<string, MessageHandler[]>;
  private blackboard: Map<string, unknown>;
  private pendingReplies: Map<string, { resolve: (msg: AgentMessage) => void; reject: (err: Error) => void; timer: ReturnType<typeof setTimeout>; }>;
  private maxInboxSize: number; private maxBlackboardSize: number;

  constructor(opts?: { maxInboxPerAgent?: number; maxBlackboardEntries?: number }) {
    this.inbox = new Map(); this.handlers = new Map(); this.blackboard = new Map();
    this.pendingReplies = new Map();
    this.maxInboxSize = opts?.maxInboxPerAgent ?? 100;
    this.maxBlackboardSize = opts?.maxBlackboardEntries ?? 500;
  }

  send(msg: Omit<AgentMessage, 'id' | 'createdAt'>): string {
    const id = generateMessageId();
    const fullMsg: AgentMessage = { ...msg, id, createdAt: Date.now(), ttl: msg.ttl ?? 300_000 };
    if (fullMsg.to !== '*') {
      if (!this.inbox.has(fullMsg.to)) this.inbox.set(fullMsg.to, []);
      const agentInbox = this.inbox.get(fullMsg.to)!;
      agentInbox.push(fullMsg);
      while (agentInbox.length > this.maxInboxSize) agentInbox.shift();
    }
    const targets = fullMsg.to === '*' ? this.getRegisteredAgentIds() : [fullMsg.to];
    for (const agentId of targets) { if (agentId === fullMsg.from) continue; this.dispatchToHandler(agentId, fullMsg); }
    if (fullMsg.replyTo) this.resolvePendingReply(fullMsg);
    return id;
  }

  sendAndWait(msg: Omit<AgentMessage, 'id' | 'createdAt'>, timeoutMs: number = 30_000): Promise<AgentMessage> {
    const id = this.send(msg);
    return new Promise<AgentMessage>((resolve, reject) => {
      const timer = setTimeout(() => { this.pendingReplies.delete(id); reject(new Error(`AgentMessageBus: sendAndWait timed out after ${timeoutMs}ms (msg=${id})`)); }, timeoutMs);
      this.pendingReplies.set(id, { resolve, reject, timer });
    });
  }

  receive(agentId: string, type?: MessageType, limit?: number): AgentMessage[] {
    this.prune();
    const agentInbox = this.inbox.get(agentId);
    if (!agentInbox || agentInbox.length === 0) return [];
    let msgs = type ? agentInbox.filter(m => m.type === type) : [...agentInbox];
    if (limit !== undefined && limit >= 0) msgs = msgs.slice(0, limit);
    return msgs;
  }

  on(agentId: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(agentId)) this.handlers.set(agentId, []);
    const list = this.handlers.get(agentId)!; list.push(handler);
    return () => { const idx = list.indexOf(handler); if (idx !== -1) list.splice(idx, 1); if (list.length === 0) this.handlers.delete(agentId); };
  }

  broadcast(from: string, type: MessageType, payload: unknown): string[] {
    const targets = this.getRegisteredAgentIds().filter(id => id !== from);
    return targets.map(to => this.send({ from, to, type, payload, ttl: 300_000 }));
  }

  handoff(from: string, to: string, taskContext: unknown, reason?: string): string {
    return this.send({ from, to, type: 'handoff', payload: { taskContext, reason: reason ?? 'task handoff', handedOverAt: Date.now() }, ttl: 300_000 });
  }

  blackboardWrite(key: string, value: unknown): void {
    if (this.blackboard.has(key)) this.blackboard.delete(key);
    this.blackboard.set(key, value);
    while (this.blackboard.size > this.maxBlackboardSize) { const oldestKey = this.blackboard.keys().next().value; if (oldestKey !== undefined) this.blackboard.delete(oldestKey); }
  }

  blackboardRead(key: string): unknown {
    if (!this.blackboard.has(key)) return undefined;
    const value = this.blackboard.get(key); this.blackboard.delete(key); this.blackboard.set(key, value); return value;
  }

  blackboardKeys(): string[] { return Array.from(this.blackboard.keys()); }
  blackboardClear(): void { this.blackboard.clear(); }

  getStats(): { registeredAgents: number; totalMessages: number; inboxSizes: Record<string, number>; blackboardSize: number } {
    const inboxSizes: Record<string, number> = {}; let totalMessages = 0;
    for (const [agentId, msgs] of this.inbox) { inboxSizes[agentId] = msgs.length; totalMessages += msgs.length; }
    return { registeredAgents: this.handlers.size, totalMessages, inboxSizes, blackboardSize: this.blackboard.size };
  }

  prune(): number {
    let pruned = 0;
    for (const [, msgs] of this.inbox) {
      const before = msgs.length; msgs.length = 0; msgs.push(...msgs.filter(m => !isExpired(m))); pruned += before - msgs.length;
    }
    for (const [agentId, msgs] of this.inbox) { if (msgs.length === 0) this.inbox.delete(agentId); }
    return pruned;
  }

  clear(): void {
    for (const [, pending] of this.pendingReplies) { clearTimeout(pending.timer); pending.reject(new Error('AgentMessageBus: bus cleared')); }
    this.pendingReplies.clear(); this.inbox.clear(); this.handlers.clear(); this.blackboard.clear();
  }

  private getRegisteredAgentIds(): string[] { return Array.from(this.handlers.keys()); }
  private async dispatchToHandler(agentId: string, msg: AgentMessage): Promise<void> {
    const list = this.handlers.get(agentId); if (!list || list.length === 0) return;
    for (const handler of list) { try { await handler(msg); } catch { /* swallow */ } }
  }
  private resolvePendingReply(msg: AgentMessage): void {
    const pending = this.pendingReplies.get(msg.replyTo!); if (!pending) return;
    clearTimeout(pending.timer); this.pendingReplies.delete(msg.replyTo!); pending.resolve(msg);
  }
}

export const agentBus = new AgentMessageBus({ maxInboxPerAgent: 100, maxBlackboardEntries: 500 });
