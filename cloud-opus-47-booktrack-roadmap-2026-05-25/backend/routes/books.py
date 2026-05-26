from fastapi import APIRouter, HTTPException, status

from database import get_connection
from models import Book, BookCreate, BookUpdate

router = APIRouter(prefix="/books", tags=["books"])


@router.get("", response_model=list[Book])
def list_books() -> list[Book]:
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT id, title, author, status FROM books ORDER BY id"
        ).fetchall()
        return [Book(**dict(row)) for row in rows]
    finally:
        conn.close()


@router.post("", response_model=Book, status_code=status.HTTP_201_CREATED)
def create_book(book: BookCreate) -> Book:
    conn = get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO books (title, author, status) VALUES (?, ?, ?)",
            (book.title, book.author, book.status),
        )
        conn.commit()
        new_id = cursor.lastrowid
        row = conn.execute(
            "SELECT id, title, author, status FROM books WHERE id = ?",
            (new_id,),
        ).fetchone()
        return Book(**dict(row))
    finally:
        conn.close()


@router.patch("/{book_id}", response_model=Book)
def update_book(book_id: int, update: BookUpdate) -> Book:
    conn = get_connection()
    try:
        existing = conn.execute(
            "SELECT id, title, author, status FROM books WHERE id = ?",
            (book_id,),
        ).fetchone()
        if existing is None:
            raise HTTPException(status_code=404, detail="Book not found")

        data = update.model_dump(exclude_unset=True)
        if data:
            fields = ", ".join(f"{key} = ?" for key in data.keys())
            values = list(data.values()) + [book_id]
            conn.execute(f"UPDATE books SET {fields} WHERE id = ?", values)
            conn.commit()

        row = conn.execute(
            "SELECT id, title, author, status FROM books WHERE id = ?",
            (book_id,),
        ).fetchone()
        return Book(**dict(row))
    finally:
        conn.close()


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(book_id: int) -> None:
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
