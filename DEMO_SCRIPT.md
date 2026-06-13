# AgriOS Demo Script

## Demo Objective

Show AgriOS as an autonomous farm operating system that monitors farm health, coordinates specialized agents, acts on sensor and image evidence, verifies outcomes, evaluates itself, and communicates with the farmer through voice.

Target duration: 5 minutes.

## Presenter Setup

Before the demo starts:

- Open the farm command center.
- Ensure synthetic telemetry is running.
- Set autonomy mode to `Auto-schedule low-risk`.
- Confirm the mock weather scenario is active.
- Set communication delivery to demo mode unless a real channel is intentionally configured.
- Keep one demo leaf image ready.
- Confirm microphone or text fallback works.
- Know the exact Marathi question for the voice scene.

## Opening, 20 Seconds

Say:

"AgriOS is an autonomous farm operating system. It monitors farm conditions, analyzes crop health, plans irrigation and inspections, coordinates robots, evaluates every agent action, and communicates with the farmer through voice."

Show:

- Farm command center
- Live telemetry
- Agent timeline area
- Actions feed
- Autonomy mode control
- Communication center or alert feed
- Evaluation and outcome area

Judge takeaway:

This is not a static farm dashboard. It is an AI-native operating layer.

## Scene 1: Farm Digital Twin, 35 Seconds

Show:

- Farm zones
- Sensor readings
- Robot position
- Zone health indicators
- Tank and battery status

Say:

"This is the live farm digital twin. AgriOS keeps track of zones, sensors, robots, and operational health so the farmer can understand the farm at a glance."

Expected result:

- Judges see the current farm state immediately.
- The UI feels operational and live.

## Scene 2: Sensor Anomaly, 40 Seconds

Show:

- Zone B moisture drops to a critical value.
- Example: `Moisture = 12%`
- The timeline begins a new workflow.

Say:

"A sensor anomaly has appeared in Zone B. The Sensor Agent interprets the telemetry and passes structured context to the Risk Agent."

Expected result:

- Sensor Agent enters running or completed state.
- Risk Agent appears in the workflow.
- Dashboard highlights Zone B.

Judge takeaway:

The system reacts to real-time farm conditions.

## Scene 3: Agent Orchestration, 45 Seconds

Show:

```text
Sensor Agent
-> Weather Agent
-> Risk Agent
-> Planner Agent
-> Robot Agent
-> Communication Agent
-> Outcome Agent
-> Evaluation Agent
```

Say:

"The Supervisor Agent coordinates specialized domain agents. It brings together telemetry, weather, farm memory, and policy before it recommends or schedules an action."

Expected result:

- Planner Agent creates an irrigation recommendation.
- Robot Agent assigns inspection if needed.
- Communication Agent prepares the farmer alert.
- Outcome Agent schedules follow-up verification.
- Evaluation metrics update.

Judge takeaway:

The product makes agent orchestration visible and traceable.

## Scene 4: Weather-Aware Autonomy, 45 Seconds

Show:

- Mock weather insight.
- Autonomy mode.
- Explanation panel.
- Actions feed.
- Communication event.

Example:

```text
Weather: Light rain expected in 6 hours
Policy: Auto-schedule low-risk actions
Decision: Schedule short irrigation now, verify moisture after 10 minutes
Communication: WhatsApp alert simulated for farmer
Why: Moisture is critically low and heat remains high before rain arrives
```

Say:

"The planner does not act blindly. It checks weather context, farm history, and the autonomy policy. Low-risk actions can be scheduled automatically, while high-risk actions require farmer approval."

Expected result:

- A timestamped irrigation action appears.
- The "Why this action?" panel lists evidence.
- A WhatsApp, Telegram, SMS, or call event appears in simulated or sent state.
- The action includes a pending outcome check.

Judge takeaway:

AgriOS balances autonomy with explainability and safety.

## Scene 5: Vision Analysis, 45 Seconds

Show:

- Leaf image upload
- Image preview
- Vision result
- Timeline update

Example result:

```text
Disease: Fungal infection
Severity: Medium
Confidence: 87%
Recommendation: Assign Robot R1 for inspection
```

Say:

"AgriOS is multimodal. I can upload a leaf image, the Vision Agent analyzes crop health, and the result feeds the same risk and planning workflow."

Expected result:

- Vision Agent completes analysis.
- Risk Agent and Planner Agent update.
- Inspection action is created or recommended.

Judge takeaway:

The system combines image intelligence with operational planning.

## Scene 6: Call My Farm, 55 Seconds

Show:

- `CALL MY FARM` button
- Incoming-call style state or voice panel
- Voice or text response

Say:

"Now for the farmer experience. Instead of reading every panel, the farmer can simply call the farm."

Ask:

```text
माझ्या बागेला आज काय लक्ष द्यायचं आहे?
```

Expected AgriOS response:

```text
Zone B मधील मातीतील आर्द्रता कमी आहे. सिंचन नियोजित केले आहे.
दोन झाडांमध्ये बुरशीजन्य संसर्गाची लक्षणे दिसत आहेत.
Robot R1 तपासणीसाठी नियुक्त केला आहे.
```

Say:

"The voice agent summarizes the current farm state, planned actions, weather-aware reasoning, pending approvals, and inspection priorities in the farmer's language. The same communication layer can also send a mobile message, WhatsApp alert, Telegram bot message, or phone call depending on urgency."

Judge takeaway:

This is an AI-native UX: conversational, contextual, and connected to live system state.

## Scene 7: Outcome Verification and Evaluation, 45 Seconds

Show:

```text
Outcome: Successful
Zone B moisture: 12% -> 28%
Planner Accuracy: 96%
Vision Confidence: 88%
Voice Response Quality: 92%
Average Response Time: 1.1s
Average Cost: $0.002
```

Say:

"The system does not stop at recommendations. It checks whether the action worked, records the result in the farm journal, and evaluates the agents involved."

Expected result:

- Before and after telemetry is visible.
- A farm journal entry is visible.
- Per-agent scorecards are visible.
- Confidence, latency, and cost are visible.
- Any review flags are visible.

Judge takeaway:

AgriOS closes the loop from observation to action to verified outcome.

## Closing, 20 Seconds

Say:

"AgriOS shows what farm software looks like when it is built around agents instead of forms. It monitors, reasons, plans, acts, evaluates itself, and communicates with the farmer in natural language."

## Backup Plan

If microphone fails:

- Use the text fallback in the voice panel.
- Say: "For demo reliability, the same Voice Agent works through text when microphone permissions are unavailable."

If OpenAI vision call fails:

- Use deterministic fallback output for the demo image.
- Say: "The architecture supports live AI calls, and this fallback keeps the demo path reliable."

If weather or outcome timing is slow:

- Use the deterministic mock weather and simulated post-action telemetry.
- Say: "For demo speed, the same verification flow is accelerated with simulated time."

If external messaging is not configured:

- Use simulated delivery in the communication center.
- Say: "The communication gateway supports real providers, but demo mode keeps the judging flow reliable and avoids depending on provider credentials."

If WebSocket disconnects:

- Refresh the page.
- Continue from the latest stored farm state if available.

## Likely Judge Questions

### Is this using real sensor data?

Answer:

"For the hackathon demo, telemetry is synthetic but realistic. The architecture is designed so real IoT data can replace the simulator without changing the agent workflows."

### Why use agents instead of one model call?

Answer:

"Each agent has a clear domain responsibility. That makes the system easier to evaluate, debug, and extend. It also lets us show the decision trace instead of hiding everything inside one response."

### What makes this multimodal?

Answer:

"The system combines sensor telemetry, crop images, text, and speech. The same planning layer can respond to all of those inputs."

### What makes this more than a recommendation engine?

Answer:

"AgriOS closes the loop. It recommends or schedules an action, verifies whether the farm state improved, writes the result into memory, and uses that history in future planning."

### Is the weather data real?

Answer:

"For the hackathon demo it can be mocked for reliability, but the Weather Agent is isolated so a live forecast API can replace the mock provider later."

### How do you prevent unsafe autonomous actions?

Answer:

"Actions are traceable, confidence-scored, and evaluated. Higher-risk actions can be routed to human review before execution."

### Are WhatsApp, Telegram, SMS, and phone calls real?

Answer:

"The product has a Communication Agent and gateway designed for those channels. For the hackathon demo, I can run them in simulated mode or enable one real channel if credentials are ready. The important architecture choice is that agents do not call providers directly; they request communication through a logged, auditable gateway."

### What would production deployment require?

Answer:

"Real sensor ingestion, farm-specific calibration, persistent storage, weather integration, permissions, and integration with actual irrigation or robot systems."

### What did Codex help build?

Answer:

"Codex helped turn the product requirements into working application structure, agent contracts, UI flows, and demo-ready implementation details."
