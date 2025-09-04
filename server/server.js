import { v4 as uuidv4 } from 'uuid';

// Base API URL - Updated to match other API endpoints
const API_BASE_URL = 'http://localhost:3001/api';

// Interface for account order data
export interface AccountOrder {
  id?: string;
  sales_id: string;
  account_id: string;
  start_date: string;
  end_date: string;
  quantity?: number;
  unit_price: number;
  status?: 'active' | 'expired' | 'cancelled';
  credentials?: AccountCredential[];
}

// Interface for account credentials
export interface AccountCredential {
  id?: string;
  account_order_id?: string;
  username?: string;
  password?: string;
  loginUrl?: string;
  additionalInfo?: string;
  isActive?: boolean;
}

/**
 * Create a new account order
 * @param orderData The order data
 */
export const createAccountOrder = async (orderData: {
  sales_id: string;
  account_id: string;
  start_date: string;
  end_date: string;
  quantity: number;
  unit_price: number;
}): Promise<any> => {
  try {
    console.log('Creating account order via API...', orderData);

    const response = await fetch(`${API_BASE_URL}/account-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      // Check if response is HTML (404 page)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error(`Account Orders API endpoint not found (${response.status}). The server may not have this endpoint implemented yet.`);
      }

      // Try to parse JSON error
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create account order (${response.status})`);
      } catch (parseError) {
        throw new Error(`Failed to create account order (${response.status}): ${response.statusText}`);
      }
    }

    const data = await response.json();
    console.log('Account order created successfully via API:', data);
    return data;
  } catch (error: any) {
    console.error('Error creating account order:', error);
    throw error;
  }
}

/**
 * Get all account orders
 * @param filters Optional filter parameters
 */
export async function getAccountOrders(filters?: {
  status?: string;
  accountId?: string;
  salesId?: string;
  startBefore?: string;
  startAfter?: string;
  endBefore?: string;
  endAfter?: string;
  limit?: number;
  offset?: number;
}): Promise<AccountOrder[]> {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = `${API_BASE_URL}/account-orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch account orders');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching account orders:', error);
    throw error;
  }
}

/**
 * Get a single account order by ID
 * @param id The order ID
 */
export async function getAccountOrderById(id: string): Promise<AccountOrder> {
  try {
    const response = await fetch(`${API_BASE_URL}/account-orders/${id}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch account order');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching account order ${id}:`, error);
    throw error;
  }
}

/**
 * Update an account order
 * @param id The order ID
 * @param orderData The updated order data
 */
export async function updateAccountOrder(id: string, orderData: Partial<AccountOrder>): Promise<AccountOrder> {
  try {
    const response = await fetch(`${API_BASE_URL}/account-orders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update account order');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error updating account order ${id}:`, error);
    throw error;
  }
}

/**
 * Delete an account order
 * @param id The order ID
 */
export async function deleteAccountOrder(id: string): Promise<{ message: string; id: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/account-orders/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete account order');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error deleting account order ${id}:`, error);
    throw error;
  }
}

/**
 * Delete a credential
 * @param id The credential ID
 */
export async function deleteCredential(id: string): Promise<{ message: string; id: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/account-orders/credentials/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete credential');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error deleting credential ${id}:`, error);
    throw error;
  }
}