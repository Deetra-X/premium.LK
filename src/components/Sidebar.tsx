import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  ShoppingCart, 
  Bell,
  X,
  LogOut  // Add logout icon
} from 'lucide-react';
import { NavigationItem } from '../types';

interface SidebarProps {
  currentView: NavigationItem;       // Currently selected navigation item
  onViewChange: (view: NavigationItem) => void;  // Callback to change view
  isOpen: boolean;                   // Sidebar open state (for mobile)
  onToggle: () => void;              // Callback to toggle sidebar open/close (mobile)
}

// Main menu items for sidebar navigation
const menuItems = [
  { id: 'dashboard' as NavigationItem, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'accounts' as NavigationItem, label: 'Accounts', icon: UserCheck },
  { id: 'sales' as NavigationItem, label: 'Sales', icon: ShoppingCart },
  { id: 'customers' as NavigationItem, label: 'Customers', icon: Users },
  { id: 'reminders' as NavigationItem, label: 'Reminders', icon: Bell }
];

interface SidebarPropsExtended extends SidebarProps {
  onLogout: () => void; // Callback for logout button click
}

export const Sidebar: React.FC<SidebarPropsExtended> = ({ 
  currentView, 
  onViewChange, 
  isOpen, 
  onToggle,
  onLogout                          // Receive logout callback
}) => {
  return (
    <>
      {/* Mobile backdrop overlay when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}           // Clicking outside closes sidebar on mobile
        />
      )}
      
      {/* Sidebar container */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-slate-900 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Header with app name and close button on mobile */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white">Premium LK</h1>
          {/* Close button visible only on mobile */}
          <button
            onClick={onToggle}
            className="lg:hidden text-gray-400 hover:text-white"
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Navigation menu buttons */}
        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  onToggle();   // Close mobile menu when navigation item is selected
                }}
                className={`
                  w-full flex items-center px-6 py-3 text-left transition-colors duration-200
                  ${isActive 
                    ? 'bg-blue-600 text-white border-r-4 border-blue-400' 
                    : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={20} className="mr-3" />
                {item.label}
              </button>
            );
          })}

          {/* Logout button at bottom */}
          <button
            onClick={onLogout}
            className="w-full flex items-center px-6 py-3 mt-6 text-left text-red-500 hover:bg-red-700 hover:text-white transition-colors duration-200"
            aria-label="Logout"
          >
            <LogOut size={20} className="mr-3" />
            Logout
          </button>
        </nav>
      </div>
    </>
  );
};
