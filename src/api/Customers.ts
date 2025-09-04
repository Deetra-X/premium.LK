// API functions for Customers

interface CustomerQueryParams {
  type?: 'standard' | 'reseller' | 'all';
  limit?: number;
  offset?: number;
  search?: string;
}

/**
 * Fetches all customers with optional filtering
 * @param params - Query parameters for filtering
 * @returns Promise resolving to array of customer objects
 */
export async function fetchCustomers(params: CustomerQueryParams = {}) {
  const queryString = new URLSearchParams(params as Record<string, string>).toString();
  const url = `/api/customers${queryString ? `?${queryString}` : ''}`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch customers');
  return res.json();
}

/**
 * Fetches all reseller customers
 * @returns Promise resolving to array of reseller customer objects
 */
export async function fetchResellerCustomers() {
  const res = await fetch('/api/customers/resellers');
  if (!res.ok) throw new Error('Failed to fetch reseller customers');
  return res.json();
}

/**
 * Fetches customer statistics
 * @returns Promise resolving to customer stats object
 */
export async function fetchCustomerStats() {
  const res = await fetch('/api/customers/stats');
  if (!res.ok) throw new Error('Failed to fetch customer stats');
  return res.json();
}

/**
 * Creates a new customer
 * @param customerData - Customer data to create
 * @returns Promise resolving to created customer object
 */
export async function createCustomer(customerData: Record<string, unknown>) {
  const res = await fetch('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customerData),
  });
  if (!res.ok) throw new Error('Failed to create customer');
  return res.json();
}

/**
 * Updates an existing customer
 * @param id - Customer ID
 * @param customerData - Customer data to update
 * @returns Promise resolving to updated customer object
 */
export async function updateCustomer(id: string, customerData: Record<string, unknown>) {
  const res = await fetch(`/api/customers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customerData),
  });
  if (!res.ok) throw new Error('Failed to update customer');
  return res.json();
}

/**
 * Deletes a customer
 * @param id - Customer ID
 * @returns Promise resolving to success response
 */
export async function deleteCustomer(id: string) {
  const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete customer');
  return res.json();
}

/**
 * Fetches a single customer by ID
 * @param id - Customer ID
 * @returns Promise resolving to customer object
 */
export async function fetchCustomerById(id: string) {
  const res = await fetch(`/api/customers/${id}`);
  if (!res.ok) throw new Error('Failed to fetch customer');
  return res.json();
}
