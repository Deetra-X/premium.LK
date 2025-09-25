import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AccountsManagement } from './components/AccountsManagement';
import { SalesManagement } from './components/SalesManagement';
import { CustomersManagement } from './components/CustomersManagement';
import { RemindersManagement } from './components/RemindersManagement';
import { NavigationItem } from './types/index';
import { Login } from './components/Login';
import { LockScreen } from './components/LockScreen';
import { AuthSession, clearSession, getLockState, getSavedSession, saveSession, setLockState } from './config/auth';

function App() {
  const [currentView, setCurrentView] = useState<NavigationItem>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(() => getSavedSession());
  const [locked, setLocked] = useState<boolean>(() => getLockState());

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

  // Auth handlers
  const handleLogin = (email: string) => {
    const newSession: AuthSession = { email };
    setSession(newSession);
    saveSession(newSession);
    setLocked(false);
    setLockState(false);
    // Ensure the first view after login is the dashboard
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setLocked(false);
    setLockState(false);
  };

  const handleLock = () => {
    setLocked(true);
    setLockState(true);
  };

  // Gate the app with auth/lock screens
  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  if (locked) {
    return <LockScreen onUnlock={() => { setLocked(false); setLockState(false); }} onLogout={handleLogout} email={session.email} />;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="flex">
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
          onLogout={handleLogout}
          onLock={handleLock}
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