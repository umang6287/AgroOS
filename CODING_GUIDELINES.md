# AgriOS Coding Guidelines

## 1. Purpose

These guidelines keep AgriOS consistent while it is built quickly during a hackathon. Optimize for a reliable demo, clear architecture, and readable code that makes the agentic system easy to extend.

## 2. Engineering Principles

- Build the main demo path first.
- Keep feature boundaries clear: frontend UI, backend API, simulator, agents, AI services, communication gateway, storage, and real-time transport.
- Prefer typed data contracts over ad hoc objects.
- Keep agent inputs and outputs JSON-compatible.
- Make failures visible and recoverable.
- Put OpenAI calls behind backend service wrappers.
- Use deterministic fallbacks for voice, vision, and sensor workflows.
- Treat weather, autonomy policy, communication, outcome verification, and farm memory as explicit product features.

## 3. Frontend Guidelines

- Use TypeScript.
- Use React functional components and hooks.
- Use Tailwind CSS for styling.
- Keep the first screen focused on the farm command center.
- Avoid a marketing landing page for the app experience.
- Use domain-oriented components: farm map, telemetry panel, agent timeline, action feed, voice panel, vision panel, evaluation scorecards.
- Include components for autonomy controls, explanation panels, communication center, outcome cards, weather context, and farm journal entries.
- Keep business logic out of presentational components.
- Prefer small custom hooks for WebSocket state, farm state, voice state, and upload state.
- Prefer small custom hooks for autonomy state, outcome state, and journal state when those flows become interactive.

Suggested frontend folders:

```text
frontend/
  app/
  components/
    farm/
    agents/
    actions/
    evaluations/
    vision/
    voice/
    weather/
    communications/
    outcomes/
    journal/
    ui/
  hooks/
  lib/
  types/
```

## 4. UI Guidelines

- Design the product like an operational command center.
- Prioritize scanability, status, and traceability.
- Make agent state visible: queued, running, completed, failed, needs review.
- Use clear visual states for normal, warning, and critical farm zones.
- Keep key demo controls obvious, especially "Call My Farm" and image upload.
- Provide text fallback for voice workflows.
- Provide visible autonomy mode and approval states.
- Show "Why this action?" evidence near recommendations.
- Show communication channel, message status, and delivery mode for outbound alerts.
- Show before and after values for outcome verification.
- Show weather context only when it changes or explains a plan.
- Avoid decorative UI that does not help the demo.
- Use Marathi demo text only where it supports the voice experience.

## 5. Backend Guidelines

- Use FastAPI.
- Use typed request and response models.
- Keep modules separated by responsibility.
- Validate all inbound payloads.
- Return structured errors.
- Add request IDs or run IDs to workflow responses.
- Store enough workflow state to recover the dashboard after refresh.

Suggested backend folders:

```text
backend/
  app/
    main.py
    api/
    agents/
    models/
    services/
    communications/
    simulator/
    storage/
    websocket/
    policy/
```

## 6. Agent Guidelines

All agents should return the same envelope shape unless a strong reason exists to extend it.

```json
{
  "agent": "planner",
  "status": "completed",
  "summary": "Irrigation scheduled for Zone B and Robot R1 assigned for inspection.",
  "confidence": 0.94,
  "latencyMs": 820,
  "estimatedCostUsd": 0.002,
  "requiresHumanReview": false,
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

Agent implementation rules:

- Name agents consistently: `sensor`, `weather`, `vision`, `risk`, `planner`, `robot`, `communication`, `outcome`, `voice`, `memory`, `evaluation`, `supervisor`.
- Keep prompts close to the agent or service that owns them.
- Validate model output before passing it to another agent.
- Record latency and cost for every AI-backed step.
- Return fallback output when an external service fails.
- Flag low-confidence outputs for human review.
- Include concise explanation evidence for recommendations.
- Include expected outcomes for actions that can be verified.
- Write important actions and verification results to the farm journal.
- Route outbound calls, SMS/mobile messages, WhatsApp messages, and Telegram messages through Communication Agent and Communication Gateway.

## 7. Communication Guidelines

Communication channels should be reliable, auditable, and demo-safe.

Supported channel ids:

- `in_app`
- `phone_call`
- `sms`
- `whatsapp`
- `telegram`

Implementation rules:

- Agents should request communication; they should not call provider SDKs directly.
- Use a Communication Gateway with provider adapters.
- Default to simulated delivery for hackathon demos.
- Enable real delivery only through explicit configuration.
- Store message text, channel, recipient role, status, source run, and provider metadata.
- Keep communication content concise and action-oriented.
- Include approve/reject context for approval messages.
- Do not block agent workflows if an external provider fails.
- Never expose provider tokens or bot credentials to the frontend.

Delivery statuses:

- `queued`
- `sent`
- `delivered`
- `failed`
- `simulated`

Escalation guidance:

- Use `in_app` for informational updates.
- Use `telegram` or `whatsapp` for warning-level farm alerts.
- Use `sms` or `phone_call` for critical alerts.
- Use farmer preference first when more than one channel is available.

## 8. Autonomy, Policy, and Safety Guidelines

Autonomy should be visible and predictable.

Supported demo modes:

- `observe_only`
- `recommend_actions`
- `auto_schedule_low_risk`
- `require_approval_high_risk`

Policy rules:

- Low-risk, high-confidence actions may be auto-scheduled in demo mode.
- High-risk actions must request approval.
- Low-confidence model outputs must request review.
- Actions with irreversible real-world consequences must never be silently executed.
- Every policy decision should include a short reason.
- High-risk approval requests should include the communication channel used.

Approval state values:

- `not_required`
- `pending`
- `approved`
- `rejected`
- `expired`

## 9. OpenAI Service Guidelines

- Never call OpenAI directly from the browser.
- Keep API keys in backend environment variables.
- Create service wrappers for text, vision, speech-to-text, and text-to-speech.
- Keep prompt templates versionable.
- Ask models for structured JSON when the output feeds another component.
- Log model name, latency, and estimated cost.
- Provide deterministic demo responses for critical flows.

## 10. Real-Time Guidelines

Use WebSockets for live farm and workflow updates.

Event names:

- `telemetry.updated`
- `agent.run.started`
- `agent.step.started`
- `agent.step.completed`
- `agent.step.failed`
- `action.created`
- `action.updated`
- `action.approval_requested`
- `communication.queued`
- `communication.sent`
- `communication.failed`
- `communication.simulated`
- `evaluation.updated`
- `weather.updated`
- `outcome.updated`
- `memory.entry.created`
- `voice.session.updated`

Event payload rules:

- Include `timestamp`.
- Include `runId` for workflow events.
- Include `zone` when the event is zone-specific.
- Include `actionId` for approval and outcome events.
- Include `communicationId` for communication events.
- Keep payloads JSON-compatible.
- Do not send raw image data through WebSocket.

## 11. Outcome and Memory Guidelines

Outcome verification should compare stored baseline state with later observed state.

Rules:

- Store baseline telemetry before an action.
- Store expected outcome and verification window.
- Simulate accelerated follow-up telemetry for demo speed.
- Classify outcomes as `pending`, `successful`, `partial`, `failed`, or `inconclusive`.
- Write outcome summaries to the farm journal.
- Let Voice Agent and Planner Agent read recent journal entries.

Farm journal entries should be short, timestamped, and actionable.

Example:

```json
{
  "type": "outcome_verified",
  "zone": "Zone B",
  "summary": "Irrigation improved soil moisture from 12% to 28%.",
  "relatedActionId": "action_001"
}
```

## 12. Demo Reliability Guidelines

- Keep the 5-minute demo path working at all times.
- Add fallback responses before adding polish.
- Ensure the app works without microphone permission.
- Ensure the app works with synthetic data only.
- Use a known demo image and known fallback analysis.
- Use deterministic mock weather.
- Use simulated delivery for communication channels unless a real provider is intentionally enabled.
- Use deterministic post-action telemetry for outcome verification.
- Keep autonomy mode defaults safe.
- Avoid introducing external services that are not necessary for the core story.

## 13. Testing Guidelines

Prioritize tests around contracts and demo-critical behavior.

Recommended test targets:

- Agent output schema validation.
- Sensor anomaly trigger.
- Planner action creation.
- Vision fallback output.
- Voice text fallback.
- WebSocket event serialization.
- Weather-aware planning branch.
- Communication gateway simulated delivery.
- Communication provider failure fallback.
- Autonomy policy approval branch.
- Outcome verification before and after comparison.
- Farm journal entry creation.

Manual verification before demo:

- Farm dashboard loads.
- Telemetry updates.
- Anomaly triggers agent timeline.
- Leaf upload returns analysis.
- "Call My Farm" returns a relevant response.
- Weather changes a recommendation or explanation.
- Communication event appears for a critical alert.
- High-risk action requests approval.
- Outcome verification shows before and after values.
- Evaluation metrics update.

## 14. Definition of Done

A feature is done when:

- It works in the main demo flow.
- It has loading, success, empty, and failure states where relevant.
- It records or emits agent/evaluation data when relevant.
- It records explanation, policy, and outcome data when relevant.
- It records communication audit data when relevant.
- It has a fallback if it depends on an external API.
- It fits the existing UI and data contracts.
- It does not require undocumented manual steps during the live demo.

## 15. Anti-Patterns

- Building disconnected AI features that do not feed the agent workflow.
- Hiding all reasoning in one model response.
- Letting UI components own backend or agent logic.
- Adding real hardware dependencies before the synthetic demo is solid.
- Creating voice-only flows with no text fallback.
- Shipping agent outputs that cannot be evaluated or traced.
- Auto-executing high-risk actions without an approval state.
- Claiming an action succeeded without checking before and after state.
- Adding weather context that does not affect recommendations or explanations.
- Calling WhatsApp, Telegram, SMS, or phone providers directly from UI components or agents.
- Making live external communication mandatory for the demo.
