def call_openai_with_fallback(prompt):
    return {"text": "Fallback response", "fallbackUsed": True, "prompt": prompt}
