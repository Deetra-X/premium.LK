import { useMemo, useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const AccountsManagement = lazy(() => import('./components/AccountsManagement').then(m => ({ default: m.AccountsManagement })));
const SalesManagement = lazy(() => import('./components/SalesManagement').then(m => ({ default: m.SalesManagement })));
const CustomersManagement = lazy(() => import('./components/CustomersManagement').then(m => ({ default: m.CustomersManagement })));
const RemindersManagement = lazy(() => import('./components/RemindersManagement').then(m => ({ default: m.RemindersManagement })));
import { NavigationItem } from './types/index';
import { Login } from './components/Login';
import { LockScreen } from './components/LockScreen';
import { AuthSession, clearSession, getLockState, getSavedSession, saveSession, setLockState } from './config/auth';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(() => getSavedSession());
  const [locked, setLocked] = useState<boolean>(() => getLockState());

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  // derive current view from URL to keep sidebar highlighting
  const currentView: NavigationItem = useMemo(() => {
    const path = location.pathname.toLowerCase();
    if (path.startsWith('/accounts')) return 'accounts';
    if (path.startsWith('/sales')) return 'sales';
    if (path.startsWith('/customers')) return 'customers';
    if (path.startsWith('/reminders')) return 'reminders';
    return 'dashboard';
  }, [location.pathname]);

  // Auth handlers
  const handleLogin = (email: string) => {
    const newSession: AuthSession = { email };
    setSession(newSession);
    saveSession(newSession);
    setLocked(false);
    setLockState(false);
    // Navigate to dashboard after login
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setLocked(false);
    setLockState(false);
    navigate('/login', { replace: true });
  };

  const handleLock = () => {
    setLocked(true);
    setLockState(true);
    navigate('/lock', { replace: true });
  };

  // App shell layout used for authenticated routes
  const AppLayout = () => (
    <div className="min-h-screen bg-slate-900">
      <div className="flex">
        <Sidebar
          currentView={currentView}
          onViewChange={(view: NavigationItem) => {
            // Navigate instead of local state
            const map: Record<NavigationItem, string> = {
              dashboard: '/dashboard',
              accounts: '/accounts',
              sales: '/sales',
              customers: '/customers',
              reminders: '/reminders',
              settings: '/settings',
            };
            navigate(map[view]);
            toggleSidebar();
          }}
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
          onLogout={handleLogout}
          onLock={handleLock}
        />

        <div className="flex-1 lg:ml-0">
          {/* Mobile Header */}
          <div className="lg:hidden bg-slate-800 border-b border-slate-700 p-4">
            <button onClick={toggleSidebar} className="text-gray-400 hover:text-white">
              <Menu size={24} />
            </button>
          </div>

          {/* Main Content */}
          <main className="p-6">
            <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );

  // Route guards: show only login or lock screens when appropriate
  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (locked) {
    return (
      <Routes>
        <Route path="/lock" element={<LockScreen onUnlock={() => { setLocked(false); setLockState(false); navigate('/dashboard', { replace: true }); }} onLogout={handleLogout} email={session.email} />} />
        <Route path="*" element={<Navigate to="/lock" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<AppLayout />}> 
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/accounts" element={<AccountsManagement />} />
        <Route path="/sales" element={<SalesManagement />} />
        <Route path="/customers" element={<CustomersManagement />} />
        <Route path="/reminders" element={<RemindersManagement />} />
        <Route path="/settings" element={<div className="text-gray-300">Settings (coming soon)</div>} />
      </Route>
      {/* prevent accessing login/lock when authed */}
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="/lock" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;