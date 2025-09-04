
export interface Account {
  // ...existing properties...
  email: string; // Email associated with the account
  id: Int16Array;
  renewalDate?: string; // Optional renewal date for the account
  productName?: string; // Name of the product associated with the account
  isDeleting?: boolean;
  deleteFailed?: boolean;
}

