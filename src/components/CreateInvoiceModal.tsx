import React, { useState, useEffect } from 'react';
import { Invoice, Customer, Sale } from '../types/index';
import { createInvoiceFromSale } from '../data/invoiceData';
import { getSalesData } from '../data/salesData';
import { formatCurrency } from '../utils/dateUtils';
import {
  X,
  Save,
  User,
  Building,
  FileText,
  Search
} from 'lucide-react';

interface CreateInvoiceModalProps {
  onClose: () => void;
  onCreate: (invoice: Invoice) => void;
  prefilledSaleId?: string;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  onClose,
  onCreate,
  prefilledSaleId
}) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [selectedSaleId, setSelectedSaleId] = useState(prefilledSaleId || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [customerType, setCustomerType] = useState<'standard' | 'reseller'>('standard');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    taxId: '',
    customerType: 'standard' as 'standard' | 'reseller',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    resellerInfo: {
      resellerId: '',
      discountRate: 20, // Default reseller discount
      minimumOrderQuantity: 1,
      specialTerms: ''
    },
    subscriptionDetails: {
    productName: '',
    discountRate: 0,
    quantity: 1,
    startDate: '',
    endDate: ''
  }
  });
  const [paymentTerms, setPaymentTerms] = useState('Payment due within 30 days');
  const [taxRate, setTaxRate] = useState(15);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getSalesData();
        setSales(data.sales);
        setCustomers(data.customers);
        
        if (prefilledSaleId) {
          const sale = data.sales.find(s => s.id === prefilledSaleId);
          if (sale) {
            handleSaleSelect(sale);
          }
        }
      } catch (error) {
        console.error('Error loading sales data:', error);
        setErrors({ general: 'Failed to load sales data' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [prefilledSaleId]);

  // Filter sales based on search term
  const filteredSales = sales.filter(sale => {
    const searchLower = searchTerm.toLowerCase();
    const orderNumber = (sale.order_number || sale.orderNumber || '').toLowerCase();
    const customerName = (sale.customer_name || sale.customerName || '').toLowerCase();
    const customerEmail = (sale.customer_email || sale.customerEmail || '').toLowerCase();

    return orderNumber.includes(searchLower) ||
         customerName.includes(searchLower) ||
         customerEmail.includes(searchLower);


});

  const selectedSale = sales.find(sale => sale.id === selectedSaleId);

  const handleSaleSelect = (sale: Sale) => {
    setSelectedSaleId(sale.id);
    setSearchTerm(`${sale.order_number || sale.orderNumber || 'Unknown Order'} - ${sale.customer_name || sale.customerName || 'Unknown Customer'}`);
    setShowDropdown(false);
    
    // Find customer data to fill billing address
    const customer = customers.find(c => c.id === sale.customerId);
    // Get the first item from the sale for subscription details
    const firstItem = sale.items && sale.items.length > 0 ? sale.items[0] : null;
    
    // Auto-fill all customer information
    setCustomerInfo(prev => ({
      ...prev,
      name: sale.customer_name || sale.customerName || customer?.name || '',
      email: sale.customer_email || sale.customerEmail || customer?.email || '',
      phone: sale.customer_phone || sale.customerPhone || customer?.phone || '',
      taxId: customer?.customerType === 'reseller' ? 'VAT-' + (sale.customerId.slice(-8).toUpperCase() || 'DEFAULT') : '',
      customerType: customer?.customerType || 'standard',
      subscriptionDetails: {
        productName: firstItem?.name || firstItem?.product_name || '',
        discountRate: sale.discount_percentage || 0,
        quantity: firstItem?.quantity || 1,
        startDate: new Date().toISOString().split('T')[0], // Today's date
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0] // One month from today
      }
    }));
    // Set customer type based on customer data
    if (customer?.customerType) {
      setCustomerType(customer.customerType);
      handleCustomerTypeChange(customer.customerType);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowDropdown(true);
    if (!value) {
      setSelectedSaleId('');
      // Reset form when clearing search
      setCustomerInfo({
        name: '',
        email: '',
        phone: '',
        taxId: '',
        customerType: 'standard',
        billingAddress: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        subscriptionDetails: {
        productName: '',
        discountRate: 0,
        quantity: 1,
        startDate: '',
        endDate: ''
  },
        resellerInfo: {
          resellerId: '',
          discountRate: 10,
          minimumOrderQuantity: 1,
          specialTerms: ''
        }
      });
    }
  };

  const handleCustomerTypeChange = (type: 'standard' | 'reseller') => {
    setCustomerType(type);
    setCustomerInfo(prev => ({
      ...prev,
      customerType: type
    }));

    if (type === 'reseller') {
      setPaymentTerms('Net 45 days - Authorized Reseller Terms');
      // Auto-generate reseller ID if not present
      if (!customerInfo.resellerInfo.resellerId && selectedSale && selectedSale.customerId) {
        setCustomerInfo(prev => ({
          ...prev,
          resellerInfo: {
            ...prev.resellerInfo,
            resellerId: 'RSL-' + selectedSale.customerId.toString().slice(-6).toUpperCase()
          }
        }));
      } else if (!customerInfo.resellerInfo.resellerId && !selectedSale) {
        // Generate a random reseller ID if no sale is selected
        const randomId = Math.random().toString(36).substr(2, 6).toUpperCase();
        setCustomerInfo(prev => ({
          ...prev,
          resellerInfo: {
            ...prev.resellerInfo,
            resellerId: 'RSL-' + randomId
          }
        }));
      }
    } else {
      setPaymentTerms('Payment due within 30 days');
    }
  };

  // ... (keep all your existing validation, loading, error states, and submit logic) ...

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedSaleId) {
      newErrors.saleId = 'Please select a sale to create invoice from';
    }
    if (!customerInfo.name.trim()) {
      newErrors.customerName = 'Customer name is required';
    }
    if (!customerInfo.email.trim()) {
      newErrors.customerEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      newErrors.customerEmail = 'Please enter a valid email address';
    }
    if (!customerInfo.phone.trim()) {
      newErrors.customerPhone = 'Phone number is required';
    }
    // Subscription validation
  if (!customerInfo.subscriptionDetails.productName.trim()) {
    newErrors.productName = 'Product name is required';
  }
  if (customerInfo.subscriptionDetails.quantity < 1) {
    newErrors.quantity = 'Quantity must be at least 1';
  }
  if (!customerInfo.subscriptionDetails.startDate) {
    newErrors.startDate = 'Start date is required';
  }
  if (!customerInfo.subscriptionDetails.endDate) {
    newErrors.endDate = 'End date is required';
  }
  if (customerInfo.subscriptionDetails.startDate && customerInfo.subscriptionDetails.endDate) {
    if (new Date(customerInfo.subscriptionDetails.endDate) <= new Date(customerInfo.subscriptionDetails.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
  }

    if (customerType === 'reseller') {
      if (!customerInfo.resellerInfo.resellerId.trim()) {
        newErrors.resellerId = 'Reseller ID is required';
      }
      if (customerInfo.resellerInfo.discountRate < 0 || customerInfo.resellerInfo.discountRate > 50) {
        newErrors.discountRate = 'Discount rate must be between 0% and 50%';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white">Loading sales data...</p>
        </div>
      </div>
    );
  }

  // Error and no sales states (keep your existing ones)
  if (errors.general) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Error</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="text-center">
            <FileText size={48} className="text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Sales Data Not Available</h3>
            <p className="text-gray-400 mb-4">Unable to load sales data. Please check your data sources.</p>
            <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">No Sales Available</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="text-center">
            <FileText size={48} className="text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Sales to Invoice</h3>
            <p className="text-gray-400 mb-4">You need to create some sales before generating invoices.</p>
            <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const invoice = await createInvoiceFromSale(
        selectedSaleId,
        customerInfo,
        paymentTerms,
        taxRate
      );

      if (notes.trim()) {
        invoice.notes = notes.trim();
      }

      onCreate(invoice);
      onClose();
    } catch (error) {
      console.error('Error creating invoice:', error);
      setErrors({ general: 'Failed to create invoice. Please try again.' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">Create Invoice</h2>
              <p className="text-gray-400 text-sm">Generate a detailed invoice from sale data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-4 rounded-lg">
              {errors.general}
            </div>
          )}

          {/* Sale Selection - Searchable */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Sale to Invoice *
            </label>
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                className={`w-full pl-10 pr-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.saleId ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="Search by order number, customer name..."
              />
              
              {/* Dropdown */}
              {showDropdown && filteredSales.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg max-h-60 overflow-y-auto">
                  {filteredSales.map(sale => (
                    <div
                      key={sale.id}
                      onClick={() => handleSaleSelect(sale)}
                      className="p-3 hover:bg-slate-600 cursor-pointer border-b border-slate-600 last:border-b-0"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-medium">{sale.order_number || 'Unknown Order'}</p>
                          <p className="text-gray-400 text-sm">{sale.customer_name || 'Unknown Customer'}</p>
                          <p className="text-gray-500 text-xs">{sale.customer_email || 'No email'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-medium">{formatCurrency(sale.total_amount || 0)}</p>
                          <p className="text-gray-400 text-xs">{sale.items?.length || 0} items</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {errors.saleId && (
              <p className="text-red-400 text-sm mt-1">{errors.saleId}</p>
            )}
          </div>

          {/* Customer Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Customer Type *
            </label>
            <div className="flex gap-4">
              <label className={`flex items-center gap-2 p-4 rounded-lg cursor-pointer transition-colors ${
                customerType === 'standard' ? 'bg-blue-600/20 border-2 border-blue-500' : 'bg-slate-700 hover:bg-slate-600'
              }`}>
                <input
                  type="radio"
                  name="customerType"
                  value="standard"
                  checked={customerType === 'standard'}
                  onChange={() => handleCustomerTypeChange('standard')}
                  className="w-4 h-4 text-blue-600 bg-slate-600 border-slate-500 focus:ring-blue-500"
                />
                <User size={20} className="text-blue-400" />
                <div>
                  <span className="text-white font-medium">Standard Customer</span>
                  <p className="text-gray-400 text-sm">Regular retail pricing</p>
                </div>
              </label>
              <label className={`flex items-center gap-2 p-4 rounded-lg cursor-pointer transition-colors ${
                customerType === 'reseller' ? 'bg-purple-600/20 border-2 border-purple-500' : 'bg-slate-700 hover:bg-slate-600'
              }`}>
                <input
                  type="radio"
                  name="customerType"
                  value="reseller"
                  checked={customerType === 'reseller'}
                  onChange={() => handleCustomerTypeChange('reseller')}
                  className="w-4 h-4 text-blue-600 bg-slate-600 border-slate-500 focus:ring-blue-500"
                />
                <Building size={20} className="text-purple-400" />
                <div>
                  <span className="text-white font-medium">Authorized Reseller</span>
                  <p className="text-gray-400 text-sm">Wholesale pricing with discounts</p>
                </div>
              </label>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 bg-slate-600 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.customerName ? 'border-red-500' : 'border-slate-500'
                  }`}
                  placeholder="John Smith or Company Name"
                />
                {errors.customerName && (
                  <p className="text-red-400 text-sm mt-1">{errors.customer_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full px-3 py-2 bg-slate-600 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.customerEmail ? 'border-red-500' : 'border-slate-500'
                  }`}
                  placeholder="customer@example.com"
                />
                {errors.customerEmail && (
                  <p className="text-red-400 text-sm mt-1">{errors.customer_email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className={`w-full px-3 py-2 bg-slate-600 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.customerPhone ? 'border-red-500' : 'border-slate-500'
                  }`}
                  placeholder="+94771234567"
                />
                {errors.customerPhone && (
                  <p className="text-red-400 text-sm mt-1">{errors.customer_phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tax ID {customerType === 'reseller' ? '*' : '(Optional)'}
                </label>
                <input
                  type="text"
                  value={customerInfo.taxId}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, taxId: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VAT-123456789"
                />
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Subscription Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={customerInfo.subscriptionDetails.productName}
                  onChange={(e) => setCustomerInfo(prev => ({ 
                    ...prev, 
                    subscriptionDetails: { ...prev.subscriptionDetails, productName: e.target.value }
                  }))}
                  className={`w-full px-3 py-2 bg-slate-600 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.productName ? 'border-red-500' : 'border-slate-500'
                  }`}
                  placeholder="Spotify Premium Subscription"
                />
                {errors.productName && (
                  <p className="text-red-400 text-sm mt-1">{errors.productName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Discount Rate *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={customerInfo.subscriptionDetails.discountRate}
                  onChange={(e) => setCustomerInfo(prev => ({ 
                    ...prev, 
                    subscriptionDetails: { ...prev.subscriptionDetails, discountRate: parseFloat(e.target.value) || 0 }
                  }))}
                  className={`w-full px-3 py-2 bg-slate-600 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.discountRate ? 'border-red-500' : 'border-slate-500'
                  }`}
                  placeholder="Discount Rate"
                />
                {errors.discountRate && (
                  <p className="text-red-400 text-sm mt-1">{errors.discountRate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Item Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={customerInfo.subscriptionDetails.quantity}
                  onChange={(e) => setCustomerInfo(prev => ({ 
                    ...prev, 
                     subscriptionDetails: { ...prev.subscriptionDetails, quantity: parseInt(e.target.value) || 1 }
                  }))}
                  className={`w-full px-3 py-2 bg-slate-600 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.quantity ? 'border-red-500' : 'border-slate-500'
                  }`}
                  placeholder="Item Quantity"
                />
                {errors.quantity && (
                  <p className="text-red-400 text-sm mt-1">{errors.quantity}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subscription Start Date *
                </label>
                <input
                  type="date"
                  value={customerInfo.subscriptionDetails.startDate}
                  onChange={(e) => setCustomerInfo(prev => ({ 
                    ...prev, 
                    subscriptionDetails: { ...prev.subscriptionDetails, startDate: e.target.value }
                  }))}
                  className={`w-full px-3 py-2 bg-slate-600 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.startDate ? 'border-red-500' : 'border-slate-500'
                  }`}
                  placeholder="2000-01-01"
                />
                {errors.startDate && (
                  <p className="text-red-400 text-sm mt-1">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subscription End date *
                </label>
                <input
                  type="date"
                  value={customerInfo.subscriptionDetails.endDate}
                  onChange={(e) => setCustomerInfo(prev => ({ 
                    ...prev, 
                     subscriptionDetails: { ...prev.subscriptionDetails, endDate: e.target.value }
                  }))}
                  className={`w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" ${
                    errors.endDate ? 'border-red-500' : 'border-slate-500'
                }`}
                  placeholder="2001-06-01"
                />
                {errors.endDate && (
                  <p className="text-red-400 text-sm mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Reseller Information */}
          {customerType === 'reseller' && (
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Building size={20} className="text-purple-400" />
                Reseller Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Reseller ID *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.resellerInfo.resellerId}
                    onChange={(e) => setCustomerInfo(prev => ({ 
                      ...prev, 
                      resellerInfo: { ...prev.resellerInfo, resellerId: e.target.value }
                    }))}
                    className={`w-full px-3 py-2 bg-slate-600 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.resellerId ? 'border-red-500' : 'border-slate-500'
                    }`}
                    placeholder="RSL-001"
                  />
                  {errors.resellerId && (
                    <p className="text-red-400 text-sm mt-1">{errors.resellerId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Discount Rate (%) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={customerInfo.resellerInfo.discountRate}
                    onChange={(e) => setCustomerInfo(prev => ({ 
                      ...prev, 
                      resellerInfo: { ...prev.resellerInfo, discountRate: parseFloat(e.target.value) || 0 }
                    }))}
                    className={`w-full px-3 py-2 bg-slate-600 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.discountRate ? 'border-red-500' : 'border-slate-500'
                    }`}
                    placeholder="20"
                  />
                  {errors.discountRate && (
                    <p className="text-red-400 text-sm mt-1">{errors.discountRate}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Additional Options */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Additional Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Payment due within 30 days"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="15"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Any additional notes for this invoice..."
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              <Save size={16} />
              Create Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};