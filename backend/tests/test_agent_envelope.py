from app.models.agent_models import AgentEnvelope


def test_agent_envelope_accepts_required_fields():
    envelope = AgentEnvelope(agent="sensor", status="completed", data={})
    assert envelope.agent == "sensor"
