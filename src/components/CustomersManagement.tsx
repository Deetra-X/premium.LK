import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  ShoppingCart,
  TrendingUp,
  Package,
  Eye,
  UserPlus,
  Star,
  Clock
} from 'lucide-react';
import { Customer, Sale } from '../types/index';
import { formatCurrency, formatDate } from '../utils/dateUtils';
import { CustomerProfileModal } from './CustomerProfileModal';
import { CreateOrderModal } from './CreateOrderModal';

export const CustomersManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'totalSpent' | 'totalOrders' | 'lastOrder'>('totalSpent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<'all' | 'high_value' | 'frequent' | 'recent'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [reorderItems, setReorderItems] = useState<any[]>([]);

  // useEffect(() => {
  //   const loadData = async () => {
  //     const salesData = await getSalesData();
  //     setCustomers(salesData.customers);
  //     setSales(salesData.sales);
  //   };
  //   loadData();
  // }, []);

  
    useEffect(() => {
               // Helper function to extract preferred products from sales data
  const getPreferredProductsFromSales = (customerEmail: string, salesData: any[]): string[] => {
    const customerSales = salesData.filter(sale => sale.customer_email === customerEmail);
    const productCounts: { [key: string]: number } = {};

    customerSales.forEach(sale => {
      if (sale.items) {
        try {
          const items = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items;
          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              const productName = item.productName || item.name || item.product_name;
              if (productName) {
                productCounts[productName] = (productCounts[productName] || 0) + (item.quantity || 1);
              }
            });
          }
        } catch (e) {
          console.warn('Error parsing items for customer:', customerEmail, e);
        }
      }
    });

    return Object.entries(productCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([product]) => product);
  };

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch real data from your API endpoints
        const [customersResponse, salesResponse] = await Promise.all([
          fetch('http://localhost:3001/api/customers'),
          fetch('http://localhost:3001/api/sales')
        ]);

        if (!customersResponse.ok || !salesResponse.ok) {
          throw new Error('Failed to fetch data from API');
        }

        const customersData = await customersResponse.json();
        const salesData = await salesResponse.json();

        // Transform API data to match frontend Customer interface
        const transformedCustomers: Customer[] = customersData.map((apiCustomer: any) => ({
          id: `${apiCustomer.customer_email}`, // Use email as unique ID
          name: apiCustomer.customer_name || '',
          email: apiCustomer.customer_email || '',
          phone: apiCustomer.customer_phone || '',
          totalSpent: parseFloat(apiCustomer.total_spent) || 0,
          totalOrders: parseInt(apiCustomer.total_orders) || 0,
          customerType: apiCustomer.customer_type === 'reseller' ? 'reseller' : 'standard',
          createdAt: apiCustomer.first_order_date ? new Date(apiCustomer.first_order_date) : new Date(),
          lastOrderDate: apiCustomer.last_order_date ? new Date(apiCustomer.last_order_date) : null,
          preferredProducts: getPreferredProductsFromSales(apiCustomer.customer_email, salesData)
        }));


  // Transform sales data to match frontend Sale interface
  const transformedSales: Sale[] = salesData.map((apiSale: any) => ({
          id: apiSale.id?.toString() || Date.now().toString(),
          orderNumber: apiSale.order_number || `ORD-${Date.now()}`,
          customerId: apiSale.customer_email, // Match with customer ID
          customerName: apiSale.customer_name || '',
          customerEmail: apiSale.customer_email || '',
          customerPhone: apiSale.customer_phone || '',
          items: Array.isArray(apiSale.items) ? apiSale.items : [],
          totalAmount: parseFloat(apiSale.total_amount) || 0,
          paymentMethod: apiSale.payment_method || 'cash',
          orderDate: new Date(apiSale.order_date),
          status: apiSale.status || 'completed'
        }));

        setCustomers(transformedCustomers);
        setSales(transformedSales);
        setError(null);
        
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load customer data. Using fallback data.');
        
        // Fallback to mock data if API fails
        try {
          const { getSalesData } = await import('../data/salesData');
          const fallbackData = await getSalesData();
          setCustomers(fallbackData.customers);
          setSales(fallbackData.sales);
        } catch (fallbackError) {
          console.error('Fallback data also failed:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Function to automatically create or update customer profile
  const createOrUpdateCustomerProfile = async (saleData: any) => {
    const existingCustomer = customers.find(c => c.email === saleData.customerEmail);
    
    if (existingCustomer) {
      // Update existing customer
      const updatedCustomer: Customer = {
        ...existingCustomer,
        totalSpent: existingCustomer.totalSpent + saleData.totalAmount,
        totalOrders: existingCustomer.totalOrders + 1,
        lastOrderDate: new Date(),
        preferredProducts: updatePreferredProducts(existingCustomer.preferredProducts || [], saleData.items)
      };
      
      setCustomers(prev => prev.map(c => c.id === existingCustomer.id ? updatedCustomer : c));
    } else {
      // Create new customer profile
      const newCustomer: Customer = {
        id: Date.now().toString(),
        name: saleData.customerName,
        email: saleData.customerEmail,
        phone: saleData.customerPhone,
        totalSpent: saleData.totalAmount,
        totalOrders: 1,
        createdAt: new Date(),
        lastOrderDate: new Date(),
        preferredProducts: saleData.items.map((item: any) => item.productName),
        customerType: 'standard'
      };
      
      setCustomers(prev => [newCustomer, ...prev]);
    }
    
    // Add the sale to sales data
    const newSale: Sale = {
      id: Date.now().toString(),
      orderNumber: `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      customerId: existingCustomer?.id || Date.now().toString(),
      customerName: saleData.customerName,
      customerEmail: saleData.customerEmail,
      customerPhone: saleData.customerPhone,
      items: saleData.items,
      totalAmount: saleData.totalAmount,
      paymentMethod: saleData.paymentMethod,
      orderDate: new Date(),
      status: 'completed'
    };
    
    setSales(prev => [newSale, ...prev]);
  };

  const updatePreferredProducts = (currentProducts: string[], newItems: any[]): string[] => {
    const newProductNames = newItems.map(item => item.productName);
    const combined = [...currentProducts, ...newProductNames];
    
    // Count frequency and return top 5 most frequent products
    const frequency = combined.reduce((acc, product) => {
      acc[product] = (acc[product] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([product]) => product);
  };

  // const getFilteredCustomers = () => {
  //   let filtered = customers;

  //   // Apply search filter
  //   if (searchTerm) {
  //     filtered = filtered.filter(customer =>
  //       customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       customer.phone.includes(searchTerm)
  //     );
  //   }

  const getFilteredCustomers = () => {
  let filtered = customers;
  
  console.log('Search Debug:', {
    searchTerm,
    totalCustomers: customers.length,
    sampleCustomer: customers[0],
    searchTermLength: searchTerm.length
  });

  // Apply search filter
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase().trim();
    console.log('Searching for:', searchLower);
    
    filtered = filtered.filter(customer => {
      const nameMatch = customer.name?.toLowerCase().includes(searchLower);
      const emailMatch = customer.email?.toLowerCase().includes(searchLower);
      const phoneMatch = customer.phone?.includes(searchTerm);
      
      const matches = nameMatch || emailMatch || phoneMatch;
      
      if (matches) {
        console.log('Match found:', {
          customer: customer.name,
          nameMatch,
          emailMatch,
          phoneMatch
        });
      }
      
      return matches;
    });
    
    console.log('Filtered results:', filtered.length);
  }


    // // Apply category filter
    // switch (filterBy) {
    //   case 'high_value':
    //     filtered = filtered.filter(customer => customer.totalSpent >= 5000);
    //     break;
    //   case 'frequent':
    //     filtered = filtered.filter(customer => customer.totalOrders >= 3);
    //     break;
    //   case 'recent':
    //     const thirtyDaysAgo = new Date();
    //     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    //     filtered = filtered.filter(customer => 
    //       customer.lastOrderDate && customer.lastOrderDate >= thirtyDaysAgo
    //     );
    //     break;
    // }
      // Apply category filter
  switch (filterBy) {
    case 'high_value':
      filtered = filtered.filter(customer => customer.totalSpent >= 5000);
      break;
    case 'frequent':
      filtered = filtered.filter(customer => customer.totalOrders >= 3);
      break;
    case 'recent':
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(customer => 
        customer.lastOrderDate && customer.lastOrderDate >= thirtyDaysAgo
      );
      break;
  }

    // Apply sorting
     return filtered.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'totalSpent':
        comparison = a.totalSpent - b.totalSpent;
        break;
      case 'totalOrders':
        comparison = a.totalOrders - b.totalOrders;
        break;
      case 'lastOrder':
        const aDate = a.lastOrderDate?.getTime() || 0;
        const bDate = b.lastOrderDate?.getTime() || 0;
        comparison = aDate - bDate;
        break;
    }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  };

  const getCustomerSales = (customerId: string): Sale[] => {
    return sales.filter(sale => sale.customerEmail === customerId || sale.customerId === customerId);
  };

  const getCustomerTier = (customer: Customer): { tier: string; color: string; icon: any } => {
    if (customer.totalSpent >= 10000) {
      return { tier: 'Platinum', color: 'text-purple-400', icon: Star };
    } else if (customer.totalSpent >= 5000) {
      return { tier: 'Gold', color: 'text-yellow-400', icon: Star };
    } else if (customer.totalSpent >= 2000) {
      return { tier: 'Silver', color: 'text-gray-400', icon: Star };
    } else {
      return { tier: 'Bronze', color: 'text-orange-400', icon: User };
    }
  };

  const getDaysSinceLastOrder = (lastOrderDate?: Date): number => {
    if (!lastOrderDate) return -1;
    const now = new Date();
    const diffTime = now.getTime() - lastOrderDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleViewProfile = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowProfileModal(true);
  };

  const handleReorder = (items: any[]) => {
    setReorderItems(items);
    setShowCreateOrder(true);
    setShowProfileModal(false);
  };

  const handleCreateOrder = (orderData: any) => {
    createOrUpdateCustomerProfile(orderData);
    setShowCreateOrder(false);
    setReorderItems([]);
  };

  const filteredCustomers = getFilteredCustomers();

  // Calculate summary metrics
  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
  const averageSpending = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
  const activeCustomers = customers.filter(customer => {
    const daysSince = getDaysSinceLastOrder(customer.lastOrderDate);
    return daysSince >= 0 && daysSince <= 30;
  }).length;

   if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-lg">Loading customers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 mb-6">
        <div className="text-yellow-400 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Customer Management</h1>
          <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">View and manage customer profiles and purchase history</p>
        </div>
        {/* <button
          onClick={() => setShowCreateOrder(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
        >
          <UserPlus size={20} />
          New Order
        </button> */}
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-slate-800 rounded-lg p-3 sm:p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-400">Total Customers</p>
              <p className="text-lg sm:text-2xl font-bold text-white mt-1 sm:mt-2">{totalCustomers}</p>
            </div>
            <User size={24} className="text-blue-400 sm:w-8 sm:h-8" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-3 sm:p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-400">Total Revenue</p>
              <p className="text-lg sm:text-2xl font-bold text-white mt-1 sm:mt-2">{formatCurrency(totalRevenue)}</p>
            </div>
            <DollarSign size={24} className="text-green-400 sm:w-8 sm:h-8" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-3 sm:p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-400">Avg Spending</p>
              <p className="text-lg sm:text-2xl font-bold text-white mt-1 sm:mt-2">{formatCurrency(averageSpending)}</p>
            </div>
            <TrendingUp size={24} className="text-purple-400 sm:w-8 sm:h-8" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-3 sm:p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-400">Active (30d)</p>
              <p className="text-lg sm:text-2xl font-bold text-white mt-1 sm:mt-2">{activeCustomers}</p>
            </div>
            <Clock size={24} className="text-orange-400 sm:w-8 sm:h-8" />
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search customers by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 bg-slate-700 border border-slate-600 rounded-lg text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <div className="relative">
              <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="pl-8 sm:pl-10 pr-6 sm:pr-8 py-2 sm:py-3 bg-slate-700 border border-slate-600 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[120px] sm:min-w-[160px]"
              >
                <option value="all">All Customers</option>
                <option value="high_value">High Value (5K+)</option>
                <option value="frequent">Frequent (3+ Orders)</option>
                <option value="recent">Recent (30 days)</option>
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 sm:px-4 py-2 sm:py-3 bg-slate-700 border border-slate-600 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[100px] sm:min-w-[140px]"
            >
              <option value="totalSpent">Sort by Spending</option>
              <option value="totalOrders">Sort by Orders</option>
              <option value="lastOrder">Sort by Last Order</option>
              <option value="name">Sort by Name</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 sm:px-4 py-2 sm:py-3 bg-slate-700 border border-slate-600 rounded-lg text-xs sm:text-sm text-white hover:bg-slate-600 transition-colors"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {filteredCustomers.map((customer) => {
          const customerTier = getCustomerTier(customer);
          const daysSinceLastOrder = getDaysSinceLastOrder(customer.lastOrderDate);
          const TierIcon = customerTier.icon;

          return (
            <div key={customer.id} className="bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
              <div className="p-4 sm:p-6">
                {/* Customer Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={20} className="text-white sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white text-base sm:text-lg truncate">{customer.name}</h3>
                      <div className="flex items-center gap-2">
                        <TierIcon size={12} className={`${customerTier.color} sm:w-[14px] sm:h-[14px]`} />
                        <span className={`text-xs sm:text-sm ${customerTier.color}`}>
                          {customerTier.tier} Customer
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewProfile(customer)}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                    title="View Profile"
                  >
                    <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                </div>

                {/* Contact Information */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={12} className="text-gray-400 sm:w-[14px] sm:h-[14px] flex-shrink-0" />
                    <span className="text-gray-300 truncate text-xs sm:text-sm">{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={12} className="text-gray-400 sm:w-[14px] sm:h-[14px] flex-shrink-0" />
                    <span className="text-gray-300 text-xs sm:text-sm">{customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={12} className="text-gray-400 sm:w-[14px] sm:h-[14px] flex-shrink-0" />
                    <span className="text-gray-300 text-xs sm:text-sm">
                      Customer since {formatDate(customer.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Purchase Statistics */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                  <div className="bg-slate-700 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign size={14} className="text-green-400 sm:w-4 sm:h-4" />
                      <span className="text-xs text-gray-400">Total Spent</span>
                    </div>
                    <p className="text-sm sm:text-lg font-semibold text-green-400">
                      {formatCurrency(customer.totalSpent)}
                    </p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <ShoppingCart size={14} className="text-blue-400 sm:w-4 sm:h-4" />
                      <span className="text-xs text-gray-400">Total Orders</span>
                    </div>
                    <p className="text-sm sm:text-lg font-semibold text-blue-400">
                      {customer.totalOrders}
                    </p>
                  </div>
                </div>

                {/* Last Order Info */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={12} className="text-gray-400 sm:w-[14px] sm:h-[14px]" />
                    <span className="text-xs text-gray-400">Last Order</span>
                  </div>
                  {customer.lastOrderDate ? (
                    <div>
                      <p className="text-sm text-white">
                        {formatDate(customer.lastOrderDate)}
                      </p>
                      <p className={`text-xs ${
                        daysSinceLastOrder <= 7 ? 'text-green-400' :
                        daysSinceLastOrder <= 30 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {daysSinceLastOrder === 0 ? 'Today' :
                         daysSinceLastOrder === 1 ? '1 day ago' :
                         `${daysSinceLastOrder} days ago`}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No orders yet</p>
                  )}
                </div>

                {/* Preferred Products */}
                {customer.preferredProducts && customer.preferredProducts.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package size={12} className="text-gray-400 sm:w-[14px] sm:h-[14px]" />
                      <span className="text-xs text-gray-400">Preferred Products</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {customer.preferredProducts.slice(0, 2).map((product, index) => (
                        <span key={index} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded truncate">
                          {product}
                        </span>
                      ))}
                      {customer.preferredProducts.length > 2 && (
                        <span className="text-xs px-2 py-1 bg-slate-700 text-gray-400 rounded">
                          +{customer.preferredProducts.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handleViewProfile(customer)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium text-sm sm:text-base"
                >
                  View Full Profile
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <div className="bg-slate-800 rounded-full p-4 sm:p-6 w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 flex items-center justify-center">
            <User size={24} className="text-gray-400 sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No customers found</h3>
          <p className="text-gray-400 text-sm sm:text-base">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Customer Profile Modal */}
      {showProfileModal && selectedCustomer && (
        <CustomerProfileModal
          customer={selectedCustomer}
          customerSales={getCustomerSales(selectedCustomer.id)}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedCustomer(null);
          }}
          onReorder={handleReorder}
        />
      )}

      {/* Create Order Modal */}
      {showCreateOrder && (
        <CreateOrderModal
          onClose={() => {
            setShowCreateOrder(false);
            setReorderItems([]);
          }}
          onCreateOrder={handleCreateOrder}
          existingCustomers={customers}
          prefilledItems={reorderItems}
        />
      )}
    </div>
  );
};