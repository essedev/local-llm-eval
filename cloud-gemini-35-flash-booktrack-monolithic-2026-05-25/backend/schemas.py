from pydantic import BaseModel, Field
from database import BookStatus

class BookBase(BaseModel):
    title: str = Field(..., min_length=1)
    author: str = Field(..., min_length=1)
    status: BookStatus = BookStatus.TO_READ

class BookCreate(BookBase):
    pass

class BookUpdate(BaseModel):
    title: str | None = None
    author: str | None = None
    status: BookStatus | None = None

class BookResponse(BookBase):
    id: int

    class Config:
        from_attributes = True
