# BookTrack Application

This is a full-stack book tracking application with a FastAPI backend and React frontend.

## Project Structure

- `backend/` - FastAPI backend with SQLite database
- `frontend/` - React frontend application

## Running the Application

### Prerequisites

- Python 3.12+
- Node.js 18+ (for frontend)
- pnpm (for frontend development)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies (using uv):
   ```bash
   uv pip install -r requirements.txt
   ```

3. Start the backend server:
   ```bash
   uv run uvicorn main:app --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the frontend development server:
   ```bash
   pnpm run dev --host 0.0.0.0 --port 5173
   ```

## API Endpoints

- `GET /books` - Retrieve all books (returns JSON array)
- `POST /books` - Create a new book
- `PATCH /books/{id}` - Update a book by ID
- `DELETE /books/{id}` - Delete a book by ID

## Testing

To verify the application is running correctly:

1. Test the backend API:
   ```bash
   curl -s http://localhost:8000/books
   ```

2. Test the frontend:
   ```bash
   curl -s http://localhost:5173
   ```

The frontend should return HTML containing "BookTrack" or "Libri".