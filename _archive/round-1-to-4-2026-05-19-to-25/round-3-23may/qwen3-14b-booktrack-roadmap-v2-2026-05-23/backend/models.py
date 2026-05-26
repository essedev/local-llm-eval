from pydantic import BaseModel

class Book(BaseModel):
    id: int
    title: str
    author: str
    status: str

class BookCreate(BaseModel):
    title: str
    author: str
    status: str

class BookUpdate(BaseModel):
    title: str | None = None
    author: str | None = None
    status: str | None = None