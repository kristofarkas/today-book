export const calculateDailyGoal = (book) => {
  if (book.status !== 'reading' || !book.targetDate) return 0;

  const today = new Date();
  const target = new Date(book.targetDate);
  const daysRemaining = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

  if (daysRemaining <= 0) return book.totalPages - book.yesterdayPage;

  const pagesRemaining = book.totalPages - book.yesterdayPage;
  return Math.ceil(pagesRemaining / daysRemaining);
};

export const getTodaysTarget = (book) => {
  const dailyGoal = calculateDailyGoal(book);
  return Math.min(book.yesterdayPage + dailyGoal, book.totalPages);
};
