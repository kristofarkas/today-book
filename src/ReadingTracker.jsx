import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Calendar, Target, TrendingUp, Edit3, Save, X, Info, CheckCircle, Play, StopCircle, Clock } from 'lucide-react';
import { useBookStorage } from './bookStorage.js';
import { calculateDailyGoal, getTodaysTarget, getYesterdayPage } from './bookMetrics.js';

const ReadingTracker = () => {
  const {
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
  } = useBookStorage();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedBook, setSelectedBook] = useState(null);
  const [showAddBook, setShowAddBook] = useState(false);
  const [editingYesterday, setEditingYesterday] = useState(false);


  const AddBookForm = () => {
    const [title, setTitle] = useState('');
    const [totalPages, setTotalPages] = useState('');
    const [targetDays, setTargetDays] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
      const pages = Number(totalPages);
      const days = Number(targetDays);

      if (
        !title ||
        !Number.isInteger(pages) ||
        pages <= 0 ||
        !Number.isInteger(days) ||
        days <= 0
      ) {
        setError('Page count and days to read must be positive integers.');
        return;
      }

      addBook(title, pages, days);
      setTitle('');
      setTotalPages('');
      setTargetDays('');
      setShowAddBook(false);
      setError('');
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">Add New Book</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Book Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter book title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Pages</label>
              <input
                type="number"
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. 300"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Days to Read</label>
              <input
                type="number"
                value={targetDays}
                onChange={(e) => setTargetDays(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. 14"
                min="1"
                required
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Book
              </button>
              <button
                onClick={() => setShowAddBook(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const BookCard = ({ book }) => {
    const progress = book.totalPages > 0 ? (book.currentPage / book.totalPages) * 100 : 0;
    const cardColor =
      book.status === 'reading'
        ? 'bg-blue-50 border-blue-200'
        : book.status === 'want-to-read'
        ? 'bg-gray-50 border-gray-200'
        : 'bg-green-50 border-green-200';

    return (
      <div
        className={`rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer border ${cardColor}`}
        onClick={() => {
          setSelectedBook(book);
          setCurrentView('detail');
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-800 line-clamp-2 flex-1 pr-2">{book.title}</h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteBook(book.id);
            }}
            className="text-red-500 hover:text-red-700 p-1"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-700">
            <div className="flex items-center gap-1">
              <TrendingUp className="text-green-600" size={16} />
              <span>{Math.round(progress)}%</span>
            </div>
            <span className="text-xs">{book.currentPage}/{book.totalPages} pages</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {book.status === 'reading' && (
            <div className="flex items-center gap-1 text-sm text-blue-700 font-medium">
              <Target className="text-blue-600" size={16} />
              <span>Up to page {getTodaysTarget(book)}</span>
            </div>
          )}

          {book.status === 'want-to-read' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                startReading(book.id);
              }}
              className="w-full mt-2 bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700 transition-colors"
            >
              Start Reading
            </button>
          )}

          {book.status === 'read' && (
            <div className="flex items-center gap-1 text-green-700 text-sm font-medium">
              <CheckCircle className="text-green-600" size={16} />
              <span>Completed</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const BookDetail = ({ book }) => {
    const [tempYesterdayPage, setTempYesterdayPage] = useState(getYesterdayPage(book));
    const [editingCurrentPage, setEditingCurrentPage] = useState(false);
    const [tempCurrentPageInput, setTempCurrentPageInput] = useState(book.currentPage.toString());
    const [editingTitle, setEditingTitle] = useState(false);
    const [tempTitle, setTempTitle] = useState(book.title);
    const [showYesterdayInfo, setShowYesterdayInfo] = useState(false);
    const sessions = book.readingSessions || [];
    const activeSession = sessions.find(s => !s.endTime);
    const [elapsed, setElapsed] = useState(0);


    useEffect(() => {
      if (activeSession) {
        setElapsed(Date.now() - activeSession.startTime);
        const i = setInterval(() => {
          setElapsed(Date.now() - activeSession.startTime);
        }, 1000);
        return () => clearInterval(i);
      } else {
        setElapsed(0);
      }
    }, [activeSession]);
    
    // Update temp values when book data changes
    useEffect(() => {
      setTempYesterdayPage(getYesterdayPage(book));
      setTempCurrentPageInput(book.currentPage.toString());
      setTempTitle(book.title);
    }, [book.currentPage, book.dailyProgress, book.title]);
    
    const dailyGoal = calculateDailyGoal(book);
    const todaysTarget = getTodaysTarget(book);
    const remainingToday = Math.max(0, todaysTarget - book.currentPage);
    
    const progress = book.totalPages > 0 ? (book.currentPage / book.totalPages) * 100 : 0;
    
    // Calculate today's progress
    const todaysStart = getYesterdayPage(book);
    const todaysGoal = dailyGoal;
    const todaysCompleted = Math.max(0, book.currentPage - todaysStart);
    const todaysProgress = todaysGoal > 0 ? (todaysCompleted / todaysGoal) * 100 : 0;
    
    // Calculate days remaining
    const today = new Date();
    const target = new Date(book.targetDate);
    const daysRemaining = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

    const completedSessions = sessions.filter(s => s.endTime);
    const sessionsWithPages = completedSessions.filter(s => (s.endPage - s.startPage) > 0);
    const averageSpeed = sessionsWithPages.length > 0
      ? sessionsWithPages.reduce((acc, s) => {
          const pages = s.endPage - s.startPage;
          const minutes = (s.endTime - s.startTime) / 60000;
          return acc + (pages > 0 ? minutes / pages : 0);
        }, 0) / sessionsWithPages.length
      : 0;
    const estimatedMinutes = averageSpeed > 0 ? Math.ceil(remainingToday * averageSpeed) : 0;
    const pagesInThirty = averageSpeed > 0 ? (30 / averageSpeed) : 0;

    const formatMinutes = (mins) => {
      if (mins >= 60) {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h} hour${h !== 1 ? 's' : ''}${m > 0 ? ` ${m} minutes` : ''}`;
      }
      return `${mins} minutes`;
    };

    const formatDuration = (ms) => {
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const formatMinutesPerPage = (minutes) => {
      const m = Math.floor(minutes);
      let s = Math.round((minutes - m) * 60);
      if (s === 60) {
        return `${m + 1}’00”`;
      }
      return `${m}’${s.toString().padStart(2, '0')}”`;
    };
    
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <button
          onClick={() => {
            setCurrentView('dashboard');
            setSelectedBook(null);
            setEditingYesterday(false);
          }}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>
        
        <div className="flex items-start justify-between mb-6">
          {editingTitle ? (
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => {
                  updateTitle(book.id, tempTitle);
                  setEditingTitle(false);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                <Save size={16} />
              </button>
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-gray-800 flex-1">
              {book.title}
            </h1>
          )}
          {!editingTitle && (
            <button
              onClick={() => setEditingTitle(true)}
              className="text-blue-600 hover:text-blue-800 ml-2"
            >
              <Edit3 size={16} />
            </button>
          )}
        </div>
        
        <div className="space-y-6 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="text-blue-600" size={20} />
              <h3 className="font-semibold text-blue-800">Today's Goal</h3>
            </div>
            <p className="text-xl font-bold text-blue-600">Read up to page {todaysTarget}</p>
            <p className="text-sm text-blue-700">
              That's {remainingToday} more pages today
              {averageSpeed > 0 && remainingToday > 0 && (
                <> (around {formatMinutes(estimatedMinutes)})</>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-green-600" size={20} />
                <h3 className="font-semibold text-green-800">Overall Progress</h3>
              </div>
              <p className="text-xl font-bold text-green-600">{Math.round(Math.min(100, progress))}%</p>
                <p className="text-sm text-green-700 mb-2">Finished {book.currentPage} of {book.totalPages} pages</p>
              <div className="w-full bg-green-200 h-2 rounded-full">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${Math.min(100, progress)}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="text-purple-600" size={20} />
                <h3 className="font-semibold text-purple-800">Today's Progress</h3>
              </div>
              <p className="text-xl font-bold text-purple-600">{Math.round(Math.min(100, todaysProgress))}%</p>
              <p className="text-sm text-purple-700 mb-2">Pages {todaysStart + 1}-{todaysTarget} ({todaysCompleted} of {todaysGoal})</p>
              <div className="w-full bg-purple-200 h-2 rounded-full">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${Math.min(100, todaysProgress)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Last Page Finished</label>
                <div className="flex items-center gap-2">
                  {activeSession && (
                    <span className="flex items-center gap-1 text-yellow-700 text-sm">
                      <Clock size={16} /> {formatDuration(elapsed)}
                    </span>
                  )}
                  {!activeSession && (
                    <button
                      onClick={() => startReadingSession(book.id)}
                      className="text-yellow-600 hover:text-yellow-800"
                    >
                      <Play size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => setEditingCurrentPage(!editingCurrentPage)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit3 size={16} />
                  </button>
                </div>
              </div>

              {editingCurrentPage || activeSession ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={tempCurrentPageInput}
                    onChange={(e) => setTempCurrentPageInput(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="last page finished"
                    min="0"
                    max={book.totalPages}
                  />
                  {activeSession ? (
                    <button
                      onClick={() => {
                        endReadingSession(book.id, tempCurrentPageInput);
                        setEditingCurrentPage(false);
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center gap-1"
                    >
                      <StopCircle size={16} /> End
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        updateCurrentPage(book.id, tempCurrentPageInput);
                        setEditingCurrentPage(false);
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      <Save size={16} />
                    </button>
                  )}
                </div>
              ) : (
                  <div className="p-2 bg-gray-100 rounded-md">
                    <span className="text-gray-800">Finished Page {book.currentPage}</span>
                  </div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2 relative">
                <div className="flex items-center gap-1">
                  <label className="block text-sm font-medium text-gray-600">Yesterday's Page</label>
                  <button
                    type="button"
                    onClick={() => setShowYesterdayInfo(!showYesterdayInfo)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <Info size={14} />
                  </button>
                </div>
                <button
                  onClick={() => setEditingYesterday(!editingYesterday)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Edit3 size={16} />
                </button>

                {showYesterdayInfo && (
                  <div className="absolute left-0 top-full mt-1 w-60 bg-white border border-gray-300 rounded-md shadow text-xs text-gray-700 p-2 z-10">
                    Automatically updated from your last entry. Change it if you missed updating yesterday.
                  </div>
                )}
              </div>

              {editingYesterday ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={tempYesterdayPage}
                    onChange={(e) => setTempYesterdayPage(e.target.value)}
                    className="flex-1 p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max={book.totalPages}
                  />
                  <button
                    onClick={() => {
                      updateYesterdayPage(book.id, tempYesterdayPage);
                      setEditingYesterday(false);
                    }}
                    className="bg-gray-500 text-white px-3 py-1 rounded-md hover:bg-gray-600 transition-colors"
                  >
                    <Save size={16} />
                  </button>
                </div>
              ) : (
                <div className="p-2 bg-gray-100 rounded-md">
                  <span className="text-sm text-gray-600">Page {getYesterdayPage(book)}</span>
                </div>
              )}
            </div>
          </div>
        </div>


        {book.targetDate && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="text-gray-600" size={20} />
              <h3 className="font-semibold text-gray-800">Reading Schedule</h3>
            </div>
            <p className="text-sm text-gray-600">
              Target completion: {new Date(book.targetDate).toLocaleDateString()} ({daysRemaining > 0 ? `in ${daysRemaining} days` : 'due today'})
            </p>
            <p className="text-sm text-gray-600">
              Daily goal: {dailyGoal} pages per day
            </p>
          </div>
        )}

        {completedSessions.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Clock className="text-gray-600" size={20} /> Past Sessions
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-gray-600">
                    <th className="px-2 py-1 text-left">Date</th>
                    <th className="px-2 py-1 text-right">Duration</th>
                    <th className="px-2 py-1 text-right">Pages</th>
                    <th className="px-2 py-1 text-right">Pace</th>
                    <th className="px-2 py-1" />
                  </tr>
                </thead>
                <tbody>
                  {completedSessions.map(s => {
                    const duration = s.endTime - s.startTime;
                    const pages = s.endPage - s.startPage;
                    const pace = pages > 0 ? (duration / 60000) / pages : 0;
                    return (
                      <tr key={s.id} className="border-t">
                        <td className="px-2 py-1">
                          {new Date(s.startTime).toLocaleDateString()} {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-2 py-1 text-right">{formatDuration(duration)}</td>
                        <td className="px-2 py-1 text-right">{pages}</td>
                        <td className="px-2 py-1 text-right">{`${formatMinutesPerPage(pace)} / page`}</td>
                        <td className="px-2 py-1 text-center">
                          <button
                            onClick={() => deleteReadingSession(book.id, s.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-700 mt-2">
              Average pace: {`${formatMinutesPerPage(averageSpeed)} / page`}
              {averageSpeed > 0 && (
                <> ({pagesInThirty.toFixed(1)} pages in 30 minutes)</>
              )}
            </p>
          </div>
        )}
      </div>
    );
  };

  const Dashboard = () => {
    const readingBooks = books.filter(book => book.status === 'reading');
    const readBooks = books.filter(book => book.status === 'read');
    const wantToReadBooks = books.filter(book => book.status === 'want-to-read');

    return (
      <div className="max-w-6xl mx-auto p-4 bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="text-blue-600" />
            Reading Summit
          </h1>
          <button
            onClick={() => setShowAddBook(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Add Book
          </button>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Currently Reading ({readingBooks.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {readingBooks.map(book => (
                <BookCard key={book.id} book={book} />
              ))}
              {readingBooks.length === 0 && (
                <p className="text-gray-500 col-span-full text-center py-8">No books currently being read</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Want to Read ({wantToReadBooks.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wantToReadBooks.map(book => (
                <BookCard key={book.id} book={book} />
              ))}
              {wantToReadBooks.length === 0 && (
                <p className="text-gray-500 col-span-full text-center py-8">No books in your reading list</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Read ({readBooks.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {readBooks.map(book => (
                <BookCard key={book.id} book={book} />
              ))}
              {readBooks.length === 0 && (
                <p className="text-gray-500 col-span-full text-center py-8">No completed books yet</p>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-gray-50 to-blue-50">
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'detail' && selectedBook && <BookDetail book={books.find(b => b.id === selectedBook.id) || selectedBook} />}
      {showAddBook && <AddBookForm />}
    </div>
  );
};

export default ReadingTracker;
