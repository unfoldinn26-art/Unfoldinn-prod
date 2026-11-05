'use client';

import { useEffect, useState } from 'react';
import { getSupportTickets, updateSupportTicket, deleteSupportTicket } from '../../../lib/adminApi';
import DataTable from '../../../components/admin/DataTable';
import StatusBadge from '../../../components/admin/StatusBadge';
import Modal from '../../../components/admin/Modal';
import { Mail, ExternalLink, Trash2, AlertCircle } from 'lucide-react';

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [editForm, setEditForm] = useState({ status: 'open', priority: 'medium', adminNotes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = statusFilter !== 'all' ? `status=${statusFilter}` : '';
      const data = await getSupportTickets(query);
      setTickets(data);
    } catch (err) {
      console.error('Error fetching support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (row) => {
    setSelectedTicket(row);
    setEditForm({
      status: row.status || 'open',
      priority: row.priority || 'medium',
      adminNotes: row.adminNotes || '',
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSupportTicket(selectedTicket._id, editForm);
      setSelectedTicket(null);
      fetchData();
    } catch (err) {
      alert('Failed to update ticket: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this support ticket?')) return;
    try {
      await deleteSupportTicket(id);
      if (selectedTicket?._id === id) setSelectedTicket(null);
      fetchData();
    } catch (err) {
      alert('Failed to delete ticket: ' + err.message);
    }
  };

  const formatCategory = (cat) => {
    if (!cat) return 'General';
    return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const columns = [
    { 
      key: 'subject', 
      label: 'Subject', 
      render: (val, row) => (
        <div className="max-w-[240px]">
          <span className="font-semibold text-[#5B4632] block truncate">{val}</span>
          <span className="text-xs text-gray-500 font-mono block">{formatCategory(row.category)}</span>
        </div>
      ) 
    },
    { key: 'name', label: 'Reported By' },
    { key: 'email', label: 'Email' },
    { 
      key: 'priority', 
      label: 'Priority', 
      render: (val) => {
        const colors = {
          low: 'bg-gray-100 text-gray-700',
          medium: 'bg-blue-100 text-blue-800',
          high: 'bg-orange-100 text-orange-800',
          urgent: 'bg-red-100 text-red-800 font-bold'
        };
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono uppercase tracking-wider ${colors[val] || colors.medium}`}>
            {val || 'medium'}
          </span>
        );
      } 
    },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'createdAt', label: 'Date', render: (val) => new Date(val).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      {/* Header and Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-xl font-serif font-bold text-[#5B4632]">Website Support &amp; Bug Tickets</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage user bug reports, technical queries, and platform issues.</p>
        </div>
        <div className="flex items-center gap-2">
          {['all', 'open', 'investigating', 'resolved', 'closed'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${
                statusFilter === st
                  ? 'bg-[#5B4632] text-white font-bold'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={tickets} 
        isLoading={loading}
        onRowClick={handleRowClick}
        searchPlaceholder="Search by subject, name or email..."
        searchKey="subject"
      />

      {/* Ticket Details & Action Modal */}
      <Modal 
        isOpen={!!selectedTicket} 
        onClose={() => setSelectedTicket(null)} 
        title="Support Ticket Details"
        actions={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={(e) => handleDelete(selectedTicket._id, e)}
              className="text-red-600 hover:text-red-800 text-xs font-mono flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-red-50"
            >
              <Trash2 size={14} /> Delete Ticket
            </button>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedTicket(null)} 
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={saving} 
                className="px-5 py-2 bg-[#D97724] hover:bg-[#c66a1e] text-white font-bold rounded-lg transition-all shadow-sm text-sm"
              >
                {saving ? 'Saving...' : 'Save Ticket Status'}
              </button>
            </div>
          </div>
        }
      >
        {selectedTicket && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div>
                <span className="text-gray-500 block text-xs">Reported By:</span>
                <span className="font-semibold text-gray-900">{selectedTicket.name}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Email:</span>
                <a href={`mailto:${selectedTicket.email}`} className="font-semibold text-blue-600 flex items-center gap-1 hover:underline">
                  {selectedTicket.email} <ExternalLink size={13} />
                </a>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Phone:</span>
                <span className="font-medium text-gray-900">{selectedTicket.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Category:</span>
                <span className="font-medium text-gray-900">{formatCategory(selectedTicket.category)}</span>
              </div>
              {selectedTicket.pageUrl && (
                <div className="col-span-1 sm:col-span-2">
                  <span className="text-gray-500 block text-xs">Affected Page URL:</span>
                  <a href={selectedTicket.pageUrl} target="_blank" rel="noreferrer" className="text-xs font-mono text-blue-600 underline truncate block">
                    {selectedTicket.pageUrl}
                  </a>
                </div>
              )}
              {selectedTicket.deviceInfo && (
                <div className="col-span-1 sm:col-span-2">
                  <span className="text-gray-500 block text-xs">Device &amp; Browser Context:</span>
                  <span className="text-xs text-gray-600 font-mono">{selectedTicket.deviceInfo}</span>
                </div>
              )}
              <div className="col-span-1 sm:col-span-2 mt-2 pt-2 border-t border-gray-200">
                <span className="text-gray-500 block text-xs">Subject:</span>
                <h4 className="font-semibold text-base text-gray-900">{selectedTicket.subject}</h4>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <span className="text-gray-500 block text-xs mb-1">Issue Description:</span>
                <div className="bg-white p-3.5 border border-gray-200 rounded-lg whitespace-pre-wrap text-gray-800 text-sm leading-relaxed">
                  {selectedTicket.description}
                </div>
              </div>
            </div>

            {/* Status, Priority & Admin Notes Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full border-gray-300 rounded-lg shadow-sm p-2.5 border text-sm focus:border-black outline-none"
                >
                  <option value="open">Open (Unresolved)</option>
                  <option value="investigating">Investigating / In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  className="w-full border-gray-300 rounded-lg shadow-sm p-2.5 border text-sm focus:border-black outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Internal Admin Notes</label>
                <textarea
                  rows={3}
                  value={editForm.adminNotes}
                  onChange={(e) => setEditForm({ ...editForm, adminNotes: e.target.value })}
                  className="w-full border-gray-300 rounded-lg shadow-sm p-2.5 border text-sm focus:border-black outline-none resize-none"
                  placeholder="Notes on bug reproduction, fix commit, or communication with user..."
                />
              </div>
            </div>

            {/* Quick Action Email Reply */}
            <div className="pt-2 flex justify-end">
              <a
                href={`mailto:${selectedTicket.email}?subject=${encodeURIComponent(`[Unfoldinn Support #${selectedTicket._id?.slice(-6)}] ${selectedTicket.subject}`)}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B4632] text-white text-xs font-mono uppercase tracking-wider rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Mail size={14} /> Reply via Direct Email
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
