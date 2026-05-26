import sqlite3
import os
from pathlib import Path

DB_PATH = "books.db"


def get_connection():
    """Restituisce una connessione SQLite con row_factory=sqlite3.Row."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Inizializza il database eseguendo lo schema SQL."""
    conn = get_connection()
    try:
        schema_path = Path(__file__).parent / "schema.sql"
        with open(schema_path, "r") as f:
            schema_sql = f.read()
        conn.executescript(schema_sql)
        conn.commit()
    finally:
        conn.close()
