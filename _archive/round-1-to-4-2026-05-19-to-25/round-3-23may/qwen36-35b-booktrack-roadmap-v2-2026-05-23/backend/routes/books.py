from fastapi import APIRouter, HTTPException
from database import get_connection
from models import Book, BookCreate, BookUpdate

router = APIRouter(prefix="/books", tags=["books"], redirect_slashes=False)


@router.get("", response_model=list[Book])
@router.get("/", response_model=list[Book])
def get_books():
    conn = get_connection()
    try:
        rows = conn.execute("SELECT id, title, author, status FROM books").fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


@router.post("", response_model=Book, status_code=201)
@router.post("/", response_model=Book, status_code=201)
def create_book(book: BookCreate):
    conn = get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO books (title, author, status) VALUES (?, ?, ?)",
            (book.title, book.author, book.status),
        )
        conn.commit()
        new_id = cursor.lastrowid
        row = conn.execute(
            "SELECT id, title, author, status FROM books WHERE id = ?", (new_id,)
        ).fetchone()
        return dict(row)
    finally:
        conn.close()


@router.patch("/{book_id}", response_model=Book)
def update_book_status(book_id: int, updates: BookUpdate):
    conn = get_connection()
    try:
        existing = conn.execute(
            "SELECT id, title, author, status FROM books WHERE id = ?", (book_id,)
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Book not found")

        data = {k: v for k, v in updates.model_dump().items() if v is not None}
        if not data:
            return dict(existing)

        set_clause = ", ".join(f"{k} = ?" for k in data)
        values = list(data.values()) + [book_id]
        conn.execute(
            f"UPDATE books SET {set_clause} WHERE id = ?", values
        )
        conn.commit()

        updated = conn.execute(
            "SELECT id, title, author, status FROM books WHERE id = ?", (book_id,)
        ).fetchone()
        return dict(updated)
    finally:
        conn.close()


@router.delete("/{book_id}", status_code=204)
def delete_book(book_id: int):
    conn = get_connection()
    try:
        existing = conn.execute(
            "SELECT id FROM books WHERE id = ?", (book_id,)
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Book not found")

        conn.execute("DELETE FROM books WHERE id = ?", (book_id,))
        conn.commit()
    finally:
        conn.close()
