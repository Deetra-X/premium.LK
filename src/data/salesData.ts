import { Customer, Sale, SalesMetrics } from '../types';

// API base URL
const API_BASE = 'http://localhost:3001/api';

// Enhanced fallback data with more samples
const fallbackSalesData = {
  customers: [
    {
      id: 'cust-demo-1',
      name: 'John Smith',
      email: 'john.smith@demo.com',
      phone: '+94771234567',
      accountsCount: 2,
      totalSpent: 5000.00,
      totalOrders: 3,
      createdAt: new Date('2024-01-15'),
      lastOrderDate: new Date('2024-12-01'),
      preferredProducts: ['Adobe Creative Cloud', 'Netflix Premium'],
      customerType: 'standard' as const,
      billingAddress: {
        street: '123 Main Street',
        city: 'Colombo',
        state: 'Western Province',
        zipCode: '00100',
        country: 'Sri Lanka'
      }
    },
    {
      id: 'cust-demo-2',
      name: 'Sarah Johnson',
      email: 'sarah.j@company.com',
      phone: '+94772345678',
      accountsCount: 5,
      totalSpent: 12000.00,
      totalOrders: 6,
      createdAt: new Date('2024-02-20'),
      lastOrderDate: new Date('2024-11-28'),
      preferredProducts: ['Microsoft Office 365', 'Adobe Creative Cloud'],
      customerType: 'reseller' as const,
      billingAddress: {
        street: '456 Business Ave',
        city: 'Kandy',
        state: 'Central Province',
        zipCode: '20000',
        country: 'Sri Lanka'
      }
    },
    {
      id: 'cust-demo-3',
      name: 'Mike Wilson',
      email: 'mike.wilson@gmail.com',
      phone: '+94773456789',
      accountsCount: 1,
      totalSpent: 1500.00,
      totalOrders: 2,
      createdAt: new Date('2024-03-10'),
      lastOrderDate: new Date('2024-11-25'),
      preferredProducts: ['Spotify Family'],
      customerType: 'standard' as const
    }
  ],
  sales: [
    {
      id: 'sale-demo-1',
      orderNumber: 'ORD-2024-0001',
      customerId: 'cust-demo-1',
      customerName: 'John Smith',
      customerEmail: 'john.smith@demo.com',
      customerPhone: '+94771234567',
      items: [
        {
          productId: 'prod-1',
          productName: 'Adobe Creative Cloud',
          price: 2500.00,
          quantity: 1
        }
      ],
      totalAmount: 2500.00,
      paymentMethod: 'card' as const,
      orderDate: new Date('2024-12-01'),
      status: 'completed' as const,
      notes: 'Professional design suite for creative work',
      createdAt: new Date('2024-12-01'),
      updatedAt: new Date('2024-12-01')
    },
    {
      id: 'sale-demo-2',
      orderNumber: 'ORD-2024-0002',
      customerId: 'cust-demo-2',
      customerName: 'Sarah Johnson',
      customerEmail: 'sarah.j@company.com',
      customerPhone: '+94772345678',
      items: [
        {
          productId: 'prod-2',
          productName: 'Microsoft Office 365',
          price: 3000.00,
          quantity: 2
        },
        {
          productId: 'prod-3',
          productName: 'Google Drive Business',
          price: 1200.00,
          quantity: 1
        }
      ],
      totalAmount: 7200.00,
      paymentMethod: 'bank_transfer' as const,
      orderDate: new Date('2024-11-28'),
      status: 'completed' as const,
      notes: 'Bulk order for company team',
      createdAt: new Date('2024-11-28'),
      updatedAt: new Date('2024-11-28')
    },
    {
      id: 'sale-demo-3',
      orderNumber: 'ORD-2024-0003',
      customerId: 'cust-demo-3',
      customerName: 'Mike Wilson',
      customerEmail: 'mike.wilson@gmail.com',
      customerPhone: '+94773456789',
      items: [
        {
          productId: 'prod-4',
          productName: 'Spotify Family',
          price: 800.00,
          quantity: 1
        }
      ],
      totalAmount: 800.00,
      paymentMethod: 'cash' as const,
      orderDate: new Date('2024-11-25'),
      status: 'pending' as const,
      notes: 'Family music streaming subscription',
      createdAt: new Date('2024-11-25'),
      updatedAt: new Date('2024-11-25')
    },
    {
      id: 'sale-demo-4',
      orderNumber: 'ORD-2024-0004',
      customerId: 'cust-demo-1',
      customerName: 'John Smith',
      customerEmail: 'john.smith@demo.com',
      customerPhone: '+94771234567',
      items: [
        {
          productId: 'prod-5',
          productName: 'Netflix Premium',
          price: 1500.00,
          quantity: 1
        }
      ],
      totalAmount: 1500.00,
      paymentMethod: 'card' as const,
      orderDate: new Date('2024-11-20'),
      status: 'completed' as const,
      createdAt: new Date('2024-11-20'),
      updatedAt: new Date('2024-11-20')
    }
  ]
};

// Track API availability globally
let globalApiAvailable = true;
let globalApiChecked = false;

export const getSalesData = async (): Promise<{ customers: Customer[]; sales: Sale[] }> => {
  // Return fallback immediately if API is known to be unavailable
  if (!globalApiAvailable && globalApiChecked) {
    console.log('API unavailable, returning fallback data immediately');
    return fallbackSalesData;
  }

  try {
    console.log('Attempting to fetch sales data from API...');
    
    const [customersResponse, salesResponse] = await Promise.all([
      fetch(`${API_BASE}/customers`).catch(err => {
        console.warn('Customers API fetch failed:', err.message);
        return null;
      }),
      fetch(`${API_BASE}/sales`).catch(err => {
        console.warn('Sales API fetch failed:', err.message);
        return null;
      })
    ]);

    let customers = fallbackSalesData.customers;
    let sales = fallbackSalesData.sales;
    let apiWorking = false;

    // Try to get customers data
    if (customersResponse && customersResponse.ok) {
      const contentType = customersResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          customers = await customersResponse.json();
          console.log('Successfully loaded customers from API');
          apiWorking = true;
        } catch (e) {
          console.warn('Failed to parse customers JSON');
        }
      }
    }

    // Try to get sales data
    if (salesResponse && salesResponse.ok) {
      const contentType = salesResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          sales = await salesResponse.json();
          console.log('Successfully loaded sales from API');
          apiWorking = true;
        } catch (e) {
          console.warn('Failed to parse sales JSON');
        }
      }
    }

    // Update global API status
    globalApiAvailable = apiWorking;
    globalApiChecked = true;

    if (!apiWorking) {
      console.log('API not working, using fallback data');
    }

    // Process sales data
    const processedSales = sales.map((sale: any) => ({
      ...sale,
      orderDate: new Date(sale.orderDate || sale.order_date || Date.now()),
      createdAt: sale.createdAt ? new Date(sale.createdAt) : new Date(sale.created_at || Date.now()),
      updatedAt: sale.updatedAt ? new Date(sale.updatedAt) : new Date(sale.updated_at || Date.now())
    }));

    console.log(`Final data: ${customers.length} customers, ${processedSales.length} sales`);
    return { customers, sales: processedSales };
  } catch (error) {
    console.error('Error in getSalesData:', error);
    globalApiAvailable = false;
    globalApiChecked = true;
    return fallbackSalesData;
  }
};

// Export function to reset API status for retry
export const resetApiStatus = () => {
  globalApiAvailable = true;
  globalApiChecked = false;
};

export const getSalesMetrics = (salesData: Sale[], customersData: Customer[]): SalesMetrics => {
  const totalRevenue = salesData
    .filter(sale => sale.status === 'completed')
    .reduce((sum, sale) => sum + sale.totalAmount, 0);
  const averageOrderValue = salesData.length > 0 ? totalRevenue / salesData.length : 0;

  // Calculate top products from sales items
  const productSales = salesData.reduce((products, sale) => {
    sale.items.forEach(item => {
      const existing = products.find(p => p.name === item.productName);
      if (existing) {
        existing.sales += item.quantity;
        existing.revenue += item.price * item.quantity;
      } else {
        products.push({
          name: item.productName,
          sales: item.quantity,
          revenue: item.price * item.quantity
        });
      }
    });
    return products;
  }, [] as { name: string; sales: number; revenue: number }[]);

  const topProducts = productSales
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    totalCustomers: customersData.length,
    totalSales: salesData.length,
    totalRevenue,
    averageOrderValue,
    topProducts
  };
};
