import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Account } from '../types/index';

interface AccountDetailsModalProps {
  accountId: string;
  onClose: () => void;
}

/**
 * AccountDetailsModal fetches and displays detailed info about an account.
 */
export const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({ accountId, onClose }) => {
  const [account, setAccount] = useState<Account | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');
  // Placeholder for future per-user email visibility state
  // const [showEmails, setShowEmails] = useState<{ [key: string]: boolean }>({});

  // Fetch account details when component mounts or accountId changes
  useEffect(() => {
    async function fetchAccount() {
      // Fetch full account details by ID; use API base for dev server
      const res = await fetch(`http://localhost:3001/api/accounts/${accountId}`);
      if (res.ok) {
        const db = await res.json();
        // Map DB snake_case to frontend Account shape
        const mapped: Account = {
          id: db.id,
          productName: db.product_name,
          label: db.label,
          email: db.email,
          renewalStatus: db.renewal_status,
          daysUntilRenewal: db.days_until_renewal ?? undefined,
          cost: db.cost,
          description: db.description || '',
          createdAt: db.created_at ? new Date(db.created_at) : new Date(),
          updatedAt: db.updated_at ? new Date(db.updated_at) : new Date(),
          isActive: !!db.is_active,
          serviceType: db.service_type,
          subscriptionType: db.subscription_type,
          renewalDate: db.renewal_date ? new Date(db.renewal_date) : new Date(),
          categoryId: db.category_id || undefined,
          brand: db.brand || undefined,
          maxUserSlots: db.max_user_slots || 1,
          availableSlots: db.available_slots ?? Math.max(0, (db.max_user_slots || 1) - (db.current_users || 0)),
          currentUsers: db.current_users || 0,
          costPerAdditionalUser: db.cost_per_additional_user ?? undefined,
          isSharedAccount: !!db.is_shared_account,
          familyFeatures: Array.isArray(db.family_features) ? db.family_features : (db.family_features ? JSON.parse(db.family_features) : []),
          usageRestrictions: Array.isArray(db.usage_restrictions) ? db.usage_restrictions : (db.usage_restrictions ? JSON.parse(db.usage_restrictions) : []),
          primaryHolder: {
            name: db.primary_holder_name || '',
            email: db.primary_holder_email || '',
            phone: db.primary_holder_phone || undefined,
          },
          userSlots: [],
        };
        setAccount(mapped);
      } else {
        // handle error
      }
    }
    fetchAccount();
  }, [accountId]);

  // Toggle masked email visibility per user
  // const toggleEmailVisibility = (userId: string) => {
  //   setShowEmails(prev => ({ ...prev, [userId]: !prev[userId] }));
  // };
  // const maskEmail = (email?: string | null) => {
  //   if (!email || typeof email !== 'string') return 'No email';
  //   const trimmed = email.trim();
  //   if (!trimmed || !trimmed.includes('@')) return 'No email';
  //   const [username, domain] = trimmed.split('@');
  //   if (!username || !domain) return 'No email';
  //   if (username.length <= 2) {
  //     return username.length === 1 ? `*@${domain}` : `${username[0]}*@${domain}`;
  //   }
  //   const maskedUsername = username.substring(0, 2) + '*'.repeat(Math.max(0, username.length - 2));
  //   return `${maskedUsername}@${domain}`;
  // };

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

  // const getStatusIcon = (status: Account['renewalStatus']) => {
  //   switch (status) {
  //     case 'renewable':
  //       return <CheckCircle size={20} className="text-green-400" />;
  //     case 'non-renewable':
  //       return <AlertCircle size={20} className="text-yellow-400" />;
  //     case 'expired':
  //       return <XCircle size={20} className="text-red-400" />;
  //   }
  // };

  // const getAccessLevelIcon = (level: 'admin' | 'standard') => {
  //   return level === 'admin' ? 
  //     <Crown size={16} className="text-yellow-400" /> : 
  //     <User size={16} className="text-blue-400" />;
  // };

  // const getLastActiveColor = (lastActive?: Date) => {
  //   if (!lastActive) return 'text-gray-500';
  //   const daysSince = Math.floor((Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24));
  //   if (daysSince === 0) return 'text-green-400';
  //   if (daysSince <= 3) return 'text-yellow-400';
  //   if (daysSince <= 7) return 'text-orange-400';
  //   return 'text-red-400';
  // };

  if (!account) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
        <div className="bg-slate-800 text-white p-8 rounded-lg">Loading account...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getServiceTypeIcon(account.serviceType)}</span>
            <div>
              <h2 className="text-xl font-semibold text-white">{account.productName}</h2>
              <p className="text-gray-400 text-sm">{account.label}</p>
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
          {['overview', 'users'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'overview' ? 'Overview' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'users' && ` (${account.currentUsers || 0}/${account.maxUserSlots})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-1">Description</h3>
                <p className="text-gray-200 whitespace-pre-wrap">
                  {account.description || 'No description provided.'}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-700 rounded p-3">
                  <div className="text-gray-400 text-xs">Service Type</div>
                  <div className="text-white">{account.serviceType}</div>
                </div>
                <div className="bg-slate-700 rounded p-3">
                  <div className="text-gray-400 text-xs">Subscription</div>
                  <div className="text-white">{account.subscriptionType}</div>
                </div>
                <div className="bg-slate-700 rounded p-3">
                  <div className="text-gray-400 text-xs">Cost (LKR)</div>
                  <div className="text-white">{account.cost}</div>
                </div>
                <div className="bg-slate-700 rounded p-3">
                  <div className="text-gray-400 text-xs">Renewal Status</div>
                  <div className="text-white">{account.renewalStatus}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="text-gray-200">Users in this account</div>
              <div className="bg-slate-700 rounded p-3">
                <div className="text-gray-400 text-xs mb-1">Primary Holder</div>
                <div className="text-white">{account.primaryHolder?.name || 'N/A'}</div>
                <div className="text-gray-300 text-sm">{account.primaryHolder?.email || account.primaryHolder?.phone || 'No contact provided'}</div>
              </div>
              <div className="text-gray-400 text-sm">
                Current users: {account.currentUsers || 0} / Max slots: {account.maxUserSlots}
              </div>
              {/* If you add a users table, render the list here */}
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







/* -----------------------------------------------
 Backend API Endpoints (for integration):

 1. GET /api/accounts/:accountId
    - Retrieves detailed account info (basic details + users + features)

 2. GET /api/accounts/:accountId/users
    - Fetch user slots / access details for account

 3. POST /api/accounts/:accountId/users/:userId/email-visibility
    - Toggle masked/unmasked email visibility

 4. GET /api/accounts/:accountId/features
    - Fetch account family/shared features and usage restrictions

 5. GET /api/accounts/:accountId/renewal-status
    - Fetch subscription renewal info (status, dates, cost)

 Optional:

 6. PUT /api/accounts/:accountId
    - Update account details

 7. POST /api/accounts/:accountId/users
    - Add users to account

 8. DELETE /api/accounts/:accountId/users/:userId
    - Remove user from account

*/