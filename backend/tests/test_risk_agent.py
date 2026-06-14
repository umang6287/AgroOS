from app.agents.risk_agent import run_risk_agent


def test_risk_agent_returns_agent_name():
    assert run_risk_agent({})["agent"] == "risk"


def test_high_risk_requires_human_review():
    result = run_risk_agent(
        {
            "sensor": {
                "data": {
                    "zoneId": "zone-b",
                    "soilMoisturePct": 24,
                    "soilMoistureThresholdPct": 35,
                }
            },
            "weather": {"data": {"rainProbabilityNext6h": 0.12}},
        }
    )

    assert result["data"]["riskLevel"] == "high"
    assert result["requiresHumanReview"] is True


def test_critical_moisture_becomes_critical_risk():
    result = run_risk_agent(
        {
            "sensor": {
                "data": {
                    "zoneId": "zone-b",
                    "soilMoisturePct": 21,
                    "soilMoistureThresholdPct": 35,
                }
            },
            "weather": {"data": {"rainProbabilityNext6h": 0.12}},
        }
    )

    assert result["data"]["riskLevel"] == "critical"
    assert result["data"]["criticalMoisture"] is True
    assert result["requiresHumanReview"] is True
