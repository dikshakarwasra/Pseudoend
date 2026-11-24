import React, { useState } from 'react';
import { Terminal, ShieldCheck, Zap, Server, ArrowRight, Eye, EyeOff, Code2 } from 'lucide-react';
import { User, Project } from '../types.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';

interface AuthViewProps {
  onAuthSuccess: (token: string, user: User, initialProject?: Project) => void;
  apiBaseUrl: string;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess, apiBaseUrl }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError(null);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { message: `Server response error (HTTP ${res.status} ${res.statusText})` };
      }

      if (!res.ok) {
        throw new Error(data.message || data.error || `Authentication failed (HTTP ${res.status})`);
      }

      onAuthSuccess(data.token, data.user, data.initialProject);
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError(`Failed to connect to API Gateway at ${apiBaseUrl}. Please verify network connection or CORS configuration.`);
      } else {
        setError(err.message || 'Network error connecting to API Gateway.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#f5f5f7] text-[#1d1d1f] relative overflow-hidden">
      {/* Soft Apple ambient background circles */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-[#e8f2fc] blur-[100px] rounded-full pointer-events-none opacity-80" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[300px] bg-[#fef3d6] blur-[100px] rounded-full pointer-events-none opacity-70" />

      <div className="max-w-4xl w-full grid md:grid-cols-12 bg-white border border-black/[0.06] rounded-[32px] shadow-apple-lg overflow-hidden relative z-10">
        
        {/* Left Side: Brand & Product Value (5 cols) */}
        <div className="md:col-span-5 p-7 sm:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#d2d2d7]/50 bg-[#fbfbfd]">
          <div>
            {/* Logo */}
            <div className="flex items-center space-x-2.5 mb-7">
              <div className="w-9 h-9 rounded-xl bg-[#0071e3] text-white flex items-center justify-center shadow-apple-blue">
                <Terminal className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg tracking-tight text-[#1d1d1f] font-mono">
                PSEUDOEND
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[#1d1d1f] mb-3 leading-snug tracking-tight">
              Intelligent Fake Server Generator
            </h1>
            <p className="text-xs text-[#6e6e73] mb-7 leading-relaxed">
              Build and test frontends without waiting for backend teams. Ephemeral serverless endpoints with dynamic schemas, chaos engineering, and instant OpenAPI import.
            </p>

            {/* Apple Store Style Feature Pills */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 rounded-2xl bg-[#e8f2fc] border border-[#d8e7f5] text-xs text-[#1d1d1f]">
                <ShieldCheck className="w-4 h-4 text-[#0071e3] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#0071e3] block">100% Free Community Tier</strong>
                  <span className="text-[#6e6e73]">Zero credit card or billing setup required</span>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-2xl bg-[#fef3d6] border border-[#faecd5] text-xs text-[#1d1d1f]">
                <Zap className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#b45309] block">Serverless Latency Simulation</strong>
                  <span className="text-[#6e6e73]">Realistic millisecond response times via AWS Lambda</span>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-2xl bg-[#f1ecfd] border border-[#e6e0f8] text-xs text-[#1d1d1f]">
                <Server className="w-4 h-4 text-[#6b21a8] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#6b21a8] block">Multi-Framework Ready</strong>
                  <span className="text-[#6e6e73]">Code snippets for React, Vue, Svelte, iOS, Flutter</span>
                </div>
              </div>
            </div>
          </div>

          {/* Illustrative endpoint snippet preview */}
          <div className="mt-8 pt-5 border-t border-[#d2d2d7]/50 font-mono text-[11px]">
            <div className="flex items-center justify-between text-[#6e6e73] mb-1.5">
              <span className="text-[10px] uppercase font-semibold flex items-center gap-1.5 text-[#1d1d1f]">
                <Code2 className="w-3.5 h-3.5 text-[#0071e3]" />
                <span>Sample Mock Endpoint</span>
              </span>
              <span className="text-[10px] text-[#15803d] font-semibold bg-[#34c759]/10 px-2 py-0.5 rounded-full border border-[#34c759]/20">
                200 OK
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-[#d2d2d7] text-[11px] text-[#1d1d1f] shadow-sm">
              <span className="text-[#0071e3] font-bold">GET</span> /mock/:projectId/api/v1/users
              <div className="text-[#6e6e73] text-[10px] mt-1 font-sans">Header: x-pseudoend-key &bull; Latency: 40ms</div>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Form (7 cols) */}
        <div className="md:col-span-7 p-7 sm:p-10 flex flex-col justify-center bg-white">
          {/* Sign In / Register Tab Toggle */}
          <div className="flex p-1 bg-[#f5f5f7] rounded-full border border-black/[0.04] mb-7" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={!isRegister}
              onClick={() => { setIsRegister(false); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${
                !isRegister 
                  ? 'bg-white text-[#1d1d1f] shadow-apple-sm' 
                  : 'text-[#6e6e73] hover:text-[#1d1d1f]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isRegister}
              onClick={() => { setIsRegister(true); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${
                isRegister 
                  ? 'bg-white text-[#1d1d1f] shadow-apple-sm' 
                  : 'text-[#6e6e73] hover:text-[#1d1d1f]'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#1d1d1f] tracking-tight">
              {isRegister ? 'Create your developer account' : 'Welcome back to Pseudoend'}
            </h2>
            <p className="text-xs text-[#6e6e73] mt-1.5">
              {isRegister ? 'Start prototyping instant mock APIs in seconds' : 'Sign in to access your mock projects and routes'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Developer Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="developer@example.com"
              autoComplete="email"
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#1d1d1f]">Password</label>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white border border-[#d2d2d7] hover:border-[#86868b] rounded-xl py-2 pl-3.5 pr-10 text-xs font-mono text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:ring-4 focus:ring-[#0071e3]/15 focus:border-[#0071e3] transition-all shadow-sm"
                  required
                  minLength={8}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-[#86868b] hover:text-[#1d1d1f] p-1 rounded-full focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {isRegister && (
                <p className="text-[11px] text-[#6e6e73] mt-1">Must be at least 8 characters long</p>
              )}
            </div>

            {error && (
              <div className="p-3.5 bg-[#ff3b30]/10 border border-[#ff3b30]/25 rounded-2xl text-xs text-[#dc2626] flex items-start space-x-2">
                <span className="shrink-0 font-bold mt-0.5">&bull;</span>
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full mt-3 font-semibold text-xs tracking-tight"
              icon={<ArrowRight className="w-4 h-4 ml-0.5" />}
            >
              {loading ? 'Authenticating...' : isRegister ? 'Get Instant Free Access' : 'Sign In'}
            </Button>

            <p className="text-[11px] text-[#86868b] text-center pt-2">
              By using Pseudoend, you agree to fair-use API limits to preserve cloud community safety.
            </p>
          </form>
        </div>

      </div>
    </div>
  );
};
