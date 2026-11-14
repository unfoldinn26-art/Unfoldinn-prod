'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { changePassword, getMe } from '../../../lib/adminApi';
import { KeyRound, User, Shield, CreditCard, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    getMe().then(data => setAdmin(data.admin || data)).catch(console.error);
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwords.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await changePassword({ 
        currentPassword: passwords.currentPassword, 
        newPassword: passwords.newPassword 
      });
      setMessage('Password updated successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      
      {/* Profile Info */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D97724]/10 text-[#D97724] flex items-center justify-center font-bold">
              <User size={18} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Administrator Profile</h2>
              <p className="text-xs text-slate-500">Your verified credentials and security privileges</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Active Session
          </span>
        </div>
        <div className="p-6">
          {admin ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-100">
                <span className="text-slate-400 text-xs uppercase tracking-wider block mb-1">Full Name</span>
                <p className="font-bold text-slate-900 text-base">{admin.name}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-100">
                <span className="text-slate-400 text-xs uppercase tracking-wider block mb-1">Login Email</span>
                <p className="font-bold text-slate-900 text-base truncate">{admin.email}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-100">
                <span className="text-slate-400 text-xs uppercase tracking-wider block mb-1">Assigned Role</span>
                <span className="inline-flex items-center gap-1.5 mt-1 px-3 py-0.5 rounded-full text-xs font-bold bg-[#FFF6E9] text-[#D97724] border border-[#FBD8AF] uppercase tracking-wide">
                  <Shield size={12} /> {admin.role}
                </span>
              </div>
            </div>
          ) : (
            <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-slate-100 rounded w-3/4"></div></div></div>
          )}
        </div>
      </div>

      {/* Quick link to Fee Control */}
      <div className="bg-linear-to-r from-[#111720] to-[#1E293B] rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-[#E07A28]">
            <CreditCard size={24} />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Payment & Session Fee Controls</h3>
            <p className="text-xs text-slate-300 mt-0.5">Toggle live fees ON/OFF, adjust consultation pricing, and manage Cashfree settings.</p>
          </div>
        </div>
        <Link 
          href="/admin/payments" 
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D97724] hover:bg-[#c4681d] text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0"
        >
          Fee Dashboard <ArrowRight size={14} />
        </Link>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <KeyRound size={18} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Security & Password</h2>
            <p className="text-xs text-slate-500">Update your administrative credentials securely</p>
          </div>
        </div>
        <div className="p-6">
          {message && (
            <div className="mb-5 p-3.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-sm flex items-center gap-2 font-medium">
              <CheckCircle2 size={16} /> {message}
            </div>
          )}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-sm flex items-center gap-2 font-medium">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          
          <form onSubmit={handleChangePassword} className="space-y-4.5 max-w-md">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Current Password</label>
              <input 
                type="password" 
                required 
                autoComplete="current-password"
                value={passwords.currentPassword} 
                onChange={e => setPasswords({...passwords, currentPassword: e.target.value})} 
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#D97724]/20 focus:border-[#D97724] transition-all" 
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">New Password</label>
              <input 
                type="password" 
                required 
                autoComplete="new-password"
                value={passwords.newPassword} 
                onChange={e => setPasswords({...passwords, newPassword: e.target.value})} 
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#D97724]/20 focus:border-[#D97724] transition-all" 
                placeholder="Minimum 6 characters"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Confirm New Password</label>
              <input 
                type="password" 
                required 
                value={passwords.confirmPassword} 
                onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} 
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#D97724]/20 focus:border-[#D97724] transition-all" 
                placeholder="Re-type new password"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-6 py-2.5 bg-[#111720] hover:bg-[#1E293B] text-white font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 text-sm inline-flex items-center gap-2"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>
      </div>
      
    </div>
  );
}
