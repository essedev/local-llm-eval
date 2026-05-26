import sqlite3
from pathlib import Path

DB_PATH = "books.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    schema_path = Path(__file__).parent / "schema.sql"
    conn = get_connection()
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = f.read()
    conn.executescript(schema)
    conn.commit()
    conn.close()
