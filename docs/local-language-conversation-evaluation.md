# Local-Language Conversation Evaluation

AgriOS evaluates local-language Conversation AI and Voice AI as a measured product signal, not as an inferred model-confidence proxy.

## Scope

This process applies to farmer-facing voice and chat answers in:

- English (`en`)
- Marathi (`mr`)
- Hindi (`hi`)
- Gujarati (`gu`)

The evaluator is designed for production hardening of farm operations answers. It checks whether the answer is in the selected language, answers the farmer's intent, and stays grounded in the current farm-state JSON.

## Source Of Truth

The evaluator compares each answer against structured context, not against another free-form answer:

- latest zone telemetry
- risk levels
- active actions
- robot state
- pending approvals
- communication events
- verified outcomes
- selected language
- farmer prompt and transcription

This prevents a fluent local-language answer from scoring well when it says incorrect farm facts.

## Metrics

Each evaluated turn produces `qualityMetrics` on the Voice Agent envelope.

| Metric | Meaning |
| --- | --- |
| `languageMatchScore` | Whether the response appears to match the requested local language. |
| `semanticGroundingScore` | Whether the response is supported by farm-state facts and avoids unsupported claims. |
| `intentAnswerScore` | Whether the answer satisfies the farmer's prompt, including greetings and farm-status questions. |
| `criticalFactAccuracy` | Percentage of expected critical facts present in the answer. |
| `translationAdequacyScore` | Combined language, grounding, and intent adequacy. |
| `speechQualityScore` | Whether speech output was generated successfully when audio was requested. |
| `transcriptionConfidence` | Whether speech-to-text produced usable text when audio input was used. |
| `overallConversationScore` | Weighted production score used by scorecards. |

## Review Gates

A Voice Agent answer requires human review when any of these are true:

- `languageMatchScore < 0.9`
- `semanticGroundingScore < 0.9`
- `criticalFactAccuracy < 1.0`
- `transcriptionConfidence < 0.8`
- unsupported or unsafe claims are detected

The agent adds the warning `evaluation:conversation_quality_review` when a response fails a gate.

## Deterministic Fact Checks

The current evaluator is deterministic and lives in:

`backend/app/services/conversation_evaluator.py`

It derives expected facts from the farm state. Examples:

- high-risk priority zone
- dry soil or low moisture
- scheduled action
- robot status
- pending approval
- verified outcome

It also detects forbidden claims such as:

- approval already granted when no approval exists
- provider delivery when no communication event exists
- payment or treatment completion claims

## Scorecard Storage

Voice Agent responses attach `qualityMetrics` in:

`backend/app/agents/voice_agent.py`

The demo store copies those metrics into evaluation scorecards in:

`backend/app/demo_store.py`

For Voice Agent scorecards, `overallConversationScore` becomes the `qualityScore` when present.

Auditable evaluated turns are available through:

`GET /evaluation/conversation-runs`

Each record includes the prompt, response text, language, fallback state, review flag, warnings, and full `qualityMetrics`.

## Production Roadmap

The deterministic evaluator should remain the first gate because it is fast, auditable, and testable.

For a fuller production release, add a second LLM evaluator after the deterministic checks to score:

- naturalness for farmers
- dialect and register fit
- translation adequacy beyond keyword coverage
- conversational follow-up quality

The LLM evaluator must return structured JSON and must not override deterministic critical-fact failures.
