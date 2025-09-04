const API_BASE_URL = 'http://localhost:3001';

interface ApiError {
  error: string;
  details?: string;
  code?: string;
  field?: string;
}

export async function fetchCategories() {
  try {
    console.log('🔄 Fetching categories from API...');
    const res = await fetch(`${API_BASE_URL}/api/categories`);
    
    if (!res.ok) {
      const errorData: ApiError = await res.json().catch(() => ({ error: 'Network error' }));
      console.error('❌ Failed to fetch categories:', errorData);
      throw new Error(errorData.error || 'Failed to fetch categories');
    }
    
    const data = await res.json();
    
    // Add validation to make sure we have an array
    if (!Array.isArray(data)) {
      console.error('❌ Invalid categories data format:', data);
      throw new Error('Invalid data format received from API');
    }
    
    console.log('✅ Categories fetched successfully:', data.length);
    return data;
  } catch (error) {
    console.error('🚨 Network error fetching categories:', error);
    // Return empty array instead of throwing to prevent modal from breaking
    return [];
  }
}

export interface CategoryCreateRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  serviceTypes?: string[] | string;
  service_types?: string[] | string;
}

export async function createCategory(data: CategoryCreateRequest) {
  try {
    console.log('🚀 Creating category:', data);
    
    // Ensure service_types is always an array
    const preparedData = {
      ...data,
      service_types: Array.isArray(data.service_types) ? data.service_types : [data.service_types || 'other']
    };
    
    console.log('📦 Prepared data for API:', preparedData);
    
    const res = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preparedData),
    });
    
    const responseData = await res.json();
    
    if (!res.ok) {
      console.error('❌ Category creation failed:', responseData);
      
      // Handle specific error types
      if (responseData.code === 'DUPLICATE_NAME_ERROR') {
        throw new Error(`A category named "${data.name}" already exists. Please choose a different name.`);
      } else if (responseData.code === 'VALIDATION_ERROR') {
        throw new Error(`Validation Error: ${responseData.error}`);
      } else if (responseData.code === 'REACTIVATION_ERROR') {
        // This is a new error code we're adding for when reactivation of a deleted category fails
        throw new Error(`Failed to reactivate category "${data.name}". ${responseData.error}`);
      } else {
        throw new Error(responseData.error || 'Failed to create category');
      }
    }
    
    console.log('✅ Category created successfully:', responseData);
    return responseData;
  } catch (error) {
    console.error('🚨 Error creating category:', error);
    throw error;
  }
}

export async function updateCategory(id: string, data: CategoryCreateRequest) {
  try {
    console.log('📝 Updating category:', id, data);
    const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    const responseData = await res.json();
    
    if (!res.ok) {
      console.error('❌ Category update failed:', responseData);
      
      // Handle specific error types
      if (responseData.code === 'CATEGORY_NOT_FOUND') {
        throw new Error('Category not found. It may have been deleted by another user.');
      } else if (responseData.code === 'DUPLICATE_NAME_ERROR') {
        throw new Error(`A category named "${data.name}" already exists. Please choose a different name.`);
      } else if (responseData.code === 'VALIDATION_ERROR') {
        throw new Error(`Validation Error: ${responseData.error}`);
      } else {
        throw new Error(responseData.error || 'Failed to update category');
      }
    }
    
    console.log('✅ Category updated successfully:', responseData);
    return responseData;
  } catch (error) {
    console.error('🚨 Error updating category:', error);
    throw error;
  }
}

export async function deleteCategory(id: string) {
  try {
    console.log('🗑️ Deleting category:', id);
    const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, { 
      method: 'DELETE' 
    });
    
    const responseData = await res.json();
    
    if (!res.ok) {
      console.error('❌ Category deletion failed:', responseData);
      
      // Handle specific error types
      if (responseData.code === 'CATEGORY_NOT_FOUND') {
        throw new Error('Category not found. It may have already been deleted.');
      } else if (responseData.code === 'CATEGORY_IN_USE') {
        throw new Error(responseData.error || 'Cannot delete category because it is being used by active accounts.');
      } else {
        throw new Error(responseData.error || 'Failed to delete category');
      }
    }
    
    console.log('✅ Category deleted successfully:', responseData);
    return responseData;
  } catch (error) {
    console.error('🚨 Error deleting category:', error);
    throw error;
  }
}