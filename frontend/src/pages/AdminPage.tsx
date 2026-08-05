import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Users, FileText, Sparkles, CreditCard, DollarSign, CheckCircle2, MessageSquare, Ban, Trash2 } from 'lucide-react';
import { adminApi, type UserType } from '../lib/api';
import PageTransition from '../components/PageTransition';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { PortalBadge, PortalCard, PortalSection, PortalStatCard } from '../components/portal';

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
      { name: 'Users', value: analytics?.totalUsers ?? 0, icon: Users, tone: 'primary' as const },
      { name: 'Lost items', value: analytics?.totalLostItems ?? 0, icon: FileText, tone: 'danger' as const },
      { name: 'Found items', value: analytics?.totalFoundItems ?? 0, icon: FileText, tone: 'success' as const },
      { name: 'Returned', value: analytics?.returnedItems ?? 0, icon: CheckCircle2, tone: 'accent' as const },
      { name: 'Matches', value: analytics?.totalMatches ?? 0, icon: Sparkles, tone: 'primary' as const },
      { name: 'Chats', value: analytics?.activeChats ?? 0, icon: MessageSquare, tone: 'warning' as const },
      { name: 'Payments', value: analytics?.completedPayments ?? 0, icon: CreditCard, tone: 'success' as const },
      { name: 'Revenue', value: `₹${(analytics?.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, tone: 'primary' as const },
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
    <PageTransition className="space-y-8 py-4 pb-16">
      <PortalSection
        eyebrow="Administration"
        title="Admin control center"
        description="Operational analytics, moderation tools, and live reporting data rendered in a modern enterprise console."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <PortalCard className="p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          {(['users', 'reports', 'matches', 'payments'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.24)]'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </PortalCard>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <PortalCard className="p-6">
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {users.map((user) => (
                    <tr key={user.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/60">
                      <td className="py-4 px-4 font-semibold text-slate-950 dark:text-white">{user.name}</td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300">{user.email}</td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300">{user.phone || '—'}</td>
                      <td className="py-4 px-4">
                        <PortalBadge tone={user.role === 'admin' ? 'warning' : 'neutral'}>{user.role}</PortalBadge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleBlockUser(user.id)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                              user.isBlocked
                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200'
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
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(['lost', 'found'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setReportType(type)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      reportType === type
                        ? 'bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.24)]'
                        : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {reports.length === 0 ? (
                <EmptyState title="No reports" description="No reports found for the selected category." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Item</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Posted by</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {reports.map((report) => (
                        <tr key={report._id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/60">
                          <td className="py-4 px-4 font-semibold text-slate-950 dark:text-white">{report.itemName}</td>
                          <td className="py-4 px-4 text-slate-600 dark:text-slate-300">{report.category}</td>
                          <td className="py-4 px-4 text-slate-600 dark:text-slate-300">{report.postedBy?.name || '—'}</td>
                          <td className="py-4 px-4">
                            <PortalBadge tone={report.status === 'Returned' ? 'success' : 'warning'}>{report.status}</PortalBadge>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => handleDeleteReport(report._id)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-900/30 dark:bg-red-950/30"
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
            <div className="space-y-4">
              {matches.length === 0 ? (
                <EmptyState title="No matches" description="Matching events will appear here." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Lost item</th>
                        <th className="py-3 px-4">Found item</th>
                        <th className="py-3 px-4">Confidence</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {matches.map((match) => (
                        <tr key={match._id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/60">
                          <td className="py-4 px-4 font-semibold text-slate-950 dark:text-white">{match.lostItemId?.itemName || '—'}</td>
                          <td className="py-4 px-4 font-semibold text-slate-950 dark:text-white">{match.foundItemId?.itemName || '—'}</td>
                          <td className="py-4 px-4 text-slate-600 dark:text-slate-300">{match.matchPercentage}%</td>
                          <td className="py-4 px-4">
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
            <div className="space-y-4">
              {payments.length === 0 ? (
                <EmptyState title="No payments" description="Verified payouts will appear here." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Owner</th>
                        <th className="py-3 px-4">Finder</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {payments.map((payment) => (
                        <tr key={payment._id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/60">
                          <td className="py-4 px-4 text-slate-600 dark:text-slate-300">{payment.lostUserId?.name || '—'}</td>
                          <td className="py-4 px-4 text-slate-600 dark:text-slate-300">{payment.foundUserId?.name || '—'}</td>
                          <td className="py-4 px-4 font-semibold text-slate-950 dark:text-white">₹{payment.amount}</td>
                          <td className="py-4 px-4">
                            <PortalBadge tone={['SUCCESS', 'Completed', 'Paid'].includes(payment.paymentStatus || payment.status || '') ? 'success' : 'warning'}>
                              {payment.status || payment.paymentStatus || 'PENDING'}
                            </PortalBadge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </PortalCard>
      )}
    </PageTransition>
  );
}
