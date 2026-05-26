from pydantic import BaseModel, Field
from typing import Literal, Optional

class BookBase(BaseModel):
    title: str
    author: str
    status: Literal['to-read', 'reading', 'done']

class BookCreate(BookBase):
    pass

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    status: Optional[Literal['to-read', 'reading', 'done']] = None

class Book(BookBase):
    id: int

    class Config:
        from_attributes = True
