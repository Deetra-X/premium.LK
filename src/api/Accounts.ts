// API functions for Accounts

const API_BASE_URL = 'http://localhost:3001';

interface QueryParams {
  status?: 'active' | 'inactive' | 'all';
  category?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetches all accounts with optional filtering
 * @param {QueryParams} params - Query parameters
 * @returns {Promise<Array>} Array of account objects
 */
export async function fetchAccounts(params: QueryParams = {}): Promise<any[]> {
  const queryString = new URLSearchParams(params as any).toString();
  const url = `${API_BASE_URL}/api/accounts${queryString ? `?${queryString}` : ''}`;
  
  console.log('🌐 Fetching accounts from:', url);
  
  try {
    const res = await fetch(url);
    console.log('📡 Response status:', res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Failed to fetch accounts:', errorText);
      throw new Error(`Failed to fetch accounts: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('📦 Accounts data received:', data);
    // Always map to camelCase for frontend compatibility
    if (!Array.isArray(data)) return [];
    return data.map(account => ({
      id: account.id,
      productName: account.product_name,
      label: account.label,
      email: account.email,
      renewalStatus: account.renewal_status,
      daysUntilRenewal: account.days_until_renewal,
      cost: account.cost,
      description: account.description,
      createdAt: account.created_at,
      updatedAt: account.updated_at,
      isActive: account.is_active,
      serviceType: account.service_type,
      subscriptionType: account.subscription_type,
      renewalDate: account.renewal_date,
      categoryId: account.category_id,
      brand: account.brand,
      maxUserSlots: account.max_user_slots,
      availableSlots: account.available_slots,
      currentUsers: account.current_users || 0, // Direct user count (doesn't include primary holder)
      costPerAdditionalUser: account.cost_per_additional_user,
      isSharedAccount: account.is_shared_account,
      familyFeatures: Array.isArray(account.family_features) ? account.family_features : (account.family_features ? JSON.parse(account.family_features) : []),
      usageRestrictions: Array.isArray(account.usage_restrictions) ? account.usage_restrictions : (account.usage_restrictions ? JSON.parse(account.usage_restrictions) : []),
      primaryHolder: {
        name: account.primary_holder_name,
        email: account.primary_holder_email,
        phone: account.primary_holder_phone
      },
      categoryName: account.category_name,
      categoryIcon: account.category_icon,
      categoryColor: account.category_color
    }));
  } catch (error) {
    console.error('🚨 Network error fetching accounts:', error);
    throw error;
  }
}

/**
 * Fetches only active accounts
 * @returns {Promise<Array>} Array of active account objects
 */
export async function fetchActiveAccounts(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/api/accounts/active`);
  if (!res.ok) throw new Error('Failed to fetch active accounts');
  return res.json();
}

/**
 * Fetches accounts expiring in the next 7 days
 * @returns {Promise<Array>} Array of expiring account objects
 */
export async function fetchExpiringSoonAccounts(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/api/accounts/expiring-soon`);
  if (!res.ok) throw new Error('Failed to fetch expiring accounts');
  return res.json();
}

/**
 * Creates a new account with proper categorization and data structure
 * @param {any} accountData - Account data to create
 * @returns {Promise<any>} Created account object
 */
export async function createAccount(accountData: any): Promise<any> {
  console.log('🚀 Creating account with data:', accountData);
  
  // Ensure the data is properly formatted for the backend
  const formattedData = {
    product_name: accountData.productName,
    label: accountData.label || '',
    email: accountData.email || '',
    category_id: accountData.categoryId || null,
    service_type: accountData.serviceType || 'other',
    subscription_type: accountData.subscriptionType || 'monthly',
    renewal_status: accountData.renewalStatus || 'renewable',
    renewal_date: accountData.renewalDate || new Date(),
    cost: accountData.cost || 0,
    brand: accountData.brand || '',
    description: accountData.description || '',
    max_user_slots: accountData.maxUserSlots || 1,
    current_users: accountData.currentUsers || 0,
    available_slots: accountData.availableSlots || (accountData.maxUserSlots || 1) - (accountData.currentUsers || 0),
    cost_per_additional_user: accountData.costPerAdditionalUser || 0,
    is_shared_account: accountData.isSharedAccount || false,
    is_active: accountData.isActive !== undefined ? accountData.isActive : true,
    family_features: JSON.stringify(accountData.familyFeatures || []),
    usage_restrictions: JSON.stringify(accountData.usageRestrictions || []),
    primary_holder_name: accountData.primaryHolder?.name || '',
    primary_holder_email: accountData.primaryHolder?.email || accountData.email || '',
    primary_holder_phone: accountData.primaryHolder?.phone || ''
  };
  
  console.log('📤 Sending formatted data to backend:', formattedData);
  
  const res = await fetch(`${API_BASE_URL}/api/accounts`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(formattedData),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('❌ Failed to create account:', errorText);
    throw new Error(`Failed to create account: ${res.status} ${res.statusText} - ${errorText}`);
  }
  
  const createdAccount = await res.json();
  console.log('✅ Account created successfully:', createdAccount);
  return createdAccount;
}

/**
 * Updates an existing account
 * @param {string} id - Account ID
 * @param {any} accountData - Account data to update
 * @returns {Promise<any>} Updated account object
 */
export async function updateAccount(id: string, accountData: any): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/accounts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(accountData),
  });
  if (!res.ok) throw new Error('Failed to update account');
  return res.json();
}

/**
 * Deletes an account (hard delete - permanently removes from database)
 * @param {string} id - Account ID
 * @returns {Promise<any>} Success response
 */
export async function deleteAccount(id: string): Promise<any> {
  console.log('🗑️ Permanently deleting account:', id);
  
  try {
    const res = await fetch(`${API_BASE_URL}/api/accounts/${id}`, { 
      method: 'DELETE' 
    });
    
    const responseData = await res.json();
    
    if (!res.ok) {
      console.error('❌ Account deletion failed:', responseData);
      throw new Error(responseData.error || 'Failed to delete account');
    }
    
    console.log('✅ Account permanently deleted:', responseData);
    return responseData;
  } catch (error) {
    console.error('🚨 Error deleting account:', error);
    throw error;
  }
}

/**
 * Fetches a single account by ID
 * @param {string} id - Account ID
 * @returns {Promise<any>} Account object
 */
export async function fetchAccountById(id: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/accounts/${id}`);
  if (!res.ok) throw new Error('Failed to fetch account');
  return res.json();
}
