# Demo Fallbacks

AgriOS demos must keep working when external providers are slow, unavailable, or not configured. Fallback behavior should be deterministic, visibly labeled, and routed through the same agent contracts as live behavior.

## Goals

- Keep critical hackathon flows available without API keys or network access.
- Preserve the shared agent output envelope for fallback and live results.
- Make fallback status visible in the UI, timeline, logs, and farm journal.
- Avoid pretending simulated outputs are live provider responses.
- Keep fallback values stable enough for repeatable demos and tests.

## Fallback Envelope Requirements

Fallback agent outputs should use the normal shared envelope and include a warning or source marker.

```json
{
  "agent": "weather",
  "status": "completed",
  "summary": "Mock forecast: no heavy rain expected in the next 6 hours.",
  "confidence": 0.86,
  "latencyMs": 25,
  "estimatedCostUsd": 0,
  "requiresHumanReview": false,
  "explanation": [
    "Weather provider unavailable or disabled.",
    "Using deterministic demo forecast for Zone B."
  ],
  "warnings": ["fallback:mock_weather"],
  "sourceIds": ["demo-weather-v1"],
  "data": {
    "mode": "fallback",
    "forecast": {
      "rainProbabilityNext6h": 0.12,
      "temperatureC": 31,
      "windKph": 8
    }
  }
}
```

## Fallback Matrix

| Capability | Trigger | Fallback | Required Label |
| --- | --- | --- | --- |
| Sensor data | Simulator unavailable, no device stream, empty telemetry | Deterministic simulator values by zone | `fallback:simulated_sensor_data` |
| Weather | API key missing, timeout, provider error | Deterministic mock forecast | `fallback:mock_weather` |
| Vision | Model unavailable, upload analysis fails, demo image recognized | Known demo-image result | `fallback:demo_vision_result` |
| Voice | Speech provider unavailable, call path fails | Text response and canned Marathi response | `fallback:text_voice_response` |
| Communication | Provider unavailable, credentials missing, demo mode enabled | Simulated delivery event through Communication Gateway | `fallback:simulated_delivery` |
| Outcome verification | No real follow-up telemetry | Accelerated simulated before/after telemetry | `fallback:simulated_outcome` |
| OpenAI calls | API key missing, timeout, validation failure | Safe static response with visible fallback label | `fallback:static_ai_response` |

## Deterministic Demo Values

Use stable values so the same demo path produces the same agent decisions.

### Sensor Data

Default anomaly scenario:

```json
{
  "zone": "Zone B",
  "cropType": "mango_kesar",
  "soilMoisturePct": 21,
  "soilMoistureThresholdPct": 35,
  "temperatureC": 34.8,
  "humidityPct": 48,
  "tankLevelPct": 71,
  "robotBatteryPct": 81,
  "anomaly": "low_soil_moisture"
}
```

Expected downstream result:

- Sensor Agent flags Zone B as anomalous.
- Risk Agent scores urgency as warning or high depending on weather and memory.
- Planner Agent recommends irrigation or requests approval based on autonomy mode.

### Weather

Default planning forecast:

```json
{
  "zone": "Zone B",
  "rainProbabilityNext6h": 0.12,
  "rainExpectedMmNext6h": 0,
  "temperatureC": 31,
  "windKph": 8,
  "planningImpact": "No heavy rain expected; irrigation remains useful."
}
```

### Vision

Known demo leaf result:

```json
{
  "imageId": "leaf-demo-tomato-001",
  "cropType": "mango",
  "zoneId": "zone-b",
  "condition": "early_leaf_blight",
  "severity": "medium",
  "confidence": 0.86,
  "recommendation": "Assign robot inspection and ask farmer to review treatment before spraying.",
  "warnings": ["fallback:demo_vision_result"]
}
```

If the image cannot be analyzed and is not a known demo image, return a low-confidence fallback and require human review.

### Voice

English fallback:

```text
Zone B is dry, irrigation is scheduled, Robot R1 is inspecting the crop, and no heavy rain is expected in the next 6 hours.
```

Marathi fallback:

```text
Zone B madhye mati sukhi aahe. 12 minute drip sinchan scheduled aahe, Robot R1 tapasnisathi Zone B madhye aahe, ani pudhchya 6 tasat motha paus expected nahi.
```

### Communication

All communication fallbacks must still go through the Communication Gateway.

```json
{
  "severity": "warning",
  "preferredChannels": ["whatsapp", "telegram", "sms"],
  "selectedChannel": "whatsapp",
  "recipientRole": "farmer",
  "message": "Zone B moisture is critically low. Short irrigation has been scheduled and will be verified in 10 minutes.",
  "status": "simulated",
  "warnings": ["fallback:simulated_delivery"]
}
```

### Outcome Verification

Default accelerated follow-up:

```json
{
  "action": "schedule_irrigation",
  "zone": "Zone B",
  "baseline": {
    "soilMoisturePct": 21
  },
  "followUp": {
    "soilMoisturePct": 34
  },
  "outcomeStatus": "improved",
  "deltaPct": 13
}
```

## Human Review Rules

Fallback mode does not bypass safety. Set `requiresHumanReview` to `true` when:

- Risk level is high.
- Confidence is below `0.8`.
- The action may have irreversible real-world impact.
- Estimated cost is above the configured threshold.
- Provider uncertainty affects delivery, diagnosis, or action execution.

For demo-only auto-scheduling, restrict execution to simulated actions unless the user has explicitly enabled real integrations.

## Logging and Auditability

Every fallback event should be recorded in:

- Agent run trace.
- Timeline step output.
- Communication event log when a message is sent or simulated.
- Farm journal when a recommendation, approval, action, or outcome is produced.
- Evaluation metrics with `estimatedCostUsd: 0` and the relevant fallback warning.

## Test Checklist

- Sensor anomaly flow completes without live telemetry.
- Weather planning continues without a weather API key.
- Vision workflow returns the known demo result for the demo image.
- Voice workflow returns a text fallback and Marathi demo response.
- Communication creates a simulated delivery event without provider SDK calls from the frontend.
- Outcome verification shows before/after telemetry with a positive delta.
- OpenAI-disabled mode returns a safe static response and visible fallback label.
