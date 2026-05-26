import sqlite3
from pathlib import Path

DB_PATH = "books.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    script_path = Path(__file__).parent / "schema.sql"
    with open(script_path, 'r') as f:
        script = f.read()
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(script)
    conn.commit()
    conn.close()