from __future__ import annotations

from datetime import datetime, timezone
from math import sin
from typing import Any

from app.agents.envelope import make_envelope
from app.services.admin_alert_service import build_admin_alert_feed


FARM_ID = "demo-farm"
FARM_NAME = "Ratnagiri Mango Estate"
RETENTION_MINUTES = 60

ZONE_LAYOUTS: list[dict[str, Any]] = [
    {
        "id": "zone-a",
        "name": "Zone A",
        "cropType": "mango_alphonso",
        "variety": "Alphonso",
        "treeCount": 168,
        "sensorIds": ["sensor-a-soil-01", "sensor-a-weather-01"],
        "valveId": "valve-a-drip-01",
        "bounds": {"leftPct": 7.4, "topPct": 12.1, "widthPct": 41.2, "heightPct": 34.7},
        "baseMoisture": 38,
        "baseTemperature": 30.0,
        "baseHumidity": 62,
    },
    {
        "id": "zone-b",
        "name": "Zone B",
        "cropType": "mango_kesar",
        "variety": "Kesar",
        "treeCount": 144,
        "sensorIds": ["sensor-b-soil-01", "sensor-b-weather-01"],
        "valveId": "valve-b-drip-01",
        "bounds": {"leftPct": 52.1, "topPct": 12.1, "widthPct": 38.8, "heightPct": 34.7},
        "baseMoisture": 27,
        "baseTemperature": 33.4,
        "baseHumidity": 50,
    },
    {
        "id": "zone-c",
        "name": "Zone C",
        "cropType": "mango_dasheri",
        "variety": "Dasheri",
        "treeCount": 156,
        "sensorIds": ["sensor-c-soil-01", "sensor-c-weather-01"],
        "valveId": "valve-c-drip-01",
        "bounds": {"leftPct": 52.1, "topPct": 52.7, "widthPct": 27.2, "heightPct": 36.7},
        "baseMoisture": 32,
        "baseTemperature": 31.5,
        "baseHumidity": 56,
    },
    {
        "id": "zone-d",
        "name": "Zone D",
        "cropType": "mango_young_grafts",
        "variety": "Young grafts",
        "treeCount": 96,
        "sensorIds": ["sensor-d-soil-01", "sensor-d-weather-01"],
        "valveId": "valve-d-drip-01",
        "bounds": {"leftPct": 7.4, "topPct": 52.7, "widthPct": 41.2, "heightPct": 36.7},
        "baseMoisture": 41,
        "baseTemperature": 30.5,
        "baseHumidity": 60,
    },
]

FIXED_ASSETS = {
    "base": {
        "id": "base-g1",
        "name": "Gate 1 charging base",
        "kind": "base",
        "location": {"xPct": 10, "yPct": 86},
    },
    "pump": {
        "id": "pump-main-01",
        "name": "Main pump bay",
        "kind": "pump",
        "location": {"xPct": 49, "yPct": 49},
    },
    "tank": {
        "id": "tank-main-01",
        "name": "Main water tank",
        "kind": "water_tank",
        "capacityLiters": 50000,
        "location": {"xPct": 82, "yPct": 61},
    },
}

SENSOR_LOCATIONS: dict[str, dict[str, Any]] = {
    "sensor-a-soil-01": {"xPct": 21, "yPct": 26, "kind": "soil"},
    "sensor-a-weather-01": {"xPct": 43, "yPct": 39, "kind": "weather"},
    "sensor-b-soil-01": {"xPct": 61, "yPct": 27, "kind": "soil"},
    "sensor-b-weather-01": {"xPct": 86, "yPct": 40, "kind": "weather"},
    "sensor-c-soil-01": {"xPct": 70, "yPct": 76, "kind": "soil"},
    "sensor-c-weather-01": {"xPct": 73, "yPct": 63, "kind": "weather"},
    "sensor-d-soil-01": {"xPct": 19, "yPct": 72, "kind": "soil"},
    "sensor-d-weather-01": {"xPct": 42, "yPct": 78, "kind": "weather"},
}

VALVE_LOCATIONS: dict[str, dict[str, Any]] = {
    "valve-a-drip-01": {"xPct": 31, "yPct": 49},
    "valve-b-drip-01": {"xPct": 80, "yPct": 51},
    "valve-c-drip-01": {"xPct": 49, "yPct": 88},
    "valve-d-drip-01": {"xPct": 49, "yPct": 49},
}

ROBOT_ROUTE: list[dict[str, Any]] = [
    {"id": "base-g1", "kind": "base", "assetId": "base-g1", "label": "Gate 1 base"},
    {"id": "zone-a-sensor", "kind": "sensor", "zoneId": "zone-a", "sensorId": "sensor-a-soil-01"},
    {"id": "zone-a-tree-1", "kind": "tree", "zoneId": "zone-a", "treeSlot": 0},
    {"id": "zone-a-tree-2", "kind": "tree", "zoneId": "zone-a", "treeSlot": 5},
    {"id": "zone-a-valve", "kind": "valve", "zoneId": "zone-a", "valveId": "valve-a-drip-01"},
    {"id": "zone-b-sensor", "kind": "sensor", "zoneId": "zone-b", "sensorId": "sensor-b-soil-01"},
    {"id": "zone-b-tree-1", "kind": "tree", "zoneId": "zone-b", "treeSlot": 1},
    {"id": "zone-b-tree-2", "kind": "tree", "zoneId": "zone-b", "treeSlot": 7},
    {"id": "tank-main", "kind": "water_tank", "assetId": "tank-main-01", "label": "Main tank"},
    {"id": "zone-c-sensor", "kind": "sensor", "zoneId": "zone-c", "sensorId": "sensor-c-soil-01"},
    {"id": "zone-c-tree-1", "kind": "tree", "zoneId": "zone-c", "treeSlot": 2},
    {"id": "zone-c-tree-2", "kind": "tree", "zoneId": "zone-c", "treeSlot": 9},
    {"id": "pump-main", "kind": "pump", "assetId": "pump-main-01", "label": "Pump bay"},
    {"id": "zone-d-sensor", "kind": "sensor", "zoneId": "zone-d", "sensorId": "sensor-d-soil-01"},
    {"id": "zone-d-tree-1", "kind": "tree", "zoneId": "zone-d", "treeSlot": 3},
    {"id": "zone-d-tree-2", "kind": "tree", "zoneId": "zone-d", "treeSlot": 10},
]


def build_tick_event(now: datetime | None = None, tick_interval_seconds: int = 60) -> dict[str, Any]:
    current_time = now or datetime.now(timezone.utc)
    if current_time.tzinfo is None:
        current_time = current_time.replace(tzinfo=timezone.utc)

    sequence = int(current_time.timestamp() // tick_interval_seconds)
    state = build_farm_state(sequence, current_time, tick_interval_seconds)
    sensor_envelope = _sensor_envelope(state, sequence)
    robot_envelope = _robot_envelope(state, sequence)

    event = {
        "type": "simulation.tick",
        "eventId": f"evt-sim-{sequence}",
        "sequence": sequence,
        "createdAt": _iso(current_time),
        "data": {
            "farmState": state,
            "telemetry": state["latestTelemetry"],
            "sensorEnvelope": sensor_envelope,
            "robotEnvelope": robot_envelope,
            "agentTrace": {
                "runId": f"run-sim-{sequence}",
                "workflow": "sensor_anomaly",
                "status": "completed",
                "startedAt": _iso(current_time),
                "completedAt": _iso(current_time),
                "trace": [sensor_envelope, robot_envelope],
            },
        },
    }
    return event


def build_farm_state(sequence: int, now: datetime, tick_interval_seconds: int = 60) -> dict[str, Any]:
    route_index = sequence % len(ROBOT_ROUTE)
    route_cycle = sequence // len(ROBOT_ROUTE)
    waypoint = _resolve_waypoint(ROBOT_ROUTE[route_index], route_cycle, sequence)
    tank_level_pct = _tank_level(sequence)
    zones = [
        _zone_snapshot(zone, sequence, now, waypoint)
        for zone in ZONE_LAYOUTS
    ]
    current_zone = next((zone for zone in zones if zone["id"] == waypoint.get("zoneId")), None)
    if current_zone is None:
        current_zone = min(zones, key=lambda zone: zone["soilMoisturePct"])

    robot = _robot_snapshot(sequence, waypoint, route_index, route_cycle)
    latest_observation = robot["observations"][0] if robot["observations"] else "Robot R1 is moving to the next waypoint."
    updated_at = _iso(now)

    state = {
        "farmId": FARM_ID,
        "name": FARM_NAME,
        "autonomyMode": "auto_schedule_low_risk",
        "updatedAt": updated_at,
        "zones": zones,
        "robots": [robot],
        "activeActions": [],
        "pendingApprovals": [],
        "communicationEvents": [],
        "outcomeChecks": [],
        "journalEntries": [],
        "assets": {
            "sensors": _sensor_assets(zones, sequence),
            "valves": _valve_assets(zones, sequence),
            "trees": _tree_assets(sequence),
            "waterTanks": [_water_tank_asset(tank_level_pct)],
            "pump": _pump_asset(sequence),
            "base": FIXED_ASSETS["base"],
        },
        "latestTelemetry": {
            "sequence": sequence,
            "generatedAt": updated_at,
            "zoneId": current_zone["id"],
            "zoneName": current_zone["name"],
            "soilMoisturePct": current_zone["soilMoisturePct"],
            "soilMoistureThresholdPct": 35,
            "temperatureC": current_zone["temperatureC"],
            "humidityPct": current_zone["humidityPct"],
            "waterTankPct": tank_level_pct,
            "tankLevelPct": tank_level_pct,
            "robot": robot,
            "zones": zones,
        },
        "simulation": {
            "tick": sequence,
            "tickIntervalSeconds": tick_interval_seconds,
            "retentionMinutes": RETENTION_MINUTES,
            "routeId": "route-g1-zones-tank-pump-loop",
            "routeName": "Gate 1 -> Zones A/B -> Tank -> Zone C -> Pump -> Zone D",
            "routeProgressPct": robot["routeProgressPct"],
            "routeStep": route_index + 1,
            "routeStepCount": len(ROBOT_ROUTE),
            "currentWaypointId": waypoint["id"],
            "currentWaypointLabel": waypoint["label"],
            "currentActivity": latest_observation,
            "inspectionsThisHour": min(60, sequence % 61),
            "zonesVisitedThisCycle": _visited_zones(route_index),
            "nextTickAt": _iso(datetime.fromtimestamp((sequence + 1) * tick_interval_seconds, tz=timezone.utc)),
        },
    }
    state.update(build_admin_alert_feed(state))
    return state


def current_sensor_reading(now: datetime | None = None, tick_interval_seconds: int = 60) -> dict[str, Any]:
    event = build_tick_event(now, tick_interval_seconds)
    telemetry = event["data"]["telemetry"]
    return {
        "eventId": event["eventId"],
        "zoneId": telemetry["zoneId"],
        "zoneName": telemetry["zoneName"],
        "soilMoisturePct": telemetry["soilMoisturePct"],
        "temperatureC": telemetry["temperatureC"],
        "humidityPct": telemetry["humidityPct"],
        "waterTankPct": telemetry["waterTankPct"],
        "tankLevelPct": telemetry["tankLevelPct"],
        "soilMoistureThresholdPct": telemetry["soilMoistureThresholdPct"],
        "robot": {
            "robotId": telemetry["robot"]["id"],
            "batteryPct": telemetry["robot"]["batteryPct"],
            "status": telemetry["robot"]["status"],
            "currentWaypointId": telemetry["robot"]["currentWaypointId"],
            "currentZoneId": telemetry["robot"]["currentZoneId"],
        },
    }


def _resolve_waypoint(template: dict[str, Any], route_cycle: int, sequence: int) -> dict[str, Any]:
    waypoint = dict(template)
    zone_id = waypoint.get("zoneId")

    if waypoint["kind"] == "tree" and zone_id:
        tree = _tree_for_zone(zone_id, route_cycle, waypoint.get("treeSlot", 0))
        waypoint["treeId"] = tree["id"]
        waypoint["label"] = tree["name"]
        waypoint["location"] = tree["location"]
    elif waypoint["kind"] == "sensor":
        sensor = SENSOR_LOCATIONS[waypoint["sensorId"]]
        waypoint["label"] = f"{waypoint['sensorId']} sensor"
        waypoint["location"] = {"xPct": sensor["xPct"], "yPct": sensor["yPct"]}
    elif waypoint["kind"] == "valve":
        valve = VALVE_LOCATIONS[waypoint["valveId"]]
        waypoint["label"] = f"{waypoint['valveId']} valve"
        waypoint["location"] = {"xPct": valve["xPct"], "yPct": valve["yPct"]}
    elif waypoint["kind"] == "water_tank":
        waypoint["location"] = FIXED_ASSETS["tank"]["location"]
    elif waypoint["kind"] == "pump":
        waypoint["location"] = FIXED_ASSETS["pump"]["location"]
    else:
        waypoint["location"] = FIXED_ASSETS["base"]["location"]

    waypoint["minutesOnRoute"] = sequence % len(ROBOT_ROUTE)
    return waypoint


def _zone_snapshot(zone: dict[str, Any], sequence: int, now: datetime, waypoint: dict[str, Any]) -> dict[str, Any]:
    zone_index = next(index for index, item in enumerate(ZONE_LAYOUTS) if item["id"] == zone["id"])
    daily_wave = sin((sequence / 19) + zone_index)
    moisture_wave = sin((sequence / 7) + (zone_index * 1.9))
    recent_visit_bonus = 2 if waypoint.get("zoneId") == zone["id"] else 0
    moisture = _clamp(round(zone["baseMoisture"] + (moisture_wave * 4) + recent_visit_bonus), 18, 49)
    temperature = round(zone["baseTemperature"] + (daily_wave * 2.1), 1)
    humidity = _clamp(round(zone["baseHumidity"] - (daily_wave * 5) + (moisture - zone["baseMoisture"]) * 0.45), 38, 76)
    risk_level = _risk_level(moisture)
    current_tree = _tree_for_zone(zone["id"], sequence // len(ROBOT_ROUTE), sequence % 12)

    return {
        "id": zone["id"],
        "name": zone["name"],
        "cropType": zone["cropType"],
        "variety": zone["variety"],
        "treeCount": zone["treeCount"],
        "soilMoisturePct": moisture,
        "temperatureC": temperature,
        "humidityPct": humidity,
        "riskLevel": risk_level,
        "lastUpdatedAt": _iso(now),
        "bounds": zone["bounds"],
        "sensorIds": zone["sensorIds"],
        "valveId": zone["valveId"],
        "currentTreeId": current_tree["id"],
        "canopyHealthPct": _clamp(round(86 + sin(sequence / 8 + zone_index) * 7 - (6 if risk_level == "high" else 0)), 58, 96),
        "pestPressure": _pest_pressure(sequence, zone_index),
    }


def _robot_snapshot(sequence: int, waypoint: dict[str, Any], route_index: int, route_cycle: int) -> dict[str, Any]:
    battery = _clamp(round(94 - ((sequence % 48) * 0.65) + (8 if waypoint["kind"] == "base" else 0)), 48, 100)
    current_zone_id = waypoint.get("zoneId") or _nearest_zone_id(waypoint["location"])
    observation = _observation_for_waypoint(waypoint, sequence)

    return {
        "id": "robot-r1",
        "name": "Robot R1",
        "status": "charging" if waypoint["kind"] == "base" and battery < 92 else "assigned",
        "batteryPct": battery,
        "currentZoneId": current_zone_id,
        "currentWaypointId": waypoint["id"],
        "currentWaypointLabel": waypoint["label"],
        "currentTarget": _next_waypoint_label(route_index, route_cycle),
        "routeId": "route-g1-zones-tank-pump-loop",
        "routeProgressPct": round(((route_index + 1) / len(ROBOT_ROUTE)) * 100),
        "location": waypoint["location"],
        "speedMps": 0 if waypoint["kind"] == "base" else 0.8,
        "lastInspection": {
            "kind": waypoint["kind"],
            "zoneId": waypoint.get("zoneId"),
            "assetId": waypoint.get("treeId") or waypoint.get("sensorId") or waypoint.get("valveId") or waypoint.get("assetId"),
            "observedAtTick": sequence,
        },
        "observations": [observation],
    }


def _active_actions(sequence: int, waypoint: dict[str, Any], high_risk_zones: list[dict[str, Any]]) -> list[dict[str, Any]]:
    now = datetime.fromtimestamp(sequence * 60, tz=timezone.utc).isoformat()
    actions = [
        {
            "id": "act-robot-patrol-live",
            "type": "robot_patrol",
            "zoneId": waypoint.get("zoneId") or _nearest_zone_id(waypoint["location"]),
            "priority": "medium",
            "status": "active",
            "summary": f"Robot R1 is monitoring {waypoint['label']} on the live patrol route.",
            "createdAt": now,
        },
        {
            "id": "act-sensor-refresh-live",
            "type": "sensor_refresh",
            "zoneId": waypoint.get("zoneId") or "farm",
            "priority": "low",
            "status": "active",
            "summary": "Synthetic sensors are publishing one synchronized farm snapshot every minute.",
            "createdAt": now,
        },
    ]
    if high_risk_zones:
        zone = high_risk_zones[0]
        actions.append(
            {
                "id": f"act-irrigate-{zone['id']}-live",
                "type": "schedule_irrigation",
                "zoneId": zone["id"],
                "priority": "high",
                "status": "scheduled",
                "summary": f"{zone['name']} moisture is {zone['soilMoisturePct']}%; drip irrigation is queued for the next safe window.",
                "expectedOutcome": {
                    "metric": "soilMoisturePct",
                    "targetValue": 35,
                    "verificationWindowMinutes": 10,
                },
                "createdAt": now,
            }
        )
    return actions


def _pending_approvals(high_risk_zones: list[dict[str, Any]]) -> list[dict[str, Any]]:
    critical_zones = [zone for zone in high_risk_zones if zone["riskLevel"] == "critical"]
    if not critical_zones:
        return []

    zone = critical_zones[0]
    return [
        {
            "id": f"approval-irrigation-{zone['id']}",
            "title": f"{zone['name']} critical irrigation review",
            "reason": f"{zone['name']} moisture is critically low at {zone['soilMoisturePct']}%. Farmer approval is required before escalation.",
            "channel": "whatsapp",
        }
    ]


def _sensor_assets(zones: list[dict[str, Any]], sequence: int) -> list[dict[str, Any]]:
    zone_by_id = {zone["id"]: zone for zone in zones}
    assets = []
    for zone in ZONE_LAYOUTS:
        snapshot = zone_by_id[zone["id"]]
        for sensor_id in zone["sensorIds"]:
            location = SENSOR_LOCATIONS[sensor_id]
            assets.append(
                {
                    "id": sensor_id,
                    "zoneId": zone["id"],
                    "kind": location["kind"],
                    "status": "drift_watch" if (sequence + len(sensor_id)) % 37 == 0 else "online",
                    "location": {"xPct": location["xPct"], "yPct": location["yPct"]},
                    "reading": {
                        "soilMoisturePct": snapshot["soilMoisturePct"],
                        "temperatureC": snapshot["temperatureC"],
                        "humidityPct": snapshot["humidityPct"],
                    },
                }
            )
    return assets


def _valve_assets(zones: list[dict[str, Any]], sequence: int) -> list[dict[str, Any]]:
    zone_by_id = {zone["id"]: zone for zone in zones}
    valves = []
    for zone in ZONE_LAYOUTS:
        location = VALVE_LOCATIONS[zone["valveId"]]
        snapshot = zone_by_id[zone["id"]]
        valves.append(
            {
                "id": zone["valveId"],
                "zoneId": zone["id"],
                "status": "open" if snapshot["soilMoisturePct"] < 26 and sequence % 5 in {0, 1} else "standby",
                "flowLitersPerMinute": 18 if snapshot["soilMoisturePct"] < 26 else 0,
                "location": {"xPct": location["xPct"], "yPct": location["yPct"]},
            }
        )
    return valves


def _tree_assets(sequence: int) -> list[dict[str, Any]]:
    trees: list[dict[str, Any]] = []
    route_cycle = sequence // len(ROBOT_ROUTE)
    for zone in ZONE_LAYOUTS:
        for slot in range(12):
            tree = _tree_for_zone(zone["id"], route_cycle, slot)
            trees.append(
                {
                    **tree,
                    "zoneId": zone["id"],
                    "canopyHealthPct": _clamp(round(86 + sin(sequence / 9 + slot) * 8), 60, 96),
                    "lastObservedAtTick": sequence if slot == sequence % 12 else max(0, sequence - ((slot + 1) * 3)),
                }
            )
    return trees


def _water_tank_asset(tank_level_pct: int) -> dict[str, Any]:
    capacity = FIXED_ASSETS["tank"]["capacityLiters"]
    return {
        **FIXED_ASSETS["tank"],
        "levelPct": tank_level_pct,
        "availableLiters": round(capacity * tank_level_pct / 100),
        "status": "low" if tank_level_pct < 35 else "ready",
    }


def _pump_asset(sequence: int) -> dict[str, Any]:
    return {
        **FIXED_ASSETS["pump"],
        "status": "running" if sequence % 11 in {0, 1, 2} else "standby",
        "pressureBar": round(2.4 + sin(sequence / 4) * 0.25, 2),
    }


def _tree_for_zone(zone_id: str, route_cycle: int, slot: int) -> dict[str, Any]:
    zone = next(item for item in ZONE_LAYOUTS if item["id"] == zone_id)
    bounds = zone["bounds"]
    tree_number = ((route_cycle * 12 + slot) % zone["treeCount"]) + 1
    row = (tree_number - 1) // 12
    col = (tree_number - 1) % 12
    x = bounds["leftPct"] + 5 + ((col % 6) * (bounds["widthPct"] - 10) / 5)
    y = bounds["topPct"] + 5 + ((row % 4) * (bounds["heightPct"] - 10) / 3)
    zone_suffix = zone_id.split("-")[-1]
    return {
        "id": f"tree-{zone_suffix}-{tree_number:03d}",
        "name": f"Tree {zone_suffix.upper()}-{tree_number:03d}",
        "location": {"xPct": round(x, 1), "yPct": round(y, 1)},
    }


def _sensor_envelope(state: dict[str, Any], sequence: int) -> dict[str, Any]:
    telemetry = state["latestTelemetry"]
    watched_zone = telemetry["zoneName"]
    return make_envelope(
        agent="sensor",
        summary=f"Synthetic telemetry tick {sequence} generated synchronized readings for all four zones.",
        confidence=0.96,
        latency_ms=35,
        estimated_cost_usd=0,
        data={
            "tick": sequence,
            "zoneId": telemetry["zoneId"],
            "soilMoisturePct": telemetry["soilMoisturePct"],
            "waterTankPct": telemetry["waterTankPct"],
            "zoneReadings": state["zones"],
            "source": "synthetic_simulation",
        },
        explanation=[
            f"Robot is closest to {watched_zone}; this zone is treated as the current inspection context.",
            "All zone, tank, valve, and sensor readings are generated from the same route tick.",
        ],
        source_ids=[f"synthetic-tick-{sequence}"],
        next_agent="robot",
    )


def _robot_envelope(state: dict[str, Any], sequence: int) -> dict[str, Any]:
    robot = state["robots"][0]
    return make_envelope(
        agent="robot",
        summary=f"Robot R1 moved to {robot['currentWaypointLabel']} and published patrol observations.",
        confidence=0.94,
        latency_ms=40,
        estimated_cost_usd=0,
        data={
            "tick": sequence,
            "robot": robot,
            "routeProgressPct": robot["routeProgressPct"],
            "location": robot["location"],
            "source": "synthetic_simulation",
        },
        explanation=[
            "The patrol engine advances one waypoint per tick.",
            "Robot location, inspection context, and telemetry snapshot share the same sequence number.",
        ],
        source_ids=[robot["currentWaypointId"]],
        next_agent="evaluation",
    )


def _observation_for_waypoint(waypoint: dict[str, Any], sequence: int) -> str:
    kind = waypoint["kind"]
    if kind == "tree":
        return f"Inspected {waypoint['label']}; canopy score stable and drip line visible."
    if kind == "sensor":
        return f"Checked {waypoint['sensorId']}; sensor heartbeat and local readings are synced."
    if kind == "valve":
        return f"Verified {waypoint['valveId']}; drip valve is responding to the patrol check."
    if kind == "water_tank":
        return f"Measured main tank at {_tank_level(sequence)}% capacity."
    if kind == "pump":
        return "Checked pump bay pressure and irrigation readiness."
    return "Robot R1 returned to Gate 1 base for route health check."


def _nearest_zone_id(location: dict[str, float]) -> str:
    x = location["xPct"]
    y = location["yPct"]
    centers = []
    for zone in ZONE_LAYOUTS:
        bounds = zone["bounds"]
        centers.append(
            (
                zone["id"],
                bounds["leftPct"] + bounds["widthPct"] / 2,
                bounds["topPct"] + bounds["heightPct"] / 2,
            )
        )
    return min(centers, key=lambda item: ((x - item[1]) ** 2) + ((y - item[2]) ** 2))[0]


def _next_waypoint_label(route_index: int, route_cycle: int) -> str:
    next_index = (route_index + 1) % len(ROBOT_ROUTE)
    next_template = ROBOT_ROUTE[next_index]
    next_waypoint = _resolve_waypoint(next_template, route_cycle + (1 if next_index == 0 else 0), route_index + 1)
    return next_waypoint["label"]


def _visited_zones(route_index: int) -> list[str]:
    visited = []
    for template in ROBOT_ROUTE[: route_index + 1]:
        zone_id = template.get("zoneId")
        if zone_id and zone_id not in visited:
            visited.append(zone_id)
    return visited


def _risk_level(moisture: int) -> str:
    if moisture < 22:
        return "critical"
    if moisture < 29:
        return "high"
    if moisture < 35:
        return "medium"
    return "low"


def _pest_pressure(sequence: int, zone_index: int) -> str:
    pressure = sin(sequence / 11 + zone_index)
    if pressure > 0.72:
        return "watch"
    if pressure < -0.74:
        return "low"
    return "normal"


def _tank_level(sequence: int) -> int:
    consumption = (sequence % 60) * 0.22
    refill = 9 if sequence % 29 in {0, 1, 2} else 0
    return _clamp(round(67 - consumption + refill + sin(sequence / 6) * 3), 35, 88)


def _clamp(value: int | float, minimum: int, maximum: int) -> int:
    return int(max(minimum, min(maximum, value)))


def _iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat()
