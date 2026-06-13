from app.simulator.sensor_generator import generate_sensor_reading


def test_generate_sensor_reading_has_zone():
    assert generate_sensor_reading()["zoneId"]
