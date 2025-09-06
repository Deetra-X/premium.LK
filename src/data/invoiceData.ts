import { Invoice } from '../types/index';

// Base API URL for invoice operations
const API_BASE_URL = 'http://localhost:3001/api';

// Interface for database invoice response
interface DatabaseInvoice {
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  customer_type: 'Standard' | 'Reseller';
  status: string;
  subtotal: string | number;
  discount_amount: string | number;
  tax_amount: string | number;
  total_amount: string | number;
  number_of_items: number;
  payment_method: string;
  payment_terms: string;
  reseller_id?: string;
  issue_date: string;
  due_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  sale_id?: string;
  customer_id?: string;
}

/**
 * Returns all invoices sorted by issue date descending.
 * Fetches data from the backend database.
 */
export const getInvoices = async (): Promise<Invoice[]> => {
  try {
    console.log('🔄 Fetching invoices from API...');
    const response = await fetch(`${API_BASE_URL}/invoices`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch invoices: ${response.statusText}`);
    }
    
    const invoices: DatabaseInvoice[] = await response.json();
    console.log(`✅ Fetched ${invoices.length} invoices from API`);
    
    // Transform database response to match Invoice interface
    return invoices.map((invoice: DatabaseInvoice) => ({
      id: invoice.invoice_number || '', // Use invoice_number as ID
      invoiceNumber: invoice.invoice_number || '',
      saleId: invoice.sale_id || '',
      customerId: invoice.customer_id || '',
      customerInfo: {
        name: invoice.customer_name || '',
        email: invoice.customer_email || '',
        phone: '', // Not stored in invoices table
        billingAddress: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        }, // Not stored in invoices table
        customerType: (invoice.customer_type?.toLowerCase() as 'standard' | 'reseller') || 'standard',
        resellerInfo: invoice.customer_type === 'Reseller' && invoice.reseller_id ? {
          resellerId: invoice.reseller_id,
          discountRate: parseFloat(String(invoice.subtotal)) > 0 ? (parseFloat(String(invoice.discount_amount)) / parseFloat(String(invoice.subtotal))) * 100 : 0,
          minimumOrderQuantity: 1
        } : undefined
      },
      items: [], // Items will be loaded separately if needed
      subtotal: parseFloat(String(invoice.subtotal)) || 0,
      discountAmount: parseFloat(String(invoice.discount_amount)) || 0,
      discountPercentage: parseFloat(String(invoice.subtotal)) > 0 ? (parseFloat(String(invoice.discount_amount)) / parseFloat(String(invoice.subtotal))) * 100 : 0,
      taxAmount: parseFloat(String(invoice.tax_amount)) || 0,
      taxRate: (parseFloat(String(invoice.subtotal)) - parseFloat(String(invoice.discount_amount))) > 0 ? (parseFloat(String(invoice.tax_amount)) / (parseFloat(String(invoice.subtotal)) - parseFloat(String(invoice.discount_amount)))) * 100 : 15,
      totalAmount: parseFloat(String(invoice.total_amount)) || 0,
      paymentMethod: (invoice.payment_method?.toLowerCase() as Invoice['paymentMethod']) || 'cash',
      paymentTerms: invoice.payment_terms || 'Payment due within 30 days',
      dueDate: new Date(invoice.due_date),
      issueDate: new Date(invoice.issue_date),
      status: (invoice.status as Invoice['status']) || 'draft',
      notes: invoice.notes,
      createdAt: new Date(invoice.created_at),
      updatedAt: new Date(invoice.updated_at)
    }));
  } catch (error) {
    console.error('❌ Error fetching invoices:', error);
    return [];
  }
};

/**
 * Finds an invoice by its unique ID.
 * Returns undefined if not found or error occurs.
 * @param id - Invoice ID to search for
 */
export const getInvoiceById = async (id: string): Promise<Invoice | undefined> => {
  try {
    console.log(`🔄 Fetching invoice ${id} from API...`);
    const response = await fetch(`${API_BASE_URL}/invoices/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`ℹ️ Invoice ${id} not found`);
        return undefined;
      }
      throw new Error(`Failed to fetch invoice: ${response.statusText}`);
    }
    
    const invoice: DatabaseInvoice = await response.json();
    console.log(`✅ Fetched invoice ${id} from API`);
    
    // Transform database response to match Invoice interface (same as above)
    return {
      id: invoice.invoice_number || '',
      invoiceNumber: invoice.invoice_number || '',
      saleId: invoice.sale_id || '',
      customerId: invoice.customer_id || '',
      customerInfo: {
        name: invoice.customer_name || '',
        email: invoice.customer_email || '',
        phone: '', // Not stored in invoices table
        billingAddress: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        }, // Not stored in invoices table
        customerType: (invoice.customer_type?.toLowerCase() as 'standard' | 'reseller') || 'standard',
        resellerInfo: invoice.customer_type === 'Reseller' && invoice.reseller_id ? {
          resellerId: invoice.reseller_id,
          discountRate: parseFloat(String(invoice.subtotal)) > 0 ? (parseFloat(String(invoice.discount_amount)) / parseFloat(String(invoice.subtotal))) * 100 : 0,
          minimumOrderQuantity: 1
        } : undefined
      },
      items: [], // Items will be loaded separately if needed
      subtotal: parseFloat(String(invoice.subtotal)) || 0,
      discountAmount: parseFloat(String(invoice.discount_amount)) || 0,
      discountPercentage: parseFloat(String(invoice.subtotal)) > 0 ? (parseFloat(String(invoice.discount_amount)) / parseFloat(String(invoice.subtotal))) * 100 : 0,
      taxAmount: parseFloat(String(invoice.tax_amount)) || 0,
      taxRate: (parseFloat(String(invoice.subtotal)) - parseFloat(String(invoice.discount_amount))) > 0 ? (parseFloat(String(invoice.tax_amount)) / (parseFloat(String(invoice.subtotal)) - parseFloat(String(invoice.discount_amount)))) * 100 : 15,
      totalAmount: parseFloat(String(invoice.total_amount)) || 0,
      paymentMethod: (invoice.payment_method?.toLowerCase() as Invoice['paymentMethod']) || 'cash',
      paymentTerms: invoice.payment_terms || 'Payment due within 30 days',
      dueDate: new Date(invoice.due_date),
      issueDate: new Date(invoice.issue_date),
      status: (invoice.status as Invoice['status']) || 'draft',
      notes: invoice.notes,
      createdAt: new Date(invoice.created_at),
      updatedAt: new Date(invoice.updated_at)
    };
  } catch (error) {
    console.error(`❌ Error fetching invoice ${id}:`, error);
    return undefined;
  }
};

/**
 * Finds an invoice by its invoice number.
 * Returns undefined if not found or error occurs.
 * @param invoiceNumber - Invoice number string
 */
export const getInvoiceByNumber = async (invoiceNumber: string): Promise<Invoice | undefined> => {
  return getInvoiceById(invoiceNumber); // Same as getInvoiceById since we use invoice_number as ID
};

/**
 * Generates a new invoice number in the format INV-{YEAR}-{NUMBER}.
 * The number currently defaults to 001 as a placeholder.
 */
export const generateInvoiceNumber = (): string => {
  const year = new Date().getFullYear();
  const nextNumber = 1;  // Placeholder for sequential invoice numbering logic
  return `INV-${year}-${nextNumber.toString().padStart(3, '0')}`;
};

/**
 * Creates a new invoice from sale data via API
 * @param saleId - The ID of the sale to create invoice from
 * @param customerInfo - Customer information for the invoice
 * @param paymentTerms - Payment terms (optional)
 * @param taxRate - Tax rate percentage (optional)
 * @param notes - Additional notes (optional)
 */
export const createInvoiceFromSale = async (
  saleId: string,
  customerInfo: Invoice['customerInfo'],
  paymentTerms: string = 'Payment due within 30 days',
  taxRate: number = 15,
  notes?: string
): Promise<Invoice> => {
  try {
    console.log(`🔄 Creating invoice from sale ${saleId}...`);
    
    const response = await fetch(`${API_BASE_URL}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        saleId,
        customerInfo,
        paymentTerms,
        taxRate,
        notes
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to create invoice: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`✅ Invoice created successfully: ${result.invoice.invoice_number}`);
    
    // Transform the created invoice to match Invoice interface
    const invoice: DatabaseInvoice = result.invoice;
    return {
      id: invoice.invoice_number || '',
      invoiceNumber: invoice.invoice_number || '',
      saleId: invoice.sale_id || saleId,
      customerId: invoice.customer_id || '',
      customerInfo: {
        name: invoice.customer_name || customerInfo.name || '',
        email: invoice.customer_email || customerInfo.email || '',
        phone: customerInfo.phone || '',
        billingAddress: customerInfo.billingAddress || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        customerType: (invoice.customer_type?.toLowerCase() as 'standard' | 'reseller') || customerInfo.customerType || 'standard',
        resellerInfo: invoice.customer_type === 'Reseller' && invoice.reseller_id ? {
          resellerId: invoice.reseller_id,
          discountRate: parseFloat(String(invoice.subtotal)) > 0 ? (parseFloat(String(invoice.discount_amount)) / parseFloat(String(invoice.subtotal))) * 100 : 0,
          minimumOrderQuantity: customerInfo.resellerInfo?.minimumOrderQuantity || 1,
          specialTerms: customerInfo.resellerInfo?.specialTerms
        } : customerInfo.resellerInfo
      },
      items: [], // Items will be populated from sale data
      subtotal: parseFloat(String(invoice.subtotal)) || 0,
      discountAmount: parseFloat(String(invoice.discount_amount)) || 0,
      discountPercentage: parseFloat(String(invoice.subtotal)) > 0 ? (parseFloat(String(invoice.discount_amount)) / parseFloat(String(invoice.subtotal))) * 100 : 0,
      taxAmount: parseFloat(String(invoice.tax_amount)) || 0,
      taxRate: (parseFloat(String(invoice.subtotal)) - parseFloat(String(invoice.discount_amount))) > 0 ? (parseFloat(String(invoice.tax_amount)) / (parseFloat(String(invoice.subtotal)) - parseFloat(String(invoice.discount_amount)))) * 100 : 15,
      totalAmount: parseFloat(String(invoice.total_amount)) || 0,
      paymentMethod: (invoice.payment_method?.toLowerCase() as Invoice['paymentMethod']) || 'cash',
      paymentTerms: invoice.payment_terms || paymentTerms,
      dueDate: new Date(invoice.due_date),
      issueDate: new Date(invoice.issue_date),
      status: (invoice.status as Invoice['status']) || 'draft',
      notes: invoice.notes,
      createdAt: new Date(invoice.created_at),
      updatedAt: new Date(invoice.updated_at)
    };
  } catch (error) {
    console.error(`❌ Error creating invoice:`, error);
    throw error;
  }
};

/**
 * Updates an invoice status
 * @param invoiceNumber - Invoice number to update
 * @param status - New status
 * @param notes - Optional notes update
 */
export const updateInvoiceStatus = async (
  invoiceNumber: string,
  status: Invoice['status'],
  notes?: string
): Promise<Invoice> => {
  try {
    console.log(`🔄 Updating invoice ${invoiceNumber} status to ${status}...`);
    
    const response = await fetch(`${API_BASE_URL}/invoices/${invoiceNumber}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status,
        notes
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to update invoice: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`✅ Invoice ${invoiceNumber} updated successfully`);
    
    // Transform the updated invoice to match Invoice interface
    const invoice: DatabaseInvoice = result.invoice;
    return {
      id: invoice.invoice_number,
      invoiceNumber: invoice.invoice_number,
      saleId: invoice.sale_id || '',
      customerId: invoice.customer_id || '',
      customerInfo: {
        name: invoice.customer_name,
        email: invoice.customer_email,
        phone: '',
        billingAddress: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        customerType: invoice.customer_type?.toLowerCase() as 'standard' | 'reseller',
        resellerInfo: invoice.customer_type === 'Reseller' && invoice.reseller_id ? {
          resellerId: invoice.reseller_id,
          discountRate: parseFloat(String(invoice.subtotal)) > 0 ? (parseFloat(String(invoice.discount_amount)) / parseFloat(String(invoice.subtotal))) * 100 : 0,
          minimumOrderQuantity: 1
        } : undefined
      },
      items: [],
      subtotal: parseFloat(String(invoice.subtotal)) || 0,
      discountAmount: parseFloat(String(invoice.discount_amount)) || 0,
      discountPercentage: parseFloat(String(invoice.subtotal)) > 0 ? (parseFloat(String(invoice.discount_amount)) / parseFloat(String(invoice.subtotal))) * 100 : 0,
      taxAmount: parseFloat(String(invoice.tax_amount)) || 0,
      taxRate: (parseFloat(String(invoice.subtotal)) - parseFloat(String(invoice.discount_amount))) > 0 ? (parseFloat(String(invoice.tax_amount)) / (parseFloat(String(invoice.subtotal)) - parseFloat(String(invoice.discount_amount)))) * 100 : 15,
      totalAmount: parseFloat(String(invoice.total_amount)) || 0,
      paymentMethod: (invoice.payment_method?.toLowerCase() as Invoice['paymentMethod']) || 'cash',
      paymentTerms: invoice.payment_terms || 'Payment due within 30 days',
      dueDate: new Date(invoice.due_date),
      issueDate: new Date(invoice.issue_date),
      status: invoice.status as Invoice['status'],
      notes: invoice.notes,
      createdAt: new Date(invoice.created_at),
      updatedAt: new Date(invoice.updated_at)
    };
  } catch (error) {
    console.error(`❌ Error updating invoice:`, error);
    throw error;
  }
};
