export type AgentEnvelope<TData = Record<string, unknown>> = {
  agent: string;
  status: string;
  summary: string;
  confidence: number;
  latencyMs: number;
  estimatedCostUsd: number;
  requiresHumanReview: boolean;
  explanation?: string[];
  warnings?: string[];
  sourceIds?: string[];
  nextAgent?: string | null;
  data: TData;
};
