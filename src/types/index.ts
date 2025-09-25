export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountsCount?: number; // For backward compatibility
  totalSpent: number;
  totalOrders: number;
  createdAt: Date;
  lastOrderDate?: Date | null; // Nullable for customers without orders
  preferredProducts?: string[];
  // Invoice-specific fields
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  taxId?: string;
  customerType: 'standard' | 'reseller';
  resellerInfo?: {
    resellerId: string;
    discountRate: number; // percentage
    minimumOrderQuantity: number;
    specialTerms?: string;
    creditLimit?: number;
  };
}
export interface DatabaseAccount {
  id: string;
  product_name?: string;
  name?: string;
  email?: string;
  cost?: number;
  price?: number;
  description?: string;
  is_active: boolean | number;
  available_slots?: number;
  max_user_slots?: number;
  max_slots?: number;
  current_users?: number;
  brand?: string;
  subscription_type?: string;
  primary_holder_name?: string;
  primary_holder_email?: string;
  primary_holder_phone?: string;
  [key: string]: unknown; // For other possible fields
}

// Account interface for our component
export interface AccountItem {
  id: string;
  productName: string;
  cost: number;
  availableSlots: number;
  isActive: boolean;
  description?: string;
  email?: string;
  maxUserSlots?: number;
  currentUsers?: number;
  brand?: string;
  subscriptionType?: string;
  primaryHolder?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  showAccountsList?: boolean;
}

export interface OrderData {
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerType: 'standard' | 'reseller';
  items: OrderItem[];
  subtotal: number;
  discountRate: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  // New fields for account orders
  startDate?: string;
  endDate?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface CreateOrderModalProps {
  onClose: () => void;
  onCreateOrder: (orderData: CreateSaleData) => void;
  existingCustomers: Customer[];
  prefilledItems?: OrderItem[];
}
export interface CreateSaleData {
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerType?: 'standard' | 'reseller'; // Add customer type
  items?: Array<{
    productId?: string;
    product_id?: string;
    productName?: string;
    product_name?: string;
    price?: number;
    quantity?: number;
    email?: string;
  }>;
  totalAmount?: number;
  discountRate?: number; // Percentag
  paymentMethod?: string;
  payment_method?: string;
  status?: string;
  notes?: string;
  startDate?: string;
  endDate?: string;
  daysUntilRenewal?: number; // Add this line
}
export interface Subscription {
  id: string;
  customerId: string;
  customerName: string;
  productName: string;
  duration: 3 | 6 | 12; // months
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled';
  price: number;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  subscriptionId: string;
  customerName: string;
  productName: string;
  date: Date;
  amount: number;
  type: 'sale' | 'renewal' | 'refund';
  status: 'completed' | 'pending' | 'failed';
}

export interface Sale {
  
  id: string;
  order_number: string;
  customer_name: string;
  customerName: string;
  customer_email: string;
  customerEmail: string;
  customer_phone: string;
  customerPhone: string;
  total_amount: number;
   totalAmount: number; // Alias for compatibility
  payment_method: 'cash' | 'bank_transfer';
  paymentMethod: 'cash' | 'bank_transfer'; // Alias for compatibility
  // The date the order was placed; backend returns string timestamps
  order_date: string | Date;
  orderDate: Date | string; // Alias for compatibility
  status: 'pending' | 'completed' | 'cancelled';
  notes: string;
  created_at?: Date | string;
  createdAt?: string | Date; // Alias for compatibility
  customerId: string;
  items: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
  }[];
  updatedAt?: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  saleId: string;
  customerId: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    billingAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    taxId?: string;
    customerType: 'standard' | 'reseller';
    resellerInfo?: {
      resellerId: string;
      discountRate: number;
      minimumOrderQuantity: number;
      specialTerms?: string;
    };
  };
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  discountPercentage: number;
  taxAmount: number;
  taxRate: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'credit' | 'check';
  paymentTerms: string;
  dueDate: Date;
  issueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  originalPrice?: number; // For reseller discounts
  discountPercentage?: number;
  lineTotal: number;
  taxable: boolean;
}

export interface CompanyInfo {
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone: string;
  email: string;
  website?: string;
  taxId?: string;
  logo?: string;
}

export interface SalesMetrics {
  totalCustomers: number;
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: {
    name: string;
    sales: number;
    revenue: number;
  }[];
}

export interface DashboardMetrics {
  activeAccounts: number;
  activeSales: number;
  salesRevenue: number;
  expiringSoon: number;
}

export interface UserSlot {
  id: string;
  name: string;
  email: string;
  accessLevel: 'admin' | 'standard';
  profileSettings: {
    restrictions: string[];
  customSettings: { [key: string]: unknown };
  };
  isActive: boolean;
  joinedDate: Date;
  lastActive?: Date;
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  serviceTypes: string[];
  createdAt: Date;
  isActive: boolean;
}

export interface Account {
  id: string;
  productName: string;
  label: string;
  email: string;
  renewalStatus: 'renewable' | 'non-renewable' | 'expired';
  daysUntilRenewal?: number;
  cost: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  
  // Enhanced inventory fields
  serviceType: 'streaming' | 'productivity' | 'design' | 'storage' | 'music' | 'gaming' | 'education' | 'other';
  subscriptionType: 'weekly' | 'monthly' | 'annual';
  renewalDate: Date;
  
  // Category information
  categoryId?: string;
  brand?: string;
  
  // User slot management
  maxUserSlots: number;
  availableSlots: number;
  currentUsers: number;
  costPerAdditionalUser?: number;
  
  // Family/shared account features
  isSharedAccount: boolean;
  familyFeatures: string[];
  usageRestrictions: string[];
  
  // Primary account holder
  primaryHolder: {
    name: string;
    email: string;
    phone?: string;
  };
  
  // User slots for shared accounts
  userSlots: UserSlot[];
}

export type NavigationItem = 'dashboard' | 'accounts' | 'customers' | 'sales' | 'reminders' | 'settings';