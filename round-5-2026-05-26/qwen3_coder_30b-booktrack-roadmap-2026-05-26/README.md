# Local LLM Eval - End-to-End Test

This project contains a backend API and a frontend application that need to be run together for end-to-end testing.

## Prerequisites

- Python 3.12
- Node.js (with pnpm)
- uv (for running the backend)
- pnpm (for running the frontend)

## How to Start Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run the backend server:
   ```bash
   uv run uvicorn main:app --port 8000
   ```

## How to Start Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Run the frontend server:
   ```bash
   pnpm run dev --port 5173
   ```

## How to Stop

To stop the backend and frontend processes, use the following commands:
```bash
kill $BE_PID
kill $FE_PID
```

Where `$BE_PID` and `$FE_PID` are the process IDs of the backend and frontend processes respectively.