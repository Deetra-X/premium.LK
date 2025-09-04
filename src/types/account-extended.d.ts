// Type extensions for Account type
import { Account } from '.';

declare module '.' {
  interface Account {
    id: string;
    productName: string;
    cost: number;
    availableSlots: number;
    isActive: boolean;
  }
}
