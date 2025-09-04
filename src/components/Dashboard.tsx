import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Calendar, AlertTriangle, Eye, RefreshCw, Clock, ShoppingCart } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { fetchAccounts } from '../api/Accounts';
import { fetchCategories } from '../api/Categories';
import { 
  fetchDashboardMetrics, 
  fetchRecentSales, 
  fetchUpcomingRenewals 
} from '../api/Dashboard';
import { formatDate, formatCurrency } from '../utils/dateUtils';
import { DashboardMetrics, Account } from '../types';

interface RecentSale {
  id: string;
  customerName: string;
  productName: string;
  price: number;
  createdAt: string;
  duration: number;
}

interface Category {
  id: string;
  name: string;
}

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeAccounts: 0,
    activeSales: 0,
    salesRevenue: 0,
    expiringSoon: 0
  });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [upcomingRenewals, setUpcomingRenewals] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'connected' | 'partial' | 'disconnected'>('disconnected');

  // Additional metrics state
  const [additionalMetrics, setAdditionalMetrics] = useState({
    totalActiveUsers: 0,
    totalAvailableSlots: 0,
    sharedAccounts: 0,
    renewableAccounts: 0,
    accountsByCategory: {} as { [key: string]: number }
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('🔄 Fetching dashboard data...');
        
        // First, always fetch accounts since this is working
        const accountsData = await fetchAccounts();
        console.log('✅ Accounts data fetched successfully:', accountsData.length, 'accounts');
        setAccounts(accountsData);
        
        // Try to fetch other data with fallbacks
        let metricsData, categoriesData, salesData, upcomingRenewalsData;
        
        try {
          // Try dashboard metrics
          metricsData = await fetchDashboardMetrics();
          console.log('✅ Dashboard metrics fetched successfully');
        } catch (metricsError) {
          console.warn('⚠️ Dashboard metrics failed, calculating from accounts:', metricsError instanceof Error ? metricsError.message : 'Unknown error');
          // Calculate metrics from accounts data
          const activeAccounts = accountsData.filter(acc => acc.isActive).length;
          const totalRevenue = accountsData.reduce((sum, acc) => sum + (acc.cost || 0), 0);
          const expiringSoon = accountsData.filter(acc => {
            if (!acc.renewalDate || !acc.isActive) return false;
            const renewalDate = new Date(acc.renewalDate);
            const now = new Date();
            const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            return renewalDate >= now && renewalDate <= sevenDays;
          }).length;
          
          metricsData = {
            activeAccounts,
            activeSales: activeAccounts,
            salesRevenue: totalRevenue,
            expiringSoon
          };
        }
        
        try {
          // Try categories
          categoriesData = await fetchCategories();
          console.log('✅ Categories data fetched successfully');
        } catch (categoriesError) {
          console.warn('⚠️ Categories failed, using fallback:', categoriesError instanceof Error ? categoriesError.message : 'Unknown error');
          // Create categories from account service types
          const serviceTypes = [...new Set(accountsData.map(acc => acc.serviceType).filter(Boolean))];
          categoriesData = serviceTypes.map((type, index) => ({
            id: `cat-${index}`,
            name: type.charAt(0).toUpperCase() + type.slice(1)
          }));
        }
        
        try {
          // Try recent sales
          salesData = await fetchRecentSales(10);
          console.log('✅ Recent sales data fetched successfully');
        } catch (salesError) {
          console.warn('⚠️ Recent sales failed, using accounts as fallback:', salesError instanceof Error ? salesError.message : 'Unknown error');
          // Use recent accounts as sales data
          salesData = accountsData
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10)
            .map(acc => ({
              id: acc.id,
              productName: acc.productName,
              customerName: acc.label || 'Customer',
              price: acc.cost || 0,
              createdAt: acc.createdAt,
              duration: acc.subscriptionType === 'annual' ? 12 : 
                       acc.subscriptionType === 'weekly' ? 0.25 : 1
            }));
        }
        
        try {
          // Try upcoming renewals
          upcomingRenewalsData = await fetchUpcomingRenewals();
          console.log('✅ Upcoming renewals data fetched successfully');
        } catch (renewalsError) {
          console.warn('⚠️ Upcoming renewals failed, calculating from accounts:', renewalsError instanceof Error ? renewalsError.message : 'Unknown error');
          // Calculate from accounts data
          const now = new Date();
          const eightDays = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);
          const fourteenDays = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
          
          upcomingRenewalsData = accountsData.filter(acc => {
            if (!acc.renewalDate || !acc.isActive) return false;
            const renewalDate = new Date(acc.renewalDate);
            return renewalDate >= eightDays && renewalDate <= fourteenDays;
          });
        }
        
        console.log('✅ All dashboard data processed successfully');
        
        // Determine server status based on what worked
        let failedAPIs = 0;
        if (!metricsData || typeof metricsData.activeAccounts === 'undefined') failedAPIs++;
        if (!categoriesData || categoriesData.length === 0) failedAPIs++;
        if (!salesData || salesData.length === 0) failedAPIs++;
        if (!upcomingRenewalsData) failedAPIs++;
        
        if (failedAPIs === 0) {
          setServerStatus('connected');
        } else if (failedAPIs <= 2) {
          setServerStatus('partial');
        } else {
          setServerStatus('disconnected');
        }
        
        // Set the data
        setMetrics(metricsData);
        setRecentSales(salesData);
        setUpcomingRenewals(upcomingRenewalsData);
        
        // Calculate additional metrics
        const totalActiveUsers = accountsData.reduce((sum: number, acc: Account) => sum + (acc.currentUsers || 0), 0);
        const totalAvailableSlots = accountsData.reduce((sum: number, acc: Account) => sum + (acc.availableSlots || 0), 0);
        const sharedAccounts = accountsData.filter((acc: Account) => acc.isSharedAccount && acc.isActive).length;
        const renewableAccounts = accountsData.filter((acc: Account) => acc.renewalStatus === 'renewable' && acc.isActive).length;
        
        // Calculate accounts by category
        const accountsByCategory: { [key: string]: number } = {};
        if (categoriesData && categoriesData.length > 0) {
          categoriesData.forEach((category: Category) => {
            const count = accountsData.filter((acc: Account) => 
              (acc.categoryId === category.id || acc.serviceType === category.name.toLowerCase()) && acc.isActive
            ).length;
            if (count > 0) {
              accountsByCategory[category.name] = count;
            }
          });
        }
        
        setAdditionalMetrics({
          totalActiveUsers,
          totalAvailableSlots,
          sharedAccounts,
          renewableAccounts,
          accountsByCategory
        });
        
      } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please make sure the backend server is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  // Calculate derived data from state
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const expiringSoonAccounts = accounts
    .filter(account => 
      account.isActive && 
      account.renewalStatus === 'renewable' &&
      new Date(account.renewalDate) <= sevenDaysFromNow &&
      new Date(account.renewalDate) >= now
    )
    .sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime())
    .slice(0, 5);

  const getDaysUntilRenewal = (renewalDate: Date | string): number => {
    const dateObj = new Date(renewalDate);
    const diffTime = dateObj.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getUrgencyColor = (days: number): string => {
    if (days <= 1) return 'text-red-400';
    if (days <= 3) return 'text-yellow-400';
    if (days <= 7) return 'text-orange-400';
    return 'text-green-400';
  };

  const getUrgencyBg = (days: number): string => {
    if (days <= 1) return 'bg-red-500/10 border-red-500/20';
    if (days <= 3) return 'bg-yellow-500/10 border-yellow-500/20';
    if (days <= 7) return 'bg-orange-500/10 border-orange-500/20';
    return 'bg-green-500/10 border-green-500/20';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-red-400" size={24} />
            <h3 className="text-lg font-semibold text-red-400">Dashboard Error</h3>
          </div>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-2">Welcome back! Here's your subscription overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${
            serverStatus === 'connected' ? 'bg-green-500/20 text-green-400' :
            serverStatus === 'partial' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              serverStatus === 'connected' ? 'bg-green-400' :
              serverStatus === 'partial' ? 'bg-yellow-400' :
              'bg-red-400'
            }`}></div>
            {serverStatus === 'connected' ? 'All Systems Online' :
             serverStatus === 'partial' ? 'Partial Data Available' :
             'Using Cached Data'}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Accounts"
          value={metrics.activeAccounts}
          icon={Users}
        />
        <MetricCard
          title="Active Users"
          value={additionalMetrics.totalActiveUsers}
          icon={Users}
        />
        <MetricCard
          title="Available Slots"
          value={additionalMetrics.totalAvailableSlots}
          icon={Clock}
        />
        <MetricCard
          title="Expiring Soon"
          value={expiringSoonAccounts.length}
          icon={AlertTriangle}
        />
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Shared Accounts"
          value={additionalMetrics.sharedAccounts}
          icon={Users}
        />
        <MetricCard
          title="Renewable Accounts"
          value={additionalMetrics.renewableAccounts}
          icon={RefreshCw}
        />
        <MetricCard
          title="Sales Revenue"
          value={formatCurrency(metrics.salesRevenue)}
          icon={DollarSign}
        />
        <MetricCard
          title="Active Sales"
          value={metrics.activeSales}
          icon={ShoppingCart}
        />
      </div>

      {/* Accounts by Category */}
      {Object.keys(additionalMetrics.accountsByCategory).length > 0 && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Accounts by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(additionalMetrics.accountsByCategory).map(([category, count]) => (
              <div key={category} className="bg-slate-700 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-400">{count}</p>
                <p className="text-sm text-gray-300 mt-1">{category}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Enhanced Expiring Soon Panel */}
        <div className="bg-slate-800 rounded-lg border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle size={24} className="text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Expiring Soon</h2>
                  <p className="text-gray-400 text-sm">Account renewals due within 7 days</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {expiringSoonAccounts.filter(acc => getDaysUntilRenewal(acc.renewalDate) <= 1).length > 0 && (
                  <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-full">
                    {expiringSoonAccounts.filter(acc => getDaysUntilRenewal(acc.renewalDate) <= 1).length} Critical
                  </span>
                )}
                <button className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
            {expiringSoonAccounts.length === 0 ? (
              <div className="text-center py-8">
                <Clock size={48} className="text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">All caught up!</h3>
                <p className="text-gray-400">No accounts expiring in the next 7 days</p>
              </div>
            ) : (
              expiringSoonAccounts.map((account) => {
                const daysLeft = getDaysUntilRenewal(account.renewalDate);
                return (
                  <div 
                    key={account.id} 
                    className={`p-4 rounded-lg border transition-all hover:bg-slate-700/50 cursor-pointer ${getUrgencyBg(daysLeft)}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle size={16} className={getUrgencyColor(daysLeft)} />
                          <h3 className="font-semibold text-white">{account.productName}</h3>
                        </div>
                        <p className="text-sm text-gray-400">{account.primaryHolder.name}</p>
                      </div>
                      <button className="p-2 text-blue-400 hover:text-blue-300 hover:bg-slate-600 rounded-lg transition-colors">
                        <Eye size={16} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Renewal Date</p>
                        <p className="text-white font-medium">{formatDate(new Date(account.renewalDate))}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Days Left</p>
                        <p className={`font-bold ${getUrgencyColor(daysLeft)}`}>
                          {daysLeft === 0 ? 'Due Today' : 
                           daysLeft === 1 ? '1 Day' : 
                           `${daysLeft} Days`}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Cost</p>
                        <p className="text-green-400 font-medium">{formatCurrency(account.cost)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Type</p>
                        <p className="text-white capitalize">{account.subscriptionType}</p>
                      </div>
                    </div>

                    {account.description && (
                      <div className="mt-3 pt-3 border-t border-slate-600">
                        <p className="text-xs text-gray-400 mb-1">Description:</p>
                        <p className="text-sm text-gray-300 line-clamp-2">{account.description}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
        {/* Enhanced Upcoming Renewals Panel */}
        <div className="bg-slate-800 rounded-lg border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Calendar size={24} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Upcoming Renewals</h2>
                  <p className="text-gray-400 text-sm">Account renewals in next 8-14 days</p>
                </div>
              </div>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
            {upcomingRenewals.length === 0 ? (
              <div className="text-center py-8">
                <Calendar size={48} className="text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No upcoming renewals</h3>
                <p className="text-gray-400">No account renewals scheduled for the next week</p>
              </div>
            ) : (
              upcomingRenewals.map((account) => {
                const daysLeft = getDaysUntilRenewal(account.renewalDate);
                return (
                  <div 
                    key={account.id} 
                    className="p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar size={16} className="text-blue-400" />
                          <h3 className="font-semibold text-white">{account.productName}</h3>
                        </div>
                        <p className="text-sm text-gray-400">{account.primaryHolder?.name || 'N/A'}</p>
                      </div>
                      <button className="p-2 text-blue-400 hover:text-blue-300 hover:bg-slate-500 rounded-lg transition-colors">
                        <Eye size={16} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Renewal Date</p>
                        <p className="text-white font-medium">{formatDate(new Date(account.renewalDate))}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">In</p>
                        <p className="text-blue-400 font-medium">{daysLeft} days</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Cost</p>
                        <p className="text-green-400 font-medium">{formatCurrency(account.cost || 0)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Users</p>
                        <p className="text-white">{account.currentUsers || 0}/{account.maxUserSlots || 0}</p>
                      </div>
                    </div>

                    {account.description && (
                      <div className="mt-3 pt-3 border-t border-slate-600">
                        <p className="text-xs text-gray-400 mb-1">Description:</p>
                        <p className="text-sm text-gray-300 line-clamp-2">{account.description}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
        {/* Recent Sales Panel */}
        <div className="bg-slate-800 rounded-lg border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <ShoppingCart size={24} className="text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Recent Sales</h2>
                  <p className="text-gray-400 text-sm">Latest subscription sales</p>
                </div>
              </div>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
            {recentSales.map((subscription) => (
              <div key={subscription.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
                <div>
                  <h3 className="font-medium text-white">{subscription.productName}</h3>
                  <p className="text-sm text-gray-400">{subscription.customerName}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(new Date(subscription.createdAt))}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-400">
                    {formatCurrency(subscription.price)}
                  </p>
                  <p className="text-xs text-gray-400">{subscription.duration} months</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};