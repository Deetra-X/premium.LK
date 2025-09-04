// Memory optimization utilities for preventing resource exhaustion

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Add API error handling utilities
export const safeApiCall = async <T>(
  apiCall: () => Promise<T>,
  fallback: T,
  errorMessage?: string
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    console.error(errorMessage || 'API call failed:', error);
    return fallback;
  }
};

export const isValidJsonResponse = (response: Response): boolean => {
  const contentType = response.headers.get('content-type');
  return response.ok && contentType && contentType.includes('application/json');
};

export const handleApiError = (error: any, context: string): void => {
  console.error(`${context}:`, error);
  
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    console.error('Network error - check if backend server is running');
  } else if (error.message.includes('Unexpected token')) {
    console.error('Received HTML instead of JSON - check API routes');
  }
};

export const cleanupResources = () => {
  // Force garbage collection if available
  if (window.gc) {
    window.gc();
  }
  
  // Clear any lingering timers
  const highestTimeoutId = setTimeout(() => {}, 0);
  for (let i = 0; i < highestTimeoutId; i++) {
    clearTimeout(i);
  }
};

export const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memInfo = (performance as any).memory;
    console.log('Memory Usage:', {
      used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024) + ' MB',
      total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024) + ' MB',
      limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024) + ' MB'
    });
  }
};

// Call this periodically in development
if (import.meta.env.DEV) {
  setInterval(monitorMemoryUsage, 30000); // Every 30 seconds
}
