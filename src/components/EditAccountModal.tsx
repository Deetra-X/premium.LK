import React, { useState } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { Account, UserSlot } from '../types/index';

interface EditAccountModalProps {
  account: Account;
  onClose: () => void;
  onSave: (account: Account) => void;
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({ account, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    productName: account.productName,
    label: account.label,
    email: account.email,
    renewalStatus: account.renewalStatus,
    daysUntilRenewal: account.daysUntilRenewal?.toString() || '',
    cost: account.cost.toString(),
    description: account.description,
    isActive: account.isActive,
    serviceType: account.serviceType,
    subscriptionType: account.subscriptionType,
    renewalDate: account.renewalDate.toISOString().split('T')[0],
    maxUserSlots: account.maxUserSlots.toString(),
    isSharedAccount: account.isSharedAccount,
    familyFeatures: [...account.familyFeatures],
    usageRestrictions: [...account.usageRestrictions],
    costPerAdditionalUser: account.costPerAdditionalUser?.toString() || '',
    primaryHolder: {
      name: account.primaryHolder.name,
      email: account.primaryHolder.email,
      phone: account.primaryHolder.phone || ''
    }
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.productName.trim()) {
      newErrors.productName = 'Product name is required';
    }

    if (!formData.label.trim()) {
      newErrors.label = 'Label is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.cost.trim()) {
      newErrors.cost = 'Cost is required';
    } else if (isNaN(Number(formData.cost)) || Number(formData.cost) <= 0) {
      newErrors.cost = 'Please enter a valid cost amount';
    }

    if (!formData.renewalDate.trim()) {
      newErrors.renewalDate = 'Renewal date is required';
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

    if (!formData.primaryHolder.email.trim()) {
      newErrors.primaryHolderEmail = 'Primary holder email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primaryHolder.email)) {
      newErrors.primaryHolderEmail = 'Please enter a valid email address';
    }

    if (formData.renewalStatus === 'renewable' && formData.daysUntilRenewal.trim()) {
      if (isNaN(Number(formData.daysUntilRenewal)) || Number(formData.daysUntilRenewal) < 0) {
        newErrors.daysUntilRenewal = 'Please enter a valid number of days';
      }
    }

    if (formData.costPerAdditionalUser.trim() && (isNaN(Number(formData.costPerAdditionalUser)) || Number(formData.costPerAdditionalUser) < 0)) {
      newErrors.costPerAdditionalUser = 'Please enter a valid cost amount';
    }

    // Check if max user slots is less than current users
    // Since primary holder doesn't count against slots, we compare against actual users (currentUsers)
    const newMaxSlots = Number(formData.maxUserSlots);
    if (newMaxSlots < account.currentUsers) {
      newErrors.maxUserSlots = `Cannot reduce slots below current users (${account.currentUsers})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const maxSlots = Number(formData.maxUserSlots);
    const renewalDate = new Date(formData.renewalDate);

    const updatedAccount: Account = {
      ...account,
      productName: formData.productName.trim(),
      label: formData.label.trim(),
      email: formData.email.trim(),
      renewalStatus: formData.renewalStatus,
      daysUntilRenewal: formData.renewalStatus === 'renewable' && formData.daysUntilRenewal.trim() 
        ? Number(formData.daysUntilRenewal) 
        : undefined,
      cost: Number(formData.cost),
      description: formData.description.trim(),
      isActive: formData.isActive,
      serviceType: formData.serviceType,
      subscriptionType: formData.subscriptionType,
      renewalDate,
      maxUserSlots: maxSlots,
      availableSlots: Math.max(0, maxSlots - account.currentUsers), // Primary holder doesn't take a slot
      isSharedAccount: formData.isSharedAccount,
      familyFeatures: formData.familyFeatures.filter(f => f.trim() !== ''),
      usageRestrictions: formData.usageRestrictions.filter(r => r.trim() !== ''),
      costPerAdditionalUser: formData.costPerAdditionalUser.trim() ? Number(formData.costPerAdditionalUser) : undefined,
      primaryHolder: {
        name: formData.primaryHolder.name.trim(),
        email: formData.primaryHolder.email.trim(),
        phone: formData.primaryHolder.phone.trim() || undefined
      }
    };

    onSave(updatedAccount);
    onClose();
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
      setFormData(prev => ({ ...prev, [field]: value }));
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
      <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Edit Account</h2>
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
                Service Type *
              </label>
              <select
                value={formData.serviceType}
                onChange={(e) => handleInputChange('serviceType', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="streaming">Streaming</option>
                <option value="music">Music</option>
                <option value="productivity">Productivity</option>
                <option value="design">Design</option>
                <option value="storage">Storage</option>
                <option value="gaming">Gaming</option>
                <option value="education">Education</option>
                <option value="other">Other</option>
              </select>
            </div>

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
          </div>

          {/* Account Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Account Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : 'border-slate-600'
              }`}
              placeholder="account@example.com"
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email}</p>
            )}
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
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.primaryHolder.email}
                  onChange={(e) => handleInputChange('primaryHolder.email', e.target.value)}
                  className={`w-full px-3 py-2 bg-slate-600 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.primaryHolderEmail ? 'border-red-500' : 'border-slate-500'
                  }`}
                  placeholder="john@example.com"
                />
                {errors.primaryHolderEmail && (
                  <p className="text-red-400 text-sm mt-1">{errors.primaryHolderEmail}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.primaryHolder.phone}
                  onChange={(e) => handleInputChange('primaryHolder.phone', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+94771234567"
                />
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
              <p className="text-xs text-gray-400 mt-1">
                Current users: {account.currentUsers}
              </p>
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};