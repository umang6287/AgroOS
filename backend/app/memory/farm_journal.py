from app.demo_store import server_now_iso


def write_journal_entry(entry):
    stored_entry = {"createdAt": server_now_iso(), **entry}
    return {"status": "stored", "entry": stored_entry}
