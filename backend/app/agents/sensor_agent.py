from app.agents.envelope import make_envelope


def run_sensor_agent(telemetry):
    moisture = telemetry.get("soilMoisturePct", 0)
    threshold = telemetry.get("soilMoistureThresholdPct", 35)
    zone_id = telemetry.get("zoneId", "zone-b")
    zone_name = telemetry.get("zoneName", zone_id)
    anomaly = moisture < threshold
    severity = "critical" if moisture <= threshold - 12 else "high" if anomaly else "normal"

    if anomaly:
        summary = f"{zone_name} soil moisture is critically low at {moisture}%."
        explanation = [
            f"{zone_name} is below its {threshold}% moisture threshold.",
            f"Current temperature is {telemetry.get('temperatureC', 0)} C with humidity at {telemetry.get('humidityPct', 0)}%.",
        ]
    else:
        summary = "Telemetry is within the expected operating range."
        explanation = ["No zone is below its configured moisture threshold."]

    return make_envelope(
        agent="sensor",
        summary=summary,
        confidence=0.97,
        latency_ms=120,
        data={
            "zoneId": zone_id,
            "anomaly": "low_soil_moisture" if anomaly else None,
            "severity": severity,
            "soilMoisturePct": moisture,
            "soilMoistureThresholdPct": threshold,
            "telemetry": telemetry,
        },
        explanation=explanation,
        source_ids=[telemetry.get("eventId", "evt-sensor-001")],
        next_agent="weather",
    )
