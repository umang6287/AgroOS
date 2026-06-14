from app.agents.envelope import make_envelope
from app.agents.language import normalize_language, localized_text
from app.services.openai_service import generate_agent_copy
from app.simulation.engine import get_current_robot_state


def run_robot_agent(context):
    language = normalize_language(context.get("language"))
    planner_actions = context.get("planner", {}).get("data", {}).get("actions", [])
    has_inspection = any(action.get("type") == "robot_inspection" for action in planner_actions)
    robot_state = get_current_robot_state()
    fallback_summary = (
        localized_text(language, "robot_assigned", waypoint=robot_state.get("currentWaypointLabel", "the active waypoint"))
        if has_inspection
        else localized_text(language, "robot_available")
    )
    generated = generate_agent_copy(
        agent="robot",
        task="Write a concise robot status update for the farmer.",
        language=language,
        farm_context={
            "hasInspectionTask": has_inspection,
            "plannerActions": planner_actions,
            "robotState": robot_state,
        },
        fallback={
            "summary": fallback_summary,
            "message": fallback_summary,
            "explanation": ["Robot R1 route state is sourced from the synchronized synthetic patrol engine."],
        },
    )

    return make_envelope(
        agent="robot",
        summary=generated["summary"],
        confidence=0.93,
        latency_ms=150 + generated["latencyMs"],
        estimated_cost_usd=generated["estimatedCostUsd"],
        data={
            "robotId": "robot-r1",
            "status": robot_state.get("status", "assigned" if has_inspection else "available"),
            "batteryPct": robot_state.get("batteryPct", 81),
            "currentZoneId": robot_state.get("currentZoneId"),
            "currentWaypointId": robot_state.get("currentWaypointId"),
            "currentWaypointLabel": robot_state.get("currentWaypointLabel"),
            "routeProgressPct": robot_state.get("routeProgressPct"),
            "location": robot_state.get("location"),
            "observations": robot_state.get("observations", []),
            "routeId": robot_state.get("routeId") if has_inspection else None,
            "language": language,
            "generatedMessage": generated["message"],
            "ai": {
                "provider": generated["provider"],
                "model": generated["model"],
                "fallback": generated["fallback"],
            },
        },
        explanation=generated["explanation"],
        warnings=generated["warnings"],
        next_agent="communication",
    )
