import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  User,
  Package,
  Settings,
  Filter,
  Search,
  RefreshCw,
  Eye,
  X,
  Mail,
  Phone,
  FileText
} from 'lucide-react';
import { Account, Sale } from '../types/index';
import { fetchExpiringAccounts } from '../api/Dashboard';
import { getSalesData } from '../data/salesData';
import { formatCurrency, formatDate } from '../utils/dateUtils';

interface AccountRenewal {
  id: string;
  type: 'account';
  accountName: string;
  renewalDate: Date;
  weeklyCost: number;
  daysRemaining: number;
  urgencyLevel: 'critical' | 'warning' | 'normal';
  isCompleted: boolean;
  account: Account;
}

interface SalesRenewal {
  id: string;
  type: 'sales';
  customerName: string;
  originalSaleDate: Date;
  renewalDate: Date;
  saleAmount: number;
  status: 'pending' | 'contacted' | 'confirmed' | 'completed' | 'declined';
  urgencyLevel: 'critical' | 'warning' | 'normal';
  sale: Sale;
}

interface RawAccountData {
  id: string;
  renewal_date?: string;
  renewalDate?: string;
  cost?: number;
  price?: number;
  subscription_type?: string;
  product_name?: string;
  productName?: string;
  label?: string;
  email?: string;
  renewal_status?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean | number;
  service_type?: string;
  category_id?: string;
  brand?: string;
  max_user_slots?: number;
  available_slots?: number;
  current_users?: number;
  cost_per_additional_user?: number;
  is_shared_account?: boolean;
  family_features?: string;
  usage_restrictions?: string;
  primary_holder_name?: string;
  primary_holder_email?: string;
  primary_holder_phone?: string;
}

type Renewal = AccountRenewal | SalesRenewal;

export const RemindersManagement: React.FC = () => {
  const [accountRenewals, setAccountRenewals] = useState<AccountRenewal[]>([]);
  const [salesRenewals, setSalesRenewals] = useState<SalesRenewal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUrgency, setFilterUrgency] = useState<'all' | 'critical' | 'warning' | 'normal'>('all');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'contacted' | 'confirmed' | 'completed' | 'declined'>('all');
  const [filterType, setFilterType] = useState<'all' | 'accounts' | 'sales'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'customer' | 'urgency'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await generateAccountRenewals();
      await generateSalesRenewals();
    };
    loadData();
  }, []);

  const generateAccountRenewals = async () => {
    try {
      const accounts = await fetchExpiringAccounts(3); // Get accounts expiring in next 3 days
      const now = new Date();

      console.log('🔍 Processing accounts for renewals (3 days):', accounts.length);

      const renewals: AccountRenewal[] = accounts
        .map((account: RawAccountData) => {
          const renewalDateStr = account.renewal_date || account.renewalDate;
          if (!renewalDateStr) return null;
          
          const renewalDate = new Date(renewalDateStr);
          const daysRemaining = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const cost = account.cost || account.price || 0;
          const weeklyCost = account.subscription_type === 'monthly' 
            ? cost / 4.33 
            : cost / 52;

          let urgencyLevel: 'critical' | 'warning' | 'normal' = 'normal';
          if (daysRemaining <= 0) urgencyLevel = 'critical';
          else if (daysRemaining <= 1) urgencyLevel = 'warning';

          console.log('📅 Account renewal:', {
            product: account.product_name,
            renewalDate: renewalDateStr,
            daysRemaining,
            urgencyLevel
          });

          if (daysRemaining <= 3) {
            const accountData: Account = {
              id: account.id || '',
              productName: account.product_name || account.productName || 'Unknown Product',
              label: account.label || '',
              email: account.email || '',
              renewalStatus: (account.renewal_status as Account['renewalStatus']) || 'renewable',
              daysUntilRenewal: daysRemaining,
              cost: cost,
              description: account.description || '',
              createdAt: account.created_at ? new Date(account.created_at) : new Date(),
              updatedAt: account.updated_at ? new Date(account.updated_at) : new Date(),
              isActive: Boolean(account.is_active),
              serviceType: (account.service_type as Account['serviceType']) || 'other',
              subscriptionType: (account.subscription_type as Account['subscriptionType']) || 'monthly',
              renewalDate: renewalDate,
              categoryId: account.category_id || undefined,
              brand: account.brand || undefined,
              maxUserSlots: Number(account.max_user_slots) || 1,
              availableSlots: Number(account.available_slots) || 0,
              currentUsers: Number(account.current_users) || 0,
              costPerAdditionalUser: account.cost_per_additional_user ? Number(account.cost_per_additional_user) : undefined,
              isSharedAccount: Boolean(account.is_shared_account),
              familyFeatures: account.family_features && typeof account.family_features === 'string' 
                ? JSON.parse(account.family_features) : [],
              usageRestrictions: account.usage_restrictions && typeof account.usage_restrictions === 'string'
                ? JSON.parse(account.usage_restrictions) : [],
              primaryHolder: {
                name: account.primary_holder_name || '',
                email: account.primary_holder_email || '',
                phone: account.primary_holder_phone || undefined
              },
              userSlots: []
            };

            return {
              id: account.id || '',
              type: 'account' as const,
              accountName: account.product_name || account.productName || 'Unknown Product',
              renewalDate: renewalDate,
              weeklyCost,
              daysRemaining: Math.max(0, daysRemaining),
              urgencyLevel,
              isCompleted: false,
              account: accountData
            };
          }
          return null;
        })
        .filter((renewal: AccountRenewal | null): renewal is AccountRenewal => renewal !== null)
        .sort((a: AccountRenewal, b: AccountRenewal) => a.daysRemaining - b.daysRemaining);

      console.log('🔔 Generated account renewals (3 days):', renewals.length);
      setAccountRenewals(renewals);
    } catch (error) {
      console.error('Error generating account renewals:', error);
      setAccountRenewals([]);
    }
  };

  const generateSalesRenewals = async () => {
    try {
      const { sales } = await getSalesData();
      const now = new Date();

      console.log('🔍 Processing sales for renewals:', sales.length);

      const renewals: SalesRenewal[] = sales
        .filter(sale => sale.status === 'completed')
        .map(sale => {
          const orderDate = new Date(sale.order_date);
          const renewalDate = new Date(orderDate);
          renewalDate.setFullYear(renewalDate.getFullYear() + 1);
          
          const daysUntilRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 1000));

          let urgencyLevel: 'critical' | 'warning' | 'normal' = 'normal';
          if (daysUntilRenewal <= 0) urgencyLevel = 'critical';
          else if (daysUntilRenewal <= 30) urgencyLevel = 'warning';

          console.log('📅 Sales renewal:', {
            customer: sale.customer_name,
            orderDate: sale.order_date,
            renewalDate: renewalDate.toISOString(),
            daysUntilRenewal,
            urgencyLevel
          });

          if (daysUntilRenewal <= 365) {
            return {
              id: sale.id,
              type: 'sales' as const,
              customerName: sale.customer_name,
              originalSaleDate: new Date(sale.order_date),
              renewalDate,
              saleAmount: sale.total_amount,
              status: daysUntilRenewal <= 0 ? 'pending' : 'pending',
              urgencyLevel,
              sale: {
                ...sale,
                items: Array.isArray(sale.items) ? sale.items : JSON.parse(sale.items || '[]'),
                orderDate: new Date(sale.order_date),
                customerEmail: sale.customer_email,
                customerPhone: sale.customer_phone,
              }
            };
          }
          return null;
        })
        .filter((renewal): renewal is SalesRenewal => renewal !== null)
        .sort((a, b) => a.renewalDate.getTime() - b.renewalDate.getTime());

      console.log('🔔 Generated sales renewals:', renewals.length);
      setSalesRenewals(renewals);
    } catch (error) {
      console.error('Error generating sales renewals:', error);
      setSalesRenewals([]);
    }
  };

  // Enhanced filtering logic
  const getFilteredRenewals = () => {
    let allRenewals: Renewal[] = [];
    
    if (filterType === 'all' || filterType === 'accounts') {
      allRenewals = [...allRenewals, ...accountRenewals];
    }
    if (filterType === 'all' || filterType === 'sales') {
      allRenewals = [...allRenewals, ...salesRenewals];
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      allRenewals = allRenewals.filter(renewal => {
        if (renewal.type === 'account') {
          return renewal.accountName.toLowerCase().includes(searchLower) ||
                 renewal.account.email.toLowerCase().includes(searchLower);
        } else {
          return renewal.customerName.toLowerCase().includes(searchLower) ||
                 renewal.sale.customer_email.toLowerCase().includes(searchLower);
        }
      });
    }

    // Apply urgency filter
    if (filterUrgency !== 'all') {
      allRenewals = allRenewals.filter(renewal => renewal.urgencyLevel === filterUrgency);
    }

    // Apply status filter (only for sales renewals)
    if (filterStatus !== 'all') {
      allRenewals = allRenewals.filter(renewal => {
        if (renewal.type === 'sales') {
          return renewal.status === filterStatus;
        }
        return true;
      });
    }

    // Apply completed filter
    allRenewals = allRenewals.filter(renewal => {
      if (renewal.type === 'account') {
        return showCompleted || !renewal.isCompleted;
      }
      return true;
    });

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

      allRenewals = allRenewals.filter(renewal => renewal.renewalDate >= startDate);
    }

    // Apply sorting
    allRenewals.sort((a, b) => {
      let aValue: string | number | Date, bValue: string | number | Date;

      switch (sortBy) {
        case 'date':
          aValue = a.renewalDate;
          bValue = b.renewalDate;
          break;
        case 'amount':
          aValue = a.type === 'account' ? a.weeklyCost : a.saleAmount;
          bValue = b.type === 'account' ? b.weeklyCost : b.saleAmount;
          break;
        case 'customer':
          aValue = a.type === 'account' ? a.accountName.toLowerCase() : a.customerName.toLowerCase();
          bValue = b.type === 'account' ? b.accountName.toLowerCase() : b.customerName.toLowerCase();
          break;
        case 'urgency': {
          const urgencyOrder = { critical: 3, warning: 2, normal: 1 };
          aValue = urgencyOrder[a.urgencyLevel];
          bValue = urgencyOrder[b.urgencyLevel];
          break;
        }
        default:
          aValue = a.renewalDate;
          bValue = b.renewalDate;
      }

      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    return allRenewals;
  };

  const filteredRenewals = getFilteredRenewals();
  const filteredAccountRenewals = filteredRenewals.filter((r): r is AccountRenewal => r.type === 'account');
  const filteredSalesRenewals = filteredRenewals.filter((r): r is SalesRenewal => r.type === 'sales');

  const criticalAccountRenewals = accountRenewals.filter(r => r.urgencyLevel === 'critical' && !r.isCompleted).length;
  const criticalSalesRenewals = salesRenewals.filter(r => r.urgencyLevel === 'critical').length;

  const getUrgencyColor = (urgency: 'critical' | 'warning' | 'normal') => {
    switch (urgency) {
      case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'normal': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Renewal Reminders</h1>
          <p className="text-gray-400 mt-2">Track upcoming account and sales renewals</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 rounded-lg">
            <Bell size={16} className="text-red-400" />
            <span className="text-red-300 text-sm font-medium">
              {criticalAccountRenewals + criticalSalesRenewals} Critical
            </span>
          </div>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Enhanced Search and Filter Controls */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by account name, customer name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Filter Row */}
          <div className="flex flex-wrap gap-3">
            {/* Time Period Filter */}
            <div className="relative">
              <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value as 'all' | 'today' | 'week' | 'month')}
                className="pl-10 pr-8 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[140px]"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'accounts' | 'sales')}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[120px]"
            >
              <option value="all">All Types</option>
              <option value="accounts">Accounts Only</option>
              <option value="sales">Sales Only</option>
            </select>

            {/* Urgency Filter */}
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value as 'all' | 'critical' | 'warning' | 'normal')}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[120px]"
            >
              <option value="all">All Urgency</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="normal">Normal</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'pending' | 'contacted' | 'confirmed' | 'completed' | 'declined')}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[120px]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="declined">Declined</option>
            </select>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'customer' | 'urgency')}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[140px]"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="customer">Sort by Customer</option>
              <option value="urgency">Sort by Urgency</option>
            </select>

            {/* Sort Direction */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white hover:bg-slate-600 transition-colors"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>

            {/* Show Completed Toggle */}
            <label className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="rounded bg-slate-600 border-slate-500 text-blue-600 focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-white text-sm">Show Completed</span>
            </label>
          </div>
        </div>
      </div>

      {/* Renewals Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Account Renewals */}
        <div className="bg-slate-800 rounded-lg border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Package size={20} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Account Renewals</h2>
                  <p className="text-gray-400 text-sm">Due within next 3 days</p>
                </div>
              </div>
              {criticalAccountRenewals > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-lg">
                  <AlertTriangle size={16} className="text-red-400" />
                  <span className="text-red-300 text-sm font-medium">
                    {criticalAccountRenewals} Critical
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {filteredAccountRenewals.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">All caught up!</h3>
                <p className="text-gray-400">No account renewals due in the next 3 days</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAccountRenewals.map((renewal) => (
                  <div
                    key={renewal.id}
                    className={`p-4 rounded-lg border transition-all cursor-pointer hover:bg-slate-700/50 ${getUrgencyColor(renewal.urgencyLevel)}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white">{renewal.accountName}</h3>
                      <span className="text-sm text-gray-400">
                        {renewal.daysRemaining} days remaining
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Renewal Date:</span>
                        <p className="text-white">{formatDate(renewal.renewalDate)}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Weekly Cost:</span>
                        <p className="text-white">{formatCurrency(renewal.weeklyCost)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sales Renewals */}
        <div className="bg-slate-800 rounded-lg border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <User size={20} className="text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Sales Renewals</h2>
                  <p className="text-gray-400 text-sm">Customer subscription renewals</p>
                </div>
              </div>
              {criticalSalesRenewals > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-lg">
                  <AlertTriangle size={16} className="text-red-400" />
                  <span className="text-red-300 text-sm font-medium">
                    {criticalSalesRenewals} Critical
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {filteredSalesRenewals.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">All up to date!</h3>
                <p className="text-gray-400">No pending sales renewals</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSalesRenewals.map((renewal) => (
                  <div
                    key={renewal.id}
                    className={`p-4 rounded-lg border transition-all cursor-pointer hover:bg-slate-700/50 ${getUrgencyColor(renewal.urgencyLevel)}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white">{renewal.customerName}</h3>
                      <span className="text-sm text-gray-400">
                        {formatDate(renewal.renewalDate)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Original Sale:</span>
                        <p className="text-white">{formatCurrency(renewal.saleAmount)}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Status:</span>
                        <p className="text-white capitalize">{renewal.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
