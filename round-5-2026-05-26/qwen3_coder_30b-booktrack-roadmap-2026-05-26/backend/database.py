import sqlite3
from pathlib import Path
from typing import Optional

# Database file path
DB_PATH = Path("books.db")

def init_db():
    """Initialize the SQLite database and create the books table if it doesn't exist."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create books table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('to-read', 'reading', 'done'))
        )
    ''')
    
    conn.commit()
    conn.close()

def get_db_connection():
    """Get a database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # This allows us to access columns by name
    return conn