'use client';

import { useState, useEffect } from 'react';
import { Users, Download, RefreshCw, Mail, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { getNewsletters } from '../../../lib/adminApi';

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getNewsletters();
      setSubscribers(res.data || []);
    } catch (err) {
      console.error('Failed to load subscribers:', err);
      setError('Failed to load newsletter subscribers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const exportToCSV = () => {
    if (!subscribers.length) return;
    const headers = ['Email', 'Name', 'Status', 'Subscribed Date'];
    const rows = subscribers.map((sub) => [
      `"${sub.email}"`,
      `"${sub.name || ''}"`,
      sub.isActive ? 'Active' : 'Unsubscribed',
      new Date(sub.createdAt).toLocaleDateString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `unfoldinn_subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeCount = subscribers.filter((s) => s.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D97724]/10 text-[#D97724] flex items-center justify-center font-bold">
              <Users size={18} />
            </div>
            Newsletter Subscribers
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage subscribed audience and export subscriber lists for mentorship newsletters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSubscribers}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-2xs transition-colors"
            title="Refresh list"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            disabled={!subscribers.length}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-linear-to-r from-[#D97724] to-[#E07A28] hover:opacity-95 rounded-xl shadow-xs transition-all disabled:opacity-50"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Subscribers</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{subscribers.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Audience</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Unsubscribed</p>
          <p className="text-2xl font-bold text-slate-400 mt-1">{subscribers.length - activeCount}</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-[#D97724] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-500 text-xs">Loading subscribers...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <p>{error}</p>
            <button onClick={fetchSubscribers} className="mt-3 text-sm underline text-[#2E4052] font-semibold">
              Try again
            </button>
          </div>
        ) : subscribers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Mail className="mx-auto text-gray-400 mb-3" size={36} />
            <p className="font-medium text-gray-800">No subscribers yet</p>
            <p className="text-sm mt-1">When visitors subscribe through the website footer, they will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date Subscribed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscribers.map((sub) => (
                  <tr key={sub._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-gray-900 flex items-center gap-2">
                      <Mail size={16} className="text-gray-400" />
                      {sub.email}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">{sub.name || '-'}</td>
                    <td className="py-3.5 px-4">
                      {sub.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#BDD9BF]/40 text-[#2E4052] border border-[#BDD9BF]">
                          <CheckCircle2 size={12} className="text-[#2E4052]" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          <XCircle size={12} />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 text-xs flex items-center gap-1.5">
                      <Calendar size={14} className="text-gray-400" />
                      {new Date(sub.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
