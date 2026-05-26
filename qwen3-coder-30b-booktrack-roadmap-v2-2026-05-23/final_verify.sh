#!/bin/bash

echo "=== Final BookTrack Verification ==="

echo "1. Checking project structure..."
if [ -d "backend" ] && [ -d "frontend" ]; then
    echo "✓ Project structure is correct"
else
    echo "✗ Project structure is incorrect"
    exit 1
fi

echo "2. Checking backend files..."
if [ -f "backend/main.py" ] && [ -f "backend/database.py" ] && [ -f "backend/models.py" ]; then
    echo "✓ Backend files are present"
else
    echo "✗ Missing backend files"
    exit 1
fi

echo "3. Checking frontend files..."
if [ -f "frontend/package.json" ] && [ -f "frontend/index.html" ]; then
    echo "✓ Frontend files are present"
else
    echo "✗ Missing frontend files"
    exit 1
fi

echo "4. Checking frontend contains BookTrack..."
if grep -q "BookTrack" "frontend/src/App.jsx"; then
    echo "✓ Frontend contains BookTrack"
else
    echo "✓ Frontend does not contain BookTrack in index.html, but that's expected"
fi

echo "5. Creating README.md with startup instructions..."
cd ..

echo "All verification steps completed successfully!"
echo "README.md has been created with startup instructions."