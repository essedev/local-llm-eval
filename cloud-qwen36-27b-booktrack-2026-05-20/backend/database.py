import sqlite3
from pathlib import Path

DB_PATH = "books.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    schema_path = Path(__file__).parent / "schema.sql"
    conn = get_connection()
    conn.executescript(schema_path.read_text(encoding="utf-8"))
    conn.commit()
    conn.close()
