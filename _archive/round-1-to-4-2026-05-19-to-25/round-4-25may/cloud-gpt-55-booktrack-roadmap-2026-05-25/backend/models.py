from typing import Literal

from pydantic import BaseModel

BookStatus = Literal["to-read", "reading", "done"]


class Book(BaseModel):
    id: int
    title: str
    author: str
    status: BookStatus


class BookCreate(BaseModel):
    title: str
    author: str
    status: BookStatus


class BookUpdate(BaseModel):
    title: str | None = None
    author: str | None = None
    status: BookStatus | None = None
