from app.agents.envelope import make_envelope
from app.simulator.weather_generator import generate_weather_forecast


def run_weather_agent(context):
    forecast = generate_weather_forecast()

    return make_envelope(
        agent="weather",
        summary="Mock forecast shows no heavy rain in the next 6 hours.",
        confidence=0.86,
        latency_ms=25,
        data={
            "zoneId": context.get("zoneId", "zone-b"),
            "forecast": forecast,
            "rainProbabilityNext6h": forecast["rainProbabilityNext6h"],
            "planningImpact": forecast["planningImpact"],
            "fallback": True,
        },
        explanation=[
            "Weather provider is disabled for the demo.",
            "Using deterministic mock forecast for Zone B.",
        ],
        warnings=["fallback:mock_weather"],
        source_ids=["demo-weather-v1"],
        next_agent="risk",
    )
