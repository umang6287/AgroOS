from datetime import datetime

from app.simulator.sensor_generator import generate_sensor_reading
from app.simulation.world import build_tick_event


def test_generate_sensor_reading_has_zone():
    assert generate_sensor_reading()["zoneId"]


def test_simulation_moves_robot_between_ticks():
    first = build_tick_event(tick_interval_seconds=60)
    second_time = first["data"]["farmState"]["simulation"]["nextTickAt"]
    second = build_tick_event(datetime.fromisoformat(second_time), tick_interval_seconds=60)

    first_robot = first["data"]["farmState"]["robots"][0]
    second_robot = second["data"]["farmState"]["robots"][0]

    assert first["type"] == "simulation.tick"
    assert first_robot["currentWaypointId"] != second_robot["currentWaypointId"]
    assert "sensorEnvelope" in first["data"]
    assert "robotEnvelope" in first["data"]
