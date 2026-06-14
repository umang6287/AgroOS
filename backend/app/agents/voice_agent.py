from app.agents.envelope import make_envelope
from app.agents.language import normalize_language, localized_text
from app.services.conversation_evaluator import evaluate_conversation_response
from app.services.openai_service import generate_agent_copy, synthesize_speech


GREETING_RESPONSES = {
    "en": {
        "summary": "Greeting response generated for the farmer.",
        "message": "Hi, I am AgriOS Saathi. I can help with farm status, risks, irrigation, approvals, robots, and recent outcomes.",
    },
    "mr": {
        "summary": "Farmer greeting response tayar kela.",
        "message": "Namaskar, mi AgriOS Saathi aahe. Farm status, risk, irrigation, approval, robot ani recent outcome sathi madat karu shakto.",
    },
    "hi": {
        "summary": "Farmer greeting response tayar hua.",
        "message": "Namaste, main AgriOS Saathi hoon. Main farm status, risk, irrigation, approval, robot aur recent outcome mein madad kar sakta hoon.",
    },
    "gu": {
        "summary": "Farmer greeting response tayar thayu.",
        "message": "Namaste, hu AgriOS Saathi chhu. Farm status, risk, irrigation, approval, robot ane recent outcome mate madad kari shaku chhu.",
    },
}


def run_voice_agent(context):
    phase = context.get("phase", "response")
    language = normalize_language(context.get("language"))
    prompt = context.get("prompt", "Call my farm")

    if phase == "received":
        return make_envelope(
            agent="voice",
            summary="Voice prompt received and normalized for farm-state lookup.",
            confidence=0.94,
            latency_ms=70,
            data={"prompt": prompt, "language": language, "phase": phase},
            explanation=["Text fallback keeps the voice demo reliable without microphone access."],
            warnings=["fallback:text_voice_response"],
            next_agent="memory",
        )

    farm_state = context.get("farmState", {})
    fallback = _fallback_for_prompt(prompt, language)
    generated = generate_agent_copy(
        agent="voice",
        task="Answer the farmer's farm-status prompt in a concise spoken style.",
        language=language,
        farm_context={
            "prompt": prompt,
            "conversationId": context.get("conversationId"),
            "history": context.get("history", []),
            "farmState": farm_state,
            "pendingApprovals": farm_state.get("pendingApprovals", []),
            "activeActions": farm_state.get("activeActions", []),
            "latestTelemetry": farm_state.get("latestTelemetry", {}),
            "robots": farm_state.get("robots", []),
            "outcomeChecks": farm_state.get("outcomeChecks", []),
        },
        fallback=fallback,
    )
    response_text = generated["message"]
    audio = (
        synthesize_speech(response_text, language=language)
        if context.get("includeAudio")
        else {
            "audioUrl": None,
            "audioMimeType": None,
            "fallbackUsed": True,
            "warnings": [],
            "latencyMs": 0,
        }
    )
    conversation_evaluation = evaluate_conversation_response(
        prompt=prompt,
        response_text=response_text,
        language=language,
        farm_state=farm_state,
        transcription=context.get("transcription"),
        speech=audio if context.get("includeAudio") else None,
        fallback_used=generated["fallback"],
    )
    warnings = [*generated["warnings"], *audio.get("warnings", [])]
    if conversation_evaluation["requiresHumanReview"]:
        warnings.append("evaluation:conversation_quality_review")

    return make_envelope(
        agent="voice",
        status="fallback" if generated["fallback"] else "completed",
        summary=generated["summary"],
        confidence=min(0.92, conversation_evaluation["overallConversationScore"]),
        latency_ms=80 + generated["latencyMs"] + audio.get("latencyMs", 0),
        estimated_cost_usd=generated["estimatedCostUsd"],
        requires_human_review=conversation_evaluation["requiresHumanReview"],
        data={
            "prompt": prompt,
            "responseText": response_text,
            "language": language,
            "audioUrl": audio.get("audioUrl"),
            "audioMimeType": audio.get("audioMimeType"),
            "activeRisks": ["zone-b-low-moisture"],
            "pendingApprovals": ["approval-treatment-001"],
            "fallback": generated["fallback"],
            "speechFallback": audio.get("fallbackUsed", True),
            "transcription": context.get("transcription"),
            "conversationId": context.get("conversationId"),
            "ai": {
                "provider": generated["provider"],
                "model": generated["model"],
                "fallback": generated["fallback"],
                "speechModel": audio.get("model"),
            },
            "qualityMetrics": conversation_evaluation,
        },
        explanation=[*generated["explanation"], *conversation_evaluation["evidence"]],
        warnings=warnings,
        source_ids=["voice-demo-fallback"],
    )


def _fallback_for_prompt(prompt: str, language: str) -> dict:
    if _is_greeting(prompt):
        greeting = GREETING_RESPONSES.get(language, GREETING_RESPONSES["en"])
        return {
            **greeting,
            "explanation": ["Fallback greeting matched a simple farmer salutation."],
        }

    return {
        "summary": localized_text(language, "voice_summary"),
        "message": localized_text(language, "voice_response"),
        "explanation": ["Voice Agent summarized farm state, actions, approvals, weather, and outcome status."],
    }


def _is_greeting(prompt: str) -> bool:
    normalized = "".join(ch.lower() if ch.isalnum() or ch.isspace() else " " for ch in (prompt or "")).strip()
    compact = " ".join(normalized.split())
    return compact in {
        "hi",
        "hello",
        "hey",
        "hi there",
        "hello there",
        "namaste",
        "namaskar",
        "नमस्ते",
        "नमस्कार",
    }
