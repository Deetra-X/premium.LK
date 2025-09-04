// API functions for Dashboard

const API_BASE_URL = 'http://localhost:3001';

interface DashboardQueryParams {
  period?: 'week' | 'month' | 'year';
  granularity?: 'day' | 'week' | 'month';
  limit?: number;
}

/**
 * Fetches dashboard metrics (counts and revenue)
 * @returns Promise resolving to dashboard metrics object
 */
export async function fetchDashboardMetrics() {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/metrics`);
  if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
  return res.json();
}

/**
 * Fetches recent sales/subscriptions
 * @param limit - Number of recent sales to fetch (default: 10)
 * @returns Promise resolving to array of recent sales
 */
export async function fetchRecentSales(limit = 10) {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/recent-sales?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch recent sales');
  return res.json();
}

/**
 * Fetches recent transactions
 * @param limit - Number of recent transactions to fetch (default: 10)
 * @returns Promise resolving to array of recent transactions
 */
export async function fetchRecentTransactions(limit = 10) {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/recent-transactions?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch recent transactions');
  return res.json();
}

/**
 * Fetches accounts with upcoming renewals (8-14 days)
 * @returns Promise resolving to array of accounts with upcoming renewals
 */
export async function fetchUpcomingRenewals() {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/upcoming-renewals`);
  if (!res.ok) throw new Error('Failed to fetch upcoming renewals');
  return res.json();
}

/**
 * Fetches sales data grouped by category
 * @param period - Time period for sales data ('week', 'month', 'year')
 * @returns Promise resolving to array of category sales data
 */
export async function fetchSalesByCategory(period: 'week' | 'month' | 'year' = 'month') {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/sales-by-category?period=${period}`);
  if (!res.ok) throw new Error('Failed to fetch sales by category');
  return res.json();
}

/**
 * Fetches revenue trend data for charts
 * @param params - Query parameters for revenue trend
 * @returns Promise resolving to array of revenue data points
 */
export async function fetchRevenueTrend(params: DashboardQueryParams = {}) {
  const queryString = new URLSearchParams(params as Record<string, string>).toString();
  const url = `${API_BASE_URL}/api/dashboard/revenue-trend${queryString ? `?${queryString}` : ''}`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch revenue trend');
  return res.json();
}

/**
 * Fetches accounts expiring soon for reminders
 * @param days - Number of days to look ahead (default: 7)
 * @returns Promise resolving to array of expiring accounts
 */
export async function fetchExpiringAccounts(days = 7) {
  const res = await fetch(`${API_BASE_URL}/api/accounts/expiring-soon?days=${days}`);
  if (!res.ok) throw new Error('Failed to fetch expiring accounts');
  return res.json();
}
