"""Database helpers: connection factory and schema initialisation."""

import pathlib
import sqlite3

# Paths are resolved relative to this file so they work regardless of cwd.
_HERE = pathlib.Path(__file__).parent
DB_PATH = _HERE / "books.db"
SCHEMA_PATH = _HERE / "schema.sql"


def get_connection() -> sqlite3.Connection:
    """Return a new SQLite connection with row_factory set to sqlite3.Row."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # Enforce foreign-key constraints and the CHECK constraint on status.
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db() -> None:
    """Execute schema.sql against books.db, creating tables if absent."""
    sql = SCHEMA_PATH.read_text(encoding="utf-8")
    with get_connection() as conn:
        conn.executescript(sql)
