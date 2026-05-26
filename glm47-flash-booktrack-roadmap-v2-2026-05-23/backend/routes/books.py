from fastapi import APIRouter, status
from typing import List, Optional, Dict, Any
from database import get_connection, init_db

router = APIRouter()


@router.get("/books", response_model=List[Dict[str, Any]])
def get_books():
    """Get all books from the database."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM books")
        books = [dict(row) for row in cursor.fetchall()]
    return books


@router.post("/books", status_code=201, response_model=Dict[str, Any])
def create_book(book: Dict[str, Any]):
    """Create a new book in the database."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO books (title, author, status) VALUES (?, ?, ?)",
            (book["title"], book["author"], book["status"])
        )
        conn.commit()
        book_id = cursor.lastrowid

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM books WHERE id = ?", (book_id,))
        created_book = dict(cursor.fetchone())

    return created_book


@router.patch("/books/{book_id}", response_model=Dict[str, Any])
def update_book(book_id: int, book: Dict[str, Any]):
    """Update a book by ID."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE books SET title = ?, author = ?, status = ? WHERE id = ?",
            (book.get("title"), book.get("author"), book.get("status"), book_id)
        )
        conn.commit()

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM books WHERE id = ?", (book_id,))
        updated_book = dict(cursor.fetchone())

    return updated_book


@router.delete("/books/{book_id}", status_code=204)
def delete_book(book_id: int):
    """Delete a book by ID."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM books WHERE id = ?", (book_id,))
        conn.commit()