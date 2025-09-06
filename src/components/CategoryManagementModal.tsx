import React, { useEffect, useState, useCallback } from 'react';
import { X, Plus, Edit, Trash2, Save, Folder, Tag, Check, AlertCircle } from '../utils/icons';
import { ProductCategory } from '../types';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  CategoryCreateRequest
} from './../api/Categories';

interface CategoryManagementModalProps {
  onClose: () => void;
  onSave: (categories: ProductCategory[]) => void;
}

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
  isConfirmation?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface BackendCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  service_types: string[] | string;
  created_at: string;
  is_active: boolean;
}

const Toast: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast.isConfirmation) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [onClose, toast.isConfirmation]);

  if (toast.isConfirmation) {
    // Center confirmation dialog
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 max-w-md w-full mx-4 shadow-xl">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle size={24} className="flex-shrink-0 text-red-400" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">Confirm Deletion</h3>
              <p className="text-gray-300">{toast.message}</p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={toast.onCancel}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={toast.onConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed top-4 right-4 z-[60] p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ease-in-out ${
      toast.type === 'success' 
        ? 'bg-green-600 text-white border-2 border-green-400 shadow-green-900/20' 
        : 'bg-red-600 text-white border-2 border-red-400 shadow-red-900/20'
    }`}>
      <div className="flex items-start gap-3">
        {toast.type === 'success' ? (
          <Check size={20} className="flex-shrink-0 mt-0.5 text-green-200" />
        ) : (
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5 text-red-200" />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium leading-5">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-white/10"
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  onClose,
  onSave
}) => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [newCategory, setNewCategory] = useState<Omit<ProductCategory, 'id' | 'createdAt' | 'isActive'>>({
    name: '',
    description: '',
    icon: '📱',
    color: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    serviceTypes: ['other']
  });

  const colorOptions = [
    { value: 'bg-red-500/20 text-red-300 border-red-500/30', label: 'Red', preview: 'bg-red-500' },
    { value: 'bg-blue-500/20 text-blue-300 border-blue-500/30', label: 'Blue', preview: 'bg-blue-500' },
    { value: 'bg-green-500/20 text-green-300 border-green-500/30', label: 'Green', preview: 'bg-green-500' },
    { value: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', label: 'Yellow', preview: 'bg-yellow-500' },
    { value: 'bg-purple-500/20 text-purple-300 border-purple-500/30', label: 'Purple', preview: 'bg-purple-500' },
    { value: 'bg-pink-500/20 text-pink-300 border-pink-500/30', label: 'Pink', preview: 'bg-pink-500' },
    { value: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', label: 'Indigo', preview: 'bg-indigo-500' },
    { value: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', label: 'Cyan', preview: 'bg-cyan-500' },
    { value: 'bg-orange-500/20 text-orange-300 border-orange-500/30', label: 'Orange', preview: 'bg-orange-500' },
    { value: 'bg-gray-500/20 text-gray-300 border-gray-500/30', label: 'Gray', preview: 'bg-gray-500' }
  ];

  const iconOptions = ['📱', '🎬', '🎵', '🎨', '💼', '☁️', '🎮', '📚', '✨', '🌐', '📊', '🔧', '💡', '🚀', '⚡'];

  const serviceTypeOptions = [
    'streaming', 'music', 'productivity', 'design', 'storage', 'gaming', 'education', 'other'
  ];

  // Toast utility functions
  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Enhanced load function with proper cleanup
  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading categories from database...');
      const fetched = await fetchCategories();
      
      // Parse serviceTypes if needed
      const parsed = fetched.map((cat: BackendCategory) => {
        let serviceTypes: string[] = [];
    try {
      // Default to 'other' if undefined or null
      if (!cat.service_types) {
        serviceTypes = ['other'];
      }
      // Handle array type
      else if (Array.isArray(cat.service_types)) {
        serviceTypes = cat.service_types.length > 0 ? cat.service_types : ['other'];
      } 
      // Handle string type
      else if (typeof cat.service_types === 'string') {
        // Empty string case
        if (!cat.service_types.trim()) {
          serviceTypes = ['other'];
        }
        // Handle 'other' special case
        else if (cat.service_types === 'other') {
          serviceTypes = ['other'];
        }
        // Handle JSON array strings
        else if (cat.service_types.startsWith('[') && cat.service_types.endsWith(']')) {
          try {
            const parsed = JSON.parse(cat.service_types);
            serviceTypes = Array.isArray(parsed) && parsed.length > 0 ? parsed : ['other'];
          } catch (error) {
            console.warn(`Failed to parse JSON array: ${cat.service_types}`, error);
            serviceTypes = [cat.service_types]; // Use as-is if parse fails
          }
        }
        // Handle comma-separated values
        else if (cat.service_types.includes(',')) {
          serviceTypes = cat.service_types.split(',')
            .map((s: string) => s.trim())
            .filter((s: string) => s);
            
          // If filtering removed all values, use default
          if (serviceTypes.length === 0) {
            serviceTypes = ['other'];
          }
        }
        // Handle single value
        else {
          serviceTypes = [cat.service_types];
        }
      }
      else {
        // Unknown type, use default
        serviceTypes = ['other'];
      }
    } catch (error) {
      console.warn('Failed to parse service_types for category:', cat.id, cat.service_types, error);
      serviceTypes = ['other'];
    }        return {
          ...cat,
          serviceTypes
        };
      });
      
      setCategories(parsed);
      console.log('✅ Categories loaded:', parsed.length);
    } catch (e) {
      console.error('Failed to load categories:', e);
      addToast('error', 'Failed to load categories. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Load categories on mount only, avoid unnecessary refreshes
  useEffect(() => {
    loadCategories();
    // Only refresh when explicitly requested via the refresh button
  }, [loadCategories]);

  // Force refresh from database
  const forceRefresh = () => {
    console.log('🔄 Force refreshing categories...');
    loadCategories(); // Directly call loadCategories instead of using refresh key
  };

  const resetNewCategory = () => {
    setNewCategory({
      name: '',
      description: '',
      icon: '📱',
      color: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      serviceTypes: ['other']
    });
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      addToast('error', '❌ Category name is required');
      return;
    }
    
    if (newCategory.serviceTypes.length === 0) {
      addToast('error', '❌ At least one service type must be selected');
      return;
    }
    
    try {
      console.log('🚀 Adding new category:', newCategory);
      // Ensure serviceTypes is an array
      const serviceTypesArray = Array.isArray(newCategory.serviceTypes) 
        ? newCategory.serviceTypes 
        : newCategory.serviceTypes 
          ? [newCategory.serviceTypes] 
          : ['other'];
      
      const payload: CategoryCreateRequest = {
        name: newCategory.name,
        description: newCategory.description,
        icon: newCategory.icon,
        color: newCategory.color,
        service_types: serviceTypesArray
      };
      
      console.log('📦 Sending payload to API:', payload);
      const created = await createCategory(payload);
      
      // Add to local state
      setCategories(prev => [
        ...prev,
        {
          ...created,
          serviceTypes: Array.isArray(created.service_types)
            ? created.service_types
            : typeof created.service_types === 'string'
              ? (() => {
                  try {
                    // Only parse if it looks like a JSON array
                    if (created.service_types.startsWith('[') && created.service_types.endsWith(']')) {
                      return JSON.parse(created.service_types);
                    }
                    // Handle special case for 'other'
                    else if (created.service_types === 'other') {
                      return ['other'];
                    }
                    // Handle comma-separated values
                    else if (created.service_types.includes(',')) {
                      return created.service_types.split(',').map((type: string) => type.trim());
                    } 
                    // Treat as single value
                    else {
                      return [created.service_types];
                    }
                  } catch (error) {
                    console.warn('Failed to parse service_types:', error);
                    return [String(created.service_types || 'other')];
                  }
                })()
              : []
        }
      ]);
      
      resetNewCategory();
      setShowAddForm(false);
      addToast('success', `🎉 Category "${newCategory.name}" created successfully!`);
      
      // No need to refresh immediately, this can cause UI glitches
      // We already updated the local state above
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to add category. Please try again.';
      console.error('❌ Error adding category:', e);
      
      if (errorMessage.includes('already exists')) {
        addToast('error', `❌ Category "${newCategory.name}" already exists. Please choose a different name.`);
      } else {
        addToast('error', `❌ Failed to create category: ${errorMessage}`);
      }
    }
  };

  const handleEditCategory = (category: ProductCategory) => {
    // Make sure we create a fresh object with proper defaults
    const editCategory = {
      ...category,
      // Ensure serviceTypes is an array and has at least 'other' value as default
      serviceTypes: Array.isArray(category.serviceTypes) && category.serviceTypes.length > 0
        ? [...category.serviceTypes] // Create a copy to avoid reference issues
        : ['other'] 
    };
    
    // Set editing category with sanitized data
    setEditingCategory(editCategory);
  };

  const handleSaveEdit = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      addToast('error', '❌ Category name is required');
      return;
    }
    
    if (editingCategory.serviceTypes.length === 0) {
      addToast('error', '❌ At least one service type must be selected');
      return;
    }
    
    try {
      console.log('📝 Updating category:', editingCategory);
      
      // Ensure serviceTypes is an array
      const serviceTypesArray = Array.isArray(editingCategory.serviceTypes) 
        ? editingCategory.serviceTypes 
        : editingCategory.serviceTypes 
          ? [editingCategory.serviceTypes] 
          : ['other'];
      
      const payload: CategoryCreateRequest = {
        name: editingCategory.name,
        description: editingCategory.description,
        icon: editingCategory.icon,
        color: editingCategory.color,
        service_types: serviceTypesArray
      };
      const updated = await updateCategory(editingCategory.id, payload);
      
      // Update local state
      setCategories(prev =>
        prev.map(cat =>
          cat.id === editingCategory.id
            ? {
                ...updated,
                serviceTypes: Array.isArray(updated.service_types)
                  ? updated.service_types
                  : typeof updated.service_types === 'string'
                    ? (() => {
                        try {
                          // Only parse if it looks like a JSON array
                          if (updated.service_types.startsWith('[') && updated.service_types.endsWith(']')) {
                            return JSON.parse(updated.service_types);
                          }
                          // Handle special case for 'other'
                          else if (updated.service_types === 'other') {
                            return ['other'];
                          }
                          // Handle comma-separated values
                          else if (updated.service_types.includes(',')) {
                            return updated.service_types.split(',').map((type: string) => type.trim());
                          } 
                          // Treat as single value
                          else {
                            return [updated.service_types];
                          }
                        } catch (error) {
                          console.warn('Failed to parse service_types:', error);
                          return [String(updated.service_types || 'other')];
                        }
                      })()
                    : []
              }
            : cat
        )
      );
      
      setEditingCategory(null);
      addToast('success', `✅ Category "${editingCategory.name}" updated successfully!`);
      
      // No need to refresh immediately, this can cause UI glitches
      // We already updated the local state above
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to update category. Please try again.';
      console.error('❌ Error updating category:', e);
      
      if (errorMessage.includes('already exists')) {
        addToast('error', `❌ Category name "${editingCategory.name}" is already taken. Please choose a different name.`);
      } else if (errorMessage.includes('not found')) {
        addToast('error', `❌ Category not found. It may have been deleted by another user.`);
      } else {
        addToast('error', `❌ Failed to update category: ${errorMessage}`);
      }
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const categoryToDelete = categories.find(cat => cat.id === categoryId);
    const categoryName = categoryToDelete?.name || 'Unknown';
    
    // Show confirmation dialog in center
    const confirmId = Date.now().toString();
    setToasts(prev => [...prev, {
      id: confirmId,
      type: 'error',
      message: `Are you sure you want to delete "${categoryName}"? This action cannot be undone.`,
      isConfirmation: true,
      onConfirm: () => performDelete(categoryId, categoryName, confirmId),
      onCancel: () => removeToast(confirmId)
    }]);
  };

  const performDelete = async (categoryId: string, categoryName: string, confirmToastId: string) => {
    removeToast(confirmToastId);
    
    try {
      console.log('🗑️ Deleting category (HARD):', categoryId, categoryName);
      // Hard delete is default; pass { soft: true } to soft delete if needed in future
      await deleteCategory(categoryId);
      
      // Remove from local state immediately
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      if (editingCategory?.id === categoryId) {
        setEditingCategory(null);
      }
      
      addToast('success', `🗑️ Category "${categoryName}" deleted successfully!`);
      
      // No need to refresh immediately, this can cause UI glitches
      // We already updated the local state by filtering out the deleted category
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to delete category. Please try again.';
      console.error('❌ Error deleting category:', e);
      
      if (errorMessage.includes('being used by')) {
        const accountCount = errorMessage.match(/(\d+)/)?.[1] || 'some';
        addToast('error', `❌ Cannot delete "${categoryName}" - it's being used by ${accountCount} active accounts. Remove accounts first.`);
      } else if (errorMessage.toLowerCase().includes('duplicate') || errorMessage.toLowerCase().includes('already exists')) {
        // This case should not happen on deletion but handling just in case
        addToast('error', `❌ Failed to delete "${categoryName}": This appears to be a database constraint issue.`);
      } else {
        addToast('error', `❌ Failed to delete "${categoryName}": ${errorMessage}`);
      }
    }
  };

  const handleSave = () => {
    onSave(categories);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
      
      <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Folder size={24} className="text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">Manage Categories</h2>
              <p className="text-gray-400 text-sm">Create and organize product categories</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center text-white">Loading categories...</div>
          ) : (
            <>
              {/* Add New Category Button */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Categories ({categories.length})</h3>
                <div className="flex gap-2">
                  <button
                    onClick={forceRefresh}
                    disabled={loading}
                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    🔄 Refresh
                  </button>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus size={16} />
                    Add Category
                  </button>
                </div>
              </div>

              {/* Add Category Form */}
              {showAddForm && (
                <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                  <h4 className="text-white font-medium mb-4">Add New Category</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Category Name *</label>
                      <input
                        type="text"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Adobe Products"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
                      <div className="flex flex-wrap gap-2">
                        {iconOptions.map(icon => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => setNewCategory(prev => ({ ...prev, icon }))}
                            className={`p-2 rounded border transition-colors ${
                              newCategory.icon === icon ? 'border-blue-500 bg-blue-500/20' : 'border-slate-500 hover:border-slate-400'
                            }`}
                            aria-label={`Select icon ${icon}`}
                          >
                            <span className="text-lg">{icon}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                      <textarea
                        value={newCategory.description}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Brief description of this category"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Color Theme</label>
                      <div className="grid grid-cols-5 gap-2">
                        {colorOptions.map(color => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => setNewCategory(prev => ({ ...prev, color: color.value }))}
                            className={`p-2 rounded border transition-colors ${
                              newCategory.color === color.value ? 'border-white' : 'border-slate-500 hover:border-slate-400'
                            }`}
                            aria-label={`Select color ${color.label}`}
                          >
                            <div className={`w-6 h-6 rounded ${color.preview} mx-auto`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Service Types</label>
                      <div className="flex flex-wrap gap-2">
                        {serviceTypeOptions.map(type => (
                          <label key={type} className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={newCategory.serviceTypes.includes(type)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewCategory(prev => ({ ...prev, serviceTypes: [...prev.serviceTypes, type] }));
                                } else {
                                  setNewCategory(prev => ({
                                    ...prev,
                                    serviceTypes: prev.serviceTypes.filter((t: string) => t !== type)
                                  }));
                                }
                              }}
                              className="w-4 h-4 text-blue-600 bg-slate-600 border-slate-500 rounded focus:ring-blue-500"
                              aria-label={type}
                            />
                            <span className="text-sm text-gray-300 capitalize">{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        resetNewCategory();
                        setShowAddForm(false);
                      }}
                      className="px-4 py-2 text-gray-400 hover:text-white hover:bg-slate-600 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Save size={16} />
                      Add Category
                    </button>
                  </div>
                </div>
              )}

              {/* Categories List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(category => (
                  <div key={category.id} className="bg-slate-700 rounded-lg border border-slate-600 p-4">
                    {editingCategory?.id === category.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editingCategory.name}
                          onChange={(e) =>
                            setEditingCategory((prev: BackendCategory | null) => (prev ? { ...prev, name: e.target.value } : null))
                          }
                          className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Category Name"
                          required
                        />
                        <textarea
                          value={editingCategory.description}
                          onChange={(e) =>
                            setEditingCategory((prev: BackendCategory | null) => (prev ? { ...prev, description: e.target.value } : null))
                          }
                          rows={2}
                          className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                          placeholder="Description"
                        />

                        {/* You can add icon, color, serviceTypes editing here as well */}

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingCategory(null)}
                            className="px-3 py-1 text-gray-400 hover:text-white text-sm rounded transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{category.icon}</span>
                            <div>
                              <h4 className="font-semibold text-white">{category.name}</h4>
                              <p className="text-xs text-gray-400">{(category.serviceTypes ?? []).join(', ')}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditCategory(category)}
                              className="p-1 text-gray-400 hover:text-blue-400 hover:bg-slate-600 rounded transition-colors"
                              aria-label={`Edit category ${category.name}`}
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(category.id)}
                              className="p-1 text-gray-400 hover:text-red-400 hover:bg-slate-600 rounded transition-colors"
                              aria-label={`Delete category ${category.name}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <p className="text-sm text-gray-300 mb-3">{category.description}</p>

                        <div className={`inline-block px-2 py-1 rounded text-xs ${category.color}`}>
                          <Tag size={12} className="inline mr-1" />
                          {category.name}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
