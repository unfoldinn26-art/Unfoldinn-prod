'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { loginAdmin, setToken } from '../../../lib/adminApi';

export default function AdminLogin() {
  const [email, setEmail] = useState('deepak@unfoldinn.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await loginAdmin(email, password);
      if (data.token) {
        setToken(data.token);
        router.push('/admin');
      } else {
        setError('Login failed, no token received');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111720] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      
      

      <div className="w-full max-w-md relative z-10">
        
        {/* Top Back Link */}
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Public Site</span>
          </Link>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-[11px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Secure Portal
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-[#18222E]/95 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden p-8 sm:p-10">
          
          {/* Header Brand */}
          <div className="text-center pb-8 border-b border-white/10">
            {/* Ensō Logo Icon */}
            <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-2xl border border-amber-500/30 flex items-center justify-center shadow-inner">
              <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="16" fill="#D97724" fillOpacity="0.25" />
                <circle cx="50" cy="50" r="9" fill="#D97724" />
                <path d="M 68 84 C 40 98 12 80 12 50 C 12 25 35 12 55 12 C 80 12 90 32 90 50 C 90 62 82 72 75 77" stroke="#FAF7F0" strokeWidth="6" strokeLinecap="round" />
                <rect x="76" y="76" width="14" height="14" rx="2" fill="#C85236" />
                <text x="83" y="86" fontSize="7.5" fill="#FFFFFF" textAnchor="middle" fontFamily="monospace" fontWeight="bold">SI</text>
              </svg>
            </div>

            <h1 className="text-2xl font-serif font-bold text-white tracking-tight">
              Unfoldinn
            </h1>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-mono">
              Founder&apos;s Administrative Portal
            </p>
          </div>

          {/* Form */}
          <div className="pt-8">
            {error && (
              <div className="mb-6 p-3.5 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300 flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Admin Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#111720]/80 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber transition-colors"
                    placeholder="deepak@unfoldinn.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300">
                    Password
                  </label>
                  <span className="text-[11px] text-gray-400 font-mono">
                    Protected by JWT
                  </span>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#111720]/80 border border-white/10 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber transition-colors"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-amber to-amber-600 hover:from-amber-600 hover:to-amber-700 text-[#111720] font-bold py-3.5 px-4 rounded-xl text-xs font-mono uppercase tracking-wider transition-all shadow-lg shadow-amber/20 hover:shadow-amber/30 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-[#111720]/30 border-t-[#111720] rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enter Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Security Note */}
            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1.5 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-amber" />
                <span>Authorized Founder &amp; Staff Access Only</span>
              </p>
            </div>

          </div>

        </div>

        {/* Footer Credit */}
        <p className="text-center text-xs text-gray-400 mt-6 font-mono">
          Unfoldinn Mentoring © 2026 · Jaipur, Rajasthan, India
        </p>

      </div>
    </div>
  );
}
