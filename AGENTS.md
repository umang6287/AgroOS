# AgriOS Agent Specification

## 1. Purpose

This document defines the agents used by AgriOS, their responsibilities, shared contracts, routing rules, and demo-safe behavior. It should be treated as the operating manual for the multi-agent layer.

AgriOS agents should not feel like isolated AI features. They should work as a coordinated farm operations team: observe, assess, plan, communicate, act, verify, remember, and evaluate.

## 2. Agent Principles

- Every agent has one clear responsibility.
- Agents exchange structured JSON-compatible data.
- The Supervisor Agent owns routing and workflow coordination.
- Every meaningful decision should include confidence, latency, cost, and explanation evidence.
- External systems such as OpenAI, WhatsApp, Telegram, SMS, phone calls, and weather providers are accessed through service wrappers or gateways.
- Critical demo flows must have deterministic fallback behavior.
- High-risk or low-confidence actions must request human approval.

## 3. Agent Catalog

| Agent | Responsibility | Primary Inputs | Primary Outputs |
| --- | --- | --- | --- |
| Supervisor Agent | Coordinates workflows and routes context | Events, farm state, user actions | Agent run trace |
| Sensor Agent | Interprets farm telemetry | Soil moisture, temperature, humidity, tank level, robot telemetry | Sensor summary and anomaly status |
| Weather Agent | Adds forecast context | Mock or live weather data, zone context | Forecast summary and planning impact |
| Vision Agent | Analyzes leaf images | Uploaded image, crop context | Disease, severity, confidence, recommendation |
| Risk Agent | Scores urgency and risk | Sensor, weather, vision, memory | Risk level, reasons, next step |
| Planner Agent | Converts risk into action plan | Risk output, autonomy mode, farm memory | Recommended actions and expected outcomes |
| Robot Agent | Assigns inspection tasks | Planner output, robot status | Robot task assignment |
| Communication Agent | Chooses and sends farmer notifications | Severity, action, farmer preferences | Channel, message, delivery status |
| Outcome Agent | Verifies whether actions worked | Action, baseline telemetry, later telemetry | Outcome status and before/after values |
| Voice Agent | Speaks as the farm manager | Farm state, actions, memory, pending approvals | Spoken or text response |
| Memory Agent | Maintains farm journal | Actions, outcomes, approvals, analyses | Relevant history and journal entries |
| Evaluation Agent | Scores agent behavior | Agent step outputs and outcomes | Metrics and review flags |

## 4. Shared Agent Output Envelope

Every agent should return the same top-level envelope unless a workflow explicitly extends it.

```json
{
  "agent": "planner",
  "status": "completed",
  "summary": "Irrigation scheduled for Zone B and Robot R1 assigned for inspection.",
  "confidence": 0.94,
  "latencyMs": 820,
  "estimatedCostUsd": 0.002,
  "requiresHumanReview": false,
  "explanation": [
    "Zone B moisture is below the critical threshold.",
    "No heavy rain is expected in the next 6 hours.",
    "Previous irrigation in Zone B improved moisture by 16 percentage points."
  ],
  "data": {
    "actions": [
      {
        "type": "schedule_irrigation",
        "zone": "Zone B",
        "priority": "high",
        "status": "scheduled"
      }
    ]
  }
}
```

Required fields:

- `agent`
- `status`
- `summary`
- `confidence`
- `latencyMs`
- `estimatedCostUsd`
- `requiresHumanReview`
- `data`

Recommended fields:

- `explanation`
- `warnings`
- `sourceIds`
- `nextAgent`

## 5. Workflow Routing

### 5.1 Sensor Anomaly Workflow

```text
Simulator
-> Supervisor Agent
-> Sensor Agent
-> Weather Agent
-> Risk Agent
-> Planner Agent
-> Robot Agent
-> Communication Agent
-> Outcome Agent
-> Evaluation Agent
-> Memory Agent
```

Expected result:

- Anomaly is detected.
- Weather and memory influence planning.
- Action is scheduled or sent for approval.
- Farmer communication is logged.
- Outcome verification is scheduled.
- Evaluation metrics are updated.

### 5.2 Vision Workflow

```text
Leaf Upload
-> Supervisor Agent
-> Vision Agent
-> Risk Agent
-> Planner Agent
-> Robot Agent
-> Communication Agent
-> Evaluation Agent
-> Memory Agent
```

Expected result:

- Disease or healthy state is identified.
- Severity and confidence are shown.
- Inspection or treatment review is recommended.
- Relevant alert can be sent to the farmer.

### 5.3 Voice Workflow

```text
Call My Farm
-> Voice Agent
-> Memory Agent
-> Supervisor Agent
-> Voice Agent
```

Expected result:

- Farmer receives a concise farm status.
- Voice answer includes active risks, actions, pending approvals, and verified outcomes.
- Marathi demo prompt and response are supported.

### 5.4 Outcome Verification Workflow

```text
Action Created
-> Outcome Agent stores baseline
-> Simulator emits follow-up telemetry
-> Outcome Agent compares before/after
-> Evaluation Agent scores success
-> Memory Agent writes journal entry
```

Expected result:

- AgriOS can say whether an action worked, not just whether it was recommended.

## 6. Autonomy Rules

Supported modes:

- `observe_only`: agents analyze and explain but do not create actions.
- `recommend_actions`: agents create recommendations only.
- `auto_schedule_low_risk`: low-risk, high-confidence actions can be scheduled.
- `require_approval_high_risk`: high-risk or low-confidence actions require approval.

Human review must be requested when:

- Risk level is high.
- Confidence is below `0.8`.
- Estimated cost is above the configured threshold.
- Action could create irreversible real-world impact.
- Provider delivery or AI output is uncertain.

## 7. Communication Policy

The Communication Agent decides how to notify the farmer. It should use farmer preference first, then severity.

Channel ids:

- `in_app`
- `phone_call`
- `sms`
- `whatsapp`
- `telegram`

Escalation defaults:

- Info: `in_app`
- Warning: `telegram` or `whatsapp`
- Critical: `sms` plus `phone_call`
- Approval needed: `whatsapp` or `telegram`

All outbound communication must go through the Communication Gateway. Agents and UI components must not call provider SDKs directly.

Communication request:

```json
{
  "severity": "critical",
  "preferredChannels": ["whatsapp", "telegram", "sms", "phone_call"],
  "selectedChannel": "whatsapp",
  "recipientRole": "farmer",
  "message": "Zone B moisture is critically low. Short irrigation has been scheduled and will be verified in 10 minutes.",
  "status": "simulated"
}
```

## 8. Evaluation Metrics

Every workflow should update evaluation metrics.

Track:

- Confidence
- Latency
- Estimated cost
- Output quality
- Human review rate
- Action success rate
- Communication delivery success
- Outcome verification success

Example scorecard:

```json
{
  "agent": "planner",
  "confidence": 0.94,
  "latencyMs": 820,
  "estimatedCostUsd": 0.002,
  "qualityScore": 0.96,
  "requiresHumanReview": false
}
```

## 9. Demo Fallbacks

Critical hackathon flows must work even if external services are unavailable.

Fallbacks:

- Sensor data: deterministic simulator values.
- Weather: deterministic mock forecast.
- Vision: known demo-image fallback result.
- Voice: text fallback and canned Marathi response.
- Communication: simulated delivery status.
- Outcome verification: accelerated simulated follow-up telemetry.
- OpenAI calls: safe static response with visible fallback label.

## 10. Implementation Notes

- Keep prompt templates close to the service or agent that owns them.
- Validate every model response before passing it to another agent.
- Store agent runs and steps for timeline recovery.
- Store communication events for auditability.
- Store farm journal entries for memory-backed planning.
- Never expose API keys or provider credentials to the frontend.
- Prefer small, testable agent functions over one large orchestration function.
