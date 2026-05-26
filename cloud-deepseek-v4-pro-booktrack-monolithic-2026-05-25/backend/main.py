from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from typing import Literal, Optional
from database import get_db, init_db


Status = Literal["to-read", "reading", "done"]


class BookCreate(BaseModel):
    title: str
    author: str
    status: Status = "to-read"


class BookUpdate(BaseModel):
    status: Status


class Book(BaseModel):
    id: int
    title: str
    author: str
    status: Status
    created_at: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Book Tracker", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def row_to_book(row) -> Book:
    return Book(
        id=row["id"],
        title=row["title"],
        author=row["author"],
        status=row["status"],
        created_at=row["created_at"],
    )


@app.get("/api/books")
def list_books(status: Optional[Status] = Query(None)):
    conn = get_db()
    try:
        if status:
            rows = conn.execute(
                "SELECT * FROM books WHERE status = ? ORDER BY created_at DESC",
                (status,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM books ORDER BY created_at DESC"
            ).fetchall()
        return [row_to_book(r) for r in rows]
    finally:
        conn.close()


@app.post("/api/books", status_code=201)
def add_book(book: BookCreate):
    conn = get_db()
    try:
        cur = conn.execute(
            "INSERT INTO books (title, author, status) VALUES (?, ?, ?)",
            (book.title.strip(), book.author.strip(), book.status),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM books WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
        return row_to_book(row)
    finally:
        conn.close()


@app.patch("/api/books/{book_id}")
def update_book(book_id: int, update: BookUpdate):
    conn = get_db()
    try:
        cur = conn.execute(
            "UPDATE books SET status = ? WHERE id = ?",
            (update.status, book_id),
        )
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Book not found")
        row = conn.execute(
            "SELECT * FROM books WHERE id = ?", (book_id,)
        ).fetchone()
        return row_to_book(row)
    finally:
        conn.close()


@app.delete("/api/books/{book_id}", status_code=204)
def delete_book(book_id: int):
    conn = get_db()
    try:
        cur = conn.execute("DELETE FROM books WHERE id = ?", (book_id,))
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Book not found")
    finally:
        conn.close()
