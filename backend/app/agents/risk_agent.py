from app.agents.envelope import make_envelope
from app.agents.language import normalize_language, localized_text
from app.services.openai_service import generate_agent_copy


def run_risk_agent(context):
    language = normalize_language(context.get("language"))
    sensor_data = context.get("sensor", {}).get("data", {})
    vision_data = context.get("vision", {}).get("data", {})
    weather_data = context.get("weather", {}).get("data", {})

    moisture = sensor_data.get("soilMoisturePct", 21)
    threshold = sensor_data.get("soilMoistureThresholdPct", 35)
    disease = vision_data.get("disease")
    has_vision_risk = disease not in (None, "healthy")
    low_moisture = moisture < threshold
    rain_probability = weather_data.get("rainProbabilityNext6h", 0.12)

    critical_moisture = low_moisture and moisture < 22
    risk_level = "critical" if critical_moisture else "high" if low_moisture or has_vision_risk else "low"
    confidence = 0.87 if risk_level == "critical" else 0.89 if risk_level == "high" else 0.92
    requires_human_review = risk_level in {"high", "critical"} or confidence < 0.8
    next_step = "schedule_short_irrigation_and_review_treatment" if has_vision_risk else "schedule_short_irrigation"

    explanation = []
    if low_moisture:
        explanation.append(f"Soil moisture is {moisture}%, below the {threshold}% threshold.")
    if rain_probability < 0.3:
        explanation.append("No heavy rain is expected in the next 6 hours.")
    if has_vision_risk:
        explanation.append("Vision fallback found a medium-severity disease signal that should be reviewed before spraying.")
    fallback_summary = localized_text(language, "risk_treatment" if has_vision_risk else "risk_water")
    generated = generate_agent_copy(
        agent="risk",
        task="Write a concise risk summary and farmer-safe explanation.",
        language=language,
        farm_context={
            "sensor": sensor_data,
            "vision": vision_data,
            "weather": weather_data,
            "riskLevel": risk_level,
            "requiresHumanReview": requires_human_review,
            "deterministicExplanation": explanation,
        },
        fallback={"summary": fallback_summary, "message": fallback_summary, "explanation": explanation},
    )

    return make_envelope(
        agent="risk",
        summary=generated["summary"],
        confidence=confidence,
        latency_ms=180 + generated["latencyMs"],
        estimated_cost_usd=0.0004 + generated["estimatedCostUsd"],
        requires_human_review=requires_human_review,
        data={
            "zoneId": sensor_data.get("zoneId") or vision_data.get("zoneId", "zone-b"),
            "riskLevel": risk_level,
            "nextStep": next_step,
            "approvalReason": "spray_treatment" if has_vision_risk else "high_risk_irrigation_context",
            "lowMoisture": low_moisture,
            "criticalMoisture": critical_moisture,
            "visionRisk": has_vision_risk,
            "language": language,
            "generatedMessage": generated["message"],
        },
        explanation=generated["explanation"] or explanation,
        warnings=generated["warnings"],
        next_agent="planner",
    )
