# BookTrack Frontend

This is the frontend application for BookTrack, a local micro-app for tracking books you read.

## Features

- Add new books with title, author, and status
- View all books in a list
- Update book status (to-read, reading, done)
- Delete books
- Immediate UI refresh after creating books (no page reload required)
- Loading and error states

## Architecture

The frontend is built with React and Vite, and communicates with the backend API at `http://localhost:8000`.

## Components

### BookForm
- Form for adding new books
- Validates required fields (title and author)
- Provides status selection (to-read, reading, done)
- Submits to backend API

### BookList
- Displays all books from the backend
- Allows updating book status via dropdown
- Allows deleting books
- Shows loading and error states

### App
- Main application component that ties everything together
- Handles communication between components

## Status Values

The status field uses the exact enum values as specified in the SPEC:
- `to-read`
- `reading` 
- `done`

All values are used as literal strings in the API communication and UI.