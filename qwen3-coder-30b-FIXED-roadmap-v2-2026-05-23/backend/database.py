import sqlite3
from pathlib import Path

def get_connection():
    """Create and return a database connection."""
    db_path = Path("books.db")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database by executing the schema."""
    conn = get_connection()
    with open("schema.sql", "r") as f:
        schema = f.read()
        conn.executescript(schema)
    conn.close()