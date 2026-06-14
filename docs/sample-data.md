# Sample Data

This document defines deterministic sample data for AgriOS demos, local development, and tests. Values should be stable unless a fixture intentionally models a follow-up state.

## Farm

```json
{
  "farmId": "demo-farm",
  "name": "Ratnagiri Mango Estate",
  "location": {
    "village": "Ratnagiri",
    "state": "Maharashtra",
    "country": "India"
  },
  "autonomyMode": "auto_schedule_low_risk",
  "farmer": {
    "name": "Asha Patil",
    "preferredChannels": ["whatsapp", "telegram", "in_app"],
    "language": "mr-IN"
  }
}
```

## Zones

```json
[
  {
    "id": "zone-a",
    "name": "Zone A",
    "cropType": "mango_alphonso",
    "variety": "Alphonso",
    "treeCount": 168,
    "areaAcres": 1.2,
    "soilMoistureThresholdPct": 32
  },
  {
    "id": "zone-b",
    "name": "Zone B",
    "cropType": "mango_kesar",
    "variety": "Kesar",
    "treeCount": 144,
    "areaAcres": 0.9,
    "soilMoistureThresholdPct": 35
  },
  {
    "id": "zone-c",
    "name": "Zone C",
    "cropType": "mango_dasheri",
    "variety": "Dasheri",
    "treeCount": 156,
    "areaAcres": 1.5,
    "soilMoistureThresholdPct": 30
  },
  {
    "id": "zone-d",
    "name": "Zone D",
    "cropType": "mango_young_grafts",
    "variety": "Young grafts",
    "treeCount": 96,
    "areaAcres": 0.7,
    "soilMoistureThresholdPct": 34
  }
]
```

## Sensor Telemetry

Use this fixture to trigger the sensor anomaly workflow.

```json
{
  "eventId": "evt-sensor-001",
  "timestamp": "2026-06-14T02:00:00+05:30",
  "zoneId": "zone-b",
  "soilMoisturePct": 21,
  "soilMoistureThresholdPct": 35,
  "temperatureC": 34.8,
  "humidityPct": 48,
  "tankLevelPct": 71,
  "robot": {
    "robotId": "robot-r1",
    "batteryPct": 81,
    "status": "assigned",
    "currentWaypointId": "zone-b-sensor",
    "currentZoneId": "zone-b"
  }
}
```

## Simulation Tick

`/ws/farm` and `/simulation/events` use this top-level shape.

```json
{
  "type": "simulation.tick",
  "eventId": "evt-sim-29676030",
  "sequence": 29676030,
  "createdAt": "2026-06-14T02:00:00+00:00",
  "data": {
    "farmState": {},
    "telemetry": {},
    "sensorEnvelope": {},
    "robotEnvelope": {},
    "agentTrace": {}
  }
}
```

Expected sensor summary:

```json
{
  "agent": "sensor",
  "status": "completed",
  "summary": "Zone B soil moisture is critically low at 21%.",
  "confidence": 0.97,
  "latencyMs": 120,
  "estimatedCostUsd": 0,
  "requiresHumanReview": false,
  "data": {
    "zoneId": "zone-b",
    "anomaly": "low_soil_moisture",
    "severity": "critical"
  }
}
```

## Weather Forecast

```json
{
  "provider": "mock-weather",
  "location": "Rahuri, Maharashtra",
  "generatedAt": "2026-06-14T02:00:00+05:30",
  "forecast": [
    {
      "hourOffset": 1,
      "rainProbabilityPct": 5,
      "expectedRainMm": 0,
      "temperatureC": 35.1
    },
    {
      "hourOffset": 3,
      "rainProbabilityPct": 8,
      "expectedRainMm": 0,
      "temperatureC": 35.6
    },
    {
      "hourOffset": 6,
      "rainProbabilityPct": 12,
      "expectedRainMm": 0.4,
      "temperatureC": 33.9
    }
  ]
}
```

## Vision Result

Use this as the known fallback for the demo leaf image.

```json
{
  "imageId": "leaf-demo-tomato-001",
  "cropType": "mango",
  "zoneId": "zone-b",
  "agent": "vision",
  "status": "fallback",
  "summary": "Possible early blight detected on the demo leaf image.",
  "confidence": 0.86,
  "latencyMs": 940,
  "estimatedCostUsd": 0,
  "requiresHumanReview": false,
  "warnings": ["fallback:demo_vision_result"],
  "data": {
    "disease": "early_blight",
    "severity": "medium",
    "recommendation": "Assign robot inspection and ask farmer to review treatment before spraying.",
    "fallback": true
  }
}
```

## Recommended Action

```json
{
  "actionId": "act-irrigate-zone-b-001",
  "type": "schedule_irrigation",
  "zoneId": "zone-b",
  "priority": "high",
  "durationMinutes": 12,
  "status": "scheduled",
  "expectedOutcome": {
    "metric": "soilMoisturePct",
    "targetValue": 34,
    "verificationWindowMinutes": 10
  }
}
```

## Communication Event

```json
{
  "communicationId": "comm-001",
  "severity": "critical",
  "preferredChannels": ["whatsapp", "telegram", "in_app"],
  "selectedChannel": "whatsapp",
  "recipientRole": "farmer",
  "message": "Zone B moisture is critically low. Short irrigation has been scheduled and will be verified in 10 minutes.",
  "status": "simulated"
}
```

## Outcome Verification

```json
{
  "outcomeId": "outcome-zone-b-001",
  "actionId": "act-irrigate-zone-b-001",
  "baseline": {
    "timestamp": "2026-06-14T02:00:00+05:30",
    "soilMoisturePct": 21
  },
  "followUp": {
    "timestamp": "2026-06-14T02:10:00+05:30",
    "soilMoisturePct": 34
  },
  "status": "improved",
  "summary": "Zone B moisture increased from 21% to 34% after irrigation."
}
```

## Voice Demo Response

```json
{
  "language": "mr-IN",
  "prompt": "Call my farm",
  "response": "\u0924\u0941\u092e\u091a\u094d\u092f\u093e \u0936\u0947\u0924\u093e\u0924 Zone B \u092e\u0927\u094d\u092f\u0947 \u0913\u0932\u093e\u0935\u093e \u0915\u092e\u0940 \u0939\u094b\u0924\u093e. 12 \u092e\u093f\u0928\u093f\u091f\u093e\u0902\u091a\u0947 \u0938\u093f\u0902\u091a\u0928 \u0936\u0947\u0921\u094d\u092f\u0942\u0932 \u0915\u0947\u0932\u0947 \u0906\u0939\u0947 \u0906\u0923\u093f 10 \u092e\u093f\u0928\u093f\u091f\u093e\u0902\u0924 \u092a\u0921\u0924\u093e\u0933\u0923\u0940 \u0939\u094b\u0908\u0932. Robot R1 \u0924\u092a\u093e\u0938\u0923\u0940\u0938\u093e\u0920\u0940 \u0909\u092a\u0932\u092c\u094d\u0927 \u0906\u0939\u0947."
}
```

## AI Config Status

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
