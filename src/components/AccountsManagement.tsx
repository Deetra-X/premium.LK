import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Calendar, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Users,
  User,
  Crown,
  Clock,
  Zap,
  Settings,
  Grid3X3,
  List,
  ArrowRight
} from 'lucide-react';
import { Account, ProductCategory } from '../types/index';
import { fetchAccounts, deleteAccount, updateAccount } from '../api/Accounts';
import { fetchCategories } from '../api/Categories';
import { formatCurrency, formatDate } from '../utils/dateUtils';
import { AddAccountModal } from './AddAccountModal';
import { AccountDetailsModal } from './AccountDetailsModal';
import { EditAccountModal } from './EditAccountModal';
import { CategoryManagementModal } from './CategoryManagementModal';

type ViewMode = 'categories' | 'category-detail' | 'grid' | 'list';

export const AccountsManagement: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'renewable' | 'non-renewable' | 'expired'>('all');
  const [filterType, setFilterType] = useState<'all' | 'shared' | 'individual'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('categories'); // Changed back to 'categories' as default
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showEmailDetails, setShowEmailDetails] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Fetching accounts and categories from database...');
      
      // Fetch accounts and categories with enhanced error handling
      const [accountsData, categoriesData] = await Promise.all([
        fetchAccounts().catch(err => {
          console.error('❌ Accounts API failed:', err);
          throw new Error(`Failed to fetch accounts: ${err.message}`);
        }),
        fetchCategories().catch(err => {
          console.warn('⚠️ Categories API failed, using fallback:', err);
          // Return empty array as fallback for categories
          return [];
        })
      ]);
      
      console.log('✅ Raw accounts data:', accountsData);
      console.log('✅ Raw categories data:', categoriesData);
      
      // Validate and process account data
      const validAccounts = accountsData.filter(account => {
        if (!account || !account.id || !account.productName) {
          console.warn('⚠️ Invalid account data:', account);
          return false;
        }
        return true;
      });
      
      // Process accounts to ensure all fields are properly set
      const processedAccounts = validAccounts.map(account => ({
        ...account,
        // Ensure numeric fields are properly typed
        currentUsers: account.currentUsers || 0,
        maxUserSlots: account.maxUserSlots || 1,
        availableSlots: account.availableSlots || (account.maxUserSlots || 1) - (account.currentUsers || 0),
        cost: account.cost || 0,
        // Ensure dates are proper Date objects
        renewalDate: account.renewalDate ? new Date(account.renewalDate) : new Date(),
        createdAt: account.createdAt ? new Date(account.createdAt) : new Date(),
        updatedAt: account.updatedAt ? new Date(account.updatedAt) : new Date(),
        // Ensure boolean fields
        isActive: account.isActive !== undefined ? account.isActive : true,
        isSharedAccount: account.isSharedAccount !== undefined ? account.isSharedAccount : false,
        // Ensure string fields
        renewalStatus: account.renewalStatus || 'renewable',
        serviceType: account.serviceType || 'other',
        subscriptionType: account.subscriptionType || 'monthly'
      }));
      
      if (validAccounts.length !== accountsData.length) {
        console.warn(`⚠️ ${accountsData.length - validAccounts.length} accounts were filtered out due to missing data`);
      }
      
      setAccounts(processedAccounts);
      setCategories(categoriesData);
      
      // Show success message for user feedback
      if (processedAccounts.length > 0) {
        console.log('🎉 Successfully loaded', processedAccounts.length, 'accounts and', categoriesData.length, 'categories');
      } else {
        console.warn('⚠️ No valid accounts found in database');
      }
      
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setError(`Failed to load account data from database. ${error instanceof Error ? error.message : 'Please check your connection and try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get category by ID
  const getCategoryById = (id: string): ProductCategory | undefined => {
    return categories.find(category => category.id === id);
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = (account.productName && account.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (account.label && account.label.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (account.email && account.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (account.primaryHolder && account.primaryHolder.name && account.primaryHolder.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (account.brand && account.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || account.renewalStatus === filterStatus;
    
    const matchesType = filterType === 'all' || 
                       (filterType === 'shared' && account.isSharedAccount) ||
                       (filterType === 'individual' && !account.isSharedAccount);

    // Fix category filtering - handle uncategorized accounts
    const matchesCategory = selectedCategory === 'all' || 
                           (selectedCategory === 'uncategorized' && (!account.categoryId || account.categoryId === '')) ||
                           account.categoryId === selectedCategory;
    
    return matchesSearch && matchesStatus && matchesType && matchesCategory;
  });

  const getCategoryAccountCounts = () => {
    const counts: { [key: string]: number } = {};
    
    categories.forEach(category => {
      counts[category.id] = accounts.filter(account => 
        account.categoryId === category.id && account.isActive
      ).length;
    });

    // Add uncategorized count
    const uncategorized = accounts.filter(account => 
      (!account.categoryId || !categories.find(cat => cat.id === account.categoryId)) && account.isActive
    ).length;
    
    if (uncategorized > 0) {
      counts['uncategorized'] = uncategorized;
    }

    return counts;
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setViewMode('grid'); // Set to grid when entering category detail view
  };

  const handleBackToCategories = () => {
    setSelectedCategory('all');
    setViewMode('categories');
    setSearchTerm('');
  };

  const getStatusIcon = (status: Account['renewalStatus']) => {
    switch (status) {
      case 'renewable':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'non-renewable':
        return <AlertCircle size={16} className="text-yellow-400" />;
      case 'expired':
        return <XCircle size={16} className="text-red-400" />;
    }
  };

  const getStatusColor = (status: Account['renewalStatus']) => {
    switch (status) {
      case 'renewable':
        return 'text-green-400 bg-green-400/10';
      case 'non-renewable':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'expired':
        return 'text-red-400 bg-red-400/10';
    }
  };

  const getServiceTypeIcon = (serviceType: Account['serviceType']) => {
    switch (serviceType) {
      case 'streaming': return '🎬';
      case 'music': return '🎵';
      case 'productivity': return '💼';
      case 'design': return '🎨';
      case 'storage': return '☁️';
      case 'gaming': return '🎮';
      case 'education': return '📚';
      default: return '📱';
    }
  };

  const getRenewalUrgency = (daysUntilRenewal?: number) => {
    if (!daysUntilRenewal) return '';
    if (daysUntilRenewal <= 7) return 'text-red-400';
    if (daysUntilRenewal <= 14) return 'text-yellow-400';
    return 'text-green-400';
  };

  const toggleEmailVisibility = (accountId: string) => {
    setShowEmailDetails(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  const maskEmail = (email?: string | null) => {
    if (!email || typeof email !== 'string') return 'No email';
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) return 'No email';
    const [username, domain] = trimmed.split('@');
    if (!username || !domain) return 'No email';
    if (username.length <= 2) {
      return username.length === 1 ? `*@${domain}` : `${username[0]}*@${domain}`;
    }
    const maskedUsername = username.substring(0, 2) + '*'.repeat(Math.max(0, username.length - 2));
    return `${maskedUsername}@${domain}`;
  };

  const handleEditAccount = (updatedAccount: Account) => {
    // Optimistically update UI
    setAccounts(prev => prev.map(account => 
      account.id === updatedAccount.id 
        ? { ...updatedAccount, updatedAt: new Date() }
        : account
    ));

    // Persist to backend
    (async () => {
      try {
        const toSqlDate = (d: string | Date | null | undefined) => {
          try {
            const date = d instanceof Date ? d : new Date(d || '');
            return isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
          } catch {
            return null;
          }
        };

        const payload = {
          product_name: updatedAccount.productName,
          label: updatedAccount.label || null,
          email: updatedAccount.email || null,
          renewal_status: updatedAccount.renewalStatus,
          days_until_renewal: updatedAccount.renewalStatus === 'renewable' && updatedAccount.daysUntilRenewal !== undefined
            ? updatedAccount.daysUntilRenewal
            : null,
          cost: updatedAccount.cost,
          description: updatedAccount.description || null,
          is_active: updatedAccount.isActive,
          service_type: updatedAccount.serviceType,
          subscription_type: updatedAccount.subscriptionType,
          renewal_date: updatedAccount.renewalStatus === 'renewable'
            ? toSqlDate(updatedAccount.renewalDate as unknown as string | Date | null | undefined)
            : null,
          category_id: updatedAccount.categoryId || null,
          brand: updatedAccount.brand || null,
          max_user_slots: updatedAccount.maxUserSlots,
          available_slots: updatedAccount.availableSlots,
          current_users: updatedAccount.currentUsers,
          cost_per_additional_user: updatedAccount.costPerAdditionalUser ?? null,
          is_shared_account: updatedAccount.isSharedAccount,
          family_features: updatedAccount.familyFeatures,
          usage_restrictions: updatedAccount.usageRestrictions,
          primary_holder_name: updatedAccount.primaryHolder?.name || null,
          primary_holder_email: updatedAccount.primaryHolder?.email || null,
          primary_holder_phone: updatedAccount.primaryHolder?.phone || null,
        } as const;

        await updateAccount(updatedAccount.id, payload);
        // Ensure state reflects database
        await loadData();
        console.log('✅ Account saved to database');
      } catch (err) {
        console.error('❌ Failed to save account to database:', err);
        alert('Failed to save changes to the database. Please try again.');
      }
    })();
  };

  const handleDeleteAccount = async (accountId: string) => {
    const accountToDelete = accounts.find(acc => acc.id === accountId);
    const accountName = accountToDelete?.productName || 'Unknown Account';
    
    const confirmed = confirm(`Are you sure you want to permanently delete "${accountName}"? This action cannot be undone.`);
    if (!confirmed) return;
    
    try {
      console.log('🗑️ Deleting account:', accountId, accountName);
      
      const result = await deleteAccount(accountId);
      
      if (result.success) {
        // Immediately remove from UI
        setAccounts(prev => prev.filter(acc => acc.id !== accountId));
        console.log(`✅ Account "${accountName}" removed from UI`);
      }
      
    } catch (error) {
      console.error('❌ Failed to delete account:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`❌ Failed to delete account "${accountName}": ${errorMessage}`);
    }
  };

  const handleViewDetails = (account: Account) => {
    setSelectedAccount(account);
    setShowDetailsModal(true);
  };

  const handleEditClick = (account: Account) => {
    setSelectedAccount(account);
    setShowEditModal(true);
  };

  const handleSaveCategories = async (updatedCategories: ProductCategory[]) => {
    try {
      setCategories(updatedCategories);
      
      // Show success notification
      console.log('✅ Categories updated successfully!');
      
      // Refresh categories from database to ensure we have the latest
      const freshCategories = await fetchCategories();
      setCategories(freshCategories);
      
      // Show success feedback to user
      setTimeout(() => {
        alert('Categories updated successfully! 🎉');
      }, 100);
      
    } catch (error) {
      console.error('❌ Error refreshing categories:', error);
      alert('Categories were updated but there was an issue refreshing the data. Please refresh the page.');
    }
  };

  const renderAccountCard = (account: Account) => {
    return (
      <div key={account.id} className="bg-slate-800 rounded-lg border p-4 transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">
              {account.productName}
            </h3>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{getServiceTypeIcon(account.serviceType)}</span>
              {account.isSharedAccount && (
                <Users size={16} className="text-purple-400" />
              )}
            </div>
            <p className="text-sm text-gray-400">{account.label}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-1 bg-slate-700 rounded text-gray-300">
                {account.subscriptionType}
              </span>
              <span className="text-xs px-2 py-1 bg-slate-700 rounded text-gray-300 capitalize">
                {account.serviceType}
              </span>
              {account.brand && (
                <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                  {account.brand}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewDetails(account)}
              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
              title="View Details"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => handleEditClick(account)}
              className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Edit Account"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={() => handleDeleteAccount(account.id)}
              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              title="Delete account permanently"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        {/* Status */}
        <div className="flex items-center gap-2 mb-4">
          {getStatusIcon(account.renewalStatus)}
          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(account.renewalStatus)}`}>
            {account.renewalStatus.charAt(0).toUpperCase() + account.renewalStatus.slice(1)}
          </span>
        </div>

        {/* Primary Holder */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Crown size={14} className="text-yellow-400" />
            <span className="text-sm font-medium text-gray-300">Primary Holder</span>
          </div>
          <p className="text-sm text-white font-medium">{account.primaryHolder.name}</p>
          <div className="flex items-center justify-between">
            {(() => {
              const hasEmail = !!account.primaryHolder.email && account.primaryHolder.email.trim() !== '';
              const contactText = hasEmail
                ? (showEmailDetails[account.id] ? account.primaryHolder.email : maskEmail(account.primaryHolder.email))
                : (account.primaryHolder.phone || 'No contact');
              const badgeText = hasEmail ? 'Email' : 'Phone';
              const badgeClass = hasEmail ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300';
              return (
                <>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded ${badgeClass}`}>
                      {badgeText}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {contactText}
                    </span>
                  </div>
                  {hasEmail && (
                    <button
                      onClick={() => toggleEmailVisibility(account.id)}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                      title={showEmailDetails[account.id] ? 'Hide email' : 'Show email'}
                    >
                      {showEmailDetails[account.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* User Slots Info */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-300">User Slots</span>
            </div>
            <span className="text-xs text-gray-400">
              {account.currentUsers || 0}/{account.maxUserSlots || 0}
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((account.currentUsers || 0) / (account.maxUserSlots || 1)) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{account.currentUsers || 0} active</span>
            <span>{account.availableSlots || 0} available</span>
          </div>
        </div>

        {/* Renewal Info */}
        {account.renewalStatus === 'renewable' && account.daysUntilRenewal != null && !isNaN(account.daysUntilRenewal) && (
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-gray-400" />
            <span className={`text-sm ${getRenewalUrgency(account.daysUntilRenewal)}`}>
              {account.daysUntilRenewal} days until renewal
            </span>
          </div>
        )}

        {/* Cost */}
        <div className="flex items-center gap-2 mb-4">
          <DollarSign size={16} className="text-gray-400" />
          <span className="text-lg font-semibold text-green-400">
            {formatCurrency(account.cost || 0)}
          </span>
          <span className="text-xs text-gray-400">
            /{account.subscriptionType}
          </span>
        </div>

        {/* Features Preview */}
        {account.familyFeatures && account.familyFeatures.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-1">Key Features:</p>
            <div className="flex flex-wrap gap-1">
              {account.familyFeatures.slice(0, 2).map((feature, index) => (
                <span key={index} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                  {feature}
                </span>
              ))}
              {account.familyFeatures.length > 2 && (
                <span className="text-xs px-2 py-1 bg-slate-700 text-gray-400 rounded">
                  +{account.familyFeatures.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-xs text-gray-500 border-t border-slate-700 pt-3">
          <div className="flex justify-between">
            <span>Renewal: {formatDate(account.renewalDate)}</span>
            <span>Updated: {formatDate(account.updatedAt)}</span>
          </div>
        </div>
      </div>
    );
  };

  const activeAccountsCount = accounts.filter(acc => acc.isActive).length;
  const renewableAccountsCount = accounts.filter(acc => acc.renewalStatus === 'renewable' && acc.isActive).length;
  const expiringSoonCount = accounts.filter(acc => 
    acc.renewalStatus === 'renewable' && 
    acc.daysUntilRenewal !== undefined && 
    acc.daysUntilRenewal <= 7 && 
    acc.isActive
  ).length;
  const sharedAccountsCount = accounts.filter(acc => acc.isSharedAccount && acc.isActive).length;
  const totalUserSlots = accounts.reduce((sum, acc) => sum + (acc.currentUsers || 0), 0);
  const availableSlots = accounts.reduce((sum, acc) => sum + (acc.availableSlots || 0), 0);

  const categoryAccountCounts = getCategoryAccountCounts();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="mt-2 text-gray-400">Loading accounts...</p>
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
            <AlertCircle className="text-red-400" size={24} />
            <h3 className="text-lg font-semibold text-red-400">Connection Error</h3>
          </div>
          <p className="text-gray-300 mb-4">{error}</p>
          <div className="space-y-2 text-sm text-gray-400">
            <p>• Check if the backend server is running: <code className="bg-slate-800 px-2 py-1 rounded">npm run server</code></p>
            <p>• Verify MySQL database is running and accessible</p>
            <p>• Test the API: <a href="http://localhost:3001/api/accounts" target="_blank" className="text-blue-400 hover:underline">http://localhost:3001/api/accounts</a></p>
          </div>
          <button
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Account Management</h1>
          <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">Manage subscription accounts with detailed user slot tracking</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="hidden sm:inline">Refreshing...</span>
                <span className="sm:hidden">Refresh</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Refresh Data</span>
                <span className="sm:hidden">Refresh</span>
              </>
            )}
          </button>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
          >
            <Settings size={18} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Manage Categories</span>
            <span className="sm:hidden">Categories</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
          >
            <Plus size={18} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Add Account</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-slate-800 rounded-lg p-3 sm:p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Total Active</p>
              <p className="text-lg sm:text-xl font-bold text-white mt-1">{activeAccountsCount}</p>
            </div>
            <CheckCircle size={20} className="text-green-400 sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 sm:p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Renewable</p>
              <p className="text-lg sm:text-xl font-bold text-white mt-1">{renewableAccountsCount}</p>
            </div>
            <Calendar size={20} className="text-blue-400 sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 sm:p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Expiring Soon</p>
              <p className="text-lg sm:text-xl font-bold text-white mt-1">{expiringSoonCount}</p>
            </div>
            <AlertCircle size={20} className="text-orange-400 sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 sm:p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Shared Accounts</p>
              <p className="text-lg sm:text-xl font-bold text-white mt-1">{sharedAccountsCount}</p>
            </div>
            <Users size={20} className="text-purple-400 sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 sm:p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Active Users</p>
              <p className="text-lg sm:text-xl font-bold text-white mt-1">{totalUserSlots}</p>
            </div>
            <User size={20} className="text-cyan-400 sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 sm:p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Available Slots</p>
              <p className="text-lg sm:text-xl font-bold text-white mt-1">{availableSlots}</p>
            </div>
            <Zap size={20} className="text-yellow-400 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'categories' ? (
        // Category Buttons View (DEFAULT)
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Browse by Category</h2>
            <p className="text-gray-400">Click on a category to view its accounts</p>
          </div>

          {/* Category Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {categories.map(category => {
              const accountCount = categoryAccountCounts[category.id] || 0;
              
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`p-4 sm:p-6 rounded-lg border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg ${category.color} border hover:border-opacity-60 group`}
                >
                  <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                    <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">{category.icon}</div>
                    <h3 className="text-base sm:text-lg font-semibold">{category.name}</h3>
                    <p className="text-xs sm:text-sm opacity-80 line-clamp-2">{category.description}</p>
                    <div className="flex items-center justify-between w-full mt-2 sm:mt-4">
                      <span className="text-lg sm:text-2xl font-bold">{accountCount}</span>
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs sm:text-sm">View</span>
                        <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Uncategorized Category (if exists) */}
            {categoryAccountCounts['uncategorized'] > 0 && (
              <button
                onClick={() => handleCategoryClick('uncategorized')}
                className="p-4 sm:p-6 rounded-lg border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg bg-gray-500/20 text-gray-300 border-gray-500/30 hover:border-opacity-60 group"
              >
                <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                  <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">📂</div>
                  <h3 className="text-base sm:text-lg font-semibold">Uncategorized</h3>
                  <p className="text-xs sm:text-sm opacity-80">Accounts without a category</p>
                  <div className="flex items-center justify-between w-full mt-2 sm:mt-4">
                    <span className="text-lg sm:text-2xl font-bold">{categoryAccountCounts['uncategorized']}</span>
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs sm:text-sm">View</span>
                      <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                    </div>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      ) : (
        // Category Detail View (Grid Mode by Default)
        <div className="space-y-6">
          {/* Back Button and Category Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToCategories}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ArrowRight size={16} className="rotate-180" />
              Back to Categories
            </button>
            
            {selectedCategory !== 'all' && (
              <div className="flex items-center gap-3">
                {selectedCategory === 'uncategorized' ? (
                  <>
                    <span className="text-2xl">📂</span>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Uncategorized Accounts</h2>
                      <p className="text-gray-400">Accounts without a category assigned</p>
                    </div>
                  </>
                ) : (
                  (() => {
                    const category = getCategoryById(selectedCategory);
                    return category ? (
                      <>
                        <span className="text-2xl">{category.icon}</span>
                        <div>
                          <h2 className="text-2xl font-bold text-white">{category.name}</h2>
                          <p className="text-gray-400">{category.description}</p>
                        </div>
                      </>
                    ) : null;
                  })()
                )}
              </div>
            )}
          </div>

          {/* Search and Filter Controls */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Search accounts, holders, brands, or emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              
              {/* Filters Row */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                <div className="relative flex-1 sm:flex-none">
                  <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 sm:w-5 sm:h-5" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as 'all' | 'renewable' | 'non-renewable' | 'expired')}
                    className="w-full sm:w-auto pl-10 sm:pl-12 pr-8 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none text-sm sm:text-base"
                  >
                    <option value="all">All Status</option>
                    <option value="renewable">Renewable</option>
                    <option value="non-renewable">Non-renewable</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'shared' | 'individual')}
                  className="w-full sm:w-auto px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none text-sm sm:text-base"
                >
                  <option value="all">All Types</option>
                  <option value="shared">Shared/Family</option>
                  <option value="individual">Individual</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex bg-slate-700 rounded-lg border border-slate-600 self-start">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 sm:p-3 rounded-l-lg transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title="Grid View"
                  >
                    <Grid3X3 size={16} className="sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 sm:p-3 rounded-r-lg transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title="List View"
                  >
                    <List size={16} className="sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Accounts Display - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
            {filteredAccounts.map(renderAccountCard)}
          </div>

          {filteredAccounts.length === 0 && (
            <div className="text-center py-8 sm:py-12 col-span-full">
              <div className="bg-slate-800 rounded-full p-4 sm:p-6 w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 flex items-center justify-center">
                <Search size={24} className="text-gray-400 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No accounts found</h3>
              <p className="text-sm sm:text-base text-gray-400">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <AddAccountModal
          onClose={() => setShowAddModal(false)}
          onSuccess={loadData} // Refresh accounts list after adding
        />
      )}

      {/* Account Details Modal */}
      {showDetailsModal && selectedAccount && (
        <AccountDetailsModal
          accountId={selectedAccount.id}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedAccount(null);
          }}
        />
      )}

      {/* Edit Account Modal */}
      {showEditModal && selectedAccount && (
        <EditAccountModal
          account={selectedAccount}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAccount(null);
          }}
          onSave={handleEditAccount}
        />
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <CategoryManagementModal
          onClose={() => setShowCategoryModal(false)}
          onSave={handleSaveCategories}
        />
      )}
    </div>
  );
};