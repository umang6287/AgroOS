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

export type AgentTrace = {
  runId: string;
  workflow: "sensor_anomaly" | "vision" | "voice" | "outcome_verification";
  status: string;
  startedAt: string;
  completedAt?: string;
  trace: AgentEnvelope[];
};
