from contextlib import asynccontextmanager
from enum import Enum
from typing import Optional, List
from datetime import datetime

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field as PydField
from sqlmodel import SQLModel, Field, Session, create_engine, select


# ---------- Status enum ----------
class BookStatus(str, Enum):
    to_read = "to-read"
    reading = "reading"
    done = "done"


# ---------- DB model ----------
class Book(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    author: str
    status: BookStatus = Field(default=BookStatus.to_read)
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ---------- API schemas ----------
class BookCreate(BaseModel):
    title: str = PydField(min_length=1, max_length=500)
    author: str = PydField(min_length=1, max_length=300)
    status: BookStatus = BookStatus.to_read


class BookUpdate(BaseModel):
    title: Optional[str] = PydField(default=None, min_length=1, max_length=500)
    author: Optional[str] = PydField(default=None, min_length=1, max_length=300)
    status: Optional[BookStatus] = None


class BookRead(BaseModel):
    id: int
    title: str
    author: str
    status: BookStatus
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- DB setup ----------
DB_URL = "sqlite:///./booktrack.db"
engine = create_engine(DB_URL, echo=False, connect_args={"check_same_thread": False})


def get_session():
    with Session(engine) as session:
        yield session


@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    yield


# ---------- App ----------
app = FastAPI(title="BookTrack", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/books", response_model=List[BookRead])
def list_books(
    status: Optional[BookStatus] = None,
    session: Session = Depends(get_session),
):
    stmt = select(Book).order_by(Book.created_at.desc())
    if status is not None:
        stmt = stmt.where(Book.status == status)
    return session.exec(stmt).all()


@app.post("/api/books", response_model=BookRead, status_code=201)
def create_book(payload: BookCreate, session: Session = Depends(get_session)):
    book = Book(**payload.model_dump())
    session.add(book)
    session.commit()
    session.refresh(book)
    return book


@app.get("/api/books/{book_id}", response_model=BookRead)
def get_book(book_id: int, session: Session = Depends(get_session)):
    book = session.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@app.patch("/api/books/{book_id}", response_model=BookRead)
def update_book(
    book_id: int,
    payload: BookUpdate,
    session: Session = Depends(get_session),
):
    book = session.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(book, k, v)
    session.add(book)
    session.commit()
    session.refresh(book)
    return book


@app.delete("/api/books/{book_id}", status_code=204)
def delete_book(book_id: int, session: Session = Depends(get_session)):
    book = session.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    session.delete(book)
    session.commit()
    return None
