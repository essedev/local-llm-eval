# Book Tracker Application

This is a full-stack book tracking application with:
- FastAPI backend using SQLite for data persistence
- React frontend with Vite

## Features
- Add books with title, author, and status (to-read/reading/done)
- View all books in a responsive grid
- Update book status
- Delete books
- Local storage (no login required)

## Project Structure
```
.
├── backend/          # FastAPI backend
│   ├── main.py       # API endpoints and database logic
│   ├── requirements.txt
│   └── README.md
├── frontend/         # React frontend
│   ├── src/          # Source files
│   │   ├── App.jsx   # Main component
│   │   ├── App.css   # Styles
│   │   └── main.jsx  # Entry point
│   ├── package.json
│   └── README.md
└── README.md         # This file
```

## Setup Instructions

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the backend server:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. The frontend will be available at http://localhost:3000

## API Endpoints
- `GET /api/books` - Get all books
- `POST /api/books` - Add a new book
- `PUT /api/books/{id}` - Update a book
- `DELETE /api/books/{id}` - Delete a book

## Database
The application uses SQLite with a single `books.db` file to store all book data.