import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "books.db"
SCHEMA_PATH = Path(__file__).resolve().parent / "schema.sql"


def get_connection() -> sqlite3.Connection:
    """Return a connection to the SQLite database."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    """Initialize the database by executing schema.sql."""
    conn = get_connection()
    try:
        schema = SCHEMA_PATH.read_text()
        conn.executescript(schema)
        conn.commit()
    finally:
        conn.close()
