export type AgentScorecard = {
  agent: string;
  confidence: number;
  latencyMs: number;
  estimatedCostUsd: number;
  qualityScore: number;
  requiresHumanReview: boolean;
};
