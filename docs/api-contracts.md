# API Contracts

This document defines the public API contracts for AgriOS. It covers REST endpoints,
WebSocket events, shared agent envelopes, and demo-safe fallback behavior.

The current backend is FastAPI and exposes routes from `backend/app/api` plus the
farm WebSocket route from `backend/app/websocket`. This document records the
implemented demo contract used by the frontend and the near-term endpoints still
planned for durable production workflows.

## 1. Conventions

- Base API URL in local development: `http://localhost:8000`
- Response format: JSON unless otherwise noted.
- Field names use `camelCase` for API payloads.
- Timestamps should use ISO 8601 UTC strings.
- IDs should be stable strings, for example `demo-farm`, `zone-b`, or `run_001`.
- External provider calls must be hidden behind backend services or gateways.
- Demo fallbacks must return valid contract-shaped responses with an explicit
  fallback marker in `warnings`, `summary`, or `data.fallback`.

## 2. Shared Agent Envelope

Every agent response should use this top-level envelope unless a workflow-specific
contract explicitly extends it.

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
    "No heavy rain is expected in the next 6 hours."
  ],
  "warnings": [],
  "sourceIds": ["telemetry_zone_b_001", "forecast_mock_001"],
  "nextAgent": "robot",
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

- `agent`: agent id, such as `sensor`, `weather`, `risk`, `planner`, or `voice`.
- `status`: `queued`, `running`, `completed`, `failed`, or `fallback`.
- `summary`: human-readable result.
- `confidence`: number from `0` to `1`.
- `latencyMs`: integer runtime in milliseconds.
- `estimatedCostUsd`: estimated provider or compute cost.
- `requiresHumanReview`: boolean.
- `data`: JSON object containing agent-specific output.

Recommended fields:

- `explanation`: short evidence list for meaningful decisions.
- `warnings`: recoverable issues, validation concerns, or fallback labels.
- `sourceIds`: telemetry, forecast, image, action, memory, or provider ids.
- `nextAgent`: suggested routing target.

## 3. REST Endpoints

### GET `/health`

Returns service health.

Implemented response:

```json
{
  "status": "ok",
  "service": "agrios-api"
}
```

### GET `/farm/state`

Returns the current farm state used by the command center.

Implemented response shape:

```json
{
  "farmId": "demo-farm",
  "name": "Ratnagiri Mango Estate",
  "autonomyMode": "auto_schedule_low_risk",
  "updatedAt": "2026-06-14T02:30:00Z",
  "zones": [
    {
      "id": "zone-b",
      "name": "Zone B",
      "cropType": "mango_kesar",
      "variety": "Kesar",
      "treeCount": 144,
      "soilMoisturePct": 21,
      "temperatureC": 34.8,
      "humidityPct": 48,
      "riskLevel": "high",
      "lastUpdatedAt": "2026-06-14T02:30:00Z",
      "bounds": {
        "leftPct": 52.1,
        "topPct": 12.1,
        "widthPct": 38.8,
        "heightPct": 34.7
      },
      "sensorIds": ["sensor-b-soil-01", "sensor-b-weather-01"],
      "valveId": "valve-b-drip-01",
      "currentTreeId": "tree-b-023",
      "canopyHealthPct": 82,
      "pestPressure": "normal"
    }
  ],
  "robots": [
    {
      "id": "robot-r1",
      "name": "Robot R1",
      "status": "assigned",
      "batteryPct": 82,
      "currentZoneId": "zone-b",
      "currentWaypointId": "zone-b-sensor",
      "currentWaypointLabel": "sensor-b-soil-01 sensor",
      "currentTarget": "Tree B-023",
      "routeId": "route-g1-zones-tank-pump-loop",
      "routeProgressPct": 38,
      "location": {
        "xPct": 61,
        "yPct": 27
      },
      "speedMps": 0.8,
      "observations": ["Checked sensor-b-soil-01; sensor heartbeat and local readings are synced."]
    }
  ],
  "activeActions": [],
  "pendingApprovals": [],
  "communicationEvents": [],
  "outcomeChecks": [],
  "journalEntries": [],
  "assets": {
    "sensors": [],
    "valves": [],
    "trees": [],
    "waterTanks": [],
    "pump": {},
    "base": {}
  },
  "latestTelemetry": {
    "sequence": 29676030,
    "generatedAt": "2026-06-14T02:30:00Z",
    "zoneId": "zone-b",
    "zoneName": "Zone B",
    "soilMoisturePct": 21,
    "soilMoistureThresholdPct": 35,
    "temperatureC": 34.8,
    "humidityPct": 48,
    "waterTankPct": 71,
    "tankLevelPct": 71,
    "robot": {},
    "zones": []
  },
  "simulation": {
    "tick": 29676030,
    "tickIntervalSeconds": 60,
    "retentionMinutes": 60,
    "routeId": "route-g1-zones-tank-pump-loop",
    "routeName": "Gate 1 -> Zones A/B -> Tank -> Zone C -> Pump -> Zone D",
    "routeProgressPct": 38,
    "routeStep": 6,
    "routeStepCount": 16,
    "currentWaypointId": "zone-b-sensor",
    "currentWaypointLabel": "sensor-b-soil-01 sensor",
    "currentActivity": "Checked sensor-b-soil-01; sensor heartbeat and local readings are synced.",
    "inspectionsThisHour": 24,
    "zonesVisitedThisCycle": ["zone-a", "zone-b"],
    "nextTickAt": "2026-06-14T02:31:00Z"
  }
}
```

Notes:

- The route merges synchronized simulation state with the in-memory demo store.
- The admin alert feed is returned through `activeActions`, `pendingApprovals`,
  `communicationEvents`, and `outcomeChecks`.
- `assets` contains orchard map primitives for sensors, valves, trees, water
  tanks, pump, and charging base.

### GET `/agents/trace`

Returns the latest workflow trace for timeline recovery and UI display.

Implemented behavior:

- If no workflow has run in the current process, the route runs the deterministic
  sensor anomaly workflow and returns it.
- If a vision or voice workflow has run, the latest trace is returned.
- Optional query: `language=en|mr|hi|gu`.

Implemented response shape:

```json
{
  "runId": "run_sensor_001",
  "workflow": "sensor_anomaly",
  "status": "completed",
  "startedAt": "2026-06-14T02:30:00Z",
  "completedAt": "2026-06-14T02:30:03Z",
  "trace": [
    {
      "stepId": "step_001",
      "agent": "sensor",
      "status": "completed",
      "summary": "Zone B soil moisture is critically low.",
      "confidence": 0.96,
      "latencyMs": 120,
      "estimatedCostUsd": 0,
      "requiresHumanReview": false,
      "data": {
        "zoneId": "zone-b",
        "anomaly": true
      }
    }
  ]
}
```

Implemented sensor workflow order:

```text
supervisor -> sensor -> weather -> risk -> planner -> robot -> communication -> outcome -> evaluation -> memory
```

### POST `/vision/analyze`

Starts leaf image analysis.

Implemented request:

```json
{
  "imageId": "leaf-demo-tomato-001",
  "cropType": "mango",
  "zoneId": "zone-b",
  "language": "en"
}
```

If the request body is omitted, the backend uses the demo image request above.

Implemented response:

```json
{
  "agent": "vision",
  "status": "fallback",
  "summary": "Possible early blight detected on the demo leaf image.",
  "confidence": 0.86,
  "latencyMs": 940,
  "estimatedCostUsd": 0,
  "requiresHumanReview": false,
  "explanation": [
    "Known demo image uses deterministic fallback analysis.",
    "Leaf marks match the demo early-blight profile."
  ],
  "warnings": ["fallback:demo_vision_result"],
  "sourceIds": ["leaf-demo-tomato-001"],
  "nextAgent": "risk",
  "data": {
    "imageId": "leaf-demo-tomato-001",
    "cropType": "mango",
    "zoneId": "zone-b",
    "language": "en",
    "disease": "early_blight",
    "severity": "medium",
    "recommendation": "Assign robot inspection and ask farmer to review treatment before spraying.",
    "fallback": true,
    "workflowRunId": "run-vision-zone-b-001"
  }
}
```

Side effect:

- Updates `/agents/trace` to the `vision` workflow:
  `supervisor -> vision -> risk -> planner -> robot -> communication -> evaluation -> memory`.

### POST `/voice/ask`

Asks the farm manager for a concise spoken or text status.

Implemented request:

```json
{
  "prompt": "Call my farm",
  "language": "en",
  "includeAudio": false,
  "audioBase64": null,
  "audioFilename": null
}
```

Implemented response:

```json
{
  "agent": "voice",
  "status": "fallback",
  "summary": "Zone B needs attention today.",
  "confidence": 0.92,
  "latencyMs": 600,
  "estimatedCostUsd": 0,
  "requiresHumanReview": false,
  "explanation": [
    "Voice Agent summarized farm state, actions, approvals, weather, and outcome status."
  ],
  "warnings": ["fallback:static_ai_response"],
  "sourceIds": ["voice-demo-fallback"],
  "nextAgent": null,
  "data": {
    "responseText": "Zone B needs attention. Irrigation has been scheduled and Robot R1 is checking the crop.",
    "language": "en",
    "audioUrl": null,
    "audioMimeType": null,
    "activeRisks": ["zone-b-low-moisture"],
    "pendingApprovals": ["approval-treatment-001"],
    "fallback": true,
    "speechFallback": true,
    "transcription": null,
    "workflowRunId": "run-voice-farm-001",
    "ai": {
      "provider": null,
      "model": null,
      "fallback": true,
      "speechModel": null
    }
  }
}
```

Marathi demo requests should use `language: "mr"` and may return a canned fallback
response when speech or model providers are unavailable.

If `audioBase64` is present, the backend attempts OpenAI transcription through
`openai_service.py`. On failure or missing configuration, transcription returns
`fallbackUsed: true` and the text prompt path still works.

If `includeAudio` is true, the backend attempts OpenAI text-to-speech. On failure
or missing configuration, the response keeps `audioUrl: null` and labels
`speechFallback: true`.

### GET `/evaluation/scorecards`

Returns latest agent evaluation metrics.

Implemented behavior:

- If no workflow has run in the current process, the route runs the deterministic
  sensor anomaly workflow so scorecards are available.

Implemented response:

```json
{
  "scorecards": [
    {
      "agent": "planner",
      "confidence": 0.94,
      "latencyMs": 820,
      "estimatedCostUsd": 0.002,
      "qualityScore": 0.96,
      "requiresHumanReview": false,
      "workflow": "sensor_anomaly",
      "runId": "run_sensor_001",
      "createdAt": "2026-06-14T02:30:03Z"
    }
  ]
}
```

### GET `/simulation/status`

Returns the simulation loop and latest tick summary.

Implemented response:

```json
{
  "status": "running",
  "tickIntervalSeconds": 60,
  "retentionMinutes": 60,
  "storedEvents": 12,
  "latestEventId": "evt-sim-29676030",
  "latestTick": 29676030,
  "robot": {},
  "currentActivity": "Checked sensor-b-soil-01; sensor heartbeat and local readings are synced.",
  "nextTickAt": "2026-06-14T02:31:00+00:00"
}
```

### GET `/simulation/events`

Returns recent persisted simulation ticks.

Query parameters:

- `limit`: integer from `1` to `240`, default `60`.

Implemented response:

```json
{
  "events": [
    {
      "type": "simulation.tick",
      "eventId": "evt-sim-29676030",
      "sequence": 29676030,
      "createdAt": "2026-06-14T02:30:00+00:00",
      "data": {
        "farmState": {},
        "telemetry": {},
        "sensorEnvelope": {},
        "robotEnvelope": {},
        "agentTrace": {}
      }
    }
  ]
}
```

### POST `/simulation/reset`

Clears persisted simulation events and creates a fresh current tick.

Implemented response:

```json
{
  "status": "running",
  "tickIntervalSeconds": 60,
  "retentionMinutes": 60,
  "storedEvents": 1,
  "latestEventId": "evt-sim-29676030"
}
```

### GET `/ai/config/status`

Returns backend OpenAI configuration status without exposing the API key.

Implemented response:

```json
{
  "configured": false,
  "ready": false,
  "liveEnabled": true,
  "source": null,
  "model": "gpt-5.2",
  "speechToTextModel": "gpt-4o-mini-transcribe",
  "textToSpeechModel": "gpt-4o-mini-tts",
  "textToSpeechVoice": "alloy"
}
```

### POST `/ai/config/validate`

Validates either the supplied OpenAI key or the configured backend key.

Request:

```json
{
  "apiKey": "sk-..."
}
```

Response:

```json
{
  "valid": true,
  "message": "OpenAI key validated."
}
```

When `OPENAI_LIVE_ENABLED=false`, format-valid keys return a valid response with
a message explaining that live validation is disabled.

### POST `/ai/config/openai-key`

Validates and stores an OpenAI key in the backend `.env` file. The raw key is not
returned.

Request:

```json
{
  "apiKey": "sk-...",
  "validateKey": true
}
```

Response:

```json
{
  "configured": true,
  "ready": true,
  "liveEnabled": true,
  "source": "backend_env",
  "model": "gpt-5.2",
  "speechToTextModel": "gpt-4o-mini-transcribe",
  "textToSpeechModel": "gpt-4o-mini-tts",
  "textToSpeechVoice": "alloy",
  "validation": {
    "valid": true,
    "message": "OpenAI key validated."
  }
}
```

## 4. WebSocket Contracts

The implemented live stream endpoint is `/ws/farm`, backed by the simulation
engine, SQLite event storage, and connection manager. On connect, the server
sends up to 12 recent ticks and then publishes one new tick per
`SIMULATION_TICK_SECONDS`.

Implemented event envelope:

```json
{
  "type": "simulation.tick",
  "eventId": "evt-sim-29676030",
  "sequence": 29676030,
  "createdAt": "2026-06-14T02:30:00Z",
  "data": {
    "farmState": {},
    "telemetry": {},
    "sensorEnvelope": {},
    "robotEnvelope": {},
    "agentTrace": {}
  }
}
```

Implemented event types:

- `simulation.tick`

Example telemetry event:

```json
{
  "type": "simulation.tick",
  "eventId": "evt-sim-29676030",
  "sequence": 29676030,
  "createdAt": "2026-06-14T02:30:00Z",
  "data": {
    "telemetry": {
      "zoneId": "zone-b",
      "zoneName": "Zone B",
      "soilMoisturePct": 21,
      "soilMoistureThresholdPct": 35,
      "temperatureC": 34.8,
      "humidityPct": 48,
      "waterTankPct": 71
    },
    "sensorEnvelope": {
      "agent": "sensor",
      "status": "completed",
      "summary": "Synthetic telemetry tick 29676030 generated synchronized readings for all four zones.",
      "confidence": 0.96,
      "latencyMs": 35,
      "estimatedCostUsd": 0,
      "requiresHumanReview": false,
      "data": {
        "source": "synthetic_simulation"
      }
    }
  }
}
```

Planned workflow event example:

```json
{
  "type": "outcome.verified",
  "eventId": "evt_outcome_001",
  "createdAt": "2026-06-14T02:40:00Z",
  "data": {
    "actionId": "action_irrigate_001",
    "status": "improved",
    "before": {
      "soilMoisturePct": 21
    },
    "after": {
      "soilMoisturePct": 34
    },
    "summary": "Zone B moisture improved by 13 percentage points."
  }
}
```

## 5. Domain Types

### Autonomy Mode

```text
observe_only
recommend_actions
auto_schedule_low_risk
require_approval_high_risk
```

### Risk Level

```text
low
medium
high
critical
```

### Communication Channel

```text
in_app
phone_call
sms
whatsapp
telegram
```

### Communication Request

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

Communication status values:

```text
queued
sent
delivered
failed
simulated
```

## 6. Error Contract

Errors should use a stable shape so the frontend can render useful recovery states.

```json
{
  "error": {
    "code": "vision_provider_unavailable",
    "message": "Vision provider is unavailable. Demo fallback result was used.",
    "recoverable": true,
    "fallbackUsed": true,
    "details": {
      "provider": "openai",
      "requestId": "req_001"
    }
  }
}
```

Common error codes:

- `validation_failed`
- `workflow_not_found`
- `provider_unavailable`
- `communication_delivery_failed`
- `human_review_required`
- `fallback_used`

## 7. Demo Fallback Guarantees

Critical demo flows must remain contract-compatible when providers are unavailable:

- Sensor data returns deterministic simulator values.
- Weather returns deterministic mock forecast data.
- Vision returns a known demo-image result.
- Voice returns text fallback and canned Marathi response when needed.
- Communication returns `status: "simulated"` instead of calling providers directly.
- Outcome verification emits accelerated follow-up telemetry.
- OpenAI failures return safe static responses with a visible fallback label.

Fallback responses should prefer `status: "fallback"` for agent envelopes and set
`data.fallback` to `true`.
