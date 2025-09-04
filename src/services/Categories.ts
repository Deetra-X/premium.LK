import { API_BASE_URL } from '../config';

/**
 * Creates a new category
 * @param categoryData - Category data to be sent to the server
 * @returns Created category object
 */
export const createCategory = async (categoryData: any) => {
  try {
    // Prepare service_types for backend
    let normalizedServiceTypes = categoryData.service_types;
    
    // If service_types is a string but not already JSON, convert to array
    if (typeof normalizedServiceTypes === 'string' && 
        !(normalizedServiceTypes.startsWith('[') && normalizedServiceTypes.endsWith(']'))) {
      normalizedServiceTypes = normalizedServiceTypes.split(',')
        .map((item: string) => item.trim())
        .filter((item: string) => item.length > 0);
    }
    
    // Prepare data with normalized service_types
    const preparedData = {
      ...categoryData,
      service_types: normalizedServiceTypes
    };
    
    console.log('Sending category data:', preparedData);
    
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preparedData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Category creation failed:', errorData);
      throw new Error(`Failed to create category: ${JSON.stringify(errorData)}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Category creation error:', error);
    throw error;
  }
};