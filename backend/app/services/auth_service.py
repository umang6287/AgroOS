from __future__ import annotations

import base64
import hashlib
import hmac
import os
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from app.config.settings import Settings
from app.services.ai_config_service import get_ai_config_status


SESSION_COOKIE_NAME = "agrios_session"
SESSION_DAYS = 7
PASSWORD_ITERATIONS = 210_000


class AuthError(Exception):
    pass


def init_auth_database() -> None:
    with _connect() as connection:
        _migrate_single_admin_table(connection)
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS farm_admin_profile (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                whatsapp_number TEXT,
                mobile_number TEXT,
                telegram_account TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS farm_admin_sessions (
                token_hash TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL
            )
            """
        )


def has_admin_profile() -> bool:
    init_auth_database()
    with _connect() as connection:
        row = connection.execute("SELECT 1 FROM farm_admin_profile LIMIT 1").fetchone()
    return row is not None


def create_admin_profile(data: dict[str, Any]) -> dict[str, Any]:
    init_auth_database()
    required = _required_profile_values(data, require_password=True)
    now = _now_iso()
    try:
        with _connect() as connection:
            connection.execute(
                """
                INSERT INTO farm_admin_profile (
                    user_id,
                    password_hash,
                    first_name,
                    last_name,
                    whatsapp_number,
                    mobile_number,
                    telegram_account,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    required["userId"],
                    _hash_password(required["password"]),
                    required["firstName"],
                    required["lastName"],
                    _optional(data.get("whatsappNumber")),
                    _optional(data.get("mobileNumber")),
                    _optional(data.get("telegramAccount")),
                    now,
                    now,
                ),
            )
    except sqlite3.IntegrityError as exc:
        raise AuthError("A Farm Admin with this user ID already exists.") from exc

    profile = get_admin_profile(required["userId"])
    if not profile:
        raise AuthError("Farm admin setup failed.")
    return profile


def authenticate_admin(user_id: str, password: str) -> dict[str, Any] | None:
    init_auth_database()
    normalized_user_id = _normalize_user_id(_required(user_id, "userId"))
    with _connect() as connection:
        row = connection.execute(
            "SELECT * FROM farm_admin_profile WHERE user_id = ?",
            (normalized_user_id,),
        ).fetchone()

    if not row or not _verify_password(password, row["password_hash"]):
        return None
    return _public_profile(dict(row))


def get_admin_profile(user_id: str | None = None) -> dict[str, Any] | None:
    init_auth_database()
    with _connect() as connection:
        if user_id:
            row = connection.execute(
                "SELECT * FROM farm_admin_profile WHERE user_id = ?",
                (_normalize_user_id(user_id),),
            ).fetchone()
        else:
            row = connection.execute("SELECT * FROM farm_admin_profile ORDER BY id LIMIT 1").fetchone()
    return _public_profile(dict(row)) if row else None


def update_admin_profile(user_id: str, data: dict[str, Any]) -> dict[str, Any]:
    normalized_user_id = _normalize_user_id(user_id)
    if not get_admin_profile(normalized_user_id):
        raise AuthError("Farm admin is not configured.")

    fields: list[str] = []
    values: list[Any] = []
    mapping = {
        "firstName": "first_name",
        "lastName": "last_name",
        "whatsappNumber": "whatsapp_number",
        "mobileNumber": "mobile_number",
        "telegramAccount": "telegram_account",
    }

    for public_key, column in mapping.items():
        if public_key not in data:
            continue
        if public_key in {"firstName", "lastName"}:
            value = _required(data.get(public_key), public_key)
        else:
            value = _optional(data.get(public_key))
        fields.append(f"{column} = ?")
        values.append(value)

    if data.get("password"):
        fields.append("password_hash = ?")
        values.append(_hash_password(_required(data["password"], "password")))

    if not fields:
        profile = get_admin_profile(normalized_user_id)
        if not profile:
            raise AuthError("Farm admin is not configured.")
        return profile

    fields.append("updated_at = ?")
    values.append(_now_iso())
    values.append(normalized_user_id)

    with _connect() as connection:
        connection.execute(
            f"UPDATE farm_admin_profile SET {', '.join(fields)} WHERE user_id = ?",
            values,
        )

    profile = get_admin_profile(normalized_user_id)
    if not profile:
        raise AuthError("Farm admin is not configured.")
    return profile


def create_session(user_id: str) -> tuple[str, str]:
    init_auth_database()
    token = secrets.token_urlsafe(32)
    token_hash = _token_hash(token)
    created_at = _now()
    expires_at = created_at + timedelta(days=SESSION_DAYS)
    with _connect() as connection:
        connection.execute(
            """
            INSERT INTO farm_admin_sessions (token_hash, user_id, created_at, expires_at)
            VALUES (?, ?, ?, ?)
            """,
            (token_hash, user_id, created_at.isoformat(), expires_at.isoformat()),
        )
    return token, expires_at.isoformat()


def get_profile_for_session(token: str | None) -> dict[str, Any] | None:
    if not token:
        return None

    init_auth_database()
    token_hash = _token_hash(token)
    now = _now()
    with _connect() as connection:
        row = connection.execute(
            "SELECT user_id, expires_at FROM farm_admin_sessions WHERE token_hash = ?",
            (token_hash,),
        ).fetchone()
        if not row:
            return None
        expires_at = datetime.fromisoformat(row["expires_at"])
        if expires_at <= now:
            connection.execute("DELETE FROM farm_admin_sessions WHERE token_hash = ?", (token_hash,))
            return None
        profile_row = connection.execute(
            "SELECT * FROM farm_admin_profile WHERE user_id = ?",
            (row["user_id"],),
        ).fetchone()
    return _public_profile(dict(profile_row)) if profile_row else None


def delete_session(token: str | None) -> None:
    if not token:
        return
    init_auth_database()
    with _connect() as connection:
        connection.execute("DELETE FROM farm_admin_sessions WHERE token_hash = ?", (_token_hash(token),))


def auth_status(token: str | None) -> dict[str, Any]:
    profile = get_profile_for_session(token)
    return {
        "setupComplete": has_admin_profile(),
        "authenticated": profile is not None,
        "user": profile,
    }


def _public_profile(row: dict[str, Any]) -> dict[str, Any]:
    first_name = row.get("first_name", "")
    last_name = row.get("last_name", "")
    return {
        "userId": row.get("user_id"),
        "firstName": first_name,
        "lastName": last_name,
        "whatsappNumber": row.get("whatsapp_number"),
        "mobileNumber": row.get("mobile_number"),
        "telegramAccount": row.get("telegram_account"),
        "initials": _initials(first_name, last_name),
        "hasOpenAiKey": bool(get_ai_config_status()["configured"]),
    }


def _required_profile_values(data: dict[str, Any], *, require_password: bool) -> dict[str, str]:
    values = {
        "userId": _normalize_user_id(_required(data.get("userId"), "userId")),
        "firstName": _required(data.get("firstName"), "firstName"),
        "lastName": _required(data.get("lastName"), "lastName"),
    }
    if require_password:
        values["password"] = _required(data.get("password"), "password")
    return values


def _required(value: Any, field: str) -> str:
    normalized = str(value or "").strip()
    if not normalized:
        raise AuthError(f"{field} is required.")
    return normalized


def _normalize_user_id(user_id: str) -> str:
    return user_id.strip().lower()


def _optional(value: Any) -> str | None:
    normalized = str(value or "").strip()
    return normalized or None


def _initials(first_name: str, last_name: str) -> str:
    first = first_name.strip()[0:1]
    last = last_name.strip()[0:1]
    return f"{first}{last}".upper() or "FA"


def _hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    password_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS)
    return "pbkdf2_sha256${}${}${}".format(
        PASSWORD_ITERATIONS,
        base64.b64encode(salt).decode("ascii"),
        base64.b64encode(password_hash).decode("ascii"),
    )


def _verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, iterations, salt_b64, hash_b64 = encoded.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        salt = base64.b64decode(salt_b64.encode("ascii"))
        expected_hash = base64.b64decode(hash_b64.encode("ascii"))
        candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, int(iterations))
        return hmac.compare_digest(candidate, expected_hash)
    except Exception:
        return False


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _connect() -> sqlite3.Connection:
    path = _database_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    return connection


def _migrate_single_admin_table(connection: sqlite3.Connection) -> None:
    row = connection.execute(
        "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'farm_admin_profile'"
    ).fetchone()
    table_sql = row["sql"] if row else ""
    if "CHECK (id = 1)" not in table_sql:
        return

    connection.execute("ALTER TABLE farm_admin_profile RENAME TO farm_admin_profile_single_admin")
    connection.execute(
        """
        CREATE TABLE farm_admin_profile (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            whatsapp_number TEXT,
            mobile_number TEXT,
            telegram_account TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    connection.execute(
        """
        INSERT INTO farm_admin_profile (
            user_id,
            password_hash,
            first_name,
            last_name,
            whatsapp_number,
            mobile_number,
            telegram_account,
            created_at,
            updated_at
        )
        SELECT
            LOWER(user_id),
            password_hash,
            first_name,
            last_name,
            whatsapp_number,
            mobile_number,
            telegram_account,
            created_at,
            updated_at
        FROM farm_admin_profile_single_admin
        """
    )
    connection.execute("DROP TABLE farm_admin_profile_single_admin")


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


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _now_iso() -> str:
    return _now().isoformat()
