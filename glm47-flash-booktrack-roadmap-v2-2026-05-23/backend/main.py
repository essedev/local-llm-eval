from fastapi import FastAPI
from database import init_db
from routes.books import router

app = FastAPI(title="BookTrack API")

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

# Include the books router
app.include_router(router)