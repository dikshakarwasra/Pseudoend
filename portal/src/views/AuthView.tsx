import React, { useState } from 'react';
import { Terminal, ShieldCheck, Zap, Server, ArrowRight } from 'lucide-react';
import { User, Project } from '../types.js';

interface AuthViewProps {
  onAuthSuccess: (token: string, user: User, initialProject?: Project) => void;
  apiBaseUrl: string;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess, apiBaseUrl }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Authentication failed');
      }

      onAuthSuccess(data.token, data.user, data.initialProject);
    } catch (err: any) {
      setError(err.message || 'Network error connecting to API Gateway.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="max-w-4xl w-full grid md:grid-cols-2 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Left Side: Brand & Value Prop */}
        <div className="p-8 md:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/40">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Terminal className="w-6 h-6" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-white">sudoend</span>
            </div>

            <h2 className="text-xl font-bold text-white mb-2 leading-snug">
              Instant Mock Backends for Frontend Engineers
            </h2>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">
              Test and build web and mobile frontends instantly with serverless mock endpoints, dynamic Faker templates, network latency simulators, and echo handlers.
            </p>

            <div className="space-y-3.5">
              <div className="flex items-center space-x-3 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>100% Free Forever — Zero Credit Card Required</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-300">
                <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Pay-per-request Serverless with $0.00 Idle Cost</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-300">
                <Server className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Language-agnostic: React, Vue, Svelte, iOS, Flutter, cURL</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-mono mt-8">
            Powered by AWS Lambda & DynamoDB Single-Table Architecture
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="p-8 md:p-10 flex flex-col justify-center">
          <div className="flex space-x-2 bg-slate-950 p-1 rounded-lg border border-slate-800 mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(null); }}
              className={`flex-1 py-2 rounded-md transition-all ${
                !isRegister ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(null); }}
              className={`flex-1 py-2 rounded-md transition-all ${
                isRegister ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Developer Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                required
                minLength={8}
              />
              {isRegister && (
                <p className="text-[11px] text-slate-500 mt-1">Must be at least 8 characters long</p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-lg text-sm font-semibold text-black bg-emerald-400 hover:bg-emerald-300 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : isRegister ? 'Get Instant Free Access' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

