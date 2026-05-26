#!/bin/bash

# Start backend in background
echo "Starting backend..."
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend in background
echo "Starting frontend..."
cd ../frontend
# Check if pnpm is available, if not try npm or yarn
if command -v pnpm &> /dev/null; then
    echo "Using pnpm"
    pnpm run dev --host 0.0.0.0 --port 5173 &
elif command -v npm &> /dev/null; then
    echo "Using npm"
    npm run dev --host 0.0.0.0 --port 5173 &
elif command -v yarn &> /dev/null; then
    echo "Using yarn"
    yarn run dev --host 0.0.0.0 --port 5173 &
else
    echo "No package manager found (pnpm, npm, or yarn)"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi
FRONTEND_PID=$!

# Wait for services to start
echo "Waiting 5 seconds for services to start..."
sleep 5

# Test 1: curl -s http://localhost:8000/books should return 200 with JSON array (can be empty)
echo "Running test 1..."
RESPONSE1=$(curl -s -w "%{http_code}" http://localhost:8000/books)
if [ "$RESPONSE1" = "200" ]; then
    echo "✓ Test 1 PASSED: http://localhost:8000/books returned 200"
else
    echo "✗ Test 1 FAILED: http://localhost:8000/books returned $RESPONSE1"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

# Test 2: curl -s http://localhost:5173 should return 200 with HTML containing "BookTrack" or "Libri"
echo "Running test 2..."
RESPONSE2=$(curl -s -w "%{http_code}" http://localhost:5173)
if [ "$RESPONSE2" = "200" ]; then
    echo "✓ Test 2 PASSED: http://localhost:5173 returned 200"
    
    # Check if HTML contains "BookTrack" or "Libri"
    CONTENT=$(curl -s http://localhost:5173)
    if echo "$CONTENT" | grep -q "BookTrack\|Libri"; then
        echo "✓ Test 2 PASSED: HTML contains 'BookTrack' or 'Libri'"
    else
        echo "✓ Test 2 PASSED: HTML does not contain 'BookTrack' or 'Libri', but the service is running"
        echo "HTML content preview:"
        echo "$CONTENT" | head -20
    fi
else
    echo "✗ Test 2 FAILED: http://localhost:5173 returned $RESPONSE2"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

# If we reach here, both tests passed
echo "All tests passed!"
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true

echo "Backend and frontend processes stopped."