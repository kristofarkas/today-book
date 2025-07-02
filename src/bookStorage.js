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
      status: 'want-to-read',
      startDate: null,
      targetDate: null,
      dailyProgress: [],
      readingSessions: []
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

  const recordProgress = (book, dateStr, page) => {
    const progress = book.dailyProgress ? [...book.dailyProgress] : [];
    const idx = progress.findIndex(p => p.date === dateStr);
    if (idx >= 0) {
      progress[idx] = { date: dateStr, page };
    } else {
      progress.push({ date: dateStr, page });
      progress.sort((a, b) => a.date.localeCompare(b.date));
    }
    return progress;
  };

  const updateCurrentPage = (bookId, newPage) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    const page = Math.min(parseInt(newPage) || 0, book.totalPages);
    const status = page >= book.totalPages ? 'read' : book.status;
    const todayStr = new Date().toISOString().split('T')[0];
    const dailyProgress = recordProgress(book, todayStr, page);
    updateBook(bookId, { currentPage: page, status, dailyProgress });
  };

  const updateTitle = (bookId, newTitle) => {
    updateBook(bookId, { title: newTitle });
  };

  const updateYesterdayPage = (bookId, newPage) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    const page = Math.min(parseInt(newPage) || 0, book.totalPages);
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yStr = y.toISOString().split('T')[0];
    const dailyProgress = recordProgress(book, yStr, page);
    const currentPage = Math.max(book.currentPage, page);
    updateBook(bookId, { currentPage, dailyProgress });
  };

  const startReadingSession = (bookId) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    const sessions = book.readingSessions ? [...book.readingSessions] : [];
    if (sessions.some(s => !s.endTime)) return; // already running
    sessions.push({
      id: Date.now(),
      startTime: Date.now(),
      startPage: book.currentPage,
      endTime: null,
      endPage: null
    });
    updateBook(bookId, { readingSessions: sessions });
  };

  const endReadingSession = (bookId, endPage) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    const sessions = book.readingSessions ? [...book.readingSessions] : [];
    const idx = sessions.findIndex(s => !s.endTime);
    if (idx === -1) return;
    const session = sessions[idx];
    const page = Math.min(parseInt(endPage) || book.currentPage, book.totalPages);
    const endTime = Date.now();
    session.endTime = endTime;
    session.endPage = page;
    sessions[idx] = session;

    const status = page >= book.totalPages ? 'read' : book.status;
    const todayStr = new Date().toISOString().split('T')[0];
    const dailyProgress = recordProgress(book, todayStr, page);

    updateBook(bookId, {
      currentPage: page,
      status,
      dailyProgress,
      readingSessions: sessions
    });
  };

  const deleteReadingSession = (bookId, sessionId) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    const sessions = (book.readingSessions || []).filter(s => s.id !== sessionId);
    updateBook(bookId, { readingSessions: sessions });
  };

  return {
    books,
    addBook,
    startReading,
    startReadingSession,
    endReadingSession,
    updateCurrentPage,
    updateYesterdayPage,
    deleteBook,
    updateTitle,
    deleteReadingSession
  };
}

