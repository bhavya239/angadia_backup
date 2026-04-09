import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Users, Activity, ArrowUpRight, TrendingUp, Plus, ArrowLeftRight, BookOpen, Zap } from 'lucide-react';
import api from '../lib/axios';
import { formatScaledCurrency } from '../utils/numberScale';

export function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: async () => {
      try {
        const res = await api.get('/dashboard');
        return res.data.data;
      } catch {
        return { totalParties: 0, todayTransactions: 0, totalAmount: 0, totalVatav: 0 };
      }
    },
    // Refetch every 30 seconds automatically
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const statCards = [
    {
      name: 'Active Parties',
      value: stats?.totalParties ?? 0,
      icon: Users,
      gradient: 'stat-indigo',
      change: 'Registered hawala parties',
    },
    {
      name: "Today's Transactions",
      value: stats?.todayTransactions ?? 0,
      icon: Activity,
      gradient: 'stat-emerald',
      change: 'Entries recorded today',
    },
    {
      name: 'Volume Today',
      value: formatScaledCurrency(stats?.totalAmount ?? 0),
      icon: ArrowUpRight,
      gradient: 'stat-amber',
      change: 'Total money transferred',
    },
    {
      name: 'Vatav Earned',
      value: formatScaledCurrency(stats?.totalVatav ?? 0),
      icon: TrendingUp,
      gradient: 'stat-rose',
      change: "Commission income today",
    },
  ];

  const quickActions = [
    { label: 'Add Party', icon: Plus, color: 'bg-indigo-600 hover:bg-indigo-700', href: '/parties' },
    { label: 'New Transaction', icon: ArrowLeftRight, color: 'bg-emerald-600 hover:bg-emerald-700', href: '/transactions' },
    { label: 'View Ledger', icon: BookOpen, color: 'bg-amber-500 hover:bg-amber-600', href: '/reports' },
  ];

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Good day! 👋</h1>
          <p className="text-slate-500 mt-1">Here's your business overview for today.</p>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] })}
          className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold underline underline-offset-2"
        >
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.name}
              className={`${card.gradient} p-5 rounded-2xl text-white shadow-lg hover:scale-[1.02] transition-transform duration-200 cursor-default`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">{card.name}</p>
                  <p className="text-3xl font-extrabold mt-2 leading-none">
                    {isLoading ? (
                      <span className="inline-block w-20 h-8 bg-white/20 rounded-lg animate-pulse" />
                    ) : card.value}
                  </p>
                  <p className="text-white/60 text-xs mt-2">{card.change}</p>
                </div>
                <div className="p-2.5 bg-white/15 rounded-xl">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions + Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Quick Actions */}
        <div className="section-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => navigate(action.href)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm font-semibold ${action.color} transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]`}
                >
                  <Icon className="w-4 h-4" />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Welcome Card */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden relative shadow-lg" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 0%, transparent 60%)' }} />
          <div className="relative p-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="text-white font-black text-sm">A</span>
              </div>
              <span className="text-white/70 text-sm font-semibold">Angadia Pedhi</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white leading-tight">
              Enterprise Hawala<br />Management System
            </h2>
            <p className="text-white/60 text-sm mt-3 max-w-xs leading-relaxed">
              Manage parties, record transfers, track commissions (vatav), view ledgers and generate financial reports — all in one place.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => navigate('/parties')} className="px-4 py-2 bg-white text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors shadow-lg">
                Manage Parties
              </button>
              <button onClick={() => navigate('/transactions')} className="px-4 py-2 bg-white/10 text-white rounded-xl text-sm font-semibold hover:bg-white/20 transition-colors border border-white/20">
                New Transaction
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
