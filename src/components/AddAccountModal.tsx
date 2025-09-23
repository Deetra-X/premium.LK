import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { Account, UserSlot, ProductCategory } from '../types/index';
import { fetchCategories } from '../api/Categories';
import { createAccount } from '../api/Accounts';

interface AddAccountModalProps {
  onClose: () => void;
  onAdd?: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onSuccess?: () => void; // Callback to refresh accounts list
}

interface BackendCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  service_types: string[] | string;
  createdAt: string;
  isActive: boolean;
}

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

// Toast component for AddAccountModal
const AccountToast: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    // Longer duration for notification messages
    const duration = toast.message.includes('Account Status') ? 8000 : 6000;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, toast.message]);

  return (
    <div 
      className={`fixed top-4 right-4 z-[100] p-4 rounded-lg shadow-xl max-w-md transform transition-all duration-500 ease-in-out ${
        toast.type === 'success' 
          ? 'bg-green-600 text-white border-2 border-green-400 shadow-green-900/50' 
          : 'bg-red-600 text-white border-2 border-red-400 shadow-red-900/50'
      }`}
      style={{ 
        animation: 'slideInRight 0.3s ease-out',
        backdropFilter: 'blur(4px)',
        maxHeight: '400px',
        overflowY: 'auto'
      }}
    >
      <div className="flex items-start gap-3">
        {toast.type === 'success' ? (
          <Check size={24} className="flex-shrink-0 text-green-200" />
        ) : (
          <AlertCircle size={24} className="flex-shrink-0 text-red-200" />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium leading-6 whitespace-pre-line">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-white/20"
          aria-label="Close notification"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export const AddAccountModal: React.FC<AddAccountModalProps> = ({ onClose, onSuccess }) => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [availableServiceTypes, setAvailableServiceTypes] = useState<string[]>(['other']);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    productName: '',
    label: '',
    email: '',
    renewalStatus: 'renewable' as Account['renewalStatus'],
    daysUntilRenewal: '',
    cost: '',
    description: '',
    isActive: true,
    categoryId: '',
    serviceType: 'other' as Account['serviceType'],
    subscriptionType: 'monthly' as Account['subscriptionType'],
    renewalDate: '',
    maxUserSlots: '1',
    isSharedAccount: false,
    familyFeatures: [''],
    usageRestrictions: [''],
    costPerAdditionalUser: '',
    primaryHolder: {
      name: '',
      contactType: 'email' as 'email' | 'phone',
      email: '',
      phone: ''
    }
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Narrow payload type we send to createAccount
  type NewAccountPayload = {
    productName: string;
    label: string;
    email: string;
    renewalStatus: Account['renewalStatus'];
    daysUntilRenewal?: number;
    cost: number;
    description: string;
    isActive: boolean;
    categoryId?: string;
    serviceType: Account['serviceType'];
    subscriptionType: Account['subscriptionType'];
    renewalDate?: string; // ISO date string only when renewable
    maxUserSlots: number;
    availableSlots: number;
    currentUsers: number;
    isSharedAccount: boolean;
    familyFeatures: string[];
    usageRestrictions: string[];
    costPerAdditionalUser?: number;
    primaryHolder: Account['primaryHolder'];
    userSlots: UserSlot[];
  };

  // Toast utility functions
  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    console.log(`📢 Adding toast: ${type} - ${message}`, { id });
    setToasts(prev => {
      const newToasts = [...prev, { id, type, message }];
      console.log('Updated toasts:', newToasts);
      return newToasts;
    });
  };

  const removeToast = (id: string) => {
    console.log(`❌ Removing toast: ${id}`);
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Debug: Log toast state changes
  useEffect(() => {
    console.log('Toast state changed:', toasts);
  }, [toasts]);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const fetchedCategories = await fetchCategories();
      // Parse serviceTypes from backend format
      const parsedCategories: ProductCategory[] = fetchedCategories.map((cat: BackendCategory) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        serviceTypes: Array.isArray(cat.service_types)
          ? cat.service_types
          : typeof cat.service_types === 'string'
            ? cat.service_types.split(',').map((s: string) => s.trim()).filter((s: string) => s)
            : ['other'],
        createdAt: new Date(cat.createdAt),
        isActive: cat.isActive
      }));
      setCategories(parsedCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update available service types when category changes
  const handleCategoryChange = (categoryId: string) => {
    const selectedCategory = categories.find(cat => cat.id === categoryId);
    if (selectedCategory && selectedCategory.serviceTypes.length > 0) {
      setAvailableServiceTypes(selectedCategory.serviceTypes);
      // Reset service type to the first available option
      setFormData(prev => ({
        ...prev,
        categoryId,
        serviceType: selectedCategory.serviceTypes[0] as Account['serviceType']
      }));
    } else {
      setAvailableServiceTypes(['other']);
      setFormData(prev => ({
        ...prev,
        categoryId,
        serviceType: 'other'
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.productName.trim()) {
      newErrors.productName = 'Product name is required';
    }

    if (!formData.label.trim()) {
      newErrors.label = 'Label is required';
    }

    if (!formData.categoryId.trim()) {
      newErrors.categoryId = 'Category is required';
    }

    if (!formData.cost.trim()) {
      newErrors.cost = 'Cost is required';
    } else if (isNaN(Number(formData.cost)) || Number(formData.cost) <= 0) {
      newErrors.cost = 'Please enter a valid cost amount';
    }

    // Renewal date is only required for renewable accounts
    if (formData.renewalStatus === 'renewable') {
      if (!formData.renewalDate.trim()) {
        newErrors.renewalDate = 'Renewal date is required';
      }
    }

    if (!formData.maxUserSlots.trim()) {
      newErrors.maxUserSlots = 'Max user slots is required';
    } else if (isNaN(Number(formData.maxUserSlots))) {
      newErrors.maxUserSlots = 'Please enter a valid number';
    } else if (Number(formData.maxUserSlots) < 0) {
      newErrors.maxUserSlots = 'User slots cannot be negative';
    }

    if (!formData.primaryHolder.name.trim()) {
      newErrors.primaryHolderName = 'Primary holder name is required';
    }

    // Validate based on the selected contact type
    if (formData.primaryHolder.contactType === 'email') {
      if (!formData.primaryHolder.email.trim()) {
        newErrors.primaryHolderContact = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primaryHolder.email)) {
        newErrors.primaryHolderContact = 'Please enter a valid email address';
      }
    } else { // phone
      if (!formData.primaryHolder.phone.trim()) {
        newErrors.primaryHolderContact = 'Phone number is required';
      } else if (!/^\+?\d{10,15}$/.test(formData.primaryHolder.phone.replace(/\s+/g, ''))) {
        newErrors.primaryHolderContact = 'Please enter a valid phone number (minimum 10 digits)';
      }
    }

    if (formData.renewalStatus === 'renewable' && formData.daysUntilRenewal.trim()) {
      if (isNaN(Number(formData.daysUntilRenewal)) || Number(formData.daysUntilRenewal) < 0) {
        newErrors.daysUntilRenewal = 'Please enter a valid number of days';
      }
    }

    if (formData.costPerAdditionalUser.trim() && (isNaN(Number(formData.costPerAdditionalUser)) || Number(formData.costPerAdditionalUser) < 0)) {
      newErrors.costPerAdditionalUser = 'Please enter a valid cost amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Form submitted, starting validation...');
    console.log('Current toasts before submit:', toasts);
    
    if (!validateForm()) {
      addToast('error', '❌ Please fix the validation errors in the form before submitting');
      return;
    }

    setSaving(true);
    console.log('💾 Starting account creation process...');

    // Show immediate loading feedback with product name
    addToast('success', `⏳ Creating "${formData.productName}" account... Please wait`);

    try {
      const maxSlots = Number(formData.maxUserSlots);
      // Only compute renewal date for renewable accounts
      const formattedRenewalDate = formData.renewalStatus === 'renewable' && formData.renewalDate
        ? new Date(formData.renewalDate).toISOString().split('T')[0]
        : undefined;

      // Create primary user slot - use the appropriate contact information
      const primaryUserSlot: UserSlot = {
        id: '1',
        name: formData.primaryHolder.name,
        email: formData.primaryHolder.contactType === 'email' ? formData.primaryHolder.email : '', // Only set email if contact type is email
        accessLevel: 'admin',
        profileSettings: {
          restrictions: [],
          customSettings: {
            // Store the phone number in custom settings if contact type is phone
            ...(formData.primaryHolder.contactType === 'phone' ? { phoneNumber: formData.primaryHolder.phone } : {})
          }
        },
        isActive: true,
        joinedDate: new Date(),
        lastActive: new Date()
      };

      // Prepare primary holder data based on contact type
      const primaryHolderData: Account['primaryHolder'] = {
        name: formData.primaryHolder.name.trim(),
        // Email is required in type; use empty string when contact type is phone
        email: formData.primaryHolder.contactType === 'email' 
          ? formData.primaryHolder.email.trim() 
          : '',
        phone: formData.primaryHolder.contactType === 'phone' 
          ? formData.primaryHolder.phone.trim() || undefined 
          : undefined
      };
      
      const accountData: NewAccountPayload = {
        productName: formData.productName.trim(),
        label: formData.label.trim(),
        email: formData.primaryHolder.contactType === 'email' ? formData.primaryHolder.email.trim() : '', // Set account email to primary holder's email if contact type is email, otherwise empty string
        renewalStatus: formData.renewalStatus,
        daysUntilRenewal: formData.renewalStatus === 'renewable' && formData.daysUntilRenewal.trim() 
          ? Number(formData.daysUntilRenewal) 
          : undefined,
        cost: Number(formData.cost),
        description: formData.description.trim(),
        isActive: formData.isActive,
        categoryId: formData.categoryId,
        serviceType: formData.serviceType,
        subscriptionType: formData.subscriptionType,
        // For non-renewable/expired, do not send a renewal date
        renewalDate: formattedRenewalDate,
        maxUserSlots: maxSlots,
        availableSlots: maxSlots, // All slots available initially
        currentUsers: 0, // No slots used initially
        isSharedAccount: formData.isSharedAccount,
        familyFeatures: formData.familyFeatures.filter(f => f.trim() !== ''),
        usageRestrictions: formData.usageRestrictions.filter(r => r.trim() !== ''),
        costPerAdditionalUser: formData.costPerAdditionalUser.trim() ? Number(formData.costPerAdditionalUser) : undefined,
        primaryHolder: primaryHolderData,
        userSlots: [primaryUserSlot]
      };

  console.log('📋 Account data prepared:', accountData);
      
      const createdAccount = await createAccount(accountData);
      console.log('✅ Account created successfully:', createdAccount);

      // Clear all toasts first
      setToasts([]);
      
      // Show success messages with proper delays
      setTimeout(() => {
        addToast('success', `🎉 SUCCESS! "${accountData.productName}" account created successfully!`);
      }, 200);
      
      setTimeout(() => {
        const categoryName = categories.find(c => c.id === formData.categoryId)?.name || 'Unknown';
        const renewalText = formattedRenewalDate 
          ? new Date(formData.renewalDate).toLocaleDateString()
          : 'N/A';
        addToast('success', 
          `✅ Account "${accountData.productName}" Details:\n\n` +
          `📦 Product: ${accountData.productName}\n` +
          `🏷️ Label: ${accountData.label}\n` +
          `📂 Category: ${categoryName}\n` +
          `🔧 Service: ${accountData.serviceType}\n` +
          `💰 Cost: LKR ${accountData.cost.toLocaleString()}\n` +
          `👥 User Slots: ${accountData.currentUsers}/${accountData.maxUserSlots}\n` +
          `📅 Renewal: ${renewalText}\n` +
          `👤 Primary Holder: ${accountData.primaryHolder.name}`
        );
      }, 1500);

      // Fix the notification toast - ensure it gets added properly
      setTimeout(() => {
        console.log('🔔 Adding notification toast...');
        // Determine which contact info to display
        const contactInfo = formData.primaryHolder.contactType === 'email' 
          ? `Email: ${accountData.primaryHolder.email}`
          : `Phone: ${accountData.primaryHolder.phone}`;
        
        const notificationMessage = 
          `🔔 "${accountData.productName}" Account Status:\n\n` +
          `✓ Account is now active and ready to use\n` +
          `✓ Primary holder: ${accountData.primaryHolder.name} (${contactInfo})\n` +
          `✓ Subscription: ${accountData.subscriptionType}\n` +
          `✓ Available slots: ${accountData.availableSlots} remaining\n` +
          (formattedRenewalDate ? `✓ Renewal date: ${new Date(formData.renewalDate).toLocaleDateString()}` : '✓ Renewal date: N/A');
        
        addToast('success', notificationMessage);
        console.log('📢 Notification toast added:', notificationMessage);
      }, 3000);

      // Call callbacks
      if (onSuccess) {
        console.log('📞 Calling onSuccess callback');
        onSuccess();
      }

      // onAdd is optional and not needed since onSuccess reloads the list

      // Close modal after longer delay to show all messages
      setTimeout(() => {
        console.log('🚪 Closing modal after success');
        onClose();
      }, 6000); // Increased delay to 6 seconds
      
    } catch (error) {
      console.error('❌ Failed to create account:', error);
      
      // Clear loading toasts
      setToasts([]);
      

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.log('Error message:', errorMessage);
      
      // Show error with product name
      setTimeout(() => {
        if (errorMessage.includes('category')) {
          addToast('error', `❌ Failed to create "${formData.productName}" account:\n\nCategory Error - Please select a valid category and try again.`);
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          addToast('error', `❌ Failed to create "${formData.productName}" account:\n\nConnection Error - Cannot connect to server. Please check your internet connection.`);
        } else if (errorMessage.includes('duplicate')) {
          addToast('error', `❌ Failed to create "${formData.productName}" account:\n\nDuplicate Error - An account with this name or email already exists.`);
        } else if (errorMessage.includes('validation')) {
          addToast('error', `❌ Failed to create "${formData.productName}" account:\n\nValidation Error - Please check all required fields are properly filled.`);
        } else {
          addToast('error', `❌ Failed to create "${formData.productName}" account:\n\n${errorMessage}`);
        }
      }, 100);
      
      // Show troubleshooting after error
      setTimeout(() => {
        addToast('error', 
          `🔧 Troubleshooting for "${formData.productName}":\n\n` +
          `1. Ensure backend server is running\n` +
          `2. Check database connection status\n` +
          `3. Verify all required fields are filled\n` +
          `4. Try refreshing the page\n` +
          `5. Check browser console for details`
        );
      }, 2000);
      
    } finally {
      setSaving(false);
      console.log('🏁 Account creation process completed');
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.startsWith('primaryHolder.')) {
      const holderField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        primaryHolder: {
          ...prev.primaryHolder,
          [holderField]: value
        }
      }));
    } else {
      // If switching renewal status to non-renewable/expired, clear date and daysUntilRenewal
      if (field === 'renewalStatus' && typeof value === 'string' && value !== 'renewable') {
        setFormData(prev => ({ ...prev, [field]: value as Account['renewalStatus'], renewalDate: '', daysUntilRenewal: '' }));
      } else {
        setFormData(prev => ({ ...prev, [field]: value }));
      }
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleArrayChange = (field: 'familyFeatures' | 'usageRestrictions', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: 'familyFeatures' | 'usageRestrictions') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'familyFeatures' | 'usageRestrictions', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Toast Container - Stack toasts vertically */}
      <div className="fixed top-4 right-4 z-[200] pointer-events-none">
        <div className="flex flex-col gap-3">
          {toasts.map((toast, index) => (
            <div 
              key={toast.id} 
              className="pointer-events-auto"
              style={{ 
                position: 'relative',
                zIndex: 200 + index,
                transform: `translateY(${index * 10}px)` // Slight stagger effect
              }}
            >
              <AccountToast
                toast={toast}
                onClose={() => removeToast(toast.id)}
              />
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Add New Account</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => handleInputChange('productName', e.target.value)}
                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.productName ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="e.g., Netflix Premium, Spotify Family"
              />
              {errors.productName && (
                <p className="text-red-400 text-sm mt-1">{errors.productName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Label *
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => handleInputChange('label', e.target.value)}
                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.label ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="e.g., Netflix-Premium-001"
              />
              {errors.label && (
                <p className="text-red-400 text-sm mt-1">{errors.label}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.categoryId ? 'border-red-500' : 'border-slate-600'
                }`}
                disabled={loading}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
              {loading && (
                <p className="text-blue-400 text-sm mt-1">Loading categories...</p>
              )}
              {errors.categoryId && (
                <p className="text-red-400 text-sm mt-1">{errors.categoryId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Service Type *
              </label>
              <select
                value={formData.serviceType}
                onChange={(e) => handleInputChange('serviceType', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!formData.categoryId}
              >
                {!formData.categoryId ? (
                  <option value="">Select a category first</option>
                ) : (
                  availableServiceTypes.map(serviceType => (
                    <option key={serviceType} value={serviceType}>
                      {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}
                    </option>
                  ))
                )}
              </select>
              {!formData.categoryId && (
                <p className="text-gray-400 text-sm mt-1">Choose a category to see available service types</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Subscription Type *
              </label>
              <select
                value={formData.subscriptionType}
                onChange={(e) => handleInputChange('subscriptionType', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            <div>
              {/* Placeholder for balanced grid layout */}
            </div>
          </div>

          {/* Primary Holder Information */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Primary Account Holder</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.primaryHolder.name}
                  onChange={(e) => handleInputChange('primaryHolder.name', e.target.value)}
                  className={`w-full px-3 py-2 bg-slate-600 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.primaryHolderName ? 'border-red-500' : 'border-slate-500'
                  }`}
                  placeholder="John Smith"
                />
                {errors.primaryHolderName && (
                  <p className="text-red-400 text-sm mt-1">{errors.primaryHolderName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contact Type *
                </label>
                <select
                  value={formData.primaryHolder.contactType}
                  onChange={(e) => handleInputChange('primaryHolder.contactType', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="email">Email Address</option>
                  <option value="phone">Phone Number</option>
                </select>
              </div>

              <div className="md:col-span-2">
                {formData.primaryHolder.contactType === 'email' ? (
                  <>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.primaryHolder.email}
                      onChange={(e) => handleInputChange('primaryHolder.email', e.target.value)}
                      className={`w-full px-3 py-2 bg-slate-600 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.primaryHolderContact ? 'border-red-500' : 'border-slate-500'
                      }`}
                      placeholder="john@example.com"
                    />
                  </>
                ) : (
                  <>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.primaryHolder.phone}
                      onChange={(e) => handleInputChange('primaryHolder.phone', e.target.value)}
                      className={`w-full px-3 py-2 bg-slate-600 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.primaryHolderContact ? 'border-red-500' : 'border-slate-500'
                      }`}
                      placeholder="+94771234567"
                    />
                  </>
                )}
                {errors.primaryHolderContact && (
                  <p className="text-red-400 text-sm mt-1">{errors.primaryHolderContact}</p>
                )}
              </div>
            </div>
          </div>

          {/* Renewal and Cost Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Renewal Status *
              </label>
              <select
                value={formData.renewalStatus}
                onChange={(e) => handleInputChange('renewalStatus', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="renewable">Renewable</option>
                <option value="non-renewable">Non-renewable</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            {formData.renewalStatus === 'renewable' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Renewal Date *
                </label>
                <input
                  type="date"
                  value={formData.renewalDate}
                  onChange={(e) => handleInputChange('renewalDate', e.target.value)}
                  className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.renewalDate ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
                {errors.renewalDate && (
                  <p className="text-red-400 text-sm mt-1">{errors.renewalDate}</p>
                )}
              </div>
            )}
          </div>

          {formData.renewalStatus === 'renewable' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Days Until Renewal
              </label>
              <input
                type="number"
                min="0"
                value={formData.daysUntilRenewal}
                onChange={(e) => handleInputChange('daysUntilRenewal', e.target.value)}
                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.daysUntilRenewal ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="e.g., 30"
              />
              {errors.daysUntilRenewal && (
                <p className="text-red-400 text-sm mt-1">{errors.daysUntilRenewal}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cost (LKR) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.cost}
                onChange={(e) => handleInputChange('cost', e.target.value)}
                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.cost ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="e.g., 2400"
              />
              {errors.cost && (
                <p className="text-red-400 text-sm mt-1">{errors.cost}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max User Slots *
              </label>
              <input
                type="number"
                min="0"
                value={formData.maxUserSlots}
                onChange={(e) => handleInputChange('maxUserSlots', e.target.value)}
                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.maxUserSlots ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="e.g., 4"
              />
              {errors.maxUserSlots && (
                <p className="text-red-400 text-sm mt-1">{errors.maxUserSlots}</p>
              )}
            </div>
          </div>

          {/* Shared Account Options */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isSharedAccount"
              checked={formData.isSharedAccount}
              onChange={(e) => handleInputChange('isSharedAccount', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="isSharedAccount" className="text-sm font-medium text-gray-300">
              This is a shared/family account
            </label>
          </div>

          {formData.isSharedAccount && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cost per Additional User (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costPerAdditionalUser}
                  onChange={(e) => handleInputChange('costPerAdditionalUser', e.target.value)}
                  className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.costPerAdditionalUser ? 'border-red-500' : 'border-slate-600'
                  }`}
                  placeholder="e.g., 200"
                />
                {errors.costPerAdditionalUser && (
                  <p className="text-red-400 text-sm mt-1">{errors.costPerAdditionalUser}</p>
                )}
              </div>

              {/* Family Features */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Family/Shared Features
                </label>
                {formData.familyFeatures.map((feature, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleArrayChange('familyFeatures', index, e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 4K Ultra HD, Multiple Profiles"
                    />
                    {formData.familyFeatures.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('familyFeatures', index)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('familyFeatures')}
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                >
                  <Plus size={16} />
                  Add Feature
                </button>
              </div>

              {/* Usage Restrictions */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Usage Restrictions
                </label>
                {formData.usageRestrictions.map((restriction, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={restriction}
                      onChange={(e) => handleArrayChange('usageRestrictions', index, e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Same household required"
                    />
                    {formData.usageRestrictions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('usageRestrictions', index)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('usageRestrictions')}
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                >
                  <Plus size={16} />
                  Add Restriction
                </button>
              </div>
            </>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Additional information about this account..."
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-300">
              Account is active
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700 p-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              onClick={handleSubmit}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors font-medium ${
                saving 
                  ? 'bg-blue-800 cursor-not-allowed opacity-75' 
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              } text-white`}
            >
              <Save size={16} />
              {saving ? `Creating "${formData.productName}"...` : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Debug info in development */}
      {import.meta.env?.MODE === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black text-white p-2 text-xs rounded z-[300]">
          Toasts: {toasts.length} | Product: {formData.productName}
        </div>
      )}
      
      {/* Add CSS animation */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};