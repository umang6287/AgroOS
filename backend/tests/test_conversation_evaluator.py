from app.agents.supervisor_agent import run_voice_workflow
from app.demo_store import get_conversation_evaluations, get_scorecards, reset_demo_state
from app.services.conversation_evaluator import evaluate_conversation_response


def _farm_state():
    return {
        "zones": [
            {"id": "zone-b", "name": "Zone B", "soilMoisturePct": 21, "riskLevel": "high"},
        ],
        "robots": [{"id": "robot-r1", "name": "Robot R1"}],
        "activeActions": [{"id": "act-irrigate-zone-b-001", "type": "schedule_irrigation"}],
        "pendingApprovals": [],
        "communicationEvents": [],
        "outcomeChecks": [],
    }


def test_local_language_evaluator_scores_grounded_marathi_answer():
    result = evaluate_conversation_response(
        prompt="माझ्या शेताची स्थिती सांगा",
        response_text="Zone B madhye mati sukhi aahe. 12 minute drip sinchan scheduled aahe ani Robot R1 tapasnisathi aahe.",
        language="mr",
        farm_state=_farm_state(),
    )

    assert result["languageMatchScore"] >= 0.9
    assert result["criticalFactAccuracy"] == 1.0
    assert result["semanticGroundingScore"] >= 0.9
    assert result["requiresHumanReview"] is False


def test_local_language_evaluator_flags_unsupported_claims():
    result = evaluate_conversation_response(
        prompt="What is happening on my farm?",
        response_text="Zone B is dry. Treatment completed and WhatsApp delivered.",
        language="en",
        farm_state=_farm_state(),
    )

    assert result["criticalFactAccuracy"] < 1.0
    assert "provider delivery happened" in result["forbiddenClaims"]
    assert "payment or irreversible real-world action" in result["forbiddenClaims"]
    assert result["requiresHumanReview"] is True


def test_voice_workflow_stores_measured_conversation_metrics():
    reset_demo_state()

    _, result = run_voice_workflow("Call my farm", language="mr")
    metrics = result["data"]["qualityMetrics"]
    scorecards = get_scorecards()["scorecards"]
    conversation_runs = get_conversation_evaluations()["conversationEvaluations"]
    voice_scorecard = next(score for score in reversed(scorecards) if score["agent"] == "voice")

    assert metrics["languageMatchScore"] >= 0.9
    assert "criticalFactAccuracy" in metrics
    assert voice_scorecard["overallConversationScore"] == metrics["overallConversationScore"]
    assert voice_scorecard["qualityScore"] == metrics["overallConversationScore"]
    assert conversation_runs[-1]["prompt"] == "Call my farm"
    assert conversation_runs[-1]["qualityMetrics"]["overallConversationScore"] == metrics["overallConversationScore"]
