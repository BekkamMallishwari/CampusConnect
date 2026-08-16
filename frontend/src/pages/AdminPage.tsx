import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Users, FileText, Sparkles, CreditCard, DollarSign, CheckCircle2, MessageSquare, Ban, Trash2, Shield } from 'lucide-react';
import { adminApi, type UserType } from '../lib/api';
import PageTransition from '../components/PageTransition';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { PortalBadge, PortalStatCard } from '../components/portal';

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
    } catch {
      toast.error('Failed to load analytics.');
    }
  };

  const fetchTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const res = await adminApi.getUsers();
        setUsers(res.data.users || []);
      } else if (activeTab === 'reports') {
        const res = await adminApi.getReports({ type: reportType });
        setReports(res.data.items || []);
      } else if (activeTab === 'matches') {
        const res = await adminApi.getMatches();
        setMatches(res.data.matches || []);
      } else if (activeTab === 'payments') {
        const res = await adminApi.getPayments();
        setPayments(res.data.payments || []);
      }
    } catch {
      toast.error('Failed to fetch tab data.');
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

  const statCards = useMemo(
    () => [
      { name: 'Total Users', value: analytics?.totalUsers ?? 0, icon: Users, tone: 'primary' as const },
      { name: 'Lost Items', value: analytics?.totalLostItems ?? 0, icon: FileText, tone: 'danger' as const },
      { name: 'Found Items', value: analytics?.totalFoundItems ?? 0, icon: FileText, tone: 'success' as const },
      { name: 'Returned Safely', value: analytics?.returnedItems ?? 0, icon: CheckCircle2, tone: 'accent' as const },
      { name: 'AI Matches', value: analytics?.totalMatches ?? 0, icon: Sparkles, tone: 'primary' as const },
      { name: 'Active Chats', value: analytics?.activeChats ?? 0, icon: MessageSquare, tone: 'warning' as const },
      { name: 'Settled Escrows', value: analytics?.completedPayments ?? 0, icon: CreditCard, tone: 'success' as const },
      { name: 'Total Revenue', value: `₹${(analytics?.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, tone: 'primary' as const },
    ],
    [analytics],
  );

  if (!analytics) {
    return <LoadingSpinner />;
  }

  const handleBlockUser = async (id: string) => {
    try {
      const res = await adminApi.blockUser(id);
      toast.success(res.data.message);
      setUsers((prev) => prev.map((user) => (user.id === id ? res.data.user : user)));
    } catch {
      toast.error('Failed to update user status.');
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Permanently delete this report?')) return;
    try {
      await adminApi.deleteReport(id, reportType);
      toast.success('Report deleted.');
      setReports((prev) => prev.filter((report) => report._id !== id));
      fetchAnalytics();
    } catch {
      toast.error('Failed to delete report.');
    }
  };

  return (
    <PageTransition className="space-y-6 py-2 pb-24">
      {/* 1. Hero Glass Banner */}
      <div className="glass-hero-banner relative p-6 sm:p-8">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-xs" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <Shield size={12} /> Administration Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>
              Admin Control Center
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--dash-text-secondary)' }}>
              Operational metrics, user moderation tools, report governance, and escrow settlements.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Stat KPIs Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <PortalStatCard
              key={card.name}
              label={card.name}
              value={card.value}
              icon={<Icon size={18} />}
              tone={card.tone}
            />
          );
        })}
      </div>

      {/* 3. Tab Bar Switcher */}
      <div className="flex flex-wrap gap-2">
        {(['users', 'reports', 'matches', 'payments'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`glass-tab-pill px-5 py-2 text-xs font-bold uppercase tracking-wider capitalize ${
              activeTab === tab ? 'active' : ''
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 4. Tab Content Panel */}
      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b text-[10.5px] font-bold uppercase tracking-wider" style={{ borderColor: 'var(--glass-border)', color: 'var(--dash-text-muted)', background: 'var(--glass-bg)' }}>
                  <tr>
                    <th className="py-3.5 px-5">Name</th>
                    <th className="py-3.5 px-5">Email</th>
                    <th className="py-3.5 px-5">Phone</th>
                    <th className="py-3.5 px-5">Role</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--glass-border)' }}>
                  {users.map((user) => (
                    <tr key={user.id} className="glass-table-row">
                      <td className="py-3.5 px-5 font-bold" style={{ color: 'var(--dash-text-primary)' }}>{user.name}</td>
                      <td className="py-3.5 px-5" style={{ color: 'var(--dash-text-secondary)' }}>{user.email}</td>
                      <td className="py-3.5 px-5" style={{ color: 'var(--dash-text-secondary)' }}>{user.phone || '—'}</td>
                      <td className="py-3.5 px-5">
                        <PortalBadge tone={user.role === 'admin' ? 'warning' : 'neutral'}>{user.role}</PortalBadge>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleBlockUser(user.id)}
                            className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                              user.isBlocked
                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-600 border border-rose-500/20 hover:bg-rose-500/20'
                            }`}
                          >
                            <Ban size={12} />
                            {user.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-4 p-5">
              <div className="flex flex-wrap gap-2">
                {(['lost', 'found'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setReportType(type)}
                    className={`glass-tab-pill px-4 py-1.5 text-xs font-bold capitalize ${
                      reportType === type ? 'active' : ''
                    }`}
                  >
                    {type} Items
                  </button>
                ))}
              </div>

              {reports.length === 0 ? (
                <EmptyState title="No reports" description="No reports found for the selected filter." />
              ) : (
                <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--glass-border)' }}>
                  <table className="w-full text-left text-xs">
                    <thead className="border-b text-[10.5px] font-bold uppercase tracking-wider" style={{ borderColor: 'var(--glass-border)', color: 'var(--dash-text-muted)', background: 'var(--glass-bg)' }}>
                      <tr>
                        <th className="py-3 px-4">Item Name</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Posted By</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--glass-border)' }}>
                      {reports.map((report) => (
                        <tr key={report._id} className="glass-table-row">
                          <td className="py-3 px-4 font-bold" style={{ color: 'var(--dash-text-primary)' }}>{report.itemName}</td>
                          <td className="py-3 px-4" style={{ color: 'var(--dash-text-secondary)' }}>{report.category}</td>
                          <td className="py-3 px-4" style={{ color: 'var(--dash-text-secondary)' }}>{report.postedBy?.name || '—'}</td>
                          <td className="py-3 px-4">
                            <PortalBadge tone={report.status === 'Returned' ? 'success' : 'warning'}>{report.status}</PortalBadge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteReport(report._id)}
                              className="inline-flex items-center gap-1 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20 px-3 py-1 text-xs font-bold hover:bg-rose-500/20 transition"
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="p-5">
              {matches.length === 0 ? (
                <EmptyState title="No matches" description="Matching events will appear here." />
              ) : (
                <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--glass-border)' }}>
                  <table className="w-full text-left text-xs">
                    <thead className="border-b text-[10.5px] font-bold uppercase tracking-wider" style={{ borderColor: 'var(--glass-border)', color: 'var(--dash-text-muted)', background: 'var(--glass-bg)' }}>
                      <tr>
                        <th className="py-3 px-4">Lost Item</th>
                        <th className="py-3 px-4">Found Item</th>
                        <th className="py-3 px-4">AI Score</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--glass-border)' }}>
                      {matches.map((match) => (
                        <tr key={match._id} className="glass-table-row">
                          <td className="py-3 px-4 font-bold" style={{ color: 'var(--dash-text-primary)' }}>{match.lostItemId?.itemName || '—'}</td>
                          <td className="py-3 px-4 font-bold" style={{ color: 'var(--dash-text-primary)' }}>{match.foundItemId?.itemName || '—'}</td>
                          <td className="py-3 px-4 font-extrabold text-indigo-500">{match.matchPercentage}%</td>
                          <td className="py-3 px-4">
                            <PortalBadge tone={match.matchStatus === 'HANDOVER_COMPLETED' ? 'success' : 'warning'}>{match.matchStatus}</PortalBadge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="p-5">
              {payments.length === 0 ? (
                <EmptyState title="No payments recorded" description="Escrow payments will appear here." />
              ) : (
                <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--glass-border)' }}>
                  <table className="w-full text-left text-xs">
                    <thead className="border-b text-[10.5px] font-bold uppercase tracking-wider" style={{ borderColor: 'var(--glass-border)', color: 'var(--dash-text-muted)', background: 'var(--glass-bg)' }}>
                      <tr>
                        <th className="py-3 px-4">Transaction ID</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--glass-border)' }}>
                      {payments.map((p) => (
                        <tr key={p._id} className="glass-table-row">
                          <td className="py-3 px-4 font-mono font-bold" style={{ color: 'var(--dash-text-primary)' }}>{p.razorpayPaymentId || p._id.slice(-8)}</td>
                          <td className="py-3 px-4 font-black" style={{ color: 'var(--dash-text-primary)' }}>₹{(p.amount || 0).toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <PortalBadge tone={p.paymentStatus === 'PAID' || p.paymentStatus === 'SUCCESS' ? 'success' : 'warning'}>{p.paymentStatus || 'Pending'}</PortalBadge>
                          </td>
                          <td className="py-3 px-4" style={{ color: 'var(--dash-text-muted)' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </PageTransition>
  );
}
