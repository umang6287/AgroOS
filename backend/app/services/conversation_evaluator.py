from __future__ import annotations

from typing import Any

from app.agents.language import normalize_language


LANGUAGE_MARKERS = {
    "en": {"zone", "dry", "irrigation", "scheduled", "robot", "rain", "approval", "farm"},
    "mr": {"aahe", "nahi", "madhye", "mati", "sinchan", "paus", "tayar", "namaskar"},
    "hi": {"hai", "nahi", "mein", "mitti", "barish", "namaste", "zaroori", "tayar"},
    "gu": {"chhe", "chhu", "nathi", "ma", "mati", "varsad", "namaste", "jaruri", "thashe"},
}

SCRIPT_RANGES = {
    "mr": ((0x0900, 0x097F),),
    "hi": ((0x0900, 0x097F),),
    "gu": ((0x0A80, 0x0AFF),),
}


def evaluate_conversation_response(
    *,
    prompt: str,
    response_text: str,
    language: str,
    farm_state: dict[str, Any],
    transcription: dict[str, Any] | None = None,
    speech: dict[str, Any] | None = None,
    fallback_used: bool = False,
) -> dict[str, Any]:
    normalized_language = normalize_language(language)
    is_greeting = _is_greeting(prompt)
    expected_facts = [] if is_greeting else _expected_facts(farm_state)
    forbidden_claims = _forbidden_claims(farm_state)
    text = response_text or ""
    lower_text = text.lower()

    fact_results = [_fact_present(lower_text, fact) for fact in expected_facts]
    forbidden_hits = [claim["label"] for claim in forbidden_claims if any(term in lower_text for term in claim["terms"])]
    mentioned_facts = [fact["label"] for fact, matched in zip(expected_facts, fact_results) if matched]
    missing_facts = [fact["label"] for fact, matched in zip(expected_facts, fact_results) if not matched]

    critical_fact_accuracy = _ratio(len(mentioned_facts), len(expected_facts))
    unsupported_claim_penalty = min(0.5, len(forbidden_hits) * 0.25)
    semantic_grounding_score = max(0.0, critical_fact_accuracy - unsupported_claim_penalty)
    language_match_score = _language_match_score(text, normalized_language)
    intent_answer_score = _intent_answer_score(prompt, lower_text, mentioned_facts)
    translation_adequacy_score = round((language_match_score + semantic_grounding_score + intent_answer_score) / 3, 3)
    speech_quality_score = _speech_quality_score(speech)
    transcription_confidence = _transcription_confidence(transcription, prompt)

    overall = round(
        (
            language_match_score * 0.2
            + semantic_grounding_score * 0.25
            + intent_answer_score * 0.2
            + critical_fact_accuracy * 0.25
            + speech_quality_score * 0.05
            + transcription_confidence * 0.05
        ),
        3,
    )
    requires_review = (
        language_match_score < 0.9
        or semantic_grounding_score < 0.9
        or critical_fact_accuracy < 1.0
        or transcription_confidence < 0.8
        or bool(forbidden_hits)
    )

    evidence = [
        f"Requested language: {normalized_language}.",
        f"Matched facts: {', '.join(mentioned_facts) if mentioned_facts else 'none'}.",
    ]
    if missing_facts:
        evidence.append(f"Missing expected facts: {', '.join(missing_facts)}.")
    if forbidden_hits:
        evidence.append(f"Unsupported or unsafe claims detected: {', '.join(forbidden_hits)}.")
    if fallback_used:
        evidence.append("Response used deterministic fallback copy.")

    return {
        "language": normalized_language,
        "languageMatchScore": round(language_match_score, 3),
        "semanticGroundingScore": round(semantic_grounding_score, 3),
        "groundingScore": round(semantic_grounding_score, 3),
        "intentAnswerScore": round(intent_answer_score, 3),
        "conversationAnswerScore": round(intent_answer_score, 3),
        "criticalFactAccuracy": round(critical_fact_accuracy, 3),
        "translationAdequacyScore": translation_adequacy_score,
        "speechQualityScore": round(speech_quality_score, 3),
        "transcriptionConfidence": round(transcription_confidence, 3),
        "overallConversationScore": overall,
        "requiresHumanReview": requires_review,
        "expectedFacts": [fact["label"] for fact in expected_facts],
        "matchedFacts": mentioned_facts,
        "missingFacts": missing_facts,
        "forbiddenClaims": forbidden_hits,
        "evidence": evidence,
    }


def _expected_facts(farm_state: dict[str, Any]) -> list[dict[str, Any]]:
    zones = farm_state.get("zones", [])
    priority_zone = next((zone for zone in zones if zone.get("riskLevel") in {"high", "critical"}), zones[0] if zones else {})
    facts = []
    if priority_zone.get("name"):
        facts.append({"label": f"{priority_zone['name']} priority risk", "terms": [_term(priority_zone["name"])]})
    if priority_zone.get("soilMoisturePct", 100) <= 25:
        facts.append({"label": "dry soil or low moisture", "terms": ["dry", "sukhi", "sukha", "sukhu", "low moisture", "mati"]})
    if farm_state.get("activeActions"):
        facts.append({"label": "scheduled action", "terms": ["scheduled", "schedule", "sinchan", "irrigation", "drip"]})
    if farm_state.get("robots"):
        facts.append({"label": "robot status", "terms": ["robot", "r1"]})
    if farm_state.get("pendingApprovals"):
        facts.append({"label": "pending approval", "terms": ["approval", "review", "manjuri", "मंजुरी"]})
    if farm_state.get("outcomeChecks"):
        facts.append({"label": "verified outcome", "terms": ["outcome", "verified", "improved", "verification"]})
    return facts[:6]


def _forbidden_claims(farm_state: dict[str, Any]) -> list[dict[str, Any]]:
    claims = []
    if not farm_state.get("pendingApprovals"):
        claims.append({"label": "approval already granted", "terms": ["approved", "approval completed", "manjur zali"]})
    if not farm_state.get("communicationEvents"):
        claims.append({"label": "provider delivery happened", "terms": ["sms sent", "call placed", "whatsapp delivered"]})
    claims.append({"label": "payment or irreversible real-world action", "terms": ["payment", "charged", "treatment completed"]})
    return claims


def _fact_present(lower_text: str, fact: dict[str, Any]) -> bool:
    return any(term in lower_text for term in fact["terms"])


def _language_match_score(text: str, language: str) -> float:
    if not text.strip():
        return 0.0
    script_score = _script_score(text, language)
    marker_score = _marker_score(text, language)
    if language == "en":
        return max(0.7, marker_score)
    return max(script_score, marker_score)


def _script_score(text: str, language: str) -> float:
    ranges = SCRIPT_RANGES.get(language)
    if not ranges:
        return 0.0
    letters = [ord(ch) for ch in text if ch.isalpha()]
    if not letters:
        return 0.0
    matching = sum(1 for code in letters if any(start <= code <= end for start, end in ranges))
    ratio = matching / len(letters)
    return 1.0 if ratio >= 0.45 else round(ratio / 0.45, 3)


def _marker_score(text: str, language: str) -> float:
    lower_text = text.lower()
    markers = LANGUAGE_MARKERS.get(language, set())
    if not markers:
        return 0.0
    hits = sum(1 for marker in markers if marker in lower_text)
    return min(1.0, hits / 3)


def _intent_answer_score(prompt: str, lower_text: str, mentioned_facts: list[str]) -> float:
    if _is_greeting(prompt):
        return 1.0 if "agrios saathi" in lower_text or "help" in lower_text or "madat" in lower_text else 0.7
    return min(1.0, 0.4 + len(mentioned_facts) * 0.2)


def _speech_quality_score(speech: dict[str, Any] | None) -> float:
    if not speech:
        return 1.0
    if speech.get("audioUrl") and not speech.get("fallbackUsed"):
        return 1.0
    return 0.65 if speech.get("fallbackUsed") else 0.8


def _transcription_confidence(transcription: dict[str, Any] | None, prompt: str) -> float:
    if not transcription:
        return 1.0
    if transcription.get("fallbackUsed"):
        return 0.0
    text = (transcription.get("text") or "").strip()
    return 1.0 if text and text == prompt else 0.85 if text else 0.0


def _is_greeting(prompt: str) -> bool:
    compact = " ".join("".join(ch.lower() if ch.isalnum() or ch.isspace() else " " for ch in (prompt or "")).split())
    return compact in {"hi", "hello", "hey", "hi there", "hello there", "namaste", "namaskar"}


def _term(value: str) -> str:
    return value.lower().replace(" ", " ")


def _ratio(numerator: int, denominator: int) -> float:
    if denominator <= 0:
        return 1.0
    return numerator / denominator
