from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Callable


ALERT_INTERVAL_SECONDS = 5 * 60
GAMIFICATION_WINDOW_SECONDS = 60 * 60
ALERTS_PER_WINDOW = GAMIFICATION_WINDOW_SECONDS // ALERT_INTERVAL_SECONDS

AdminFeed = dict[str, list[dict[str, Any]]]
AlertBuilder = Callable[[dict[str, Any]], tuple[str, dict[str, Any]]]


def build_admin_alert_feed(farm_state: dict[str, Any]) -> AdminFeed:
    """Build a rolling one-hour admin feed aligned to simulator time."""
    feed: AdminFeed = {
        "activeActions": [],
        "pendingApprovals": [],
        "communicationEvents": [],
        "outcomeChecks": [],
    }

    latest_slot_seconds = _latest_alert_slot_seconds(farm_state)
    slot_seconds_values = [
        latest_slot_seconds - (ALERT_INTERVAL_SECONDS * offset)
        for offset in range(ALERTS_PER_WINDOW - 1, -1, -1)
    ]

    builders = _alert_builders()
    for slot_seconds in slot_seconds_values:
        slot_number = slot_seconds // ALERT_INTERVAL_SECONDS
        context = _alert_context(farm_state, slot_seconds, slot_number)
        collection_name, item = builders[slot_number % len(builders)](context)
        feed[collection_name].append(item)

    return feed


def _latest_alert_slot_seconds(farm_state: dict[str, Any]) -> int:
    simulation = farm_state.get("simulation", {})
    tick = int(simulation.get("tick", 0) or 0)
    tick_interval_seconds = int(simulation.get("tickIntervalSeconds", 60) or 60)
    current_seconds = tick * tick_interval_seconds
    return current_seconds - (current_seconds % ALERT_INTERVAL_SECONDS)


def _alert_context(farm_state: dict[str, Any], slot_seconds: int, slot_number: int) -> dict[str, Any]:
    zones = farm_state.get("zones") or [_fallback_zone()]
    zone = zones[slot_number % len(zones)]
    priority_zone = max(zones, key=_zone_risk_score)
    robot = (farm_state.get("robots") or [{}])[0]
    assets = farm_state.get("assets") or {}
    water_tank = (assets.get("waterTanks") or [{}])[0]
    pump = assets.get("pump") or {}
    sensors = assets.get("sensors") or []
    valves = assets.get("valves") or []

    return {
        "slotNumber": slot_number,
        "eventTime": datetime.fromtimestamp(slot_seconds, tz=timezone.utc).isoformat(),
        "zone": zone,
        "priorityZone": priority_zone,
        "robot": robot,
        "waterTank": water_tank,
        "pump": pump,
        "sensor": sensors[slot_number % len(sensors)] if sensors else None,
        "valve": valves[slot_number % len(valves)] if valves else None,
    }


def _alert_builders() -> list[AlertBuilder]:
    return [
        _soil_moisture_alert,
        _robot_inspection_alert,
        _whatsapp_notification,
        _sensor_drift_alert,
        _irrigation_action,
        _irrigation_approval,
        _tank_level_alert,
        _pump_pressure_alert,
        _pest_pressure_alert,
        _heat_stress_alert,
        _outcome_verification,
        _critical_escalation_notification,
    ]


def _soil_moisture_alert(context: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    zone = context["priorityZone"]
    moisture = zone.get("soilMoisturePct", 0)
    priority = "critical" if zone.get("riskLevel") == "critical" else "high"
    return (
        "activeActions",
        _action(
            context,
            "soil_moisture_alert",
            zone,
            priority,
            "recommended",
            f"{zone['name']} moisture is {moisture}%; irrigation readiness is under watch.",
        ),
    )


def _robot_inspection_alert(context: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    zone = context["zone"]
    robot = context["robot"]
    target = robot.get("currentWaypointLabel") or zone["name"]
    return (
        "activeActions",
        _action(
            context,
            "robot_inspection",
            zone,
            "medium",
            "active",
            f"Robot R1 is inspecting {target} and publishing patrol evidence.",
        ),
    )


def _whatsapp_notification(context: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    zone = context["zone"]
    return (
        "communicationEvents",
        {
            "communicationId": _id("comm-whatsapp", context),
            "severity": "warning",
            "selectedChannel": "whatsapp",
            "recipientRole": "farmer",
            "message": f"{zone['name']} update sent to the farmer with current moisture, robot, and irrigation status.",
            "status": "simulated",
            "createdAt": context["eventTime"],
        },
    )


def _sensor_drift_alert(context: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    zone = context["zone"]
    sensor = context.get("sensor") or {"id": "sensor-mesh"}
    return (
        "activeActions",
        _action(
            context,
            "sensor_drift_alert",
            zone,
            "medium",
            "recommended",
            f"{sensor['id']} is marked for calibration review against the synchronized farm snapshot.",
        ),
    )


def _irrigation_action(context: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    zone = context["priorityZone"]
    target = max(35, int(zone.get("soilMoisturePct", 0)) + 8)
    action = _action(
        context,
        "schedule_irrigation",
        zone,
        "high",
        "scheduled",
        f"{zone['name']} drip irrigation is queued to recover soil moisture toward {target}%.",
    )
    action["expectedOutcome"] = {
        "metric": "soilMoisturePct",
        "targetValue": target,
        "verificationWindowMinutes": 10,
    }
    return "activeActions", action


def _irrigation_approval(context: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    zone = context["priorityZone"]
    return (
        "pendingApprovals",
        {
            "id": _id("approval-irrigation", context),
            "title": f"{zone['name']} irrigation approval",
            "reason": f"{zone['name']} is at {zone.get('soilMoisturePct', 0)}% moisture. Farmer approval is required before high-priority escalation.",
            "channel": "whatsapp",
            "createdAt": context["eventTime"],
            "requestedAt": context["eventTime"],
        },
    )


def _tank_level_alert(context: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    zone = context["zone"]
    tank = context["waterTank"]
    tank_level = tank.get("levelPct", 0)
    priority = "high" if tank_level < 45 else "medium"
    return (
        "activeActions",
        _action(
            context,
            "water_tank_warning",
            zone,
            priority,
            "recommended",
            f"Main tank is at {tank_level}% capacity; irrigation scheduling is checking available liters.",
        ),
    )


def _pump_pressure_alert(context: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    zone = context["zone"]
    pump = context["pump"]
    pressure = pump.get("pressureBar", 0)
    return (
        "activeActions",
        _action(
            context,
            "pump_pressure_check",
            zone,
            "medium",
            "active",
            f"Pump bay pressure is {pressure} bar; flow readiness is being checked before the next drip cycle.",
        ),
    )


def _pest_pressure_alert(context: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    zone = context["zone"]
    pressure = zone.get("pestPressure", "normal")
    priority = "high" if pressure == "watch" else "medium"
    return (
        "activeActions",
        _action(
            context,
            "pest_pressure_watch",
            zone,
            priority,
            "recommended",
            f"{zone['name']} pest pressure is {pressure}; robot imagery is queued for comparison.",
        ),
    )


def _heat_stress_alert(context: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    zone = context["zone"]
    temperature = zone.get("temperatureC", 0)
    priority = "high" if temperature >= 34 else "medium"
    return (
        "activeActions",
        _action(
            context,
            "heat_stress_watch",
            zone,
            priority,
            "recommended",
            f"{zone['name']} canopy temperature is {temperature}C; shade and irrigation timing are being reviewed.",
        ),
    )


def _outcome_verification(context: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    zone = context["priorityZone"]
    before = int(zone.get("soilMoisturePct", 0))
    after = min(before + 9, 42)
    return (
        "outcomeChecks",
        {
            "outcomeId": _id("outcome-moisture", context),
            "actionId": _id("act-irrigation", context),
            "zoneId": zone["id"],
            "status": "verified",
            "metric": "soilMoisturePct",
            "beforeValue": before,
            "afterValue": after,
            "targetValue": 35,
            "deltaPct": after - before,
            "summary": f"{zone['name']} moisture changed from {before}% to {after}% during simulated verification.",
            "verifiedAt": context["eventTime"],
        },
    )


def _critical_escalation_notification(context: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    zone = context["priorityZone"]
    channel = "sms" if zone.get("riskLevel") == "critical" else "telegram"
    severity = "critical" if zone.get("riskLevel") == "critical" else "warning"
    return (
        "communicationEvents",
        {
            "communicationId": _id("comm-escalation", context),
            "severity": severity,
            "selectedChannel": channel,
            "recipientRole": "farmer",
            "message": f"{zone['name']} escalation notice generated from simulator risk level {zone.get('riskLevel', 'medium')}.",
            "status": "simulated",
            "createdAt": context["eventTime"],
        },
    )


def _action(
    context: dict[str, Any],
    action_type: str,
    zone: dict[str, Any],
    priority: str,
    status: str,
    summary: str,
) -> dict[str, Any]:
    return {
        "id": _id(f"act-{action_type}", context),
        "type": action_type,
        "zoneId": zone["id"],
        "priority": priority,
        "status": status,
        "summary": summary,
        "createdAt": context["eventTime"],
    }


def _id(prefix: str, context: dict[str, Any]) -> str:
    return f"{prefix}-{context['slotNumber']}"


def _zone_risk_score(zone: dict[str, Any]) -> tuple[int, int]:
    risk_order = {"low": 0, "medium": 1, "high": 2, "critical": 3}
    risk_score = risk_order.get(zone.get("riskLevel", "low"), 0)
    moisture_score = 100 - int(zone.get("soilMoisturePct", 100))
    return risk_score, moisture_score


def _fallback_zone() -> dict[str, Any]:
    return {
        "id": "farm",
        "name": "Farm",
        "soilMoisturePct": 35,
        "temperatureC": 30,
        "riskLevel": "medium",
        "pestPressure": "normal",
    }
