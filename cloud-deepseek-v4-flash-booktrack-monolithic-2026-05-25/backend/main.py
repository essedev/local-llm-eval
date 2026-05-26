from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from models import Book, SessionLocal, init_db

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Pydantic schemas ───────────────────────────────────────

class BookCreate(BaseModel):
    title: str
    author: str
    status: str = "to-read"


class BookOut(BaseModel):
    id: int
    title: str
    author: str
    status: str

    model_config = {"from_attributes": True}


class BookStatusUpdate(BaseModel):
    status: str


# ─── Startup ────────────────────────────────────────────────

@app.on_event("startup")
def on_startup():
    init_db()


# ─── Helpers ────────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Endpoints ──────────────────────────────────────────────

@app.get("/books", response_model=list[BookOut])
def list_books():
    db = next(get_db())
    books = db.query(Book).order_by(Book.id).all()
    return books


@app.post("/books", response_model=BookOut, status_code=201)
def create_book(payload: BookCreate):
    db = next(get_db())
    book = Book(title=payload.title, author=payload.author, status=payload.status)
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


@app.patch("/books/{book_id}", response_model=BookOut)
def update_book_status(book_id: int, payload: BookStatusUpdate):
    db = next(get_db())
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(404, "Book not found")
    if payload.status not in ("to-read", "reading", "done"):
        raise HTTPException(400, "Invalid status – use to-read, reading, or done")
    book.status = payload.status
    db.commit()
    db.refresh(book)
    return book
