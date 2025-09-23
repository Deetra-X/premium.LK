import React, { useState } from 'react';
import { HARDCODED_CREDENTIALS } from '../config/auth';

interface LockScreenProps {
  onUnlock: () => void;
  onLogout: () => void;
  email?: string | null;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, onLogout, email }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password === HARDCODED_CREDENTIALS.password) {
      onUnlock();
    } else {
      setError('Incorrect password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-xl shadow-xl p-8 border border-slate-700">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">Locked</h1>
        {email && <p className="text-gray-400 text-center mb-6">Signed in as {email}</p>}
        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Enter password to unlock</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded transition-colors"
            >
              Unlock
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
