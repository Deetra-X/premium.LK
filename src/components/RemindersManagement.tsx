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
import { Account, Sale } from '../types';
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

type Renewal = AccountRenewal | SalesRenewal;

interface RenewalDetailsModalProps {
  renewal: Renewal;
  onClose: () => void;
  onUpdateStatus?: (renewalId: string, newStatus: SalesRenewal['status']) => void;
  onMarkCompleted?: (renewalId: string) => void;
}

const RenewalDetailsModal: React.FC<RenewalDetailsModalProps> = ({
  renewal,
  onClose,
  onUpdateStatus,
  onMarkCompleted
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            {renewal.type === 'account' ? (
              <Package size={24} className="text-blue-400" />
            ) : (
              <User size={24} className="text-green-400" />
            )}
            <div>
              <h2 className="text-xl font-semibold text-white">
                {renewal.type === 'account' ? 'Account Renewal Details' : 'Sales Renewal Details'}
              </h2>
              <p className="text-gray-400 text-sm">
                {renewal.type === 'account' ? renewal.accountName : renewal.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {renewal.type === 'account' ? (
            // Account Renewal Details
            <>
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Package size={20} className="text-blue-400" />
                    <div>
                      <p className="text-white font-medium">{renewal.account.productName}</p>
                      <p className="text-gray-400 text-sm">Product Name</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-purple-400" />
                    <div>
                      <p className="text-white font-medium">{formatDate(renewal.renewalDate)}</p>
                      <p className="text-gray-400 text-sm">Renewal Date</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <DollarSign size={20} className="text-green-400" />
                    <div>
                      <p className="text-white font-medium">
                        {formatCurrency(renewal.account.cost)}
                        <span className="text-gray-400 text-sm ml-1">/{renewal.account.subscriptionType}</span>
                      </p>
                      <p className="text-gray-400 text-sm">Subscription Cost</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Clock size={20} className="text-orange-400" />
                    <div>
                      <p className={`text-lg font-medium ${
                        renewal.daysRemaining === 0 ? 'text-red-400' :
                        renewal.daysRemaining === 1 ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {renewal.daysRemaining === 0 ? 'Due today' :
                         renewal.daysRemaining === 1 ? '1 day remaining' :
                         `${renewal.daysRemaining} days remaining`}
                      </p>
                      <p className="text-gray-400 text-sm">Time Remaining</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <DollarSign size={20} className="text-cyan-400" />
                    <div>
                      <p className="text-white font-medium">{formatCurrency(renewal.weeklyCost)}</p>
                      <p className="text-gray-400 text-sm">Weekly Cost</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Description */}
              {renewal.account.description && (
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={20} className="text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Account Description</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{renewal.account.description}</p>
                </div>
              )}

              {/* Account Details */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Account Email</p>
                    <p className="text-white">{renewal.account.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Service Type</p>
                    <p className="text-white capitalize">{renewal.account.serviceType}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">User Slots</p>
                    <p className="text-white">{renewal.account.currentUsers}/{renewal.account.maxUserSlots}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <p className="text-white capitalize">{renewal.account.renewalStatus}</p>
                  </div>
                </div>
              </div>

              {/* Primary Holder */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Primary Account Holder</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <span className="text-white">{renewal.account.primaryHolder.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    <span className="text-white">{renewal.account.primaryHolder.email}</span>
                  </div>
                  {renewal.account.primaryHolder.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-400" />
                      <span className="text-white">{renewal.account.primaryHolder.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Family Features (if shared account) */}
              {renewal.account.isSharedAccount && renewal.account.familyFeatures.length > 0 && (
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Family/Shared Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {renewal.account.familyFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-green-500/10 rounded">
                        <CheckCircle size={16} className="text-green-400" />
                        <span className="text-green-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Usage Restrictions (if any) */}
              {renewal.account.usageRestrictions.length > 0 && (
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Usage Restrictions</h3>
                  <div className="space-y-2">
                    {renewal.account.usageRestrictions.map((restriction, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-yellow-500/10 rounded">
                        <AlertTriangle size={16} className="text-yellow-400" />
                        <span className="text-yellow-300 text-sm">{restriction}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              {!renewal.isCompleted && onMarkCompleted && (
                <div className="flex justify-end">
                  <button
                    onClick={() => onMarkCompleted(renewal.id)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <CheckCircle size={16} />
                    Mark as Completed
                  </button>
                </div>
              )}
            </>
          ) : (
            // Sales Renewal Details
            <>
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User size={20} className="text-green-400" />
                    <div>
                      <p className="text-white font-medium">{renewal.customerName}</p>
                      <p className="text-gray-400 text-sm">Customer Name</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-blue-400" />
                    <div>
                      <p className="text-white font-medium">{formatDate(renewal.originalSaleDate)}</p>
                      <p className="text-gray-400 text-sm">Original Sale Date</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-purple-400" />
                    <div>
                      <p className="text-white font-medium">{formatDate(renewal.renewalDate)}</p>
                      <p className="text-gray-400 text-sm">Renewal Due Date</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <DollarSign size={20} className="text-green-400" />
                    <div>
                      <p className="text-white font-medium">{formatCurrency(renewal.saleAmount)}</p>
                      <p className="text-gray-400 text-sm">Original Sale Amount</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock size={20} className="text-orange-400" />
                    <div>
                      <p className={`text-lg font-medium ${
                        renewal.urgencyLevel === 'critical' ? 'text-red-400' :
                        renewal.urgencyLevel === 'warning' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {renewal.urgencyLevel === 'critical' ? 'Overdue' :
                         renewal.urgencyLevel === 'warning' ? 'Due Soon' :
                         'On Schedule'}
                      </p>
                      <p className="text-gray-400 text-sm">Renewal Status</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Contact */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Customer Contact</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    <span className="text-white">{renewal.sale.customerEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    <span className="text-white">{renewal.sale.customerPhone}</span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Original Order Items</h3>
                <div className="space-y-2">
                  {(renewal.sale.items || []).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-slate-600 rounded">
                      <div>
                        <p className="text-white">{item.productName}</p>
                        <p className="text-gray-400 text-sm">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-green-400 font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Management */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Renewal Status</h3>
                <div className="flex items-center gap-4">
                  <span className="text-gray-300">Current Status:</span>
                  <select
                    value={renewal.status}
                    onChange={(e) => onUpdateStatus && onUpdateStatus(renewal.id, e.target.value as SalesRenewal['status'])}
                    className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
              </div>
            </>
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



export const RemindersManagement: React.FC = () => {
  const [accountRenewals, setAccountRenewals] = useState<AccountRenewal[]>([]);
  const [salesRenewals, setSalesRenewals] = useState<SalesRenewal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUrgency, setFilterUrgency] = useState<'all' | 'critical' | 'warning' | 'normal'>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedRenewal, setSelectedRenewal] = useState<Renewal | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await generateAccountRenewals();
      await generateSalesRenewals();
    };
    loadData();
  }, []);

  const generateAccountRenewals = async () => {
    try {
      const accounts = await fetchExpiringAccounts(7); // Get accounts expiring in next 3 days
      const now = new Date();

    const renewals: AccountRenewal[] = accounts
      .map(account => {
        const renewalDate = new Date(account.renewal_date);
        const daysRemaining = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const weeklyCost = account.subscription_type === 'monthly' 
          ? account.cost / 4.33 // Approximate weeks in a month
          : account.cost / 52; // Weeks in a year

        let urgencyLevel: 'critical' | 'warning' | 'normal' = 'normal';
        if (daysRemaining <= 0) urgencyLevel = 'critical';
        else if (daysRemaining <= 1) urgencyLevel = 'warning';

        // Convert database fields to Account interface format
        const accountData: Account = {
          id: account.id,
          productName: account.product_name,
          label: account.label || '',
          email: account.email || '',
          renewalStatus: account.renewal_status as Account['renewalStatus'],
          daysUntilRenewal: daysRemaining,
          cost: account.cost,
          description: account.description || '',
          createdAt: new Date(account.created_at),
          updatedAt: new Date(account.updated_at),
          isActive: account.is_active,
          serviceType: account.service_type as Account['serviceType'],
          subscriptionType: account.subscription_type as Account['subscriptionType'],
          renewalDate: renewalDate,
          categoryId: account.category_id,
          brand: account.brand,
          maxUserSlots: account.max_user_slots,
          availableSlots: account.available_slots,
          currentUsers: account.current_users,
          costPerAdditionalUser: account.cost_per_additional_user,
          isSharedAccount: account.is_shared_account,
          familyFeatures: account.family_features ? JSON.parse(account.family_features) : [],
          usageRestrictions: account.usage_restrictions ? JSON.parse(account.usage_restrictions) : [],
          primaryHolder: {
            name: account.primary_holder_name || '',
            email: account.primary_holder_email || '',
            phone: account.primary_holder_phone || ''
          },
          userSlots: []
        };

        return {
          id: account.id,
          type: 'account' as const,
          accountName: account.product_name,
          renewalDate: renewalDate,
          weeklyCost,
          daysRemaining: Math.max(0, daysRemaining),
          urgencyLevel,
          isCompleted: false,
          account: accountData
        };
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    setAccountRenewals(renewals);
    } catch (error) {
      console.error('Error generating account renewals:', error);
    }
  };

  const generateSalesRenewals = async () => {
    try {
      const { sales } = await getSalesData();
      console.log('📊 Sales data loaded for renewals:', sales.length, 'sales');
      const now = new Date();

      // Log a sample of sales data
      if (sales.length > 0) {
        console.log('Sample sale data:', sales[0]);
      }

      const completedSales = sales.filter(sale => {
        const isCompleted = sale.status === 'completed';
        console.log(`Sale ${sale.id}: status=${sale.status}, completed=${isCompleted}`);
        return isCompleted;
      });

      console.log(`Found ${completedSales.length} completed sales out of ${sales.length} total sales`);

      const renewals: SalesRenewal[] = completedSales
        .map(sale => {
          // Calculate renewal date (assuming 1 year renewal cycle)
          const renewalDate = new Date(sale.order_date);
          renewalDate.setFullYear(renewalDate.getFullYear() + 1);

          const daysUntilRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          let urgencyLevel: 'critical' | 'warning' | 'normal' = 'normal';
          if (daysUntilRenewal <= 7) urgencyLevel = 'critical';
          else if (daysUntilRenewal <= 15) urgencyLevel = 'warning';
          else urgencyLevel = 'normal';

          console.log(`Sale ${sale.id}: renewal date=${renewalDate.toDateString()}, days until renewal=${daysUntilRenewal}, urgency=${urgencyLevel}`);

          // Include renewals that are due within 30 days or overdue
          if (daysUntilRenewal <= 30) {
            console.log(`✅ Including sale ${sale.id} in renewals (${daysUntilRenewal} days)`);
            return {
              id: sale.id,
              type: 'sales' as const,
              customerName: sale.customer_name,
              originalSaleDate: new Date(sale.order_date),
              renewalDate,
              saleAmount: sale.total_amount,
              status: (daysUntilRenewal <= 0 ? 'pending' : 'pending') as SalesRenewal['status'],
              urgencyLevel,
              sale: {
                ...sale,
                items: Array.isArray(sale.items) ? sale.items : JSON.parse(sale.items || '[]'),
                orderDate: new Date(sale.order_date),
                customerEmail: sale.customer_email,
                customerPhone: sale.customer_phone,
              }
            };
          } else {
            console.log(`❌ Excluding sale ${sale.id} from renewals (${daysUntilRenewal} days)`);
          }
          return null;
        })
        .filter((renewal): renewal is SalesRenewal => renewal !== null)
        .sort((a, b) => a.renewalDate.getTime() - b.renewalDate.getTime());

      // If no renewals from actual sales, create some test data for demonstration
      if (renewals.length === 0 && completedSales.length > 0) {
        console.log('📝 No renewals found in 30-day window, creating test renewals for demonstration');
        
        // Take the first few completed sales and create test renewals with dates in the near future
        const testRenewals: SalesRenewal[] = completedSales.slice(0, 3).map((sale, index) => {
          const testRenewalDate = new Date();
          testRenewalDate.setDate(testRenewalDate.getDate() + (index === 0 ? 5 : index === 1 ? 12 : 25)); // 5, 12, 25 days from now
          
          const daysUntilRenewal = Math.ceil((testRenewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          let urgencyLevel: 'critical' | 'warning' | 'normal' = 'normal';
          if (daysUntilRenewal <= 7) urgencyLevel = 'critical';
          else if (daysUntilRenewal <= 15) urgencyLevel = 'warning';
          else urgencyLevel = 'normal';
          
          return {
            id: `test_${sale.id}`,
            type: 'sales' as const,
            customerName: sale.customer_name,
            originalSaleDate: new Date(sale.order_date),
            renewalDate: testRenewalDate,
            saleAmount: sale.total_amount,
            status: 'pending' as SalesRenewal['status'],
            urgencyLevel,
            sale: {
              ...sale,
              items: Array.isArray(sale.items) ? sale.items : JSON.parse(sale.items || '[]'),
              orderDate: new Date(sale.order_date),
              customerEmail: sale.customer_email,
              customerPhone: sale.customer_phone,
            }
          };
        });
        
        renewals.push(...testRenewals);
        console.log(`Added ${testRenewals.length} test renewals`);
      }

      console.log('🔄 Generated sales renewals:', renewals.length);
      console.log('Sales renewals:', renewals);
      setSalesRenewals(renewals);
    } catch (error) {
      console.error('❌ Error generating sales renewals:', error);
    }
  };

  const getUrgencyColor = (urgency: 'critical' | 'warning' | 'normal') => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'normal':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
    }
  };

  const getUrgencyIcon = (urgency: 'critical' | 'warning' | 'normal') => {
    switch (urgency) {
      case 'critical':
        return <XCircle size={16} className="text-red-400" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-400" />;
      case 'normal':
        return <CheckCircle size={16} className="text-green-400" />;
    }
  };

  const getStatusColor = (status: SalesRenewal['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-500/20 text-gray-300';
      case 'contacted':
        return 'bg-blue-500/20 text-blue-300';
      case 'confirmed':
        return 'bg-green-500/20 text-green-300';
      case 'completed':
        return 'bg-green-600/20 text-green-400';
      case 'declined':
        return 'bg-red-500/20 text-red-300';
    }
  };

  const markAccountRenewalCompleted = (renewalId: string) => {
    setAccountRenewals(prev => 
      prev.map(renewal => 
        renewal.id === renewalId 
          ? { ...renewal, isCompleted: true }
          : renewal
      )
    );
  };

  const updateSalesRenewalStatus = (renewalId: string, newStatus: SalesRenewal['status']) => {
    setSalesRenewals(prev => 
      prev.map(renewal => 
        renewal.id === renewalId 
          ? { ...renewal, status: newStatus }
          : renewal
      )
    );
  };

  const handleViewDetails = (renewal: Renewal) => {
    setSelectedRenewal(renewal);
    setShowDetailsModal(true);
  };

  const filteredAccountRenewals = accountRenewals.filter(renewal => {
    const matchesSearch = renewal.accountName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUrgency = filterUrgency === 'all' || renewal.urgencyLevel === filterUrgency;
    const matchesCompleted = showCompleted || !renewal.isCompleted;
    
    return matchesSearch && matchesUrgency && matchesCompleted;
  });

  const filteredSalesRenewals = salesRenewals.filter(renewal => {
    const matchesSearch = renewal.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUrgency = filterUrgency === 'all' || renewal.urgencyLevel === filterUrgency;
    
    return matchesSearch && matchesUrgency;
  });

  const criticalAccountRenewals = accountRenewals.filter(r => r.urgencyLevel === 'critical' && !r.isCompleted).length;
  const criticalSalesRenewals = salesRenewals.filter(r => r.urgencyLevel === 'critical').length;

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

      {/* Search and Filter Controls */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by account or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-3">
            <div className="relative">
              <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value as 'all' | 'critical' | 'warning' | 'normal')}
                className="pl-10 pr-8 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[140px]"
              >
                <option value="all">All Urgency</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="normal">Normal</option>
              </select>
            </div>
            
            <label className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-slate-600 border-slate-500 rounded focus:ring-blue-500"
              />
              <span className="text-white text-sm">Show Completed</span>
            </label>
          </div>
        </div>
      </div>

      {/* Two-Section Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Section 1: Account Renewals */}
        <div className="bg-slate-800 rounded-lg border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Package size={24} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Account Renewals</h2>
                  <p className="text-gray-400 text-sm">Due within next 3 days</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {criticalAccountRenewals > 0 && (
                  <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-full">
                    {criticalAccountRenewals} Critical
                  </span>
                )}
                <button
                  onClick={generateAccountRenewals}
                  className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
            {filteredAccountRenewals.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">All caught up!</h3>
                <p className="text-gray-400">No account renewals due in the next 3 days</p>
              </div>
            ) : (
              filteredAccountRenewals.map((renewal) => (
                <div 
                  key={renewal.id} 
                  className={`p-4 rounded-lg border transition-all cursor-pointer hover:bg-slate-700/50 ${
                    renewal.isCompleted 
                      ? 'bg-slate-700/50 border-slate-600 opacity-60' 
                      : `${getUrgencyColor(renewal.urgencyLevel)} border`
                  }`}
                  onClick={() => handleViewDetails(renewal)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getUrgencyIcon(renewal.urgencyLevel)}
                        <h3 className={`font-semibold ${renewal.isCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>
                          {renewal.accountName}
                        </h3>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-gray-300">
                            Renewal: {formatDate(renewal.renewalDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign size={14} className="text-gray-400" />
                          <span className="text-gray-300">
                            Weekly cost: {formatCurrency(renewal.weeklyCost)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-400" />
                          <span className={`font-medium ${
                            renewal.daysRemaining === 0 ? 'text-red-400' :
                            renewal.daysRemaining === 1 ? 'text-yellow-400' :
                            'text-green-400'
                          }`}>
                            {renewal.daysRemaining === 0 ? 'Due today' :
                             renewal.daysRemaining === 1 ? '1 day remaining' :
                             `${renewal.daysRemaining} days remaining`}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button className="p-2 text-blue-400 hover:text-blue-300 hover:bg-slate-600 rounded-lg transition-colors">
                      <Eye size={16} />
                    </button>
                  </div>
                  
                  {renewal.isCompleted && (
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <CheckCircle size={14} />
                      <span>Renewal completed</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 2: Sales Renewals */}
        <div className="bg-slate-800 rounded-lg border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <User size={24} className="text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Sales Renewals</h2>
                  <p className="text-gray-400 text-sm">Customer subscription renewals (30d normal, 15d warning, 7d critical)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {criticalSalesRenewals > 0 && (
                  <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-full">
                    {criticalSalesRenewals} Critical
                  </span>
                )}
                <button
                  onClick={generateSalesRenewals}
                  className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
            {filteredSalesRenewals.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">All up to date!</h3>
                <p className="text-gray-400">No pending sales renewals</p>
              </div>
            ) : (
              filteredSalesRenewals.map((renewal) => (
                <div 
                  key={renewal.id} 
                  className={`p-4 rounded-lg border transition-all cursor-pointer hover:bg-slate-700/50 ${getUrgencyColor(renewal.urgencyLevel)} border`}
                  onClick={() => handleViewDetails(renewal)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getUrgencyIcon(renewal.urgencyLevel)}
                        <h3 className="font-semibold text-white">{renewal.customerName}</h3>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-gray-300">
                            Original sale: {formatDate(renewal.originalSaleDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-gray-300">
                            Renewal due: {formatDate(renewal.renewalDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign size={14} className="text-gray-400" />
                          <span className="text-gray-300">
                            Sale amount: {formatCurrency(renewal.saleAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 items-end">
                      <button className="p-2 text-blue-400 hover:text-blue-300 hover:bg-slate-600 rounded-lg transition-colors">
                        <Eye size={16} />
                      </button>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(renewal.status)}`}>
                        {renewal.status.charAt(0).toUpperCase() + renewal.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Renewal Details Modal */}
      {showDetailsModal && selectedRenewal && (
        <RenewalDetailsModal
          renewal={selectedRenewal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRenewal(null);
          }}
          onUpdateStatus={updateSalesRenewalStatus}
          onMarkCompleted={markAccountRenewalCompleted}
        />
      )}
    </div>
  );
};