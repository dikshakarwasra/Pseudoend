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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-black text-[#f5f5f7] relative overflow-hidden">
      {/* Subtle Apple blue ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-[#0071e3]/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-4xl w-full grid md:grid-cols-12 bg-[#161617] border border-white/10 rounded-3xl shadow-apple-md overflow-hidden backdrop-blur-xl relative z-10">
        
        {/* Left Side: Brand & Product Value (5 cols) */}
        <div className="md:col-span-5 p-7 sm:p-9 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10 bg-[#121213]">
          <div>
            {/* Logo — NO 2.0 */}
            <div className="flex items-center space-x-2.5 mb-7">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
                <Terminal className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white font-mono">
                PSEUDOEND
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-semibold text-[#f5f5f7] mb-2.5 leading-snug tracking-tight">
              Intelligent Fake Server Generator
            </h1>
            <p className="text-xs text-[#a1a1a6] mb-7 leading-relaxed">
              Build and test frontends without waiting for backend teams. Ephemeral serverless endpoints with dynamic schemas, chaos engineering, and instant OpenAPI import.
            </p>

            {/* Feature Bullets */}
            <div className="space-y-3.5 pt-1">
              <div className="flex items-start space-x-3 text-xs text-[#d2d2d7]">
                <ShieldCheck className="w-4 h-4 text-[#2997ff] shrink-0 mt-0.5" />
                <span><strong>100% Free Forever</strong> &mdash; Zero credit card or billing setup required</span>
              </div>
              <div className="flex items-start space-x-3 text-xs text-[#d2d2d7]">
                <Zap className="w-4 h-4 text-[#ff9f0a] shrink-0 mt-0.5" />
                <span><strong>Zero-Cost Idle</strong> &mdash; Serverless microsecond response via AWS Lambda</span>
              </div>
              <div className="flex items-start space-x-3 text-xs text-[#d2d2d7]">
                <Server className="w-4 h-4 text-[#bf5af2] shrink-0 mt-0.5" />
                <span><strong>Multi-Framework</strong> &mdash; Ready-to-copy code for React, Vue, Svelte, iOS, Flutter</span>
              </div>
            </div>
          </div>

          {/* Illustrative endpoint snippet preview */}
          <div className="mt-8 pt-5 border-t border-white/10 font-mono text-[11px] text-[#86868b]">
            <div className="flex items-center justify-between text-[#a1a1a6] mb-1.5">
              <span className="text-[10px] uppercase font-semibold flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-[#2997ff]" />
                <span>Sample Mock Endpoint</span>
              </span>
              <span className="text-[10px] text-[#86868b] font-mono">
                200 OK
              </span>
            </div>
            <div className="bg-[#000000] p-3 rounded-xl border border-white/10 text-[11px] text-[#d2d2d7] overflow-x-auto">
              <span className="text-[#2997ff] font-bold">GET</span> /mock/:projectId/api/v1/users
              <div className="text-[#86868b] text-[10px] mt-1 font-sans">Header: x-pseudoend-key &bull; Latency: 40ms</div>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Form (7 cols) */}
        <div className="md:col-span-7 p-7 sm:p-10 flex flex-col justify-center">
          {/* Sign In / Register Tab Toggle */}
          <div className="flex p-1 bg-[#000000] rounded-full border border-white/10 mb-7" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={!isRegister}
              onClick={() => { setIsRegister(false); setError(null); }}
              className={`flex-1 py-2 text-xs font-medium rounded-full transition-all ${
                !isRegister 
                  ? 'bg-[#2c2c2e] text-white shadow-apple-sm' 
                  : 'text-[#86868b] hover:text-[#f5f5f7]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isRegister}
              onClick={() => { setIsRegister(true); setError(null); }}
              className={`flex-1 py-2 text-xs font-medium rounded-full transition-all ${
                isRegister 
                  ? 'bg-[#2c2c2e] text-white shadow-apple-sm' 
                  : 'text-[#86868b] hover:text-[#f5f5f7]'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white tracking-tight">
              {isRegister ? 'Create your developer account' : 'Welcome back to Pseudoend'}
            </h2>
            <p className="text-xs text-[#a1a1a6] mt-1">
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
                <label className="block text-xs font-medium text-[#a1a1a6]">Password</label>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#1c1c1e] border border-white/10 hover:border-white/20 rounded-xl py-2 pl-3 pr-10 text-xs font-mono text-[#f5f5f7] placeholder-[#6e6e73] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/60 focus:border-[#0071e3]"
                  required
                  minLength={8}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#86868b] hover:text-[#f5f5f7] p-1 rounded-full focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {isRegister && (
                <p className="text-[11px] text-[#86868b] mt-1">Must be at least 8 characters long</p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-[#ff453a] flex items-start space-x-2">
                <span className="shrink-0 font-bold mt-0.5">&bull;</span>
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full mt-3 font-medium text-xs tracking-tight"
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
