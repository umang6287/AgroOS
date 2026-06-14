import type { AgentTrace } from "@/types/agents";

const mockTraceCompletedAt = new Date().toISOString();
const mockTraceStartedAt = new Date(Date.now() - 8000).toISOString();

export const mockAgentTrace: AgentTrace = {
  runId: "run-mango-zone-b-001",
  workflow: "sensor_anomaly",
  status: "completed",
  startedAt: mockTraceStartedAt,
  completedAt: mockTraceCompletedAt,
  trace: [
    {
      agent: "supervisor",
      status: "completed",
      summary: "Routed Zone B mango moisture anomaly into the sensor anomaly workflow.",
      confidence: 0.96,
      latencyMs: 95,
      estimatedCostUsd: 0,
      requiresHumanReview: false,
      explanation: ["Incoming telemetry matched the low-moisture rule for Zone B."],
      nextAgent: "sensor",
      data: { workflow: "sensor_anomaly", zoneId: "zone-b" }
    },
    {
      agent: "sensor",
      status: "completed",
      summary: "Zone B soil moisture is low at 24% with rising canopy temperature.",
      confidence: 0.97,
      latencyMs: 120,
      estimatedCostUsd: 0,
      requiresHumanReview: false,
      explanation: ["Zone B is below its 35% moisture threshold.", "Canopy temperature is 4.4 C above Zone A."],
      nextAgent: "weather",
      data: { zoneId: "zone-b", anomaly: "low_soil_moisture", moisturePct: 24 }
    },
    {
      agent: "weather",
      status: "completed",
      summary: "Mock forecast shows no heavy rain in the next 6 hours.",
      confidence: 0.86,
      latencyMs: 25,
      estimatedCostUsd: 0,
      requiresHumanReview: false,
      warnings: ["fallback:mock_weather"],
      nextAgent: "vision",
      data: { rainProbabilityNext6h: 0.12, windKph: 8 }
    },
    {
      agent: "vision",
      status: "completed",
      summary: "Leaf image from Tree 23 shows possible early fungal marks.",
      confidence: 0.84,
      latencyMs: 710,
      estimatedCostUsd: 0.0015,
      requiresHumanReview: false,
      warnings: ["fallback:demo_vision_result"],
      nextAgent: "risk",
      data: { treeId: "tree-23", finding: "possible_fungal_marks", severity: "medium" }
    },
    {
      agent: "risk",
      status: "completed",
      summary: "Water stress is high; treatment risk requires farmer review.",
      confidence: 0.89,
      latencyMs: 180,
      estimatedCostUsd: 0.0004,
      requiresHumanReview: true,
      explanation: ["Moisture is low.", "Vision finding is not high enough confidence for automatic spray."],
      nextAgent: "planner",
      data: { riskLevel: "high", approvalReason: "spray_treatment" }
    },
    {
      agent: "planner",
      status: "completed",
      summary: "Scheduled drip irrigation, robot inspection, communication, and outcome verification.",
      confidence: 0.94,
      latencyMs: 260,
      estimatedCostUsd: 0.002,
      requiresHumanReview: false,
      explanation: ["Autonomy mode allows irrigation scheduling.", "High-risk spray is converted into approval request."],
      nextAgent: "robot",
      data: { actions: ["schedule_irrigation", "robot_inspection", "farmer_approval", "verify_outcome"] }
    },
    {
      agent: "robot",
      status: "completed",
      summary: "Robot R1 assigned to Gate 1 -> Zone B -> Tree 23 -> Tank bay route.",
      confidence: 0.93,
      latencyMs: 150,
      estimatedCostUsd: 0,
      requiresHumanReview: false,
      nextAgent: "communication",
      data: { robotId: "robot-r1", pathId: "route-g1-zoneb-tree23-tank" }
    },
    {
      agent: "communication",
      status: "completed",
      summary: "Farmer notification simulated through WhatsApp with SMS and phone escalation ready.",
      confidence: 0.9,
      latencyMs: 90,
      estimatedCostUsd: 0,
      requiresHumanReview: false,
      warnings: ["fallback:simulated_delivery"],
      nextAgent: "outcome",
      data: { selectedChannel: "whatsapp", status: "simulated", language: "mr" }
    },
    {
      agent: "outcome",
      status: "completed",
      summary: "Stored Zone B moisture baseline and scheduled follow-up telemetry comparison.",
      confidence: 0.92,
      latencyMs: 105,
      estimatedCostUsd: 0,
      requiresHumanReview: false,
      nextAgent: "evaluation",
      data: { baselineMoisturePct: 24, verificationInMinutes: 10 }
    },
    {
      agent: "evaluation",
      status: "completed",
      summary: "Workflow quality is high; one human-review gate is correctly preserved.",
      confidence: 0.95,
      latencyMs: 130,
      estimatedCostUsd: 0.0003,
      requiresHumanReview: false,
      nextAgent: "memory",
      data: { qualityScore: 0.96, reviewFlags: ["spray_approval_required"] }
    },
    {
      agent: "memory",
      status: "completed",
      summary: "Wrote farm journal entry for Zone B moisture stress, robot route, and farmer approval.",
      confidence: 0.91,
      latencyMs: 85,
      estimatedCostUsd: 0,
      requiresHumanReview: false,
      data: { journalEntryId: "journal-zone-b-20260614-001" }
    }
  ]
};
