from __future__ import annotations

import asyncio
import os
from datetime import datetime, timezone
from typing import Any

from app.simulation import storage
from app.simulation.world import RETENTION_MINUTES, build_tick_event, current_sensor_reading


_simulation_task: asyncio.Task | None = None


def get_tick_interval_seconds() -> int:
    raw_value = os.getenv("SIMULATION_TICK_SECONDS", "60")
    try:
        return max(1, int(raw_value))
    except ValueError:
        return 60


def get_retention_minutes() -> int:
    raw_value = os.getenv("SIMULATION_RETENTION_MINUTES", str(RETENTION_MINUTES))
    try:
        return max(1, int(raw_value))
    except ValueError:
        return RETENTION_MINUTES


def generate_current_tick_event(store: bool = True) -> dict[str, Any]:
    event = build_tick_event(datetime.now(timezone.utc), get_tick_interval_seconds())
    if store:
        storage.save_event(event, get_retention_minutes())
    return event


def get_current_farm_state() -> dict[str, Any]:
    return generate_current_tick_event()["data"]["farmState"]


def get_current_sensor_reading() -> dict[str, Any]:
    return current_sensor_reading(datetime.now(timezone.utc), get_tick_interval_seconds())


def get_current_robot_state() -> dict[str, Any]:
    return get_current_farm_state()["robots"][0]


def get_latest_simulation_trace() -> dict[str, Any]:
    return generate_current_tick_event()["data"]["agentTrace"]


def get_recent_simulation_events(limit: int = 120) -> list[dict[str, Any]]:
    generate_current_tick_event()
    return storage.get_recent_events(limit=limit, retention_minutes=get_retention_minutes())


def get_simulation_status() -> dict[str, Any]:
    latest = generate_current_tick_event()
    stored_events = storage.get_recent_events(limit=500, retention_minutes=get_retention_minutes())
    state = latest["data"]["farmState"]
    return {
        "status": "running" if is_simulation_running() else "ready",
        "tickIntervalSeconds": get_tick_interval_seconds(),
        "retentionMinutes": get_retention_minutes(),
        "storedEvents": len(stored_events),
        "latestEventId": latest["eventId"],
        "latestTick": latest["sequence"],
        "robot": state["robots"][0],
        "currentActivity": state["simulation"]["currentActivity"],
        "nextTickAt": state["simulation"]["nextTickAt"],
    }


def reset_simulation_events() -> None:
    storage.reset_events()
    generate_current_tick_event()


def start_simulation_loop() -> None:
    global _simulation_task
    storage.init_database()
    generate_current_tick_event()

    try:
        asyncio.get_running_loop()
    except RuntimeError:
        return

    if _simulation_task is None or _simulation_task.done():
        _simulation_task = asyncio.create_task(_run_simulation_loop())


async def stop_simulation_loop() -> None:
    global _simulation_task
    if _simulation_task is None:
        return

    _simulation_task.cancel()
    try:
        await _simulation_task
    except asyncio.CancelledError:
        pass
    _simulation_task = None


def is_simulation_running() -> bool:
    return _simulation_task is not None and not _simulation_task.done()


async def _run_simulation_loop() -> None:
    while True:
        generate_current_tick_event()
        await asyncio.sleep(get_tick_interval_seconds())

