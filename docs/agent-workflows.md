# Agent Workflows

This document expands the routing rules in `AGENTS.md` into implementation-ready
workflow notes. `AGENTS.md` remains the source of truth for agent responsibilities,
shared envelope fields, autonomy rules, and communication policy.

## Shared Rules

- The Supervisor Agent owns routing and run trace creation.
- Each agent returns the shared envelope documented in `api-contracts.md`.
- Agent outputs should include confidence, latency, estimated cost, data, and
  explanation evidence when a decision is meaningful.
- High-risk, low-confidence, expensive, or irreversible actions require human
  review.
- Demo fallbacks must be deterministic and visibly labeled in warnings or data.
- Communication must go through the Communication Gateway, never directly from
  frontend components.
- The synchronized simulation stream emits `simulation.tick` events with sensor
  and robot envelopes; REST-triggered sensor, vision, and voice workflows update
  the latest trace, scorecards, actions, communications, outcomes, and journal.

## Sensor Anomaly Workflow

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

Expected behavior:

- The simulator emits deterministic telemetry for the demo farm.
- Sensor Agent flags Zone B when soil moisture is below threshold.
- Weather Agent adds mock or live forecast context.
- Risk Agent combines sensor, weather, memory, and vision context.
- Planner Agent creates recommendations or schedules low-risk actions based on
  autonomy mode.
- Robot Agent assigns inspection when crop stress or disease uncertainty exists.
- Communication Agent simulates or sends farmer notification through the gateway.
- Outcome Agent stores baseline values and schedules follow-up verification.
- Evaluation Agent writes scorecards for confidence, latency, cost, quality, and
  review flags.
- Memory Agent records the journal entry for future planning.

## Vision Workflow

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

Expected behavior:

- Known demo images return deterministic fallback disease results.
- Unknown or low-confidence images require human review.
- Planner Agent should prefer inspection or treatment review before real-world
  spraying.
- The UI should show disease, severity, confidence, recommendation, and fallback
  label.

## Voice Workflow

```text
Call My Farm
-> Voice Agent
-> Memory Agent
-> Supervisor Agent
-> Voice Agent
```

Expected behavior:

- Voice Agent answers with active risks, scheduled actions, pending approvals,
  and verified outcomes.
- Marathi demo prompts can use text fallback and canned response.
- Audio providers are optional for the demo; text fallback is required.
- Optional browser audio can be sent as base64. The backend attempts
  transcription through `openai_service.py` when configured, otherwise the text
  prompt path remains active.

## Simulation Tick Workflow

```text
FastAPI lifespan
-> Simulation Engine
-> SQLite simulation_events
-> WebSocket /ws/farm
-> Frontend command center
```

Expected behavior:

- The simulation engine builds one synchronized farm snapshot per tick.
- Each snapshot includes zones, sensors, valves, trees, pump, water tank, robot
  waypoint, latest telemetry, admin alert feed, and a small simulation trace.
- Recent ticks are persisted in SQLite for reconnect and recovery.
- The WebSocket sends recent ticks on connect, then streams new ticks at
  `SIMULATION_TICK_SECONDS`.

## Outcome Verification Workflow

```text
Action Created
-> Outcome Agent stores baseline
-> Simulator emits follow-up telemetry
-> Outcome Agent compares before/after
-> Evaluation Agent scores success
-> Memory Agent writes journal entry
```

Expected behavior:

- The system can explain whether the action worked.
- The demo path should show before and after soil moisture values.
- Failed or unchanged outcomes should create review flags.

## Current Implementation Status

- Frontend command center consumes backend farm state, `/ws/farm` ticks, agent
  traces, evaluation scorecards, vision results, voice responses, and AI config
  status, with local mock fallback.
- Backend registers `/health`, `/farm/state`, `/agents/trace`,
  `/vision/analyze`, `/voice/ask`, `/evaluation/scorecards`, `/simulation/*`,
  `/ai/config/*`, and `/ws/farm`.
- Sensor anomaly workflow returns 10 steps:
  `supervisor -> sensor -> weather -> risk -> planner -> robot -> communication
  -> outcome -> evaluation -> memory`.
- Vision workflow returns 8 steps:
  `supervisor -> vision -> risk -> planner -> robot -> communication ->
  evaluation -> memory`.
- Voice workflow returns 4 steps:
  `voice -> memory -> supervisor -> voice`.
- Simulation ticks are persisted in SQLite through `DATABASE_URL` or
  `AGRIOS_SIMULATION_DB_PATH`.
- Agent traces, scorecards, workflow actions, communications, outcomes, and
  journal entries are stored in the in-memory demo store for the current process.
- Communication delivery is simulated through `communication_gateway.py`.
- OpenAI-backed copy, transcription, and TTS are optional and fall back to static
  demo-safe responses when not configured.

## Remaining Implementation Gaps

- Durable storage for full agent runs, action history, approvals,
  communications, outcomes, and journal entries.
- Mutation endpoints for approving or rejecting pending actions.
- Real provider adapters for weather, WhatsApp, Telegram, SMS, and phone calls.
- Real irrigation controller and robot dispatch integrations.
