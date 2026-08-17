#!/bin/bash

# Start backend in background
cd backend
uv run uvicorn main:app --port 8000 --host 0.0.0.0 &
BE_PID=$!
cd ..

# Start frontend in background
cd frontend
pnpm run dev --port 5173 &
FE_PID=$!
cd ..

# Give processes time to start
sleep 3

# Smoke test backend with curl
echo "Testing backend..."
curl -X POST http://localhost:8000/ -d '{"test": "data"}' -H "Content-Type: application/json" -v
curl -X GET http://localhost:8000/ -v

# Test frontend
echo "Testing frontend..."
curl -I http://localhost:5173/ -v

# Kill processes
echo "Killing backend and frontend processes..."
kill $BE_PID
kill $FE_PID

echo "E2E test completed."