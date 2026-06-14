# AgriOS Tasks

This backlog translates `AGENTS.md`, `ARCHITECTURE.md`, and the demo requirements into implementation tasks. Keep tasks small, testable, and demo-safe.

## Priority Legend

- `P0`: Required for the hackathon demo path.
- `P1`: Important for product completeness.
- `P2`: Polish, hardening, or future expansion.

## P0 Demo-Critical Tasks

- [x] Verify every backend agent returns the shared output envelope with `agent`, `status`, `summary`, `confidence`, `latencyMs`, `estimatedCostUsd`, `requiresHumanReview`, and `data`.
- [x] Ensure the Supervisor Agent records a step-by-step run trace for sensor anomaly, vision, and voice workflows.
- [x] Confirm sensor anomaly routing follows: Simulator -> Supervisor -> Sensor -> Weather -> Risk -> Planner -> Robot -> Communication -> Outcome -> Evaluation -> Memory.
- [x] Confirm vision routing follows: Leaf Upload -> Supervisor -> Vision -> Risk -> Planner -> Robot -> Communication -> Evaluation -> Memory.
- [x] Confirm voice routing follows: Call My Farm -> Voice -> Memory -> Supervisor -> Voice.
- [x] Confirm outcome verification stores baseline telemetry and compares it with accelerated follow-up telemetry.
- [x] Keep deterministic fallbacks active for sensor data, weather, vision, voice, communication, outcome verification, and OpenAI calls.
- [ ] Validate autonomy rules for `observe_only`, `recommend_actions`, `auto_schedule_low_risk`, and `require_approval_high_risk`.
- [ ] Require human review when risk is high, confidence is below `0.8`, estimated cost exceeds threshold, or provider output is uncertain.
- [x] Route all outbound farmer notifications through `communication_gateway.py`.
- [x] Show active agent trace, risk state, recommended action, communication status, and evaluation summary in the command center UI.
- [x] Support the Marathi voice demo path with text fallback and canned audio or response.

## Agent Implementation

- [x] Sensor Agent: normalize telemetry, detect threshold anomalies, and explain anomaly causes.
- [x] Weather Agent: provide mock forecast context and planning impact for each zone.
- [x] Vision Agent: classify known demo leaf images with disease, severity, confidence, and recommendation.
- [x] Risk Agent: combine sensor, weather, vision, and memory context into a risk level and next step.
- [x] Planner Agent: convert risk outputs into recommended actions with expected outcomes.
- [x] Robot Agent: assign inspection tasks based on planner output and robot availability.
- [x] Communication Agent: select channel by farmer preference and severity, then call the communication gateway.
- [x] Outcome Agent: store action baselines and compare before/after telemetry.
- [x] Voice Agent: summarize farm state, risks, actions, approvals, and verified outcomes.
- [x] Memory Agent: write farm journal entries for actions, approvals, outcomes, and analyses.
- [x] Evaluation Agent: score confidence, latency, cost, quality, and review flags.
- [ ] Evaluation Agent: extend scoring to aggregate review rate, action success, delivery success, and verification success over durable history.

## Backend API And Services

- [x] Add or verify API contracts for agent runs, farm state, vision upload, voice status, evaluation metrics, simulation, AI config, and communication events.
- [ ] Validate model or fallback responses before passing data between agents.
- [x] Store latest agent run and steps for timeline recovery in the in-memory demo store.
- [x] Store communication events for demo auditability in the in-memory demo store.
- [x] Store farm journal entries for memory-backed planning in the in-memory demo store.
- [x] Ensure OpenAI access is isolated in `openai_service.py` with safe static fallback responses.
- [x] Ensure provider credentials are never exposed to the frontend.
- [x] Add health checks and AI configuration status for backend readiness and demo dependency status.
- [x] Persist recent synchronized simulation ticks in SQLite.
- [ ] Move agent runs, communication events, outcomes, and journal entries to durable database tables.

## Frontend Experience

- [ ] Keep the command center as the first screen and make demo state visible without setup.
- [ ] Show live telemetry for soil moisture, temperature, humidity, tank level, and robot status.
- [ ] Show zone-level risk, recommended action, autonomy mode, and pending approvals.
- [ ] Display agent timeline steps with status, confidence, latency, estimated cost, and explanation evidence.
- [x] Show communication channel, message, and simulated delivery status.
- [x] Show before/after outcome verification values after actions run.
- [x] Include vision upload with healthy and diseased demo image paths.
- [x] Include voice farm manager transcript and Marathi demo response.
- [x] Add clear empty, loading, and fallback states for demo flows.
- [x] Add OpenAI configuration status and key validation flow.
- [x] Add farm admin alert feed with notification, action, approval, and performance views.

## Tests

- [x] Test shared agent envelope validation for every agent.
- [x] Test deterministic simulator output for demo scenarios.
- [x] Test risk escalation and human-review rules.
- [ ] Test planner behavior for each autonomy mode.
- [x] Test communication gateway simulation and channel selection.
- [x] Test outcome verification before/after comparison.
- [x] Test memory journal writes after actions and outcomes.
- [x] Test evaluation scorecard generation for completed workflows.
- [x] Test API contracts for farm state, agent trace, vision, voice, evaluation, simulation, and AI config.
- [ ] Add frontend smoke checks for command center, vision, and voice panels.

## Documentation

- [ ] Keep `AGENTS.md` as the source of truth for agent responsibilities and contracts.
- [x] Keep `docs/agent-workflows.md` aligned with implemented workflow routing.
- [x] Keep `docs/api-contracts.md` aligned with backend response models.
- [x] Keep `docs/demo-fallbacks.md` aligned with deterministic fallback behavior.
- [ ] Keep `DEMO_SCRIPT.md` aligned with available UI controls and backend routes.
- [ ] Document local run steps for backend, frontend, simulator, and demo reset.

## Future Enhancements

- [ ] Add durable database storage for agent traces, communication events, outcomes, approvals, and farm journal entries.
- [ ] Add real weather provider integration behind the weather service wrapper.
- [ ] Add real WhatsApp, Telegram, SMS, and phone-call delivery behind the communication gateway.
- [ ] Add richer crop disease detection with calibrated confidence and image quality checks.
- [ ] Add approval workflows with farmer identity, timestamp, and audit trail.
- [ ] Add multi-farm and multi-user support.
- [ ] Add production monitoring for latency, cost, failures, and fallback usage.
