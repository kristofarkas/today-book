import { useState, useEffect } from 'react';

const STORAGE_KEY = 'reading-tracker-books';

export function useBookStorage() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setBooks(JSON.parse(stored));
      } catch {
        setBooks([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  }, [books]);

  const addBook = (title, totalPages, targetDays) => {
    const newBook = {
      id: Date.now(),
      title,
      totalPages: parseInt(totalPages),
      targetDays: parseInt(targetDays),
      currentPage: 0,
      yesterdayPage: 0,
      status: 'want-to-read',
      startDate: null,
      targetDate: null,
      dailyProgress: []
    };
    setBooks(bks => [...bks, newBook]);
  };

  const updateBook = (bookId, updates) => {
    setBooks(bks => bks.map(b => (b.id === bookId ? { ...b, ...updates } : b)));
  };

  const deleteBook = (bookId) => {
    setBooks(bks => bks.filter(b => b.id !== bookId));
  };

  const startReading = (bookId) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + book.targetDays);

    updateBook(bookId, {
      status: 'reading',
      startDate: today.toISOString().split('T')[0],
      targetDate: targetDate.toISOString().split('T')[0]
    });
  };

  const updateCurrentPage = (bookId, newPage) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    const page = Math.min(parseInt(newPage) || 0, book.totalPages);
    const status = page >= book.totalPages ? 'read' : book.status;
    updateBook(bookId, { currentPage: page, status });
  };

  const updateYesterdayPage = (bookId, newPage) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    const page = Math.min(parseInt(newPage) || 0, book.totalPages);
    const currentPage = Math.max(book.currentPage, parseInt(newPage) || 0);
    updateBook(bookId, { yesterdayPage: page, currentPage });
  };

  return {
    books,
    addBook,
    startReading,
    updateCurrentPage,
    updateYesterdayPage,
    deleteBook
  };
}

