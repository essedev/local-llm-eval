import BookCard from "./BookCard";

export default function BookList({ books, onStatusChange, onDelete }) {
  if (books.length === 0) {
    return <p className="empty">Nessun libro in questa categoria.</p>;
  }

  return (
    <ul className="book-list">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
