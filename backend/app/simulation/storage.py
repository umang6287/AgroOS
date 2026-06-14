from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.config.settings import Settings


def init_database() -> None:
    with _connect() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS simulation_events (
                event_id TEXT PRIMARY KEY,
                event_type TEXT NOT NULL,
                sequence INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                created_at_epoch REAL NOT NULL,
                payload_json TEXT NOT NULL
            )
            """
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_simulation_events_created_at ON simulation_events(created_at_epoch)"
        )


def save_event(event: dict[str, Any], retention_minutes: int = 60) -> dict[str, Any]:
    init_database()
    created_at_epoch = _created_at_epoch(event["createdAt"])
    payload_json = json.dumps(event, separators=(",", ":"))

    with _connect() as connection:
        connection.execute(
            """
            INSERT OR REPLACE INTO simulation_events (
                event_id,
                event_type,
                sequence,
                created_at,
                created_at_epoch,
                payload_json
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                event["eventId"],
                event["type"],
                event["sequence"],
                event["createdAt"],
                created_at_epoch,
                payload_json,
            ),
        )
        cutoff = datetime.now(timezone.utc).timestamp() - (retention_minutes * 60)
        connection.execute("DELETE FROM simulation_events WHERE created_at_epoch < ?", (cutoff,))

    return event


def get_recent_events(limit: int = 120, retention_minutes: int = 60) -> list[dict[str, Any]]:
    init_database()
    cutoff = datetime.now(timezone.utc).timestamp() - (retention_minutes * 60)

    with _connect() as connection:
        rows = connection.execute(
            """
            SELECT payload_json
            FROM simulation_events
            WHERE created_at_epoch >= ?
            ORDER BY created_at_epoch ASC
            LIMIT ?
            """,
            (cutoff, limit),
        ).fetchall()

    return [json.loads(row["payload_json"]) for row in rows]


def get_latest_event() -> dict[str, Any] | None:
    init_database()
    with _connect() as connection:
        row = connection.execute(
            """
            SELECT payload_json
            FROM simulation_events
            ORDER BY created_at_epoch DESC
            LIMIT 1
            """
        ).fetchone()

    return json.loads(row["payload_json"]) if row else None


def reset_events() -> None:
    init_database()
    with _connect() as connection:
        connection.execute("DELETE FROM simulation_events")


def _connect() -> sqlite3.Connection:
    path = _database_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    return connection


def _database_path() -> Path:
    explicit_path = os.getenv("AGRIOS_SIMULATION_DB_PATH")
    if explicit_path:
        return Path(explicit_path).expanduser().resolve()

    database_url = os.getenv("DATABASE_URL", Settings().database_url)
    if database_url.startswith("sqlite:///"):
        configured_path = Path(database_url.replace("sqlite:///", "", 1)).expanduser()
        if os.getenv("VERCEL") and not configured_path.is_absolute():
            return Path("/tmp") / configured_path.name
        return configured_path.resolve()

    return Path("agrios.db").resolve()


def _created_at_epoch(created_at: str) -> float:
    normalized = created_at.replace("Z", "+00:00")
    return datetime.fromisoformat(normalized).timestamp()
