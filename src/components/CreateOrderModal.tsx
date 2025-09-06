import React, { useState, useEffect } from 'react';
import { X, Trash2, Save, User, Mail, Phone, Tag, DollarSign } from '../utils/icons';
import { AccountItem, Category, CreateOrderModalProps, Customer, DatabaseAccount, OrderItem } from '../types/index';

// Using direct API fetch with fallback to local mock data
import { fetchCategories } from '../api/Categories';

// Type definition for database account structure


export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  onClose,
  onCreateOrder,
  existingCustomers,
  prefilledItems = []
}) => {
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    isExisting: false,
    existingCustomerId: '',
    customerType: 'standard' as 'standard' | 'reseller',
    discountRate: 0
  });
  
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { productId: '', productName: '', price: 0, quantity: 1, showAccountsList: false }
  ]);
  
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer'>('cash');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Add state for start date and end date
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(() => {
    // Default to 30 days from now
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    return thirtyDaysLater.toISOString().split('T')[0];
  });

  // Add state for days until renewal
  const [daysUntilRenewal, setDaysUntilRenewal] = useState<number>(30);

  // Add function to calculate days until renewal
  const calculateDaysUntilRenewal = (startDateStr: string, endDateStr: string) => {
    if (!startDateStr || !endDateStr) return 0;
    
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  // Update days until renewal when dates change
  useEffect(() => {
    const calculatedDays = calculateDaysUntilRenewal(startDate, endDate);
    setDaysUntilRenewal(calculatedDays);
  }, [startDate, endDate]);
  
  // Added state for categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [subtotal, setSubtotal] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [availableAccounts, setAvailableAccounts] = useState<AccountItem[]>([]); // Using our defined AccountItem type
  
  // Fetch categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const categoryData = await fetchCategories();
        setCategories(categoryData as Category[]);
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategories([]);
      }
    }
    loadCategories();
  }, []);
  
  // Fetch accounts by selected category
  useEffect(() => {
    async function fetchAccountsByCategory() {
      try {
        if (selectedCategory) {
          console.log('Fetching accounts for category:', selectedCategory);
          
          // Use direct fetch to the backend API to ensure we get consistent results
          const API_BASE_URL = 'http://localhost:3001';
          const url = `${API_BASE_URL}/api/accounts?category=${selectedCategory}`;
          console.log(`Fetching from API URL: ${url}`);
          
          const response = await fetch(url);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`API error (${response.status}): ${errorText}`);
            throw new Error(`API error: ${response.status}`);
          }
          
          console.log('Response headers:', response.headers);
          
          // Check content type
          const contentType = response.headers.get('content-type');
          console.log(`Content-Type: ${contentType}`);
          
          if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response received:', text.substring(0, 200) + '...');
            throw new Error('API returned non-JSON response');
          }
          
          const accounts = await response.json();
          console.log('Raw accounts returned from API:', accounts);
          
          // Debug the account structure
          if (accounts && accounts.length > 0) {
            console.log('Sample account structure:', JSON.stringify(accounts[0], null, 2));
          } else {
            console.log('No accounts found for category:', selectedCategory);
          }
          
          // Map accounts to our expected format - show all active accounts, even if they have no slots
          const activeAccounts = accounts
            .filter((account: DatabaseAccount) => {
              const isActive = account.is_active === true || account.is_active === 1;
              //methanin pahala
                const maxSlots = account.max_user_slots || account.max_slots || 1;
                const currentUsers = account.current_users || 0;
                const hasAvailableSlots = currentUsers < maxSlots;
    // Only show if active and has available slots
                return isActive && hasAvailableSlots;
              //methanin uda
              //const hasAvailableSlots = (account.available_slots || 0) > 0;
              //const slotStatus = hasAvailableSlots ? "has slots" : "FULL - no available slots";
              //console.log(`Account ${account.product_name || account.name || 'Unknown'}: isActive=${isActive}, ${slotStatus}`);
              // Only filter by active status, not by available slots
              return isActive;
            })
            .map((account: DatabaseAccount): AccountItem => {
              // Map database fields to our component's expected format
              // Ensure we have a valid cost/price
              let accountCost = 0;
              if (typeof account.cost === 'number' && !isNaN(account.cost)) {
                accountCost = account.cost;
              } else if (typeof account.price === 'number' && !isNaN(account.price)) {
                accountCost = account.price;
              }
              
              const mappedAccount: AccountItem = {
                id: account.id,
                productName: account.product_name || account.name || 'Unknown Account',
                email: account.email || '',
                cost: accountCost,
                description: account.description || '',
                isActive: account.is_active === true || account.is_active === 1,
                availableSlots: account.available_slots || 1,
                maxUserSlots: account.max_user_slots || account.max_slots || 1,
                currentUsers: account.current_users || 0,
                brand: account.brand || '',
                subscriptionType: account.subscription_type || '',
                primaryHolder: {
                  name: account.primary_holder_name || '',
                  email: account.primary_holder_email || '',
                  phone: account.primary_holder_phone || ''
                }
              };
              console.log('Mapped account:', mappedAccount);
              return mappedAccount;
            });
          
          console.log(`Found ${activeAccounts.length} active accounts for category ${selectedCategory}`);
          setAvailableAccounts(activeAccounts);
        } else {
          setAvailableAccounts([]);
        }
      } catch (error) {
        console.error('Error loading accounts from API:', error);
        
        // Create some mock data for testing purposes
        const mockAccounts: AccountItem[] = [
          {
            id: 'mock-1',
            productName: 'Netflix Premium',
            cost: 15.99,
            availableSlots: 2,
            isActive: true,
            description: 'Premium streaming service with 4K content',
            email: 'netflix@example.com',
            maxUserSlots: 5,
            currentUsers: 3,
            brand: 'Netflix',
            subscriptionType: 'Monthly',
            primaryHolder: {
              name: 'Test User',
              email: 'test@example.com',
              phone: '1234567890'
            }
          },
          {
            id: 'mock-2',
            productName: 'Spotify Family',
            cost: 14.99,
            availableSlots: 3,
            isActive: true,
            description: 'Family music streaming plan',
            email: 'spotify@example.com',
            maxUserSlots: 6,
            currentUsers: 3,
            brand: 'Spotify',
            subscriptionType: 'Monthly',
            primaryHolder: {
              name: 'Test User',
              email: 'test@example.com',
              phone: '1234567890'
            }
          },
          {
            id: 'mock-3',
            productName: 'Xbox Game Pass',
            cost: 9.99,
            availableSlots: 1,
            isActive: true,
            description: 'Gaming subscription service',
            email: 'xbox@example.com',
            maxUserSlots: 2,
            currentUsers: 1,
            brand: 'Microsoft',
            subscriptionType: 'Monthly',
            primaryHolder: {
              name: 'Test User',
              email: 'test@example.com',
              phone: '1234567890'
            }
          }
        ];
        
        console.log('Using local mock data due to API error:', error instanceof Error ? error.message : 'Unknown error');
        console.log('Mock accounts for testing:', mockAccounts);
        setAvailableAccounts(mockAccounts);
      }
    }
    fetchAccountsByCategory();
  }, [selectedCategory]);

  // Prefill items if provided (for reorders)
  useEffect(() => {
    if (prefilledItems.length > 0) {
      const mappedItems = prefilledItems.map(item => ({
        productId: item.productId || '',
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
        showAccountsList: false
      }));
      setOrderItems(mappedItems);
    }
  }, [prefilledItems]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

      // Category validation
    if (!selectedCategory) {
      newErrors.category = 'Please select an account category';
    }    // Customer validation
    if (!customerInfo.isExisting) {
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
      } else if (!/^\+?[\d\s-()]+$/.test(customerInfo.phone)) {
        newErrors.customerPhone = 'Please enter a valid phone number';
      }
    } else if (!customerInfo.existingCustomerId) {
      newErrors.existingCustomer = 'Please select an existing customer';
    }

    // Discount validation
    if (customerInfo.discountRate < 0 || customerInfo.discountRate > 100) {
      newErrors.discountRate = 'Discount rate must be between 0 and 100%';
    }

    // Order items validation
    const validItems = orderItems.filter(item => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      newErrors.orderItems = 'At least one account must be selected';
    }

    orderItems.forEach((item, index) => {
      if (item.productId && item.quantity <= 0) {
        newErrors[`quantity_${index}`] = 'Quantity must be greater than 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCustomerTypeChange = (isExisting: boolean) => {
    console.log('🔍 handleCustomerTypeChange called:', { isExisting, currentDiscountRate: customerInfo.discountRate });
    setCustomerInfo(prev => ({
      ...prev,
      isExisting,
      existingCustomerId: '',
      name: '',
      email: '',
      phone: '',
      customerType: 'standard', // Reset customer type to standard for new customers
      // Don't reset discount rate - preserve user input
      discountRate: prev.discountRate // Keep existing discount rate
    }));
    setErrors({});
  };

  const handleExistingCustomerSelect = (customerId: string) => {
    const customer = existingCustomers.find(c => c.id === customerId);
    if (customer) {
      // Get discount rate from reseller info if available
      const discountRate = customer.customerType === 'reseller' && customer.resellerInfo 
        ? customer.resellerInfo.discountRate 
        : 0;
        
      console.log('🔍 handleExistingCustomerSelect called:', { 
        customerId, 
        customerType: customer.customerType, 
        calculatedDiscountRate: discountRate,
        currentDiscountRate: customerInfo.discountRate 
      });
        
      setCustomerInfo(prev => ({
        ...prev,
        existingCustomerId: customerId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        // customerType: customer.customerType,
        discountRate
      }));
    }
  };
  // Add a new handler for customer type changes
  const handleCustomerTypeSelect = (type: 'standard' | 'reseller') => {
    console.log('🔍 handleCustomerTypeSelect called:', { type, currentDiscountRate: customerInfo.discountRate });
    setCustomerInfo(prev => ({
      ...prev,
      customerType: type,
      // Only set default discount rate if current rate is 0 (not manually entered)
      discountRate: type === 'reseller' && prev.discountRate === 0 ? 10 : prev.discountRate
    }));
    console.log('🔍 After handleCustomerTypeSelect, new discount rate should be:', type === 'reseller' && customerInfo.discountRate === 0 ? 10 : customerInfo.discountRate);
  };

  const handleAccountSelect = (accountId: string) => {
    const account = availableAccounts.find(a => a.id === accountId);
    if (account) {
      console.log('Selected account:', account);
      // Check if this account is already in the order items
      const existingItem = orderItems.find(item => item.productId === accountId);
      
      if (existingItem) {
        // If already exists, just increase quantity
        setOrderItems(prev => prev.map(item => 
          item.productId === accountId 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        // Make sure we have a valid price
        const price = typeof account.cost === 'number' && !isNaN(account.cost) ? account.cost : 0;
        console.log(`Adding account with price: ${price}`);
        
        // Add as new item
        setOrderItems(prev => [
          ...prev.filter(item => item.productId), // Keep only valid items
          { 
            productId: accountId, 
            productName: account.productName, 
            price: price,
            quantity: 1,
            showAccountsList: false
          }
        ]);
      }
    }
  };

  // The account adding is now handled by handleAccountSelect when clicking on an account

  const removeOrderItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateQuantity = (index: number, quantity: number) => {
    setOrderItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity: Math.max(1, quantity) } : item
    ));
  };

  const calculateTotal = () => {
    // Calculate subtotal
    const subtotalAmount = orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Calculate discount amount based on discount rate
    const discount = (subtotalAmount * customerInfo.discountRate) / 100;
    
    // Return final total
    return subtotalAmount - discount;
  };
  
  // Update subtotal and discount amount whenever order items or discount rate changes
  useEffect(() => {
    const subtotalAmount = orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const discount = (subtotalAmount * customerInfo.discountRate) / 100;
    
    setSubtotal(subtotalAmount);
    setDiscountAmount(discount);
  }, [orderItems, customerInfo.discountRate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called');
    console.log('Customer Info State:', customerInfo);
    console.log('Customer Type:', customerInfo.customerType);
    if (!validateForm()) {
      return;
    }

    // const validItems = orderItems.filter(item => item.productId && item.quantity > 0);
    const validItems = orderItems
  .filter(item => item.productId && item.quantity > 0)
  .map(item => {
    const account = availableAccounts.find(a => a.id === item.productId);
    return {
      ...item,
      email: account?.email || '', // Add the email property for backend
    };
  });

  //newly fixed code that account update 
    const totalAmount = calculateTotal();

    // Calculate final values for the order
    const orderSubtotal = subtotal;
    const orderDiscountAmount = discountAmount;
    // const orderDiscountRate = customerInfo.discountRate;

    const orderData = {
      customerId: customerInfo.isExisting ? customerInfo.existingCustomerId : undefined,
      customerName: customerInfo.name || undefined,
      customerEmail: customerInfo.email || undefined,
      customerPhone: customerInfo.phone || undefined,
      customerType: customerInfo.customerType || undefined,
      items: validItems.map(item => ({
      productId: item.productId || undefined,
      product_id: item.productId || undefined,
      productName: item.productName || undefined,
      product_name: item.productName || undefined,
      price: item.price || undefined,
      quantity: item.quantity || undefined,
      email: item.email || undefined,
      })),
      totalAmount: totalAmount || undefined,
      discountRate: customerInfo.discountRate || undefined,
      paymentMethod: paymentMethod || undefined,
      payment_method: paymentMethod || undefined,
      status: 'completed',
      notes: '', // Add notes if needed
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      daysUntilRenewal: daysUntilRenewal || undefined,
    };
     console.log('Final Order Data being sent:', orderData );
    console.log('Customer Type in payload:' , orderData.customerType);
    console.log('Days until renewal:', orderData.daysUntilRenewal);
    console.log('🔍 DEBUG - customerInfo.discountRate:', customerInfo.discountRate);
    console.log('🔍 DEBUG - orderData.discountRate:', orderData.discountRate);
    console.log('🔍 DEBUG - Full customerInfo object:', customerInfo);
    console.log("Sending order data to backend:", JSON.stringify(orderData, null, 2));


onCreateOrder(orderData);
onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            {prefilledItems.length > 0 ? 'Reorder Items' : 'Create New Order'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Information */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Customer Information</h3>
            
            {/* Customer Type Selection */}
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="customerSelection"
                  checked={!customerInfo.isExisting}
                  onChange={() => handleCustomerTypeChange(false)}
                  className="w-4 h-4 text-blue-600 bg-slate-600 border-slate-500 focus:ring-blue-500"
                />
                <span className="text-white">New Customer</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="customerSelection"
                  checked={customerInfo.isExisting}
                  onChange={() => handleCustomerTypeChange(true)}
                  className="w-4 h-4 text-blue-600 bg-slate-600 border-slate-500 focus:ring-blue-500"
                />
                <span className="text-white">Existing Customer</span>
              </label>
            </div>

            {customerInfo.isExisting ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Customer *
                </label>
                <select
                  value={customerInfo.existingCustomerId}
                  onChange={(e) => handleExistingCustomerSelect(e.target.value)}
                  className={`w-full px-3 py-2 bg-slate-600 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.existingCustomer ? 'border-red-500' : 'border-slate-500'
                  }`}
                >
                  <option value="">Choose a customer...</option>
                  {existingCustomers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.email}
                    </option>
                  ))}
                </select>
                {errors.existingCustomer && (
                  <p className="text-red-400 text-sm mt-1">{errors.existingCustomer}</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <User size={16} className="inline mr-1" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3 py-2 bg-slate-600 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.customerName ? 'border-red-500' : 'border-slate-500'
                    }`}
                    placeholder="John Smith"
                  />
                  {errors.customerName && (
                    <p className="text-red-400 text-sm mt-1">{errors.customerName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Mail size={16} className="inline mr-1" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full px-3 py-2 bg-slate-600 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.customerEmail ? 'border-red-500' : 'border-slate-500'
                    }`}
                    placeholder="john@example.com"
                  />
                  {errors.customerEmail && (
                    <p className="text-red-400 text-sm mt-1">{errors.customerEmail}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Phone size={16} className="inline mr-1" />
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
                    <p className="text-red-400 text-sm mt-1">{errors.customerPhone}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Category Selection */}
          <div className="bg-slate-700 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-white mb-4">Select Account Category</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Tag size={16} className="inline mr-1" />
                Account Category *
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  const categoryId = e.target.value;
                  console.log(`Selected category ID: ${categoryId}`);
                  setSelectedCategory(categoryId);
                }}
                className={`w-full px-3 py-2 bg-slate-600 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  !selectedCategory && orderItems.some(item => item.productId) ? 'border-red-500' : 'border-slate-500'
                }`}
              >
                <option value="">Select a category...</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {!selectedCategory && orderItems.some(item => item.productId) && (
                <p className="text-red-400 text-sm mt-1">Please select a category first</p>
              )}
            </div>
          </div>

          {/* Account Selection */}
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Available Accounts</h3>
              <span className="text-sm text-gray-300">
                Click on an account to add it to your order
              </span>
            </div>

            {!selectedCategory && (
              <p className="text-amber-400 text-sm mb-4">Please select an account category first</p>
            )}
            
            {errors.orderItems && (
              <p className="text-red-400 text-sm mb-4">{errors.orderItems}</p>
            )}
            
            {/* Display available accounts in a grid */}
            {selectedCategory && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-white text-md font-medium">Accounts in Selected Category:</h4>
                  <div className="space-x-2">
                    <button 
                      type="button"
                      onClick={() => {
                        // Select all accounts with available slots
                        const accountsWithSlots = availableAccounts.filter(a => a.availableSlots > 0);
                        
                        // Replace current order items with all available accounts
                        const newOrderItems = accountsWithSlots.map(account => {
                          // Make sure we have a valid price
                          const price = typeof account.cost === 'number' && !isNaN(account.cost) ? account.cost : 0;
                          
                          return {
                            productId: account.id,
                            productName: account.productName,
                            price: price,
                            quantity: 1,
                            showAccountsList: false,
                            email: account.email || '',
                          };
                        });
                        
                        setOrderItems(newOrderItems);
                      }}
                      className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                    >
                      Select All
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        // Remove all selected accounts
                        setOrderItems([{ productId: '', productName: '', price: 0, quantity: 1, showAccountsList: false }]);
                      }}
                      className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    >
                      Unselect All
                    </button>
                  </div>
                </div>
                {availableAccounts.length === 0 ? (
                  <p className="text-gray-400">No accounts found for this category or all accounts are inactive.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableAccounts.map(account => (
                        <div 
                        key={account.id} 
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all
                          ${orderItems.some(item => item.productId === account.id) 
                            ? 'border-green-400 bg-green-900/20' 
                            : account.availableSlots <= 0 
                              ? 'border-red-400 bg-red-900/10 hover:bg-red-900/20' 
                              : 'border-slate-600 bg-slate-600 hover:bg-slate-500'
                          }`}
                        onClick={() => {
                          // Find if account is already in order items
                          const existingItemIndex = orderItems.findIndex(item => item.productId === account.id);
                          
                          if (existingItemIndex >= 0) {
                            // Already added - remove it
                            removeOrderItem(existingItemIndex);
                          } else {
                            // Don't allow selecting accounts with no slots
                            if (account.availableSlots > 0) {
                              // Add to order
                              handleAccountSelect(account.id);
                            } else {
                              // Alert that this account is full
                              alert(`This ${account.productName} account has no available slots. Please choose another account.`);
                            }
                          }
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <h5 className={`font-semibold ${account.availableSlots <= 0 ? 'text-red-300' : 'text-white'}`}>
                            {account.productName}
                          </h5>
                          <span className={`text-white text-xs px-2 py-1 rounded-full 
                            ${account.availableSlots <= 0 
                              ? 'bg-red-500' 
                              : account.availableSlots <= 2 
                                ? 'bg-yellow-500' 
                                : 'bg-blue-500'
                            }`}>
                            {account.availableSlots} slots
                          </span>
                        </div>                        {/* Account Email */}
                        <div className="flex items-center mt-1">
                          <Mail size={12} className="text-gray-400 mr-1" />
                          <p className="text-gray-300 text-xs overflow-hidden text-ellipsis">
                            {account.email || 'No email available'}
                          </p>
                        </div>
                        
                        {/* Account Holder Name */}
                        {account.primaryHolder && account.primaryHolder.name && (
                          <div className="flex items-center mt-1">
                            <User size={12} className="text-gray-400 mr-1" />
                            <p className="text-gray-300 text-xs">
                              {account.primaryHolder.name}
                            </p>
                          </div>
                        )}
                        
                        {/* Account Description */}
                        <p className="text-gray-300 text-sm mt-2 mb-2 line-clamp-2">
                          {account.description || 'No description available'}
                        </p>
                        
                        <div className="flex justify-between items-center mt-2">
                          {/* <span className="text-green-400 font-medium">LKR {account.cost.toFixed(2)}</span> */}
                          <div className="flex items-center text-xs text-gray-300">
                            <span className="text-xs text-gray-400 mr-1">{account.brand || ''}</span>
                            <span className="px-2 py-0.5 bg-blue-500 bg-opacity-20 text-blue-400 rounded-full">
                              {account.subscriptionType || ''}
                            </span>
                          </div>
                        </div>
                        
                        {/* Slot Information */}
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-center">
                          <div className="bg-slate-700 rounded p-1">
                            <div className="font-semibold">{account.maxUserSlots || 0}</div>
                            <div className="text-gray-400">Max Slots</div>
                          </div>
                          <div className={`rounded p-1 ${account.availableSlots <= 0 ? 'bg-red-900/30' : 'bg-slate-700'}`}>
                            <div className={`font-semibold ${
                              account.availableSlots <= 0 
                                ? 'text-red-400' 
                                : account.availableSlots <= 2 
                                  ? 'text-yellow-400' 
                                  : 'text-green-400'
                            }`}>
                              {account.availableSlots || 0}
                            </div>
                            <div className="text-gray-400">Available</div>
                          </div>
                          <div className="bg-slate-700 rounded p-1">
                            <div className="font-semibold text-blue-400">{account.currentUsers || 0}</div>
                            <div className="text-gray-400">Current</div>
                          </div>
                        </div>
                        
                        {/* Add a status message for filled accounts */}
                        {account.availableSlots <= 0 && (
                          <div className="bg-red-400 bg-opacity-20 text-red-400 text-xs mt-2 py-1 px-2 rounded text-center">
                            No Available Slots
                          </div>
                        )}
                        
                        {orderItems.some(item => item.productId === account.id) && (
                          <div className="bg-green-400 bg-opacity-20 text-green-400 text-xs mt-2 py-1 px-2 rounded text-center">
                            Added to Order
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Selected Accounts List */}
            <div className="flex justify-between items-center my-4">
              <h4 className="text-white text-md font-medium">Selected Accounts:</h4>
              {orderItems.filter(item => item.productId).length > 0 && (
                <button 
                  type="button"
                  onClick={() => {
                    setOrderItems([{ productId: '', productName: '', price: 0, quantity: 1, showAccountsList: false }]);
                  }}
                  className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            
            {orderItems.filter(item => item.productId).length === 0 ? (
              <p className="text-gray-400 italic mb-4">No accounts selected yet. Click on an account from above to add it to your order.</p>
            ) : (
              <div className="space-y-4">
                {orderItems.filter(item => item.productId).map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-slate-600 rounded-lg">
                    <div className="md:col-span-5">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Account
                      </label>
                      <input
                        type="text"
                        value={item.productName}
                        readOnly
                        className="w-full px-3 py-2 bg-slate-500 border border-slate-400 rounded-lg text-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Price
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <span className="text-white">LKR</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => {
                            const newPrice = parseFloat(e.target.value) || 0;
                            setOrderItems(prev => 
                              prev.map((it, idx) => idx === index ? {...it, price: newPrice} : it)
                            );
                          }}
                          className="w-full px-3 py-2 pl-14 bg-slate-500 border border-slate-400 rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                        className={`w-full px-3 py-2 bg-slate-500 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`quantity_${index}`] ? 'border-red-500' : 'border-slate-400'
                        }`}
                      />
                      {errors[`quantity_${index}`] && (
                        <p className="text-red-400 text-xs mt-1">{errors[`quantity_${index}`]}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Total
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <span className="text-white">LKR</span>
                        </div>
                        <input
                          type="text"
                          value={(item.price * item.quantity).toFixed(2)}
                          readOnly
                          className="w-full px-3 py-2 pl-14 bg-slate-500 border border-slate-400 rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-1 flex items-end">
                      <button
                        type="button"
                        onClick={() => removeOrderItem(index)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-500 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Order Total */}
            <div className="mt-4 p-4 bg-slate-600 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-300">Subtotal:</span>
                  <span className="font-medium text-gray-300">
                    LKR {subtotal.toFixed(2)}
                  </span>
                </div>
                
                {customerInfo.discountRate > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-300">
                      Discount ({customerInfo.discountRate}%):
                    </span>
                    <span className="font-medium text-amber-400">
                      -LKR {discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-2 border-t border-gray-600">
                  <span className="text-lg font-semibold text-white">Order Total:</span>
                  <span className="text-2xl font-bold text-green-400">
                    LKR {(subtotal - discountAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Type and Discount */}
          <div className="bg-slate-700 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-white mb-4">Customer Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <label className="flex items-center gap-3 p-3 bg-slate-600 rounded-lg cursor-pointer hover:bg-slate-500 transition-colors">
                <input
                  type="radio"
                  name="customerTypeSelection"
                  value="standard"
                  checked={customerInfo.customerType === 'standard'}
                  onChange={() => handleCustomerTypeSelect('standard')}
                  // onChange={() => setCustomerInfo(prev => ({ ...prev, customerType: 'standard' }))}
                  className="w-4 h-4 text-blue-600 bg-slate-500 border-slate-400 focus:ring-blue-500"
                />
                <span className="text-white">Standard Customer</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-slate-600 rounded-lg cursor-pointer hover:bg-slate-500 transition-colors">
                <input
                  type="radio"
                  name="customerTypeSelection"
                  value="reseller"
                  checked={customerInfo.customerType === 'reseller'}
                  onChange={() => handleCustomerTypeSelect('reseller')}
                  // onChange={() => setCustomerInfo(prev => ({ ...prev, customerType: 'reseller' }))}
                  className="w-4 h-4 text-blue-600 bg-slate-500 border-slate-400 focus:ring-blue-500"
                />
                <span className="text-white">Reseller</span>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <DollarSign size={16} className="inline mr-1" />
                Discount Rate (%)
              </label>
                <input
                type="number"
                min="0"
                max="100"
                value={customerInfo.discountRate}
                onChange={(e) => {
                  const newDiscountRate = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                  console.log('🔍 DISCOUNT INPUT CHANGE:', {
                    inputValue: e.target.value,
                    newDiscountRate: newDiscountRate,
                    currentDiscountRate: customerInfo.discountRate
                  });
                  setCustomerInfo(prev => ({
                    ...prev,
                    discountRate: newDiscountRate
                  }));
                }}
                className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              <p className="text-sm text-gray-400 mt-1">
                {customerInfo.customerType === 'reseller' ? 
                  'Reseller discount rate - this will be applied to the total order amount' : 
                  'Optional discount for standard customers'}
              </p>
            </div>
          </div>
          
          {/* Payment Method */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Payment Method</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-3 bg-slate-600 rounded-lg cursor-pointer hover:bg-slate-500 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'bank_transfer')}
                  className="w-4 h-4 text-blue-600 bg-slate-500 border-slate-400 focus:ring-blue-500"
                />
                <span className="text-white">Cash</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-slate-600 rounded-lg cursor-pointer hover:bg-slate-500 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank_transfer"
                  checked={paymentMethod === 'bank_transfer'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'bank_transfer')}
                  className="w-4 h-4 text-blue-600 bg-slate-500 border-slate-400 focus:ring-blue-500"
                />
                <span className="text-white">Bank Transfer</span>
              </label>
            </div>
          </div>
          
          {/* Account Period */}
          <div className="bg-slate-700 rounded-lg p-4 mt-4">
            <h3 className="text-lg font-semibold text-white mb-4">Account Period & Renewal</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-600 text-white border border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-600 text-white border border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Days Until Renewal
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={daysUntilRenewal}
                    onChange={(e) => {
                      const days = parseInt(e.target.value) || 0;
                      setDaysUntilRenewal(days);
                      
                      // Auto-calculate end date based on start date + days
                      if (startDate && days > 0) {
                        const newEndDate = new Date(startDate);
                        newEndDate.setDate(newEndDate.getDate() + days);
                        setEndDate(newEndDate.toISOString().split('T')[0]);
                      }
                    }}
                    className="w-full p-2.5 bg-slate-600 text-white border border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="30"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-400 text-sm">days</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Auto-calculated from dates or manually entered
                </p>
              </div>
            </div>
            <div className="bg-slate-600 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Renewal Status</p>
                  <p className="text-xs text-gray-400">
                    Account will expire on {endDate ? new Date(endDate).toLocaleDateString() : 'Not set'}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  daysUntilRenewal <= 7 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                    : daysUntilRenewal <= 30 
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-green-500/20 text-green-400 border border-green-500/30'
                }`}>
                  {daysUntilRenewal <= 7 
                    ? `⚠️ Expires in ${daysUntilRenewal} days` 
                    : daysUntilRenewal <= 30 
                      ? `⏰ ${daysUntilRenewal} days remaining`
                      : `✅ ${daysUntilRenewal} days remaining`
                  }
                </div>
              </div>
            </div>
            {/* Quick Duration Buttons */}
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-300 mb-2">Quick Duration:</p>
              <div className="flex flex-wrap gap-2">
                {[7, 14, 30, 60, 90, 180, 365].map(days => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => {
                      setDaysUntilRenewal(days);
                      if (startDate) {
                        const newEndDate = new Date(startDate);
                        newEndDate.setDate(newEndDate.getDate() + days);
                        setEndDate(newEndDate.toISOString().split('T')[0]);
                      }
                    }}
                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                      daysUntilRenewal === days
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-600 text-gray-300 hover:bg-slate-500'
                    }`}
                  >
                    {days === 7 ? '1 Week' :
                     days === 14 ? '2 Weeks' :
                     days === 30 ? '1 Month' :
                     days === 60 ? '2 Months' :
                     days === 90 ? '3 Months' :
                     days === 180 ? '6 Months' :
                     days === 365 ? '1 Year' : `${days} days`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Save size={16} />
              {prefilledItems.length > 0 ? 'Place Reorder' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
