from datetime import datetime, timezone

from app.services.admin_alert_service import ALERTS_PER_WINDOW, ALERT_INTERVAL_SECONDS
from app.simulation.world import build_tick_event


def _admin_feed(state):
    return {
        "activeActions": state["activeActions"],
        "pendingApprovals": state["pendingApprovals"],
        "communicationEvents": state["communicationEvents"],
        "outcomeChecks": state["outcomeChecks"],
    }


def _alert_timestamps(feed):
    timestamps = []
    timestamps.extend(action["createdAt"] for action in feed["activeActions"])
    timestamps.extend(approval.get("requestedAt") or approval["createdAt"] for approval in feed["pendingApprovals"])
    timestamps.extend(event["createdAt"] for event in feed["communicationEvents"])
    timestamps.extend(outcome["verifiedAt"] for outcome in feed["outcomeChecks"])
    return sorted(datetime.fromisoformat(timestamp) for timestamp in timestamps)


def test_admin_alert_feed_has_one_hour_of_five_minute_alerts():
    event = build_tick_event(datetime(2026, 6, 14, 10, 37, tzinfo=timezone.utc), tick_interval_seconds=60)
    feed = _admin_feed(event["data"]["farmState"])

    total_alerts = sum(len(items) for items in feed.values())
    timestamps = _alert_timestamps(feed)

    assert total_alerts == ALERTS_PER_WINDOW
    assert len(timestamps) == ALERTS_PER_WINDOW
    assert timestamps[-1] == datetime(2026, 6, 14, 10, 35, tzinfo=timezone.utc)
    assert all(
        int((right - left).total_seconds()) == ALERT_INTERVAL_SECONDS
        for left, right in zip(timestamps, timestamps[1:])
    )


def test_admin_alert_feed_rotates_alert_types_in_existing_contract():
    event = build_tick_event(datetime(2026, 6, 14, 10, 37, tzinfo=timezone.utc), tick_interval_seconds=60)
    feed = _admin_feed(event["data"]["farmState"])
    action_types = {action["type"] for action in feed["activeActions"]}

    assert {"soil_moisture_alert", "schedule_irrigation", "robot_inspection"}.issubset(action_types)
    assert feed["pendingApprovals"][0]["channel"] == "whatsapp"
    assert feed["pendingApprovals"][0]["requestedAt"]
    assert feed["communicationEvents"][0]["createdAt"]
    assert feed["outcomeChecks"][0]["verifiedAt"]


def test_admin_alert_feed_includes_telegram_notification_scenario():
    event = build_tick_event(datetime(2026, 6, 14, 10, 37, tzinfo=timezone.utc), tick_interval_seconds=60)
    feed = _admin_feed(event["data"]["farmState"])

    assert any(event["selectedChannel"] == "telegram" for event in feed["communicationEvents"])


def test_admin_alert_latest_timestamp_advances_on_five_minute_boundary():
    before_boundary = build_tick_event(datetime(2026, 6, 14, 10, 34, tzinfo=timezone.utc), tick_interval_seconds=60)
    at_boundary = build_tick_event(datetime(2026, 6, 14, 10, 35, tzinfo=timezone.utc), tick_interval_seconds=60)

    before_latest = _alert_timestamps(_admin_feed(before_boundary["data"]["farmState"]))[-1]
    boundary_latest = _alert_timestamps(_admin_feed(at_boundary["data"]["farmState"]))[-1]

    assert before_latest == datetime(2026, 6, 14, 10, 30, tzinfo=timezone.utc)
    assert boundary_latest == datetime(2026, 6, 14, 10, 35, tzinfo=timezone.utc)
