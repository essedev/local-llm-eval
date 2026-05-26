from pydantic import BaseModel, Field


class Book(BaseModel):
    id: int
    title: str
    author: str
    status: str


class BookCreate(BaseModel):
    title: str = Field(min_length=1)
    author: str = Field(min_length=1)
    status: str = Field(default="to-read")


class BookUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    author: str | None = Field(default=None, min_length=1)
    status: str | None = Field(default=None)
