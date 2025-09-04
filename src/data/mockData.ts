import { Subscription, Transaction, DashboardMetrics, Account } from '../types';
import { 
  fetchDashboardMetrics, 
  fetchRecentSales, 
  fetchRecentTransactions, 
  fetchUpcomingRenewals 
} from '../api/Dashboard';
import { fetchExpiringSoonAccounts, fetchActiveAccounts } from '../api/Accounts';

// Updated functions that fetch real data from the API

export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  try {
    const metrics = await fetchDashboardMetrics();
    return {
      activeAccounts: metrics.activeAccounts || 0,
      activeSales: metrics.activeSales || 0,
      salesRevenue: metrics.salesRevenue || 0,
      expiringSoon: metrics.expiringSoon || 0,
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return {
      activeAccounts: 0,
      activeSales: 0,
      salesRevenue: 0,
      expiringSoon: 0,
    };
  }
};

export const getExpiringSoon = async (): Promise<Subscription[]> => {
  try {
    // Map accounts to subscription format for compatibility
    const accounts = await fetchExpiringSoonAccounts();
    return accounts.map((account: Record<string, unknown>) => ({
      id: account.id as string,
      customerId: account.primary_holder_email as string || account.email as string || '',
      customerName: account.primary_holder_name as string || 'Unknown',
      productName: account.product_name as string,
      duration: 12 as const, // Default to annual
      startDate: new Date(account.created_at as string),
      endDate: new Date(account.renewal_date as string),
      status: (account.renewal_status === 'renewable' ? 'active' : 'expired') as 'active' | 'expired' | 'cancelled',
      price: account.cost as number,
      createdAt: new Date(account.created_at as string)
    }));
  } catch (error) {
    console.error('Error fetching expiring accounts:', error);
    return [];
  }
};

export const getUpcomingRenewals = async (): Promise<Subscription[]> => {
  try {
    // Map accounts to subscription format for compatibility
    const accounts = await fetchUpcomingRenewals();
    return accounts.map((account: Record<string, unknown>) => ({
      id: account.id as string,
      customerId: account.primary_holder_email as string || account.email as string || '',
      customerName: account.primary_holder_name as string || 'Unknown',
      productName: account.product_name as string,
      duration: 12 as const, // Default to annual
      startDate: new Date(account.created_at as string),
      endDate: new Date(account.renewal_date as string),
      status: (account.renewal_status === 'renewable' ? 'active' : 'expired') as 'active' | 'expired' | 'cancelled',
      price: account.cost as number,
      createdAt: new Date(account.created_at as string)
    }));
  } catch (error) {
    console.error('Error fetching upcoming renewals:', error);
    return [];
  }
};

export const getRecentSales = async (): Promise<Subscription[]> => {
  try {
    const sales = await fetchRecentSales(10);
    return sales.map((sale: Record<string, unknown>) => ({
      id: sale.id as string,
      customerId: sale.customer_id as string,
      customerName: sale.customer_name as string || 'Unknown',
      productName: sale.product_name as string,
      duration: 12 as const, // Default to annual
      startDate: new Date(sale.created_at as string),
      endDate: new Date(sale.end_date as string || Date.now() + 365*24*60*60*1000), // Default to 1 year from now
      status: sale.status as 'active' | 'expired' | 'cancelled',
      price: sale.cost as number,
      createdAt: new Date(sale.created_at as string)
    }));
  } catch (error) {
    console.error('Error fetching recent sales:', error);
    return [];
  }
};

export const getRecentTransactions = async (): Promise<Transaction[]> => {
  try {
    const transactions = await fetchRecentTransactions(10);
    return transactions.map((transaction: Record<string, unknown>) => ({
      id: transaction.id as string,
      subscriptionId: transaction.subscription_id as string,
      customerName: transaction.customer_name as string || 'Unknown',
      productName: transaction.product_name as string || 'Unknown',
      date: new Date(transaction.created_at as string),
      amount: transaction.amount as number,
      type: transaction.type as 'sale' | 'refund' | 'renewal',
      status: transaction.status as 'pending' | 'completed' | 'failed'
    }));
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return [];
  }
};

export const getAccounts = async (): Promise<Account[]> => {
  try {
    const accounts = await fetchActiveAccounts();
    return accounts.map((account: Record<string, unknown>) => ({
      id: account.id as string,
      productName: account.product_name as string,
      label: account.label as string || '',
      email: account.email as string || '',
      renewalStatus: account.renewal_status as 'renewable' | 'non-renewable' | 'expired',
      daysUntilRenewal: account.days_until_renewal as number,
      cost: account.cost as number,
      description: account.description as string || '',
      createdAt: new Date(account.created_at as string),
      updatedAt: new Date(account.updated_at as string),
      isActive: account.is_active as boolean,
      serviceType: account.service_type as 'streaming' | 'productivity' | 'design' | 'storage' | 'music' | 'gaming' | 'education' | 'other',
      subscriptionType: account.subscription_type as 'weekly' | 'monthly' | 'annual',
      renewalDate: new Date(account.renewal_date as string),
      categoryId: account.category_id as string,
      brand: account.brand as string,
      maxUserSlots: account.max_user_slots as number || 1,
      availableSlots: account.available_slots as number || 1,
      currentUsers: account.current_users as number || 0,
      costPerAdditionalUser: account.cost_per_additional_user as number,
      isSharedAccount: account.is_shared_account as boolean || false,
      familyFeatures: (account.family_features as string[]) || [],
      usageRestrictions: (account.usage_restrictions as string[]) || [],
      primaryHolder: {
        name: account.primary_holder_name as string || '',
        email: account.primary_holder_email as string || '',
        phone: account.primary_holder_phone as string
      },
      userSlots: [] // Will be populated from separate endpoint if needed
    }));
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return [];
  }
};

export const getActiveAccounts = async (): Promise<Account[]> => {
  return getAccounts(); // getAccounts already filters for active accounts
};

// Utility function for filtering accounts by category
export const getAccountsByCategory = async (categoryId: string): Promise<Account[]> => {
  try {
    const allAccounts = await getAccounts();
    return allAccounts.filter(account => account.categoryId === categoryId);
  } catch (error) {
    console.error('Error fetching accounts by category:', error);
    return [];
  }
};

export const getRenewableAccounts = async (): Promise<Account[]> => {
  try {
    const allAccounts = await getAccounts();
    return allAccounts.filter(account => account.renewalStatus === 'renewable' && account.isActive);
  } catch (error) {
    console.error('Error fetching renewable accounts:', error);
    return [];
  }
};

export const getAccountsExpiringSoon = async (): Promise<Account[]> => {
  try {
    const accounts = await fetchExpiringSoonAccounts();
    return accounts.map((account: Record<string, unknown>) => ({
      id: account.id as string,
      productName: account.product_name as string,
      label: account.label as string || '',
      email: account.email as string || '',
      renewalStatus: account.renewal_status as 'renewable' | 'non-renewable' | 'expired',
      daysUntilRenewal: account.days_until_renewal as number,
      cost: account.cost as number,
      description: account.description as string || '',
      createdAt: new Date(account.created_at as string),
      updatedAt: new Date(account.updated_at as string),
      isActive: account.is_active as boolean,
      serviceType: account.service_type as 'streaming' | 'productivity' | 'design' | 'storage' | 'music' | 'gaming' | 'education' | 'other',
      subscriptionType: account.subscription_type as 'weekly' | 'monthly' | 'annual',
      renewalDate: new Date(account.renewal_date as string),
      categoryId: account.category_id as string,
      brand: account.brand as string,
      maxUserSlots: account.max_user_slots as number || 1,
      availableSlots: account.available_slots as number || 1,
      currentUsers: account.current_users as number || 0,
      costPerAdditionalUser: account.cost_per_additional_user as number,
      isSharedAccount: account.is_shared_account as boolean || false,
      familyFeatures: (account.family_features as string[]) || [],
      usageRestrictions: (account.usage_restrictions as string[]) || [],
      primaryHolder: {
        name: account.primary_holder_name as string || '',
        email: account.primary_holder_email as string || '',
        phone: account.primary_holder_phone as string
      },
      userSlots: []
    }));
  } catch (error) {
    console.error('Error fetching expiring accounts:', error);
    return [];
  }
};

export const getSharedAccounts = async (): Promise<Account[]> => {
  try {
    const allAccounts = await getAccounts();
    return allAccounts.filter(account => account.isSharedAccount && account.isActive);
  } catch (error) {
    console.error('Error fetching shared accounts:', error);
    return [];
  }
};

export const getIndividualAccounts = async (): Promise<Account[]> => {
  try {
    const allAccounts = await getAccounts();
    return allAccounts.filter(account => !account.isSharedAccount && account.isActive);
  } catch (error) {
    console.error('Error fetching individual accounts:', error);
    return [];
  }
};
