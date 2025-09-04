import { CompanyInfo } from '../types';

export const companyInfo: CompanyInfo = {
  name: 'Premium LK',
  address: {
    street: 'Colombo',
    city: 'Colombo',
    state: 'Western Province',
    zipCode: '00100',
    country: 'Sri Lanka'
  },
  phone: '+94 11 234 5678',
  email: 'Premium@gmail.lk',
  website: 'www.premium.com',
  taxId: 'VAT-00',
  logo: '🏢' // Using emoji as placeholder - in production, this would be a logo URL
};

export const getCompanyInfo = (): CompanyInfo => {
  return companyInfo;
};