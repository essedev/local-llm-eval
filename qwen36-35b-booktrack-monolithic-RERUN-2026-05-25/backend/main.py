from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, get_db
from models import BookCreate, BookUpdate, BookResponse

app = FastAPI(title="BookTrack")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


def _row_to_book(row):
    return BookResponse(
        id=row["id"],
        title=row["title"],
        author=row["author"],
        status=row["status"],
    )


@app.get("/api/books", response_model=list[BookResponse])
def get_books():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM books ORDER BY id DESC"
        ).fetchall()
    return [_row_to_book(r) for r in rows]


@app.post("/api/books", response_model=BookResponse, status_code=201)
def add_book(book: BookCreate):
    with get_db() as conn:
        cursor = conn.execute(
            "INSERT INTO books (title, author, status) VALUES (?, ?, ?)",
            (book.title, book.author, book.status),
        )
        row = conn.execute("SELECT * FROM books WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return _row_to_book(row)


@app.patch("/api/books/{book_id}", response_model=BookResponse)
def update_status(book_id: int, update: BookUpdate):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM books WHERE id = ?", (book_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Libro non trovato")
        conn.execute(
            "UPDATE books SET status = ? WHERE id = ?",
            (update.status, book_id),
        )
        row = conn.execute("SELECT * FROM books WHERE id = ?", (book_id,)).fetchone()
    return _row_to_book(row)


@app.delete("/api/books/{book_id}", status_code=204)
def delete_book(book_id: int):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM books WHERE id = ?", (book_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Libro non trovato")
        conn.execute("DELETE FROM books WHERE id = ?", (book_id,))
    return None
