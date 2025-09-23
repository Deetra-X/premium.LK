import React, { useState } from 'react';
import { verifyCredentials, HARDCODED_CREDENTIALS } from '../config/auth';

interface LoginProps {
  onLogin: (email: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (verifyCredentials(email, password)) {
      onLogin(email.trim());
    } else {
      setError('Invalid email or password');
    }
  };

  const useDemo = () => {
    setEmail(HARDCODED_CREDENTIALS.email);
    setPassword(HARDCODED_CREDENTIALS.password);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-xl shadow-xl p-8 border border-slate-700">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Premium LK Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="••••••••"
              required
            />
            <div className="flex items-center justify-between mt-2">
              <label className="inline-flex items-center text-sm text-gray-400">
                <input type="checkbox" className="mr-2" checked={showPassword} onChange={() => setShowPassword(!showPassword)} />
                Show password
              </label>
              <button type="button" className="text-xs text-blue-400 hover:text-blue-300" onClick={useDemo}>
                Use demo credentials
              </button>
            </div>
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded transition-colors"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
};
