import sqlite3
import os

def get_connection():
    db_path = os.path.join(os.path.dirname(__file__), 'books.db')
    return sqlite3.connect(db_path)

def init_db():
    with open(os.path.join(os.path.dirname(__file__), 'schema.sql')) as f:
        sql = f.read()
    conn = get_connection()
    try:
        conn.executescript(sql)
    finally:
        conn.close()