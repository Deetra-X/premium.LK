import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ShoppingCart, 
  Calendar,
  Package,
  Eye,
  RefreshCw,
  FileText,
  Receipt,
  ArrowLeft,
  Edit,
  Trash2,
  AlertTriangle,
  X
} from '../utils/icons'; // Use centralized imports
import { CreateSaleData, Sale } from '../types/index'; // Customer import removed - using sales only
import { formatCurrency, formatDate } from '../utils/dateUtils';
import { CreateOrderModal } from './CreateOrderModal';
import { InvoiceManagement } from './InvoiceManagement';
import { CreateInvoiceModal } from './CreateInvoiceModal';

// API functions for sales CRUD operations
const API_BASE = 'http://localhost:3001/api';

// No fallback data - we'll use only real data from the database

// No flags for API availability - we'll always use real data
const fetchSales = async (params?: Record<string, string | number | boolean>): Promise<Sale[]> => {
  try {
    console.log('Fetching sales from API...');
    const queryString = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    const response = await fetch(`${API_BASE}/sales${queryString}`);
    
    if (!response.ok) {
      throw new Error(`Sales API error: ${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Sales API did not return JSON: ${contentType}`);
    }
    
    const responseData = await response.json();
    
    // Handle different response formats
    let data: any[] = [];
    if (Array.isArray(responseData)) {
      data = responseData;
    } else if (responseData && Array.isArray(responseData.items)) {
      data = responseData.items;
    } else if (responseData && typeof responseData === 'object') {
      console.warn('Sales API returned an object instead of an array:', responseData);
      // Try to extract data from a common property, or use an empty array
      data = [];
    }
    
    console.log('Successfully loaded sales from API:', data.length);
    
    // Ensure all sales have required properties
    data = data.map((sale: Sale) => ({
      ...sale,
      paymentMethod: sale.paymentMethod || 'cash',
      status: sale.status || 'completed',
      items: Array.isArray(sale.items) ? sale.items : []
    }));
    
    return data;
  } catch (error) {
    console.error('Error fetching sales:', error);
    throw error;
  }
};

// Example update for the fetch customers function
/* 
const fetchCustomers = async () => {
  console.log("Fetching customers from API...");
  try {
    const response = await fetch("http://localhost:3001/api/customers");
    
    if (!response.ok) {
      throw new Error(`Customers API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Successfully loaded customers from API:", data.length);
    return data;
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];  // Return empty array rather than crashing
  }
};
*/

// Customer functionality removed - using sales data only



const createSale = async (saleData: CreateSaleData): Promise<Sale> => {
  try {
    console.log('Creating sale via API...');
    console.log('Sale data being sent:', saleData);

     // Ensure items array is properly formatted
    const formattedItems = (saleData.items || []).map(item => ({
      product_id: item.productId || item.product_id,
      product_name: item.productName || item.product_name,
      price: parseFloat(item.price?.toString() || '0'),
      quantity: parseInt(item.quantity?.toString() || '1'),
      email: item.email || '',
      total: parseFloat(item.price?.toString() || '0') * parseInt(item.quantity?.toString() || '1')
    }));

    const requestBody = {
      customer_id: saleData.customerId,
      customer_name: saleData.customerName,
      customer_email: saleData.customerEmail,
      customer_phone: saleData.customerPhone,
      customer_type: saleData.customerType || 'standard', // Add customer type
      items: formattedItems,
      total_amount: saleData.totalAmount || 0,
      payment_method: saleData.paymentMethod || saleData.payment_method || 'cash',
      status: saleData.status || 'completed',
      notes: saleData.notes || '',
      // Add new fields for account periods
      start_date: saleData.startDate,
      end_date: saleData.endDate,
      daysUntilRenewal: saleData.daysUntilRenewal // Add this line
    };
     console.log('Formatted request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Check if response is OK
    if (!response.ok) {
      let errorMessage = `Failed to create sale: ${response.status} ${response.statusText}`;

      try{
      // Check content type before trying to parse as JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        console.error('Server error details:', errorData);
      } else {
          const errorText = await response.text();
          console.error('Server error (non-JSON):', errorText.substring(0, 500));
          errorMessage += ` - ${errorText.substring(0, 200)}`;
      }
    } catch (parseError) {
      console.error('Could not parse error response:', parseError);
    }
    throw new Error(errorMessage);
    }
    
    // Check content type before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.error('Non-JSON response:', responseText.substring(0, 500));
      throw new Error(`Expected JSON response but got: ${contentType}`);
    }
    
    const data = await response.json();
    console.log('Sale created successfully via API:', data);
    
    // Extract the actual sale data from the response
    const actualSaleData = data.data || data;
    
    return actualSaleData as Sale;
  } catch (error: any) {
    console.error('Error creating sale:', error);
    throw error;
  }
};

const updateSale = async (order_number: string, saleData: any): Promise<Sale> => {
   try {
    // ✅ Ensure the order_number is properly encoded and not empty
    if (!order_number || order_number.trim() === '') {
      throw new Error('Order number is required for update');
    }
    
    const encodedOrderNumber = encodeURIComponent(order_number.trim());
    const url = `${API_BASE}/sales/${encodedOrderNumber}`;
    
    console.log('Updating sale via API:', order_number);
    console.log('Full URL:', url); // ✅ Debug the full URL
    console.log('Request data:', saleData); // ✅ Debug the request data
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      
      body: JSON.stringify({
        customer_name: saleData.customerName || saleData.customer_name,
        customer_email: saleData.customerEmail || saleData.customer_email,
        customer_phone: saleData.customerPhone || saleData.customer_phone,
        items: saleData.items,
        total_amount: saleData.totalAmount,
        payment_method: saleData.paymentMethod || saleData.payment_method,
        status: saleData.status,
        notes: saleData.notes
      })
    });
    console.log('Response status:', response.status);
    console.log('Response URL:', response.url);
    
    if (!response.ok) {
      // ✅ Handle HTML responses (404 pages)
      const contentType = response.headers.get('content-type');
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      if (contentType && contentType.includes('text/html')) {
        errorMessage += ' - API endpoint not found. Check if your backend server has the PUT /api/sales/:id endpoint implemented.';
      } else if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          console.error('Error parsing error response:', jsonError);
        }
      }
      
      throw new Error(errorMessage);
    }
    
    // ✅ Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected JSON response but got: ${contentType}`);
    }
    
    const data = await response.json();
    console.log('Sale updated successfully via API:', data);
    
    return data as Sale;
  } catch (error: any) {
    console.error('Error updating sale:', error);
    throw error;
  }
};

// const deleteSale = async (id: string): Promise<void> => {
//   try {
//     console.log('Deleting sale via API:', id);
    
//     const response = await fetch(`${API_BASE}/sales/${id}`, {
//       method: 'DELETE'
//     });
    
//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.error || `Failed to delete sale with ID ${id}`);
//     }
    
//     console.log('Sale deleted successfully via API');
//   } catch (error: any) {
//     console.error('Error deleting sale:', error);
//     throw error;
//   }
// };

const deleteSale = async (order_number: string): Promise<void> => {
  try {
    // Ensure the ID doesn't contain invalid characters
    const encodedOrderNumber = encodeURIComponent(order_number);
    console.log('Deleting sale via API:', encodedOrderNumber);
    
    const response = await fetch(`${API_BASE}/sales/${encodedOrderNumber}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to delete sale with ID ${order_number}`);
    }
    
    console.log('Sale deleted successfully via API');
  } catch (error: any) {
    console.error('Error deleting sale:', error);
    throw error;
  }
};

// Edit Order Modal Component
interface EditOrderModalProps {
  order: Sale;
  onClose: () => void;
  onSave: (updatedOrder: any) => void;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, onClose, onSave }) => {
  const [formData, setFormData] = useState({
     customer_name: order.customer_name || order.customerName,
    customer_email: order.customer_email || order.customerEmail,
    customer_phone: order.customer_phone || order.customerPhone,
    payment_method: order.payment_method || order.paymentMethod,
    status: order.status,
    notes: order.notes || ''
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Edit Order {order.orderNumber || order.order_number}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Customer Name</label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Customer Email</label>
              <input
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Customer Phone</label>
              <input
                type="tel"
                value={formData.customer_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value as any }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const SalesManagement: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]); // Initialize with empty array
  // const [customers, setCustomers] = useState<Customer[]>([]); // Customer data removed - using sales only
  const [loading, setLoading] = useState(true); // Start with true to show loading indicator
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'customer' | 'orderNumber'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Sale | null>(null);
  const [editingOrder, setEditingOrder] = useState<Sale | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'invoices'>('orders');
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [selectedSaleForInvoice, setSelectedSaleForInvoice] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    // Load data when component mounts
    loadData();
  }, []);

  const [apiStatus, setApiStatus] = useState<{isConnected: boolean; message?: string}>({ isConnected: false });

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('Loading sales data...');
      
      const salesData = await fetchSales({
        status: filterStatus === 'all' ? filterStatus : filterStatus,
        search: searchTerm || '',
        sortBy: sortBy === 'date' ? 'order_date' : sortBy,
        sortOrder
      });
      
      console.log(`Loaded ${salesData.length} sales`);
      setSales(salesData);
      setApiStatus({ isConnected: true });
    } catch (error) {
      console.error('Error loading data:', error);
      // Set empty arrays when there's an error
      setSales([]);
      setApiStatus({ 
        isConnected: false, 
        message: error instanceof Error ? error.message : 'Failed to connect to API'
      });
    } finally {
      setLoading(false);
    }
  };

  const retryApiConnection = async () => {
    await loadData();
  };

  // Calculate filtered sales based on current filters
  const getFilteredSales = () => {
    let filtered = sales;

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(sale => sale.status === filterStatus);
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(sale => 
        (sale.orderNumber || '').toLowerCase().includes(searchLower) ||
        (sale.customerName || '').toLowerCase().includes(searchLower) ||
        (sale.customerEmail || '').toLowerCase().includes(searchLower) ||
        ((sale.items || []).some((item: {productName?: string}) => 
          (item && item.productName) ? item.productName.toLowerCase().includes(searchLower) : false)
        )
      );
    }

    // Apply period filter
    if (filterPeriod !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (filterPeriod) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter(sale => new Date(sale.orderDate) >= startDate);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.orderDate);
          bValue = new Date(b.orderDate);
          break;
        case 'amount':
          aValue = a.totalAmount;
          bValue = b.totalAmount;
          break;
        case 'customer':
          aValue = a.customerName.toLowerCase();
          bValue = b.customerName.toLowerCase();
          break;
        case 'orderNumber':
          aValue = a.order_number;
          bValue = b.order_number;
          break;
        default:
          aValue = new Date(a.createdAt || a.orderDate);
          bValue = new Date(b.createdAt || b.orderDate);
      }

      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    return filtered;
  };

  const filteredSales = getFilteredSales();

  const handleCreateOrder = async (orderData: any) => {
    try {
      console.log('Creating order with data:', orderData);

         const formattedItems = (orderData.items || []).map((item: any) => ({
          productId: item.productId,
          productName: item.productName,
          price: parseFloat(item.price?.toString() || '0'),
          quantity: parseInt(item.quantity?.toString() || '1'),
          email: item.email || ''
    }));
      
      const newSale = await createSale({
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        customerType: orderData.customerType, // Add customer type
        items: formattedItems,
        totalAmount: orderData.totalAmount,
        paymentMethod: orderData.paymentMethod,
        status: 'completed',
        startDate: orderData.startDate,
        endDate: orderData.endDate,
        daysUntilRenewal: orderData.daysUntilRenewal // Add this mapping
      });
      
      console.log('Order created successfully:', newSale);
      
      // Ensure newSale has the expected structure - cast to any to handle dynamic properties
      const rawSale = newSale as any;
      const saleToAdd = {
        ...newSale,
        items: newSale.items || orderData.items || [],
        orderNumber: newSale.order_number || rawSale.order_number || `#${Math.floor(10000 + Math.random() * 90000)}`,
        totalAmount: newSale.totalAmount || rawSale.total_amount || orderData.totalAmount || 0,
        customerName: newSale.customerName || rawSale.customer_name || orderData.customerName,
        customerEmail: newSale.customerEmail || rawSale.customer_email || orderData.customerEmail,
        customerPhone: newSale.customerPhone || rawSale.customer_phone || orderData.customerPhone,
        paymentMethod: newSale.paymentMethod || rawSale.payment_method || orderData.paymentMethod || 'cash',
        orderDate: newSale.orderDate || rawSale.order_date || new Date().toISOString(),
        createdAt: newSale.createdAt || rawSale.created_at || new Date().toISOString(),
        id: newSale.order_number || Math.random().toString(36).substr(2, 9)
      };
      
      setSales(prev => [saleToAdd, ...prev]);
      
      // Create account orders for each account in the items (if dates are provided)
      if (orderData.startDate && orderData.endDate && saleToAdd.id) {
        try {
          // Import AccountOrders module dynamically to avoid circular dependencies
          const AccountOrdersAPI = await import('../api/AccountOrders');
          
          // Process each item in the order to create account orders
          for (const item of orderData.items) {
            await AccountOrdersAPI.createAccountOrder({
              sales_id: saleToAdd.id,
              account_id: item.productId,
              start_date: orderData.startDate,
              end_date: orderData.endDate,
              quantity: item.quantity,
              unit_price: item.price
            });
          }
          console.log('Account orders created successfully');
          
          // Show success message with account period info
          alert(`Order #${saleToAdd.orderNumber} has been successfully created with account period tracking from ${orderData.startDate} to ${orderData.endDate}!`);
        } catch (accountOrderError: any) {
          console.error('Error creating account orders:', accountOrderError);
          
          // Provide specific error messages based on the error type
          let errorMessage = 'Unknown error occurred while setting up account periods.';
          
          if (accountOrderError?.message?.includes('endpoint not found')) {
            errorMessage = 'Account period tracking is not available yet. The server needs to implement the account-orders API endpoint.';
          } else if (accountOrderError?.message?.includes('<!DOCTYPE')) {
            errorMessage = 'Server returned an HTML page instead of API response. The account-orders endpoint may not exist.';
          } else if (accountOrderError?.message) {
            errorMessage = accountOrderError.message;
          }
          
          alert(`Order #${saleToAdd.orderNumber} was saved successfully, but account period tracking failed: ${errorMessage}`);
        }
      } else {
        // Show success message without account period info
        alert(`Order #${saleToAdd.orderNumber} has been successfully created and saved to the database!`);
      }
      
      setShowCreateOrder(false);
    } catch (error: any) {
      console.error('Error creating order:', error);
      alert(`Failed to create order: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleEditOrder = async (updatedData: any) => {
    if (!editingOrder) return;
    
    try {

      const orderId = editingOrder.order_number || (editingOrder as any).order_number;
      console.log('Updating order:', editingOrder.order_number, 'with data:', updatedData);
      
      

       if (!orderId) {
      throw new Error('No valid order ID found');
    }

      const updated = await updateSale(orderId, updatedData);
      console.log('Order updated successfully:', updated);
      
      setSales(prev => prev.map(sale => 
        sale.order_number === orderId ? { ...sale, ...updated } : sale
      ));
      setEditingOrder(null);
    } catch (error) {
      console.error('Error updating order:', error);
      alert(`Failed to update order: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleDeleteOrder = async (order_number: string) => {
    try {
      console.log('Deleting order:', order_number);
      
      await deleteSale(order_number);
      console.log('Order deleted successfully');
      
      setSales(prev => prev.filter(sale => sale.order_number !== order_number));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting order:', error);
      alert(`Failed to delete order: ${error.message}`);
    }
  };

  const handleReorder = (sale: Sale) => {
    setShowCreateOrder(true);
  };

  const getStatusColor = (status: Sale['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getPaymentMethodColor = (method: Sale['paymentMethod']) => {
    switch (method) {
      case 'cash':
        return 'bg-green-500/20 text-green-300';
      case 'bank_transfer':
        return 'bg-purple-500/20 text-purple-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  // If invoices tab is active, show the invoice management component
  if (activeTab === 'invoices') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('orders')}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Sales Management
          </button>
        </div>
        <InvoiceManagement />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
          Loading sales data...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Sales Management</h1>
          <p className="text-gray-400 mt-2">Process new orders and manage sales records</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateOrder(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
          >
            <Plus size={20} />
            Create New Order
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'orders' 
                ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700/50' 
                : 'text-gray-400 hover:text-white hover:bg-slate-700/30'
            }`}
          >
            <ShoppingCart size={16} />
            Order History ({sales.length})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'invoices' 
                ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700/50' 
                : 'text-gray-400 hover:text-white hover:bg-slate-700/30'
            }`}
          >
            <FileText size={16} />
            Invoice Management
          </button>
        </div>

        {/* Search and Filter Controls */}
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer, order number, or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <div className="relative">
                <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value as any)}
                  className="pl-10 pr-8 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[140px]"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[120px]"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[140px]"
              >
                <option value="date">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
                <option value="customer">Sort by Customer</option>
                <option value="orderNumber">Sort by Order #</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white hover:bg-slate-600 transition-colors"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'desc' ? '↓' : '↑'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Order History</h2>
            <div className="text-sm text-gray-400">
              {filteredSales.length} order{filteredSales.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-700">
          {filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No orders found</h3>
              <p className="text-gray-400">
                {searchTerm || filterStatus !== 'all' ? 
                  'Try adjusting your search or filter criteria' :
                  'Create your first order to get started'
                }
              </p>
            </div>
          ) : (
            filteredSales.map((sale) => (
              <div key={sale.order_number} className="p-6 hover:bg-slate-700/50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  {/* Order Header */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {sale.order_number}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(sale.status || 'pending')}`}>
                        {sale.status ? (sale.status.charAt(0).toUpperCase() + sale.status.slice(1)) : 'Pending'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-gray-300">{formatDate(sale.order_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-gray-400" />
                        <span className="text-gray-300">{sale.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${getPaymentMethodColor(sale.payment_method || 'unknown')}`}>
                          {(sale.payment_method ? sale.payment_method.replace('_', ' ') : 'unknown').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Total and Actions */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-400">
                        {formatCurrency(sale.total_amount)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {(sale.items || []).length} item{(sale.items || []).length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedOrder(selectedOrder?.id === sale.order_number ? null : sale)}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-slate-600 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      {/* // Edit, Reorder, Create Invoice, Delete buttons */}
                      <button
                        onClick={() => setEditingOrder(sale)}
                        className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-slate-600 rounded-lg transition-colors"
                        title="Edit Order"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleReorder(sale.order_number)}
                        className="p-2 text-green-400 hover:text-green-300 hover:bg-slate-600 rounded-lg transition-colors"
                        title="Reorder"
                      >
                        <RefreshCw size={18} />
                      </button>
                      <button
                        onClick={() => { setSelectedSaleForInvoice(sale.order_number); setShowCreateInvoice(true); }}
                        className="p-2 text-purple-400 hover:text-purple-300 hover:bg-slate-600 rounded-lg transition-colors"
                        title="Create Invoice"
                      >
                        <Receipt size={18} />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(sale.order_number)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-600 rounded-lg transition-colors"
                        title="Delete Order"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Order Items (Expandable) */}
                {selectedOrder?.order_number === sale.order_number && (
                  <div className="mt-4 pt-4 border-t border-slate-600">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Order Items:</h4>
                    <div className="space-y-2">
                      {(sale.items || []).map((item: {productName?: string, price?: number, quantity?: number}, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-600 rounded-lg">
                          <div>
                            <p className="text-white font-medium">{item.productName || item.name || 'Unknown Product'}</p>
                            <p className="text-gray-400 text-sm">
                              Quantity: {item.quantity || 1} × {formatCurrency(item.price || 0)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold">
                              {formatCurrency((item.price || 0) * (item.quantity || 1))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 p-3 bg-slate-600 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Customer Contact:</span>
                        <div className="text-right">
                          <p className="text-white">{sale.customer_email}</p>
                          <p className="text-gray-400 text-sm">{sale.payment_method || 'N/A'}</p>
                        </div>
                      </div>
                      {sale.notes && (
                        <div className="mt-2 pt-2 border-t border-slate-500">
                          <span className="text-gray-300">Notes: </span>
                          <span className="text-white">{sale.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-red-400" />
              <h3 className="text-lg font-semibold text-white">Confirm Deletion</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this order? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteOrder(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      Edit Order Modal

      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSave={handleEditOrder}
        />
      )}
    
      {/* Create Order Modal */}
      {showCreateOrder && (
        <CreateOrderModal
          onClose={() => setShowCreateOrder(false)}
          onCreateOrder={handleCreateOrder}
          existingCustomers={[]} /* Customers functionality removed - using empty array */
        />
      )}

      {/* Create Invoice Modal */}
      {showCreateInvoice && (
        <CreateInvoiceModal
          onClose={() => {
            setShowCreateInvoice(false);
            setSelectedSaleForInvoice('');
          }}
          onCreate={() => {
            setShowCreateInvoice(false);
            setSelectedSaleForInvoice('');
            setActiveTab('invoices');
          }}
          prefilledSaleId={selectedSaleForInvoice}
        />
      )}

      {/* No debug info in production version */}

      {/* API Status Indicator */}
      <div className={`p-3 rounded-lg border ${
        apiStatus.isConnected ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              apiStatus.isConnected ? 'bg-green-500' : 'bg-orange-500'
            }`}></div>
            <span className={apiStatus.isConnected ? 'text-green-700' : 'text-orange-700'}>
              {apiStatus.isConnected ? 
                `API Connected: ${filteredSales.length} orders` : 
                `Database Connection Error: No sales data available`
              }
            </span>
          </div>
          {!apiStatus.isConnected && (
            <button
              onClick={retryApiConnection}
              className="text-blue-600 hover:text-blue-700 text-sm underline font-medium"
            >
              Retry Connection
            </button>
          )}
        </div>
        {!apiStatus.isConnected && apiStatus.message && (
          <p className="text-xs text-orange-600 mt-1">
            {apiStatus.message}
          </p>
        )}
      </div>
    </div>
  );
};