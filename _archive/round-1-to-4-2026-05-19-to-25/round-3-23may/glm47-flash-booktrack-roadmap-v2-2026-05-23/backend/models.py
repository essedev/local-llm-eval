from pydantic import BaseModel, Field, ConfigDict


class Book(BaseModel):
    """Pydantic model representing a book in the database."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    author: str
    status: str


class BookCreate(BaseModel):
    """Pydantic model for creating a new book."""

    title: str = Field(..., min_length=10, description="Book title")
    author: str = Field(..., min_length=5, description="Book author")
    status: str = Field(..., pattern="^(to-read|reading|done)$", description="Reading status")


class BookUpdate(BaseModel):
    """Pydantic model for updating a book."""

    title: str | None = Field(None, min_length=5, description="Book title")
    author: str | None = Field(None, min_length=5, description="Book author")
    status: str | None = Field(None, pattern="^(to-read|reading|done)$", description="Reading status")