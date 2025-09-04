import { Invoice, InvoiceItem } from '../types';
import { getSalesData } from './salesData';

/**
 * Returns all invoices sorted by issue date descending.
 * Currently returns an empty array as no data source is connected.
 */
export const getInvoices = (): Invoice[] => {
  return [];
};

/**
 * Finds an invoice by its unique ID.
 * Returns undefined if not found or data source is empty.
 * @param id - Invoice ID to search for
 */
export const getInvoiceById = (id: string): Invoice | undefined => {
  return undefined;
};

/**
 * Finds an invoice by its invoice number.
 * Returns undefined if not found or data source is empty.
 * @param invoiceNumber - Invoice number string
 */
export const getInvoiceByNumber = (invoiceNumber: string): Invoice | undefined => {
  return undefined;
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
 * Creates a new Invoice object from a sale record.
 * Applies reseller discounts if customerInfo indicates reseller type.
 * Calculates subtotal, discount, tax, and total amounts accordingly.
 * @param saleId - The ID of the sale from which to create the invoice
 * @param customerInfo - Customer billing and type information
 * @param paymentTerms - Payment terms description (default: "Payment due within 30 days")
 * @param taxRate - Tax rate percentage to apply (default: 15%)
 * @throws Error if sale with saleId is not found
 * @returns the newly generated Invoice object in draft status
 */
export const createInvoiceFromSale = async (
  saleId: string,
  customerInfo: Invoice['customerInfo'],
  paymentTerms: string = 'Payment due within 30 days',
  taxRate: number = 15
): Promise<Invoice> => {
  // Retrieve sales data - now async
  const { sales } = await getSalesData();
  
  // Find the matching sale by ID
  const sale = sales.find(s => s.id === saleId);

  if (!sale) {
    throw new Error('Sale not found');
  }

  // Map sale items to invoice items applying possible reseller discounts
  const invoiceItems: InvoiceItem[] = sale.items.map((item, index) => {
    let unitPrice = item.price;
    let originalPrice = item.price;
    let discountPercentage = 0;

    // If customer is reseller, apply reseller discount rate to unit price
    if (customerInfo.customerType === 'reseller' && customerInfo.resellerInfo) {
      discountPercentage = customerInfo.resellerInfo.discountRate;
      unitPrice = item.price * (1 - discountPercentage / 100);
    }

    return {
      id: (index + 1).toString(),
      productId: item.productId,
      productName: item.productName,
      description: `Subscription service - ${item.productName}`,
      quantity: item.quantity,
      unitPrice,
      originalPrice: customerInfo.customerType === 'reseller' ? originalPrice : undefined,
      discountPercentage: customerInfo.customerType === 'reseller' ? discountPercentage : undefined,
      lineTotal: unitPrice * item.quantity,
      taxable: true
    };
  });

  // Calculate subtotal differently for resellers to show original price subtotal
  const subtotal = customerInfo.customerType === 'reseller' 
    ? invoiceItems.reduce((sum, item) => sum + (item.originalPrice! * item.quantity), 0)
    : invoiceItems.reduce((sum, item) => sum + item.lineTotal, 0);

  // Calculate total discount amount applied for resellers
  const discountAmount = customerInfo.customerType === 'reseller'
    ? subtotal - invoiceItems.reduce((sum, item) => sum + item.lineTotal, 0)
    : 0;

  // Discount percentage extracted from reseller info if applicable
  const discountPercentage = customerInfo.customerType === 'reseller' && customerInfo.resellerInfo
    ? customerInfo.resellerInfo.discountRate
    : 0;

  // Taxable amount is sum of all invoice line totals after discounts
  const taxableAmount = invoiceItems.reduce((sum, item) => sum + item.lineTotal, 0);

  // Calculate tax amount based on taxable amount and provided tax rate
  const taxAmount = taxableAmount * (taxRate / 100);

  // Total amount is taxable amount plus tax
  const totalAmount = taxableAmount + taxAmount;

  // Construct the final Invoice object with all calculated fields
  const invoice: Invoice = {
    id: Date.now().toString(),  // Use timestamp as unique ID placeholder
    invoiceNumber: generateInvoiceNumber(),
    saleId,
    customerId: sale.customerId,
    customerInfo,
    items: invoiceItems,
    subtotal,
    discountAmount,
    discountPercentage,
    taxAmount,
    taxRate,
    totalAmount,
    paymentMethod: sale.paymentMethod,
    paymentTerms,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Due in 30 days
    issueDate: new Date(),
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return invoice;
};
