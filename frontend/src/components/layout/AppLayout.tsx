import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard, Users, LogOut, Menu, UserCircle,
  ArrowLeftRight, BookOpen, Scale, Percent, Calculator, X,
  ChevronRight, Bell, FileSpreadsheet
} from 'lucide-react';

const navGroups = [
  {
    label: 'Core',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard, desc: 'Overview & stats' },
      { name: 'Parties', href: '/parties', icon: UserCircle, desc: 'Manage hawala parties', children: ['/parties', '/parties/create'] },
      { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight, desc: 'Entry & daybook', children: ['/transactions', '/transactions/create'] },
      { name: 'Bulk Import', href: '/transactions/bulk-import', icon: FileSpreadsheet, desc: 'Excel bulk entry' },
    ]
  },
  {
    label: 'Reports',
    items: [
      { name: 'Daily Register', href: '/reports/daily-register', icon: BookOpen, desc: 'Daybook statement' },
      { name: 'Ledger', href: '/reports', icon: BookOpen, desc: 'Party statement' },
      { name: 'Trial Balance', href: '/reports/trial-balance', icon: Scale, desc: 'Book balance check' },
      { name: 'Vatav Summary', href: '/reports/vatav', icon: Percent, desc: 'Commission earnings' },
      { name: 'Interest Report', href: '/reports/interest', icon: Calculator, desc: 'Interest calculations' },
    ]
  },
  {
    label: 'Admin',
    items: [
      { name: 'User Management', href: '/users', icon: Users, desc: 'Access & security', children: ['/users', '/users/create'] },
    ]
  }
];

export function AppLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Get current page name for breadcrumb
  const allItems = navGroups.flatMap(g => g.items);
  
  const isActive = (item: any) => {
    // Exact match for main routes
    if (item.href === location.pathname) return true;
    
    // If item has children → match those
    if (item.children && item.children.includes(location.pathname)) {
      return true;
    }
    
    return false;
  };

  const currentPage = allItems.find(i => isActive(i));

  const initials = (user?.fullName || 'U')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen flex" style={{ background: '#f8fafc' }}>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside className={`
        sidebar fixed inset-y-0 left-0 z-50 w-64 flex flex-col
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-sm">A</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-sm leading-none">Angadia Pedhi</h1>
              <p className="text-white/40 text-xs mt-0.5">Management System</p>
            </div>
          </div>
          <button
            className="lg:hidden text-white/50 hover:text-white p-1 rounded"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-6 overflow-y-auto py-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm
                        transition-all duration-200 group relative
                        ${active
                          ? 'bg-white/10 text-white'
                          : 'text-white/60 hover:text-white hover:bg-white/5'}
                      `}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-400 rounded-r-full" />
                      )}
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-indigo-400' : 'text-white/40 group-hover:text-white/70'}`} />
                      <span className="flex-1">{item.name}</span>
                      {active && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.fullName || 'User'}</p>
              <p className="text-white/40 text-xs truncate">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="text-white/30 hover:text-red-400 transition-colors p-1 rounded"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main content ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 -ml-1 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-slate-400">Angadia</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <span className="font-semibold text-slate-800">{currentPage?.name || 'Page'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">{initials}</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-800 leading-none">{user?.fullName?.split(' ')[0]}</p>
                <p className="text-xs text-slate-400 mt-0.5">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
