import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  ShoppingCart,
  Package,
  TrendingUp,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import { Customer, Sale } from '../types';
import { formatCurrency, formatDate } from '../utils/dateUtils';

interface CustomerProfileModalProps {
  customer: Customer;
  customerSales: Sale[];
  onClose: () => void;
  onReorder: (items: any[]) => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  customer,
  customerSales,
  onClose,
  onReorder
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Calculate customer metrics
  const totalSpent = customerSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const averageOrderValue = customerSales.length > 0 ? totalSpent / customerSales.length : 0;
  const lastOrderDate = customerSales.length > 0 
    ? new Date(Math.max(...customerSales.map(sale => sale.orderDate.getTime())))
    : null;

  // Get unique products purchased - handle both array and undefined cases
  const purchasedProducts = customerSales.reduce((products, sale) => {
    const items = sale.items || [];
    items.forEach(item => {
      const existing = products.find(p => p.name === item.productName);
      if (existing) {
        existing.quantity += item.quantity;
        existing.totalSpent += item.price * item.quantity;
        existing.orders += 1;
      } else {
        products.push({
          name: item.productName,
          quantity: item.quantity,
          totalSpent: item.price * item.quantity,
          orders: 1,
          lastPurchased: sale.orderDate
        });
      }
    });
    return products;
  }, [] as any[]);

  // Sort and filter sales
  const filteredSales = customerSales
    .filter(sale => 
      (sale.items || []).some(item => 
        item?.productName?.toLowerCase().includes(searchTerm.toLowerCase())
      ) || (sale.orderNumber || sale.id).includes(searchTerm)
    )
    .sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'desc' 
          ? b.orderDate.getTime() - a.orderDate.getTime()
          : a.orderDate.getTime() - b.orderDate.getTime();
      } else {
        return sortOrder === 'desc' 
          ? b.totalAmount - a.totalAmount
          : a.totalAmount - b.totalAmount;
      }
    });

  const handleReorder = (sale: Sale) => {
    onReorder(sale.items || []);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <User size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{customer.name}</h2>
              <p className="text-gray-400 text-sm">Customer Profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'overview' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'orders' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Order History ({customerSales.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'products' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Products ({purchasedProducts.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail size={20} className="text-blue-400" />
                    <div>
                      <p className="text-white font-medium">{customer.email}</p>
                      <p className="text-gray-400 text-sm">Email Address</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={20} className="text-green-400" />
                    <div>
                      <p className="text-white font-medium">{customer.phone}</p>
                      <p className="text-gray-400 text-sm">Phone Number</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-purple-400" />
                    <div>
                      <p className="text-white font-medium">{formatDate(customer.createdAt)}</p>
                      <p className="text-gray-400 text-sm">Customer Since</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Total Spent</p>
                      <p className="text-xl font-bold text-green-400 mt-1">
                        {formatCurrency(totalSpent)}
                      </p>
                    </div>
                    <DollarSign size={24} className="text-green-400" />
                  </div>
                </div>

                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Total Orders</p>
                      <p className="text-xl font-bold text-blue-400 mt-1">{customerSales.length}</p>
                    </div>
                    <ShoppingCart size={24} className="text-blue-400" />
                  </div>
                </div>

                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Avg Order Value</p>
                      <p className="text-xl font-bold text-purple-400 mt-1">
                        {formatCurrency(averageOrderValue)}
                      </p>
                    </div>
                    <TrendingUp size={24} className="text-purple-400" />
                  </div>
                </div>

                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Last Order</p>
                      <p className="text-xl font-bold text-orange-400 mt-1">
                        {lastOrderDate ? formatDate(lastOrderDate) : 'Never'}
                      </p>
                    </div>
                    <Calendar size={24} className="text-orange-400" />
                  </div>
                </div>
              </div>

              {/* Preferred Products */}
              {customer.preferredProducts && customer.preferredProducts.length > 0 && (
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Preferred Products</h3>
                  <div className="flex flex-wrap gap-2">
                    {customer.preferredProducts.map((product, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Orders Preview */}
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Recent Orders</h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {customerSales.slice(0, 3).map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-3 bg-slate-600 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Order #{sale.id.slice(-6)}</p>
                        <p className="text-gray-400 text-sm">{sale.items.length} item(s)</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-semibold">{formatCurrency(sale.totalAmount)}</p>
                        <p className="text-gray-400 text-sm">{formatDate(sale.orderDate)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="amount">Sort by Amount</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white hover:bg-slate-600 transition-colors"
                  >
                    {sortOrder === 'desc' ? '↓' : '↑'}
                  </button>
                </div>
              </div>

              {/* Orders List */}
              <div className="space-y-4">
                {filteredSales.map((sale) => (
                  <div key={sale.id} className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-white font-medium">Order #{sale.id.slice(-8)}</h4>
                        <p className="text-gray-400 text-sm">{formatDate(sale.orderDate)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-green-400">
                          {formatCurrency(sale.totalAmount)}
                        </span>
                        <button
                          onClick={() => handleReorder(sale)}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                        >
                          <RefreshCw size={14} />
                          Reorder
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {sale.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-slate-600 rounded">
                          <div>
                            <p className="text-white text-sm">{item.productName}</p>
                            <p className="text-gray-400 text-xs">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-gray-300 text-sm">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-600 flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Payment: {sale.paymentMethod}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        sale.status === 'completed' 
                          ? 'bg-green-500/20 text-green-300'
                          : sale.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {sale.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {filteredSales.length === 0 && (
                <div className="text-center py-8">
                  <ShoppingCart size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No orders found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {purchasedProducts.map((product, index) => (
                  <div key={index} className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Package size={20} className="text-blue-400" />
                        <div>
                          <h4 className="text-white font-medium">{product.name}</h4>
                          <p className="text-gray-400 text-sm">{product.orders} order(s)</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Total Quantity:</span>
                        <span className="text-white text-sm">{product.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Total Spent:</span>
                        <span className="text-green-400 text-sm font-semibold">
                          {formatCurrency(product.totalSpent)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Last Purchased:</span>
                        <span className="text-white text-sm">
                          {formatDate(product.lastPurchased)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {purchasedProducts.length === 0 && (
                <div className="text-center py-8">
                  <Package size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No products purchased yet</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};