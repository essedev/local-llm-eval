from pydantic import BaseModel, Field
from typing import Literal


class BookCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    author: str = Field(..., min_length=1, max_length=300)
    status: Literal["to-read", "reading", "done"] = "to-read"


class BookUpdate(BaseModel):
    status: Literal["to-read", "reading", "done"]


class BookResponse(BaseModel):
    id: int
    title: str
    author: str
    status: str
