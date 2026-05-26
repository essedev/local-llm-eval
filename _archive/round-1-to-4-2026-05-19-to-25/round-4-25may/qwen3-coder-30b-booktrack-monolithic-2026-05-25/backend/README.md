# Book Tracker Backend

This is a FastAPI backend for the Book Tracker application.

## Features
- REST API for managing books
- SQLite database for persistence
- CORS support for frontend integration
- CRUD operations for books

## Setup
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the server:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

## API Endpoints
- `GET /` - Health check
- `GET /books` - Get all books
- `POST /books` - Add a new book
- `PUT /books/{id}` - Update a book
- `DELETE /books/{id}` - Delete a book

## Project Structure
- `main.py` - Main application with routes and database logic
- `requirements.txt` - Python dependencies