import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Shield, Users, FileText, Sparkles, CreditCard, DollarSign, Trash2, Ban } from 'lucide-react';
import { adminApi, type UserType } from '../lib/api';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'matches' | 'payments'>('users');
  const [analytics, setAnalytics] = useState<any>(null);
  
  const [users, setUsers] = useState<UserType[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [reportType, setReportType] = useState<'lost' | 'found'>('lost');
  const [matches, setMatches] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await adminApi.getAnalytics();
      setAnalytics(res.data);
    } catch (err) {
      toast.error('Failed to load analytical counts.');
    }
  };

  const fetchTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const res = await adminApi.getUsers();
        setUsers(res.data.users);
      } else if (activeTab === 'reports') {
        const res = await adminApi.getReports({ type: reportType });
        setReports(res.data.items);
      } else if (activeTab === 'matches') {
        const res = await adminApi.getMatches();
        setMatches(res.data.matches);
      } else if (activeTab === 'payments') {
        const res = await adminApi.getPayments();
        setPayments(res.data.payments);
      }
    } catch (err) {
      toast.error('Failed to fetch data list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    fetchTabData();
  }, [activeTab, reportType]);

  const handleBlockUser = async (id: string) => {
    try {
      const res = await adminApi.blockUser(id);
      toast.success(res.data.message);
      setUsers(users.map((u) => (u.id === id ? res.data.user : u)));
    } catch (err) {
      toast.error('Failed to update user status.');
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this report?')) return;
    try {
      await adminApi.deleteReport(id, reportType);
      toast.success('Report deleted successfully.');
      setReports(reports.filter((r) => r._id !== id));
      fetchAnalytics();
    } catch (err) {
      toast.error('Failed to remove report.');
    }
  };

  if (!analytics) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    { name: 'Total Users', value: analytics.totalUsers, icon: Users, color: 'from-blue-500 to-cyan-500' },
    { name: 'Lost Items', value: analytics.totalLostItems, icon: FileText, color: 'from-rose-500 to-orange-500' },
    { name: 'Found Items', value: analytics.totalFoundItems, icon: FileText, color: 'from-emerald-500 to-teal-500' },
    { name: 'Total Matches', value: analytics.totalMatches, icon: Sparkles, color: 'from-amber-500 to-yellow-500' },
    { name: 'Verified Escrows', value: analytics.completedPayments, icon: CreditCard, color: 'from-purple-500 to-indigo-500' },
    { name: 'Total Revenue', value: `$${analytics.totalRevenue}`, icon: DollarSign, color: 'from-pink-500 to-rose-500' },
  ];

  return (
    <div className="space-y-10">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Shield className="text-cyan-400" />
          Admin Control Center
        </h1>
        <p className="mt-2 text-sm text-slate-400">Moderation, analytical charts, user bans, and transaction audits</p>
      </div>

      {/* Analytics stats */}
      <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.name} className="rounded-2xl border border-slate-900 bg-slate-900/35 p-5 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{card.name}</span>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-xl font-extrabold text-white">{card.value}</span>
                <Icon size={16} className="text-cyan-400/80" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-900">
        {(['users', 'reports', 'matches', 'payments'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setLoading(true);
            }}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition uppercase tracking-wider ${
              activeTab === tab ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-900 bg-slate-900/30 p-6 backdrop-blur-sm">
          
          {/* Users Panel */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase text-slate-500 border-b border-slate-850">
                  <tr>
                    <th className="py-3.5 px-4">Name</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4 text-right font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/10">
                      <td className="py-4 px-4 font-semibold text-white">{u.name}</td>
                      <td className="py-4 px-4">{u.email}</td>
                      <td className="py-4 px-4 text-slate-400">{u.phone || '—'}</td>
                      <td className="py-4 px-4 capitalize">{u.role}</td>
                      <td className="py-4 px-4 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleBlockUser(u.id)}
                            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                              u.isBlocked
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                            }`}
                          >
                            <Ban size={12} />
                            {u.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Reports Panel */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex border-b border-slate-850">
                <button
                  onClick={() => setReportType('lost')}
                  className={`px-4 py-2 text-xs font-bold transition ${
                    reportType === 'lost' ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-450 hover:text-white'
                  }`}
                >
                  Lost Reports
                </button>
                <button
                  onClick={() => setReportType('found')}
                  className={`px-4 py-2 text-xs font-bold transition ${
                    reportType === 'found' ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-450 hover:text-white'
                  }`}
                >
                  Found Reports
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-350">
                  <thead className="text-xs uppercase text-slate-500 border-b border-slate-850">
                    <tr>
                      <th className="py-3.5 px-4">Item Name</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Posted By</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {reports.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-900/10">
                        <td className="py-4 px-4 font-semibold text-white">{r.itemName}</td>
                        <td className="py-4 px-4">{r.category}</td>
                        <td className="py-4 px-4">{r.postedBy?.name || '—'}</td>
                        <td className="py-4 px-4">{r.status}</td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => handleDeleteReport(r._id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-950/30 bg-rose-950/10 px-3.5 py-1.5 text-xs font-semibold text-rose-455 hover:bg-rose-950/20"
                          >
                            <Trash2 size={12} />
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Matches Panel */}
          {activeTab === 'matches' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-350">
                <thead className="text-xs uppercase text-slate-500 border-b border-slate-850">
                  <tr>
                    <th className="py-3.5 px-4">Lost Item</th>
                    <th className="py-3.5 px-4">Found Item</th>
                    <th className="py-3.5 px-4">Confidence</th>
                    <th className="py-3.5 px-4">Match Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {matches.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-900/10">
                      <td className="py-4 px-4 font-semibold text-white">{m.lostItemId?.itemName || '—'}</td>
                      <td className="py-4 px-4 font-semibold text-white">{m.foundItemId?.itemName || '—'}</td>
                      <td className="py-4 px-4">{m.matchPercentage}%</td>
                      <td className="py-4 px-4">{m.matchStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Payments Panel */}
          {activeTab === 'payments' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-350">
                <thead className="text-xs uppercase text-slate-500 border-b border-slate-850">
                  <tr>
                    <th className="py-3.5 px-4">Lost Owner</th>
                    <th className="py-3.5 px-4">Found Finder</th>
                    <th className="py-3.5 px-4">Reward Payout</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-900/10">
                      <td className="py-4 px-4">{p.lostUserId?.name || '—'}</td>
                      <td className="py-4 px-4">{p.foundUserId?.name || '—'}</td>
                      <td className="py-4 px-4 font-bold text-white">${p.amount}</td>
                      <td className="py-4 px-4 capitalize">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
