from app.agents.risk_agent import run_risk_agent


def test_risk_agent_returns_agent_name():
    assert run_risk_agent({})["agent"] == "risk"
