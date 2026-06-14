from copy import deepcopy
from typing import Any

from app.simulation.engine import get_current_farm_state as get_simulated_farm_state
from app.simulation.engine import get_recent_simulation_events
from app.simulation.engine import reset_simulation_events
from app.utils.time_utils import utc_now_iso


def server_now_iso() -> str:
    return utc_now_iso()


def _default_farm_state() -> dict[str, Any]:
    now = server_now_iso()
    return {
        "farmId": "demo-farm",
        "name": "Ratnagiri Mango Estate",
        "autonomyMode": "auto_schedule_low_risk",
        "updatedAt": now,
        "zones": [
            {
                "id": "zone-a",
                "name": "Zone A",
                "cropType": "mango_alphonso",
                "soilMoisturePct": 37,
                "temperatureC": 29.8,
                "humidityPct": 62,
                "riskLevel": "low",
                "lastUpdatedAt": now,
            },
            {
                "id": "zone-b",
                "name": "Zone B",
                "cropType": "mango_kesar",
                "soilMoisturePct": 21,
                "temperatureC": 34.8,
                "humidityPct": 48,
                "riskLevel": "high",
                "lastUpdatedAt": now,
            },
            {
                "id": "zone-c",
                "name": "Zone C",
                "cropType": "mango_dasheri",
                "soilMoisturePct": 31,
                "temperatureC": 31.7,
                "humidityPct": 57,
                "riskLevel": "medium",
                "lastUpdatedAt": now,
            },
            {
                "id": "zone-d",
                "name": "Zone D",
                "cropType": "mango_young_grafts",
                "soilMoisturePct": 42,
                "temperatureC": 30.6,
                "humidityPct": 61,
                "riskLevel": "low",
                "lastUpdatedAt": now,
            },
        ],
        "robots": [
            {
                "id": "robot-r1",
                "name": "Robot R1",
                "status": "assigned",
                "batteryPct": 81,
                "currentZoneId": "zone-b",
            }
        ],
        "activeActions": [],
        "pendingApprovals": [],
        "communicationEvents": [],
        "outcomeChecks": [],
        "journalEntries": [
            {
                "id": "journal-seed-001",
                "type": "memory_seed",
                "zoneId": "zone-b",
                "summary": "Zone B improved by 14 points after the last short irrigation cycle.",
                "createdAt": now,
            },
            {
                "id": "journal-seed-002",
                "type": "preference",
                "zoneId": "farm",
                "summary": "Farmer prefers Marathi voice briefs and WhatsApp approval links.",
                "createdAt": now,
            },
        ],
    }


_state: dict[str, Any] = _default_farm_state()
_latest_trace: dict[str, Any] | None = None
_scorecards: list[dict[str, Any]] = []
_events: list[dict[str, Any]] = []
_conversation_evaluations: list[dict[str, Any]] = []


def reset_demo_state() -> None:
    global _state, _latest_trace, _scorecards, _events, _conversation_evaluations
    _state = _default_farm_state()
    _latest_trace = None
    _scorecards = []
    _events = []
    _conversation_evaluations = []
    reset_simulation_events()


def has_latest_trace() -> bool:
    return _latest_trace is not None


def get_farm_state() -> dict[str, Any]:
    simulated_state = get_simulated_farm_state()
    demo_state = deepcopy(_state)
    merged_state = {
        **simulated_state,
        "autonomyMode": demo_state.get("autonomyMode", simulated_state.get("autonomyMode")),
        "activeActions": _merge_many(simulated_state.get("activeActions", []), demo_state.get("activeActions", [])),
        "pendingApprovals": _merge_many(
            simulated_state.get("pendingApprovals", []), demo_state.get("pendingApprovals", [])
        ),
        "communicationEvents": _merge_many(
            simulated_state.get("communicationEvents", []),
            demo_state.get("communicationEvents", []),
            id_key="communicationId",
        ),
        "outcomeChecks": _merge_many(
            simulated_state.get("outcomeChecks", []), demo_state.get("outcomeChecks", []), id_key="outcomeId"
        ),
        "journalEntries": _merge_many(simulated_state.get("journalEntries", []), demo_state.get("journalEntries", [])),
    }
    return _with_current_farm_timestamps(merged_state)


def get_latest_trace() -> dict[str, Any]:
    if _latest_trace is None:
        now = server_now_iso()
        return {
            "runId": "run-pending",
            "workflow": "sensor_anomaly",
            "status": "queued",
            "startedAt": now,
            "completedAt": None,
            "trace": [],
        }
    return deepcopy(_latest_trace)


def get_scorecards() -> dict[str, Any]:
    return {"scorecards": deepcopy(_scorecards)}


def get_conversation_evaluations(limit: int = 50) -> dict[str, Any]:
    return {"conversationEvaluations": deepcopy(_conversation_evaluations[-limit:])}


def get_communication_events(limit: int = 60) -> dict[str, Any]:
    events = sorted(
        get_farm_state().get("communicationEvents", []),
        key=lambda event: event.get("createdAt", ""),
    )
    return {"communications": deepcopy(events[-limit:])}


def get_recent_events() -> list[dict[str, Any]]:
    return [*get_recent_simulation_events(limit=60), *deepcopy(_events)]


def record_communication_event(communication: dict[str, Any]) -> dict[str, Any]:
    event = deepcopy(communication)
    _upsert_many("communicationEvents", [event], id_key="communicationId")
    _events.append(
        {
            "type": "communication.updated",
            "eventId": f"evt-{event['communicationId']}",
            "createdAt": event.get("createdAt") or server_now_iso(),
            "data": event,
        }
    )
    _state["updatedAt"] = event.get("createdAt") or server_now_iso()
    return deepcopy(event)


def record_workflow(trace: dict[str, Any]) -> dict[str, Any]:
    global _latest_trace, _scorecards, _events

    _latest_trace = deepcopy(trace)
    steps = trace.get("trace", [])
    workflow = trace.get("workflow", "sensor_anomaly")
    run_id = trace.get("runId", "run-demo")
    completed_at = trace.get("completedAt") or server_now_iso()

    planner_step = _find_step(steps, "planner")
    if planner_step:
        planner_data = planner_step.get("data", {})
        _upsert_many("activeActions", planner_data.get("actions", []))
        _upsert_many("pendingApprovals", planner_data.get("pendingApprovals", []))

    communication_step = _find_step(steps, "communication")
    if communication_step:
        communication = communication_step.get("data", {}).get("communication")
        if communication:
            _upsert_many("communicationEvents", [communication], id_key="communicationId")

    outcome_step = _find_step(steps, "outcome")
    if outcome_step:
        outcome = outcome_step.get("data", {}).get("outcome")
        if outcome:
            _upsert_many("outcomeChecks", [outcome], id_key="outcomeId")

    memory_step = _find_step(steps, "memory")
    if memory_step:
        entry = memory_step.get("data", {}).get("journalEntry")
        if entry:
            _upsert_many("journalEntries", [entry])

    voice_step = _find_step_with_quality_metrics(steps, "voice")
    if workflow == "voice" and voice_step:
        _record_conversation_evaluation(voice_step, workflow, run_id, completed_at)

    _scorecards = [_scorecard_from_step(step, workflow, run_id, completed_at) for step in steps]
    _events = _events_from_trace(trace)
    _state["updatedAt"] = completed_at
    for zone in _state.get("zones", []):
        zone["lastUpdatedAt"] = completed_at
    return get_latest_trace()


def _record_conversation_evaluation(step: dict[str, Any], workflow: str, run_id: str, created_at: str) -> None:
    metrics = step.get("data", {}).get("qualityMetrics")
    if not metrics:
        return
    _conversation_evaluations.append(
        {
            "id": f"eval-{run_id}-{len(_conversation_evaluations) + 1}",
            "workflow": workflow,
            "runId": run_id,
            "agent": step.get("agent"),
            "createdAt": created_at,
            "language": step.get("data", {}).get("language"),
            "prompt": step.get("data", {}).get("prompt") or step.get("data", {}).get("transcription", {}).get("text"),
            "responseText": step.get("data", {}).get("responseText"),
            "fallback": step.get("data", {}).get("fallback"),
            "speechFallback": step.get("data", {}).get("speechFallback"),
            "qualityMetrics": deepcopy(metrics),
            "requiresHumanReview": step.get("requiresHumanReview", False),
            "warnings": deepcopy(step.get("warnings", [])),
        }
    )


def _with_current_farm_timestamps(state: dict[str, Any]) -> dict[str, Any]:
    now = server_now_iso()
    state["updatedAt"] = now
    for zone in state.get("zones", []):
        zone["lastUpdatedAt"] = now
    return state


def _find_step(steps: list[dict[str, Any]], agent: str) -> dict[str, Any] | None:
    return next((step for step in steps if step.get("agent") == agent), None)


def _find_step_with_quality_metrics(steps: list[dict[str, Any]], agent: str) -> dict[str, Any] | None:
    return next(
        (
            step
            for step in reversed(steps)
            if step.get("agent") == agent and step.get("data", {}).get("qualityMetrics")
        ),
        None,
    )


def _upsert_many(collection_name: str, items: list[dict[str, Any]], id_key: str = "id") -> None:
    if not items:
        return

    collection = _state.setdefault(collection_name, [])
    existing_indexes = {item.get(id_key): index for index, item in enumerate(collection)}

    for item in items:
        item_id = item.get(id_key)
        if item_id in existing_indexes:
            collection[existing_indexes[item_id]] = item
        else:
            collection.append(item)


def _merge_many(primary: list[dict[str, Any]], secondary: list[dict[str, Any]], id_key: str = "id") -> list[dict[str, Any]]:
    merged = deepcopy(primary)
    existing_indexes = {item.get(id_key): index for index, item in enumerate(merged)}

    for item in secondary:
        item_id = item.get(id_key)
        if item_id in existing_indexes:
            merged[existing_indexes[item_id]] = item
        else:
            merged.append(item)

    return merged


def _scorecard_from_step(
    step: dict[str, Any], workflow: str, run_id: str, created_at: str | None
) -> dict[str, Any]:
    quality_metrics = step.get("data", {}).get("qualityMetrics", {})
    explicit_quality = step.get("data", {}).get("qualityScore")
    if explicit_quality is None:
        explicit_quality = quality_metrics.get("overallConversationScore")
    quality_score = explicit_quality if explicit_quality is not None else min(0.99, step.get("confidence", 0) + 0.02)
    scorecard = {
        "agent": step.get("agent"),
        "confidence": step.get("confidence", 0),
        "latencyMs": step.get("latencyMs", 0),
        "estimatedCostUsd": step.get("estimatedCostUsd", 0),
        "qualityScore": round(quality_score, 3),
        "requiresHumanReview": step.get("requiresHumanReview", False),
        "workflow": workflow,
        "runId": run_id,
        "createdAt": created_at or server_now_iso(),
    }
    scorecard.update(quality_metrics)
    return scorecard


def _events_from_trace(trace: dict[str, Any]) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = [
        {
            "type": "agent.trace.updated",
            "eventId": f"evt-{trace['runId']}-trace",
            "createdAt": trace.get("completedAt") or server_now_iso(),
            "data": trace,
        }
    ]

    planner_step = _find_step(trace.get("trace", []), "planner")
    if planner_step:
        for action in planner_step.get("data", {}).get("actions", []):
            events.append(
                {
                    "type": "action.created",
                    "eventId": f"evt-{action['id']}",
                    "createdAt": trace.get("completedAt") or server_now_iso(),
                    "data": action,
                }
            )

    communication_step = _find_step(trace.get("trace", []), "communication")
    communication = communication_step.get("data", {}).get("communication") if communication_step else None
    if communication:
        events.append(
            {
                "type": "communication.updated",
                "eventId": f"evt-{communication['communicationId']}",
                "createdAt": communication.get("createdAt", trace.get("completedAt") or server_now_iso()),
                "data": communication,
            }
        )

    outcome_step = _find_step(trace.get("trace", []), "outcome")
    outcome = outcome_step.get("data", {}).get("outcome") if outcome_step else None
    if outcome:
        events.append(
            {
                "type": "outcome.verified",
                "eventId": f"evt-{outcome['outcomeId']}",
                "createdAt": outcome.get("verifiedAt", trace.get("completedAt") or server_now_iso()),
                "data": outcome,
            }
        )

    if _scorecards:
        events.append(
            {
                "type": "evaluation.updated",
                "eventId": f"evt-{trace['runId']}-evaluation",
                "createdAt": trace.get("completedAt") or server_now_iso(),
                "data": {"scorecards": deepcopy(_scorecards)},
            }
        )

    return events
