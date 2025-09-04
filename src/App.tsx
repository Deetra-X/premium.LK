import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AccountsManagement } from './components/AccountsManagement';
import { SalesManagement } from './components/SalesManagement';
import { CustomersManagement } from './components/CustomersManagement';
import { RemindersManagement } from './components/RemindersManagement';
import { PlaceholderView } from './components/PlaceholderView';
import { NavigationItem } from './types';
import { Bell } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState<NavigationItem>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'accounts':
        return <AccountsManagement />;
      case 'sales':
        return <SalesManagement />;
      case 'customers':
        return <CustomersManagement />;
      case 'reminders':
        return <RemindersManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="flex">
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
        />
        
        <div className="flex-1 lg:ml-0">
          {/* Mobile Header */}
          <div className="lg:hidden bg-slate-800 border-b border-slate-700 p-4">
            <button
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-white"
            >
              <Menu size={24} />
            </button>
          </div>
          
          {/* Main Content */}
          <main className="p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;