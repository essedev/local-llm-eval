from contextlib import asynccontextmanager
from enum import Enum
import sqlite3
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DB_PATH = Path(__file__).with_name("books.db")


class BookStatus(str, Enum):
    TO_READ = "to-read"
    READING = "reading"
    DONE = "done"


class BookCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    author: str = Field(min_length=1, max_length=300)
    status: BookStatus = BookStatus.TO_READ


class BookUpdateStatus(BaseModel):
    status: BookStatus


class Book(BaseModel):
    id: int
    title: str
    author: str
    status: BookStatus


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('to-read', 'reading', 'done')),
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="BookTrack API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def row_to_book(row: sqlite3.Row) -> Book:
    return Book(id=row["id"], title=row["title"], author=row["author"], status=row["status"])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/books", response_model=list[Book])
def list_books(status: Annotated[BookStatus | None, Query()] = None) -> list[Book]:
    with get_connection() as conn:
        if status is None:
            rows = conn.execute("SELECT * FROM books ORDER BY id DESC").fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM books WHERE status = ? ORDER BY id DESC", (status.value,)
            ).fetchall()
    return [row_to_book(row) for row in rows]


@app.post("/books", response_model=Book, status_code=201)
def create_book(payload: BookCreate) -> Book:
    title = payload.title.strip()
    author = payload.author.strip()
    if not title or not author:
        raise HTTPException(status_code=422, detail="Title and author are required")

    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO books (title, author, status) VALUES (?, ?, ?)",
            (title, author, payload.status.value),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM books WHERE id = ?", (cursor.lastrowid,)).fetchone()

    if row is None:
        raise HTTPException(status_code=500, detail="Could not create book")
    return row_to_book(row)


@app.patch("/books/{book_id}/status", response_model=Book)
def update_book_status(book_id: int, payload: BookUpdateStatus) -> Book:
    with get_connection() as conn:
        cursor = conn.execute(
            "UPDATE books SET status = ? WHERE id = ?", (payload.status.value, book_id)
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Book not found")
        conn.commit()
        row = conn.execute("SELECT * FROM books WHERE id = ?", (book_id,)).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return row_to_book(row)
