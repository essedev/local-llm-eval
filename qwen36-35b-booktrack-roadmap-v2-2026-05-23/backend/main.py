from fastapi import FastAPI
from database import init_db
from routes.books import router as books_router

app = FastAPI(title="BookTrack API")

init_db()

app.include_router(books_router)
