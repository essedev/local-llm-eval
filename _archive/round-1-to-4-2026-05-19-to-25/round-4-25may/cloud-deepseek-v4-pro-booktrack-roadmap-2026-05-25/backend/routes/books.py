from fastapi import APIRouter, HTTPException

from database import get_connection
from models import Book, BookCreate, BookUpdate

router = APIRouter(prefix="/books", tags=["books"])


@router.get("", response_model=list[Book])
def list_books():
    conn = get_connection()
    try:
        rows = conn.execute("SELECT id, title, author, status FROM books").fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


@router.post("", response_model=Book, status_code=201)
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
def update_book(book_id: int, book: BookUpdate):
    conn = get_connection()
    try:
        # Verify the book exists
        existing = conn.execute(
            "SELECT id, title, author, status FROM books WHERE id = ?", (book_id,)
        ).fetchone()
        if existing is None:
            raise HTTPException(status_code=404, detail="Book not found")

        # Build dynamic SET clause for provided fields only
        fields = book.model_dump(exclude_unset=True)
        if not fields:
            raise HTTPException(status_code=400, detail="No fields to update")

        set_clause = ", ".join(f"{k} = ?" for k in fields)
        values = list(fields.values())
        values.append(book_id)

        conn.execute(
            f"UPDATE books SET {set_clause} WHERE id = ?", values
        )
        conn.commit()

        row = conn.execute(
            "SELECT id, title, author, status FROM books WHERE id = ?", (book_id,)
        ).fetchone()
        return dict(row)
    finally:
        conn.close()


@router.delete("/{book_id}", status_code=204)
def delete_book(book_id: int):
    conn = get_connection()
    try:
        existing = conn.execute(
            "SELECT id FROM books WHERE id = ?", (book_id,)
        ).fetchone()
        if existing is None:
            raise HTTPException(status_code=404, detail="Book not found")

        conn.execute("DELETE FROM books WHERE id = ?", (book_id,))
        conn.commit()
    finally:
        conn.close()
