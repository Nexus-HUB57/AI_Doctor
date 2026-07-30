/** CHIMERA Multi-Agent Negotiation Protocols — Ported to AI_Doctor
 * Contract Net, Voting, and Debate strategies for multi-agent coordination. */

export interface Proposal {
  id: string; fromAgent: string; task: string; capability: string;
  estimatedCost: number; estimatedDuration: number; confidence: number; bid?: number;
}

export interface NegotiationResult {
  protocol: 'contract_net' | 'voting' | 'debate';
  winner: string; proposals: Proposal[]; rounds: number;
  consensus: number; reasoning: string;
}

function randomId(): string { return `prop_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`; }

function makeProposal(fromAgent: string, task: string, capability: string, opts?: Partial<Pick<Proposal, 'estimatedCost' | 'estimatedDuration' | 'confidence' | 'bid'>>): Proposal {
  return { id: randomId(), fromAgent, task, capability,
    estimatedCost: opts?.estimatedCost ?? 0, estimatedDuration: opts?.estimatedDuration ?? 0,
    confidence: opts?.confidence ?? 0.5, bid: opts?.bid };
}

export class AgentNegotiator {
  contractNet(task: string, bidders: string[], evaluateBid: (proposal: Proposal) => number, maxRounds: number = 1): NegotiationResult {
    const allProposals: Proposal[] = []; let rounds = 0;
    for (let r = 0; r < maxRounds; r++) {
      rounds++;
      const roundProposals = bidders.map(bidder => makeProposal(bidder, task, 'contract_net_bid'));
      for (const p of roundProposals) p.bid = evaluateBid(p);
      allProposals.push(...roundProposals);
    }
    const scored = allProposals.filter(p => p.bid !== undefined && p.bid > 0).sort((a, b) => (b.bid ?? 0) - (a.bid ?? 0));
    if (scored.length === 0) return { protocol: 'contract_net', winner: 'none', proposals: allProposals, rounds, consensus: 0, reasoning: 'No valid bids received' };
    const winner = scored[0];
    const totalBidders = allProposals.length;
    const consensus = totalBidders > 1 ? Math.max(0, Math.min(1, winner.bid! / allProposals.reduce((s, p) => s + (p.bid ?? 0), 0))) : 1;
    return { protocol: 'contract_net', winner: winner.fromAgent, proposals: allProposals, rounds, consensus,
      reasoning: `Awarded to ${winner.fromAgent} with bid score ${winner.bid!.toFixed(3)} out of ${scored.length} valid bids` };
  }

  async vote(topic: string, voters: string[], options: string[], getVote: (voter: string, options: string[]) => string | Promise<string>): Promise<NegotiationResult> {
    const proposals: Proposal[] = []; const tally: Record<string, number> = {};
    for (const opt of options) tally[opt] = 0;
    for (const voter of voters) {
      const choice = await getVote(voter, options);
      if (choice in tally) tally[choice]++;
      proposals.push(makeProposal(voter, topic, 'vote', { confidence: choice in tally ? 1 : 0 }));
    }
    const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    const topVotes = sorted[0][1];
    const tied = sorted.filter(([, v]) => v === topVotes);
    const winnerOption = tied.length === 1 ? tied[0][0] : options.find(o => tied.some(([t]) => t === o)) ?? tied[0][0];
    const totalVotes = voters.length;
    const consensus = totalVotes > 0 ? topVotes / totalVotes : 0;
    return { protocol: 'voting', winner: winnerOption, proposals, rounds: 1, consensus,
      reasoning: `${winnerOption} won with ${topVotes}/${totalVotes} votes (${(consensus * 100).toFixed(0)}% consensus). Results: ${sorted.map(([o, v]) => `${o}=${v}`).join(', ')}` };
  }

  async debate(proposition: string, participants: Array<{ agentId: string; stance: 'for' | 'against'; argument: string }>,
    judgeFn: (proposition: string, debateArguments: Array<{ agentId: string; stance: string; argument: string }>) => string | Promise<string>,
    maxRounds: number = 1): Promise<NegotiationResult> {
    const proposals: Proposal[] = []; let rounds = 0;
    for (let r = 0; r < maxRounds; r++) {
      rounds++;
      for (const p of participants) proposals.push(makeProposal(p.agentId, proposition, `debate_${p.stance}`, { confidence: p.stance === 'for' ? 0.8 : 0.3 }));
    }
    const forCount = participants.filter(p => p.stance === 'for').length;
    const againstCount = participants.filter(p => p.stance === 'against').length;
    const total = participants.length;
    const majoritySide = Math.max(forCount, againstCount);
    const stanceConsensus = total > 0 ? majoritySide / total : 0;
    const judgeDecision = await judgeFn(proposition, participants.map(p => ({ agentId: p.agentId, stance: p.stance, argument: p.argument })));
    const judgeAgreesWithMajority = (forCount >= againstCount && judgeDecision === 'accept') || (againstCount > forCount && judgeDecision === 'reject');
    const consensus = judgeAgreesWithMajority ? stanceConsensus : stanceConsensus * 0.5;
    return { protocol: 'debate', winner: judgeDecision, proposals, rounds, consensus: Math.max(0, Math.min(1, consensus)),
      reasoning: `Judge decided "${judgeDecision}" after ${rounds} round(s). Arguments: ${forCount} for, ${againstCount} against. Participants: ${participants.map(p => p.agentId).join(', ')}` };
  }
}

export const agentNegotiator = new AgentNegotiator();
