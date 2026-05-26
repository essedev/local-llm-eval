from fastapi import FastAPI

app = FastAPI(title="BookTrack API")

@app.on_event("startup")
async def init_db():
    from database import init_db
    init_db()

@app.get("/")
async def root():
    return {"message": "BookTrack API"}

from routes.books import router as books_router
app.include_router(books_router, prefix="/books")