def score_agent_step(step):
    confidence = step.get("confidence", 0)
    quality_score = min(0.99, confidence + 0.02)
    if step.get("requiresHumanReview"):
        quality_score = min(quality_score, 0.94)

    if step.get("agent") == "communication":
        metrics = _communication_metrics(step)
        communication_quality = sum(metrics.values()) / len(metrics)
        quality_score = min(quality_score, communication_quality)
        return {"qualityScore": round(quality_score, 3), "step": step, "metrics": metrics}

    return {"qualityScore": round(quality_score, 3), "step": step}


def _communication_metrics(step):
    data = step.get("data", {})
    explicit_metrics = data.get("qualityMetrics")
    if explicit_metrics:
        return {
            "routingAccuracy": float(explicit_metrics.get("routingAccuracy", 0)),
            "deliverySuccess": float(explicit_metrics.get("deliverySuccess", 0)),
            "fallbackSuccess": float(explicit_metrics.get("fallbackSuccess", 0)),
            "languageMatchScore": float(explicit_metrics.get("languageMatchScore", 0)),
            "groundingScore": float(explicit_metrics.get("groundingScore", 0)),
            "conversationAnswerScore": float(explicit_metrics.get("conversationAnswerScore", 0.88)),
        }

    communication = data.get("communication", {})
    delivery_success = communication.get("status") in {"sent", "delivered"}
    fallback_success = communication.get("fallbackProvider") == "telegram" and delivery_success
    return {
        "routingAccuracy": 1.0 if communication.get("selectedChannel") else 0.0,
        "deliverySuccess": 1.0 if delivery_success else 0.0,
        "fallbackSuccess": 1.0 if fallback_success else 0.0,
        "languageMatchScore": 1.0 if communication.get("language") else 0.7,
        "groundingScore": 0.9,
        "conversationAnswerScore": 0.88,
    }
