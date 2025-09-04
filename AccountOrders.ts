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
 * @param orderData Order data to create
 */
export async function createAccountOrder(orderData: Partial<AccountOrder>): Promise<AccountOrder> {
  try {
    console.log('Creating account order via API:', orderData);
    
    const response = await fetch(`${API_BASE_URL}/account-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create account order (${response.status})`);
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
    console.log('Fetching account orders from API with filters:', filters);
    
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const url = `${API_BASE_URL}/account-orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Account Orders API endpoint not found (${response.status}). The server may not have this endpoint implemented yet.`);
    }
    
    const data = await response.json();
    console.log('Account orders fetched successfully:', data);
    
    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    } else if (data.orders && Array.isArray(data.orders)) {
      return data.orders;
    } else {
      console.warn('Unexpected response format from account orders API:', data);
      return [];
    }
  } catch (error: any) {
    console.error('Error fetching account orders:', error);
    return [];
  }
}

/**
 * Get a single account order by ID
 */
export async function getAccountOrderById(id: string): Promise<AccountOrder> {
  try {
    console.log(`Fetching account order ${id} from API`);
    
    const response = await fetch(`${API_BASE_URL}/account-orders/${id}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Account order not found (${response.status})`);
    }
    
    const data = await response.json();
    console.log('Account order fetched successfully:', data);
    return data;
  } catch (error: any) {
    console.error(`Error fetching account order ${id}:`, error);
    throw error;
  }
}

/**
 * Update an existing account order
 */
export async function updateAccountOrder(id: string, orderData: Partial<AccountOrder>): Promise<AccountOrder> {
  try {
    console.log(`Updating account order ${id} via API:`, orderData);
    
    const response = await fetch(`${API_BASE_URL}/account-orders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to update account order (${response.status})`);
    }
    
    const data = await response.json();
    console.log('Account order updated successfully:', data);
    return data;
  } catch (error: any) {
    console.error(`Error updating account order ${id}:`, error);
    throw error;
  }
}

/**
 * Delete an account order
 */
export async function deleteAccountOrder(id: string): Promise<{ success: boolean; message: string; id: string }> {
  try {
    console.log(`Deleting account order ${id} via API`);
    
    const response = await fetch(`${API_BASE_URL}/account-orders/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to delete account order (${response.status})`);
    }
    
    const data = await response.json();
    console.log('Account order deleted successfully:', data);
    return { ...data, success: true };
  } catch (error: any) {
    console.error(`Error deleting account order ${id}:`, error);
    throw error;
  }
}

/**
 * Add a credential to an account order
 */
export async function addCredential(
  accountOrderId: string, 
  credential: Partial<AccountCredential>
): Promise<AccountCredential> {
  try {
    console.log(`Adding credential to account order ${accountOrderId} via API:`, credential);
    
    const credentialWithId = {
      ...credential,
      id: credential.id || uuidv4(),
      account_order_id: accountOrderId
    };
    
    const response = await fetch(`${API_BASE_URL}/account-orders/${accountOrderId}/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentialWithId)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to add credential (${response.status})`);
    }
    
    const data = await response.json();
    console.log('Credential added successfully:', data);
    return data;
  } catch (error: any) {
    console.error(`Error adding credential to account order ${accountOrderId}:`, error);
    throw error;
  }
}

/**
 * Delete a credential
 */
export async function deleteCredential(id: string): Promise<{ success: boolean; message: string; id: string }> {
  try {
    console.log(`Deleting credential ${id} via API`);
    
    const response = await fetch(`${API_BASE_URL}/account-orders/credentials/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to delete credential (${response.status})`);
    }
    
    const data = await response.json();
    console.log('Credential deleted successfully:', data);
    return { ...data, success: true };
  } catch (error: any) {
    console.error(`Error deleting credential ${id}:`, error);
    throw error;
  }
}
