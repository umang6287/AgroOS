from app.services.openai_service import synthesize_speech


def synthesize_voice(text, language="en"):
    audio = synthesize_speech(text, language=language)
    return {"spokenText": text, **audio}
