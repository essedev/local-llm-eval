# BookTrack - Book Tracking Application

A full-stack web application for tracking books with a React frontend and FastAPI backend.

## Prerequisites

- Python 3.9+
- Node.js 16+
- uv (Python package manager)
- pnpm

## Installation

### Backend Setup

```bash
cd backend
uv sync
```

### Frontend Setup

```bash
cd frontend
pnpm install
```

## Running the Application

### Start Backend

```bash
cd backend
uv run uvicorn main:app --reload
```

The backend will start on `http://localhost:8000`

### Start Frontend

```bash
cd frontend
pnpm run dev
```

The frontend will start on `http://localhost:5173`

## API Endpoints

- `GET /books` - Get all books (returns a JSON array)
- `POST /books` - Create a new book

## Project Structure

```
.
├── backend/
│   ├── main.py          # FastAPI application
│   └── requirements.txt # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── main.jsx     # React entry point
│   │   └── App.jsx      # Main application component
│   └── package.json     # Node dependencies
└── README.md
```

## Testing

### Backend API Test
```bash
curl http://localhost:8000/books
```

### Frontend Test
```bash
curl -I http://localhost:5173
```

## Development

- Backend uses FastAPI with automatic API documentation at `http://localhost:8000/docs`
- Frontend uses Vite with hot module replacement
- Both services support hot reloading during development