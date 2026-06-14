import type { AgentScorecard } from "@/types/evaluation";

const mockEvaluationCreatedAt = new Date().toISOString();

export const mockEvaluation: AgentScorecard[] = [
  {
    agent: "supervisor",
    confidence: 0.96,
    latencyMs: 95,
    estimatedCostUsd: 0,
    qualityScore: 0.97,
    requiresHumanReview: false,
    workflow: "sensor_anomaly",
    runId: "run-mango-zone-b-001",
    createdAt: mockEvaluationCreatedAt
  },
  {
    agent: "sensor",
    confidence: 0.97,
    latencyMs: 120,
    estimatedCostUsd: 0,
    qualityScore: 0.96,
    requiresHumanReview: false,
    workflow: "sensor_anomaly",
    runId: "run-mango-zone-b-001",
    createdAt: mockEvaluationCreatedAt
  },
  {
    agent: "vision",
    confidence: 0.84,
    latencyMs: 710,
    estimatedCostUsd: 0.0015,
    qualityScore: 0.88,
    requiresHumanReview: false,
    workflow: "sensor_anomaly",
    runId: "run-mango-zone-b-001",
    createdAt: mockEvaluationCreatedAt
  },
  {
    agent: "risk",
    confidence: 0.89,
    latencyMs: 180,
    estimatedCostUsd: 0.0004,
    qualityScore: 0.93,
    requiresHumanReview: true,
    workflow: "sensor_anomaly",
    runId: "run-mango-zone-b-001",
    createdAt: mockEvaluationCreatedAt
  },
  {
    agent: "planner",
    confidence: 0.94,
    latencyMs: 260,
    estimatedCostUsd: 0.002,
    qualityScore: 0.95,
    requiresHumanReview: false,
    workflow: "sensor_anomaly",
    runId: "run-mango-zone-b-001",
    createdAt: mockEvaluationCreatedAt
  },
  {
    agent: "communication",
    confidence: 0.9,
    latencyMs: 90,
    estimatedCostUsd: 0,
    qualityScore: 0.92,
    requiresHumanReview: false,
    workflow: "sensor_anomaly",
    runId: "run-mango-zone-b-001",
    createdAt: mockEvaluationCreatedAt
  },
  {
    agent: "outcome",
    confidence: 0.92,
    latencyMs: 105,
    estimatedCostUsd: 0,
    qualityScore: 0.94,
    requiresHumanReview: false,
    workflow: "sensor_anomaly",
    runId: "run-mango-zone-b-001",
    createdAt: mockEvaluationCreatedAt
  },
  {
    agent: "memory",
    confidence: 0.91,
    latencyMs: 85,
    estimatedCostUsd: 0,
    qualityScore: 0.93,
    requiresHumanReview: false,
    workflow: "sensor_anomaly",
    runId: "run-mango-zone-b-001",
    createdAt: mockEvaluationCreatedAt
  }
];
