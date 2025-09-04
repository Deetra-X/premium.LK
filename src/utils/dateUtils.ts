export const formatDate = (date: Date | string): string => {
  // Handle both Date objects and string dates
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check if valid date
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatCurrency = (amount: number | undefined | null): string => {
  // Handle undefined or null values
  if (amount === undefined || amount === null) {
    return 'LKR 0.00';
  }
  
  // Handle NaN
  if (isNaN(amount)) {
    return 'LKR 0.00';
  }
  
  return `LKR ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const getDaysUntilExpiry = (endDate: Date): number => {
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const calculateEndDate = (startDate: Date, duration: 3 | 6 | 12): Date => {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + duration);
  return endDate;
};

export const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const isOverdue = (dueDate: Date, status: string): boolean => {
  return status !== 'paid' && new Date() > dueDate;
};