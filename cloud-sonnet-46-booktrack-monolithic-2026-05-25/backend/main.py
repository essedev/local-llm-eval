import sqlite3
from contextlib import contextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DB_PATH = "booktrack.db"

# ---------------------------------------------------------------------------
# DB setup
# ---------------------------------------------------------------------------

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS books (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            title   TEXT    NOT NULL,
            author  TEXT    NOT NULL,
            status  TEXT    NOT NULL DEFAULT 'to-read',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
        """
    )
    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

STATUS_VALUES = {"to-read", "reading", "done"}


class BookCreate(BaseModel):
    title: str
    author: str
    status: str = "to-read"


class BookUpdate(BaseModel):
    status: str


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(title="BookTrack API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/books")
def list_books():
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM books ORDER BY created_at DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/books", status_code=201)
def add_book(book: BookCreate):
    if book.status not in STATUS_VALUES:
        raise HTTPException(400, f"status must be one of {STATUS_VALUES}")
    title = book.title.strip()
    author = book.author.strip()
    if not title or not author:
        raise HTTPException(400, "title and author cannot be empty")
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO books (title, author, status) VALUES (?, ?, ?)",
        (title, author, book.status),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM books WHERE id = ?", (cur.lastrowid,)).fetchone()
    conn.close()
    return dict(row)


@app.patch("/books/{book_id}")
def update_status(book_id: int, update: BookUpdate):
    if update.status not in STATUS_VALUES:
        raise HTTPException(400, f"status must be one of {STATUS_VALUES}")
    conn = get_db()
    cur = conn.execute(
        "UPDATE books SET status = ? WHERE id = ?",
        (update.status, book_id),
    )
    conn.commit()
    if cur.rowcount == 0:
        conn.close()
        raise HTTPException(404, "book not found")
    row = conn.execute("SELECT * FROM books WHERE id = ?", (book_id,)).fetchone()
    conn.close()
    return dict(row)


@app.delete("/books/{book_id}", status_code=204)
def delete_book(book_id: int):
    conn = get_db()
    cur = conn.execute("DELETE FROM books WHERE id = ?", (book_id,))
    conn.commit()
    conn.close()
    if cur.rowcount == 0:
        raise HTTPException(404, "book not found")
