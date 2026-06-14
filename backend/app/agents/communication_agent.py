from app.agents.envelope import make_envelope
from app.agents.language import normalize_language, localized_text
from app.demo_store import server_now_iso
from app.services.communication_gateway import send_message
from app.services.openai_service import generate_agent_copy


def run_communication_agent(context):
    language = normalize_language(context.get("language"))
    risk_level = context.get("risk", {}).get("data", {}).get("riskLevel", "high")
    selected_channel = "phone_call" if risk_level == "critical" else "whatsapp" if risk_level == "high" else "in_app"
    severity = "critical" if risk_level == "critical" else "warning" if risk_level == "high" else "info"
    fallback_message = localized_text(language, "communication_alert")
    generated = generate_agent_copy(
        agent="communication",
        task="Write the AgriOS Saathi farmer notification message. Keep it short, actionable, and safe for the selected channel.",
        language=language,
        farm_context={
            "risk": context.get("risk", {}),
            "planner": context.get("planner", {}),
            "robot": context.get("robot", {}),
            "severity": severity,
            "selectedChannel": selected_channel,
            "recipientRole": "farmer",
        },
        fallback={
            "summary": localized_text(language, "communication_summary"),
            "message": fallback_message,
            "explanation": ["AgriOS Saathi uses Twilio first and Telegram fallback when Twilio delivery fails."],
        },
    )
    request = {
        "communicationId": "comm-zone-b-001",
        "runId": context.get("runId", "run-sensor-001"),
        "actionId": "act-irrigate-zone-b-001",
        "severity": severity,
        "preferredChannels": ["sms", "phone_call", "whatsapp", "telegram"] if severity == "critical" else ["whatsapp", "telegram"],
        "selectedChannel": selected_channel,
        "recipientRole": "farmer",
        "message": generated["message"],
        "language": language,
        "ai": {
            "provider": generated["provider"],
            "model": generated["model"],
            "fallback": generated["fallback"],
        },
        "createdAt": server_now_iso(),
    }
    communication = send_message(request)
    warnings = [*generated["warnings"], *communication.get("warnings", [])]
    if communication.get("fallbackProvider") == "telegram":
        warnings.append("fallback:telegram_after_twilio_failure")
    if communication.get("status") == "failed":
        warnings.append("communication:provider_delivery_failed")

    delivery_success = communication.get("status") in {"sent", "delivered"}
    fallback_success = communication.get("fallbackProvider") == "telegram" and delivery_success

    return make_envelope(
        agent="communication",
        summary=generated["summary"],
        confidence=0.9 if delivery_success else 0.72,
        latency_ms=90 + generated["latencyMs"],
        estimated_cost_usd=generated["estimatedCostUsd"],
        requires_human_review=communication.get("requiresHumanReview", False),
        data={
            "communication": communication,
            "qualityMetrics": {
                "routingAccuracy": 1.0,
                "deliverySuccess": 1.0 if delivery_success else 0.0,
                "fallbackSuccess": 1.0 if fallback_success else 0.0,
                "languageMatchScore": 1.0 if communication.get("language") == language else 0.7,
                "groundingScore": 0.92,
                "conversationAnswerScore": 0.88,
            },
        },
        explanation=generated["explanation"],
        warnings=warnings,
        source_ids=[communication["communicationId"]],
        next_agent="outcome",
        status="failed" if communication.get("status") == "failed" else "completed",
    )
