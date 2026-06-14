from app.agents.envelope import make_envelope
from app.agents.language import normalize_language


def run_vision_agent(image_context):
    image_id = image_context.get("imageId", "leaf-demo-tomato-001")
    crop_type = image_context.get("cropType", "mango")
    zone_id = image_context.get("zoneId", "zone-b")
    language = normalize_language(image_context.get("language"))

    return make_envelope(
        agent="vision",
        status="fallback",
        summary="Possible early blight detected on the demo leaf image.",
        confidence=0.86,
        latency_ms=940,
        estimated_cost_usd=0,
        data={
            "imageId": image_id,
            "cropType": crop_type,
            "zoneId": zone_id,
            "language": language,
            "disease": "early_blight",
            "severity": "medium",
            "recommendation": "Assign robot inspection and ask farmer to review treatment before spraying.",
            "fallback": True,
        },
        explanation=[
            "Known demo image uses deterministic fallback analysis.",
            "Leaf marks match the demo early-blight profile.",
        ],
        warnings=["fallback:demo_vision_result"],
        source_ids=[image_id],
        next_agent="risk",
    )
