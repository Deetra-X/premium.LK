import { useContext } from 'react';
import { NotificationsContextRef } from './Notifications';

export const useNotifications = () => {
  const ctx = useContext(NotificationsContextRef);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
};
