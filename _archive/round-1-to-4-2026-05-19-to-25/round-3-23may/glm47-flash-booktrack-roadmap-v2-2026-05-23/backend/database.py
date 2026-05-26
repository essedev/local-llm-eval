import sqlite3
from typing import ContextManager


DB_PATH = "books.db"


def get_connection() -> ContextManager[sqlite3.Connection]:
    """Get a database connection (context manager)."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    class ConnectionContextManager:
        def __init__(self, conn):
            self.conn = conn

        def __enter__(self):
            return self.conn

        def __exit__(self, exc_type, exc_val, exc_tb):
            self.conn.close()

    return ConnectionContextManager(conn)


def init_db() -> None:
    """Initialize the database with the schema."""
    with get_connection() as conn:
        with open("schema.sql", "r") as f:
            schema = f.read()
        conn.executescript(schema)