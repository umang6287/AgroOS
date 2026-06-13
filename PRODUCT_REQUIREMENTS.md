# AgriOS Product Requirements

## 1. Overview

AgriOS is an autonomous farm operating system for mango farms. It combines a live farm digital twin, synthetic sensor telemetry, crop image analysis, multi-agent planning, voice interaction, and agent evaluation into one command center.

The hackathon version should prove the core product idea: a farmer or supervisor can see what is happening, understand why the system is acting, and talk to the farm manager in natural language.

## 2. Product Positioning

AgriOS is not a generic farm dashboard. It is an AI-native operations layer that turns farm signals into traceable decisions and actions.

Core promise:

- Monitor farm conditions in real time.
- Detect operational risk from sensors and images.
- Coordinate specialized AI agents.
- Recommend or schedule actions.
- Explain the farm state through a voice manager.
- Notify the farmer through the right communication channel.
- Evaluate every agent step for confidence, latency, cost, and review risk.
- Verify whether actions improved the farm state.
- Adjust autonomy based on action risk and farmer approval settings.
- Use weather and farm history as planning context.

## 3. Problem Statement

Farm operations are often managed through fragmented observations: sensor readings in one place, crop inspections in another, irrigation decisions in memory, and field-worker or robot tasks handled manually. This makes it hard to react quickly, audit decisions, or explain why an action was taken.

AgriOS connects telemetry, visual evidence, planning, and communication in one workflow. Instead of forcing a farmer to interpret raw dashboards, it acts like a farm operations manager that can observe, reason, plan, and explain.

## 4. Target Users

- Mango farmers who need practical daily guidance.
- Farm supervisors managing irrigation, inspections, and labor or robot tasks.
- Agricultural consultants reviewing crop risk and recommendations.
- Hackathon judges evaluating agentic, multimodal, and AI-native product execution.

## 5. Hackathon Theme Alignment

- Agentic applications: a supervisor coordinates specialized agents across farm workflows.
- Domain agents: sensor, weather, vision, risk, planner, robot, communication, outcome, voice, memory, and evaluation agents each own a clear responsibility.
- Multimodal intelligence: the product uses telemetry, images, text, and speech.
- Agent evaluation: every important agent decision exposes confidence, latency, cost, and review signals.
- AI-native UX: users can call the farm manager instead of reading every dashboard panel.
- Closed-loop autonomy: the system verifies whether actions worked and explains follow-up decisions.

## 6. MVP Scope

### In Scope

- Farm command center with digital twin view.
- Synthetic real-time sensor stream.
- Multi-agent execution timeline.
- Leaf image upload and disease-style analysis.
- "Call My Farm" voice or text experience with Marathi demo support.
- Agent evaluation dashboard.
- Autonomous actions feed.
- Weather-aware planning with mocked or API-backed forecast data.
- Outcome verification after planned actions.
- Autonomy mode controls and human approval for high-risk actions.
- Communication channels for in-app call, phone call, SMS/mobile message, WhatsApp, and Telegram.
- Farm memory and journal entries for past actions.
- Explainability panel for each recommendation.
- Demo-ready fallback data and responses.

### Out of Scope for Hackathon MVP

- Real IoT hardware integration.
- Real irrigation controller integration.
- Real robot dispatch APIs.
- Production-grade weather integration.
- Production-grade telecom, WhatsApp, or Telegram compliance workflows.
- Production authentication and billing.
- Long-term agronomic model calibration.
- Regulatory or insurance-grade recommendations.

## 7. Core Product Flows

### 7.1 Sensor Anomaly to Action

1. Synthetic telemetry reports low soil moisture in Zone B.
2. Sensor Agent summarizes the anomaly.
3. Risk Agent scores urgency and operational risk.
4. Planner Agent recommends irrigation.
5. Robot Agent assigns an inspection task if needed.
6. Evaluation Agent scores the workflow.
7. Dashboard shows the action, trace, and metrics.

### 7.2 Leaf Image to Inspection Plan

1. User uploads a leaf image.
2. Vision Agent detects likely disease, severity, and confidence.
3. Risk Agent combines image result with farm context.
4. Planner Agent recommends inspection or treatment review.
5. Actions feed records the recommendation.
6. Evaluation dashboard updates confidence and review flags.

### 7.3 Call My Farm

1. User clicks "Call My Farm".
2. User asks what needs attention today.
3. Voice Agent summarizes the latest telemetry, vision results, and planned actions.
4. User receives a spoken or text response in the demo language.

Example Marathi prompt:

```text
माझ्या बागेला आज काय लक्ष द्यायचं आहे?
```

Example response:

```text
Zone B मधील मातीतील आर्द्रता कमी आहे. सिंचन नियोजित केले आहे.
दोन झाडांमध्ये बुरशीजन्य संसर्गाची लक्षणे दिसत आहेत.
Robot R1 तपासणीसाठी नियुक्त केला आहे.
```

### 7.4 Weather-Aware Planning

1. Weather Agent provides a short forecast summary.
2. Risk Agent combines forecast, moisture, temperature, and farm history.
3. Planner Agent decides whether to irrigate immediately, delay, or request approval.
4. Explainability panel shows why the plan changed.

Example:

```text
Rain expected in 6 hours.
Recommendation: delay irrigation unless moisture drops below 10%.
Reason: low moisture risk is high, but near-term rainfall reduces water usage need.
```

### 7.5 Outcome Verification

1. An action is scheduled, such as irrigation for Zone B.
2. Outcome Agent watches follow-up telemetry.
3. System compares before and after values.
4. Farm journal records whether the action worked.
5. Evaluation dashboard updates the workflow outcome.

Example:

```text
Before action: Zone B moisture 12%
After action: Zone B moisture 28%
Outcome: Successful
```

### 7.6 Autonomy and Human Approval

1. User selects an autonomy mode.
2. Low-risk actions can be auto-scheduled.
3. High-risk or uncertain actions require approval.
4. Voice Agent can explain what is waiting for approval.

Autonomy modes:

- Observe only
- Recommend actions
- Auto-schedule low-risk actions
- Require approval for high-risk actions

### 7.7 Farmer Communication Escalation

1. A critical or high-priority event occurs.
2. Communication Agent selects a channel based on urgency and farmer preference.
3. Low-risk updates can appear in-app or through Telegram.
4. High-priority alerts can use mobile message, WhatsApp, or phone call.
5. Every outbound communication is logged with status and source workflow.

Example escalation policy:

```text
Info: in-app notification
Warning: Telegram or WhatsApp message
Critical: mobile message plus phone call
Approval needed: WhatsApp or Telegram with approve/reject action
```

## 8. Functional Requirements

### 8.1 Farm Digital Twin

- Display farm zones, sensor positions, robot position, and zone health.
- Show live values for moisture, temperature, humidity, tank level, and robot battery.
- Highlight critical or warning states visually.
- Allow the user to understand the farm state within 30 seconds.

### 8.2 Synthetic Sensor Stream

- Generate realistic sensor values every few seconds.
- Include normal trends and deterministic demo anomalies.
- Trigger at least one low-moisture workflow during the demo.
- Broadcast updates to the frontend through WebSockets or an equivalent real-time channel.

### 8.3 Agent Orchestration

- Represent the workflow as a sequence of agent steps.
- Include Weather Agent, Outcome Agent, and Memory Agent in relevant workflows.
- Show status for each agent: queued, running, completed, failed, or needs review.
- Store structured input and output for each step.
- Capture confidence, latency, and estimated cost.
- Make the Supervisor Agent visible as the coordinator.

### 8.4 Vision Analysis

- Accept image upload.
- Show image preview.
- Return disease or healthy-state assessment.
- Return severity, confidence, and recommended action.
- Trigger downstream risk and planning steps.

Example output:

```json
{
  "agent": "vision",
  "status": "completed",
  "disease": "Fungal infection",
  "severity": "medium",
  "confidence": 0.87,
  "recommendation": "Assign Robot R1 for inspection and schedule treatment review."
}
```

### 8.5 Voice Farm Manager

- Provide a prominent "Call My Farm" entry point.
- Support browser microphone when available.
- Provide text input fallback.
- Support Marathi demo prompt and response.
- Answer from current farm state, not generic farming advice.
- Summarize actions already taken and actions awaiting approval.
- Hand off urgent summaries to the Communication Agent when the farmer should be notified outside the app.

### 8.6 Agent Evaluation Dashboard

- Display scorecards for Sensor, Vision, Risk, Planner, Robot, Voice, and Evaluation agents.
- Track confidence, latency, estimated cost, output quality, and review flags.
- Show recent workflow failures or uncertain outputs.
- Make evaluation feel like part of the product, not a debug panel.

### 8.7 Autonomous Actions Feed

- Show timestamped actions.
- Include action type, zone, priority, status, and source workflow.
- Distinguish scheduled, active, completed, failed, and needs-review actions.
- Allow judges to connect each action back to the agent trace.

### 8.8 Weather Agent

- Provide forecast context for demo scenarios.
- Support deterministic mock forecast data.
- Influence irrigation recommendations.
- Show weather rationale in the explanation panel.

### 8.9 Outcome Verification

- Track before and after telemetry for scheduled actions.
- Determine whether the expected farm-state improvement occurred.
- Record outcome status: pending, successful, partial, failed, or inconclusive.
- Feed outcome results into the evaluation dashboard and farm journal.

### 8.10 Autonomy Mode and Human Approval

- Provide visible autonomy mode controls.
- Allow safe demo modes: observe, recommend, auto-schedule low-risk, approval required.
- Require approval when confidence is low or risk is high.
- Show pending approvals in the actions feed and voice summary.

### 8.11 Farm Memory and Explainability

- Record important actions, analyses, outcomes, and approvals in a farm journal.
- Use recent history to improve voice summaries and planner context.
- Show a "Why this action?" explanation for recommendations.
- Include evidence such as sensor thresholds, forecast, image findings, and prior outcomes.

### 8.12 Communication Agent

- Support channel types: in-app voice call, phone call, SMS/mobile message, WhatsApp, and Telegram bot.
- Select the channel based on urgency, farmer preference, and demo configuration.
- Generate concise, farmer-readable alert text.
- Include action context, zone, severity, and next step.
- Track delivery state: queued, sent, delivered, failed, or simulated.
- Keep a communication audit trail tied to the originating agent run.
- Provide mock delivery mode so the demo does not depend on external provider availability.

## 9. Non-Functional Requirements

- Demo path must be reliable without external hardware.
- UI must look production-quality and operational.
- Critical interactions must have deterministic fallback data.
- The system must be usable on a laptop screen and reasonable mobile widths.
- OpenAI API calls must be isolated behind backend services.
- Agent outputs must be inspectable and JSON-compatible.
- The app must degrade gracefully when microphone or API access is unavailable.
- Autonomy decisions must be explainable and visible to the user.
- Outcome verification must rely on stored before and after state, not only generated text.
- External communication must respect configured channel preferences and demo-safe consent.
- Messaging failures must not block the core dashboard workflow.

## 10. Success Metrics

- A judge understands the product idea in under 60 seconds.
- Sensor anomaly flow visibly triggers multiple agents.
- Leaf image flow visibly triggers vision, risk, and planning steps.
- "Call My Farm" produces a relevant farm-state answer during the demo.
- Evaluation metrics update after agent workflows.
- Weather context changes at least one recommendation during the demo.
- Outcome verification shows whether irrigation improved moisture.
- A high-risk or low-confidence action enters approval state instead of auto-executing.
- A critical event produces a visible communication event on at least one channel.
- The full demo completes in under 5 minutes.
- The product clearly shows why agents matter.

## 11. User Stories

- As a farmer, I want to ask what needs attention today so I can prioritize my work.
- As a farm supervisor, I want sensor anomalies converted into planned actions.
- As an agricultural consultant, I want crop image analysis connected to operational recommendations.
- As a farmer, I want Marathi support so the assistant feels usable in my context.
- As a farmer, I want to approve high-risk actions before the system proceeds.
- As a farmer, I want urgent alerts on the channel I actually use.
- As a supervisor, I want WhatsApp or Telegram alerts for important farm events.
- As a supervisor, I want to know whether an action actually improved the farm state.
- As a consultant, I want recommendations to explain the evidence behind them.
- As a judge, I want to see agent traces and evaluations so I can trust the system is not a black box.

## 12. Acceptance Criteria

- The home screen opens directly to the farm command center.
- At least one synthetic anomaly appears during a demo run.
- The agent timeline updates from anomaly detection to planned action.
- A leaf image upload produces a visible analysis result and timeline update.
- The "Call My Farm" flow works with microphone or text fallback.
- The evaluation dashboard shows per-agent metrics.
- Autonomous actions are visible and tied to workflow traces.
- Weather-aware planning is visible in at least one recommendation.
- Outcome verification records a before and after result.
- Autonomy mode and approval state are visible in the UI.
- Each major recommendation includes a short explanation.
- Communication Agent logs one in-app, WhatsApp, Telegram, mobile message, or call event.

## 13. Future Roadmap

- Replace synthetic telemetry with real IoT ingestion.
- Add real irrigation controller integration.
- Add real robot task APIs.
- Add farm-specific memory and historical trend analysis.
- Integrate weather forecasts and market data.
- Add human approval policies by action risk level.
- Add multilingual support beyond Marathi.
- Add offline-first mobile workflows for field workers.
