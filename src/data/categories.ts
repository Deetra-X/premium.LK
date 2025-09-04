// import { ProductCategory } from '../types';

// export const productCategories: ProductCategory[] = [
//   {
//     id: 'streaming',
//     name: 'Streaming Services',
//     description: 'Video and audio streaming platforms',
//     icon: '🎬',
//     color: 'bg-red-500/20 text-red-300 border-red-500/30',
//     serviceTypes: ['streaming'],
//     createdAt: new Date('2024-01-01'),
//     isActive: true
//   },
//   {
//     id: 'music',
//     name: 'Music Platforms',
//     description: 'Music streaming and audio services',
//     icon: '🎵',
//     color: 'bg-green-500/20 text-green-300 border-green-500/30',
//     serviceTypes: ['music'],
//     createdAt: new Date('2024-01-01'),
//     isActive: true
//   },
//   {
//     id: 'adobe',
//     name: 'Adobe Products',
//     description: 'Adobe Creative Suite and related services',
//     icon: '🎨',
//     color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
//     serviceTypes: ['design'],
//     createdAt: new Date('2024-01-01'),
//     isActive: true
//   },
//   {
//     id: 'microsoft',
//     name: 'Microsoft Services',
//     description: 'Microsoft Office, Azure, and productivity tools',
//     icon: '💼',
//     color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
//     serviceTypes: ['productivity'],
//     createdAt: new Date('2024-01-01'),
//     isActive: true
//   },
//   {
//     id: 'google',
//     name: 'Google Services',
//     description: 'Google Workspace, Drive, and cloud services',
//     icon: '🌐',
//     color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
//     serviceTypes: ['productivity', 'storage'],
//     createdAt: new Date('2024-01-01'),
//     isActive: true
//   },
//   {
//     id: 'cloud-storage',
//     name: 'Cloud Storage',
//     description: 'File storage and backup services',
//     icon: '☁️',
//     color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
//     serviceTypes: ['storage'],
//     createdAt: new Date('2024-01-01'),
//     isActive: true
//   },
//   {
//     id: 'gaming',
//     name: 'Gaming Platforms',
//     description: 'Gaming subscriptions and platforms',
//     icon: '🎮',
//     color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
//     serviceTypes: ['gaming'],
//     createdAt: new Date('2024-01-01'),
//     isActive: true
//   },
//   {
//     id: 'education',
//     name: 'Educational Services',
//     description: 'Learning platforms and educational tools',
//     icon: '📚',
//     color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
//     serviceTypes: ['education'],
//     createdAt: new Date('2024-01-01'),
//     isActive: true
//   },
//   {
//     id: 'design-tools',
//     name: 'Design Tools',
//     description: 'Design and creative software platforms',
//     icon: '✨',
//     color: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
//     serviceTypes: ['design'],
//     createdAt: new Date('2024-01-01'),
//     isActive: true
//   },
//   {
//     id: 'other',
//     name: 'Other Services',
//     description: 'Miscellaneous subscription services',
//     icon: '📱',
//     color: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
//     serviceTypes: ['other'],
//     createdAt: new Date('2024-01-01'),
//     isActive: true
//   }
// ];

// export const getCategories = (): ProductCategory[] => {
//   return productCategories.filter(category => category.isActive);
// };

// export const getCategoryById = (id: string): ProductCategory | undefined => {
//   return productCategories.find(category => category.id === id);
// };

// export const getCategoryByServiceType = (serviceType: string): ProductCategory | undefined => {
//   return productCategories.find(category => 
//     category.serviceTypes.includes(serviceType) && category.isActive
//   );
// };

// // Brand mapping for better categorization
// export const brandCategoryMapping: { [key: string]: string } = {
//   'netflix': 'streaming',
//   'disney': 'streaming',
//   'hulu': 'streaming',
//   'amazon prime': 'streaming',
//   'hbo': 'streaming',
//   'youtube': 'streaming',
//   'spotify': 'music',
//   'apple music': 'music',
//   'amazon music': 'music',
//   'tidal': 'music',
//   'adobe': 'adobe',
//   'microsoft': 'microsoft',
//   'office 365': 'microsoft',
//   'google': 'google',
//   'dropbox': 'cloud-storage',
//   'onedrive': 'cloud-storage',
//   'icloud': 'cloud-storage',
//   'canva': 'design-tools',
//   'figma': 'design-tools',
//   'sketch': 'design-tools'
// };

// export const getBrandCategory = (productName: string): string | undefined => {
//   const lowerProductName = productName.toLowerCase();
  
//   for (const [brand, categoryId] of Object.entries(brandCategoryMapping)) {
//     if (lowerProductName.includes(brand)) {
//       return categoryId;
//     }
//   }
  
//   return undefined;
// };
// Remove or comment out everything below:
export const productCategories: ProductCategory[] = [
  // ...all the objects...
];

// Also remove or update:
export const getCategories = (): ProductCategory[] => {
  return productCategories.filter(category => category.isActive);
};

export const getCategoryById = (id: string): ProductCategory | undefined => {
  return productCategories.find(category => category.id === id);
};

// ...and any other productCategories usage...