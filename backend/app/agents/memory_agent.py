from app.agents.envelope import make_envelope
from app.memory.farm_journal import write_journal_entry


def run_memory_agent(context):
    workflow = context.get("workflow", "sensor_anomaly")
    zone_id = context.get("zoneId", "zone-b")
    summary = context.get(
        "summary",
        "Recorded Zone B water stress, robot inspection, farmer communication, and outcome verification.",
    )
    entry = {
        "id": f"journal-{workflow}-zone-b-001",
        "type": f"{workflow}_recorded",
        "zoneId": zone_id,
        "summary": summary,
        "relatedActionId": context.get("actionId", "act-irrigate-zone-b-001"),
    }
    stored = write_journal_entry(entry)

    return make_envelope(
        agent="memory",
        summary="Wrote farm journal entry for the latest workflow.",
        confidence=0.91,
        latency_ms=85,
        data={"journalEntry": stored["entry"], "storeStatus": stored["status"]},
        explanation=["Farm journal entry is available for later planning and voice summaries."],
    )
