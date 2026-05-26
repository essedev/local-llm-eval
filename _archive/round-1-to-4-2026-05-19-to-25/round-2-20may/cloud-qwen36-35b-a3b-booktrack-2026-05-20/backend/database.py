import sqlite3
from pathlib import Path
from sqlite3 import Row

DB_PATH = "books.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = Row
    return conn


def init_db():
    schema_path = Path(__file__).parent / "schema.sql"
    conn = get_connection()
    with open(schema_path, "r") as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()
