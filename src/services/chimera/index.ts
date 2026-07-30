/**
 * CHIMERA — Arquitetura de Inteligencia Artificial Distribuida
 * Portado de Nexus-HUB57/LiveBook-rRNA para AI_Doctor
 *
 * Modulos:
 *  - Live Lab Algorithms (PROMETHEE, Cascade, TokenBucket, Budget, RBAC, PII)
 *  - Observability (Logger, Metrics, Tracer)
 *  - Agent Memory (episodic, semantic, working, procedural)
 *  - Agent Message Bus (P2P, broadcast, request/reply, handoff, blackboard)
 *  - Agent Negotiation (Contract Net, Voting, Debate)
 *  - Semantic Cache (SHA-256 LRU)
 *  - Skill Learner (rolling performance tracking)
 *  - MCDM Meta-Learner (adaptive weight optimization)
 *  - Routing Evaluator (Accuracy@1/3, MRR, A/B testing)
 */

// Live Lab Types & Algorithms
export * from './live-lab-types';
export * from './algorithms';

// Observability
export { ChimeraLogger, ChimeraMetrics, ChimeraSpan, ChimeraTracer, logger, metrics, tracer, createLogger } from './observability';
export type { LogEntry, LogContext, SpanData, LogLevel } from './observability';

// Agent Memory
export { AgentMemory, agentMemory } from './agent-memory';
export type { MemoryEntry, MemoryType, AgentMemoryOptions, RecallOptions, MemoryStats } from './agent-memory';

// Agent Message Bus
export { AgentMessageBus, agentBus } from './agent-message-bus';
export type { AgentMessage, MessageType, MessageHandler } from './agent-message-bus';

// Agent Negotiation
export { AgentNegotiator, agentNegotiator } from './agent-negotiation';
export type { Proposal, NegotiationResult } from './agent-negotiation';

// Semantic Cache
export { SemanticCache, semanticCache } from './semantic-cache';
export type { CacheEntry, SemanticCacheStats, SemanticCacheOptions } from './semantic-cache';

// Skill Learner
export { SkillLearner, skillLearner } from './skill-learner';
export type { SkillPerformance } from './skill-learner';

// MCDM Meta-Learner
export { McdmMetaLearner, mcdmLearner } from './mcdm-meta-learner';
export type { WeightSample } from './mcdm-meta-learner';

// Routing Evaluator
export { RoutingEvaluator, routingEvaluator } from './routing-evaluator';
export type { GroundTruthEntry, RoutingEvalResult, RouteResult } from './routing-evaluator';
