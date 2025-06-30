const getYesterdayPageFromProgress = (book) => {
  const todayStr = new Date().toISOString().split('T')[0];
  if (!book.dailyProgress || book.dailyProgress.length === 0) {
    return book.yesterdayPage || 0;
  }
  const entries = book.dailyProgress
    .filter(p => p.date < todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (entries.length === 0) return book.yesterdayPage || 0;
  return entries[entries.length - 1].page;
};

export const getYesterdayPage = getYesterdayPageFromProgress;

export const calculateDailyGoal = (book) => {
  if (book.status !== 'reading' || !book.targetDate) return 0;

  const yesterdayPage = getYesterdayPageFromProgress(book);

  const today = new Date();
  const target = new Date(book.targetDate);
  const daysRemaining = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

  if (daysRemaining <= 0) return book.totalPages - yesterdayPage;

  const pagesRemaining = book.totalPages - yesterdayPage;
  return Math.ceil(pagesRemaining / daysRemaining);
};

export const getTodaysTarget = (book) => {
  const yesterdayPage = getYesterdayPageFromProgress(book);
  const dailyGoal = calculateDailyGoal(book);
  return Math.min(yesterdayPage + dailyGoal, book.totalPages);
};
