import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'react-hot-toast';
import { Plus, ShieldAlert, KeyRound, Ban, CheckCircle, Users } from 'lucide-react';
import api from '../../lib/axios';

interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  active: boolean;
  locked: boolean;
  failedAttemptCount: number;
  lastLoginAt: string;
}

export function UserManagement() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', fullName: '', password: '', role: 'ROLE_STAFF' });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data.data as User[];
    }
  });

  const createUser = useMutation({
    mutationFn: async (userData: any) => await api.post('/users', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateOpen(false);
      toast.success('User created. They must reset password on first login.');
      setNewUser({ username: '', fullName: '', password: '', role: 'ROLE_STAFF' });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create user')
  });

  const userAction = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: string }) =>
      await api.post(`/users/${id}/action?type=${type}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User action applied');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Action failed')
  });

  const resetPassword = useMutation({
    mutationFn: async (id: string) =>
      await api.post(`/users/${id}/reset-password`, { newPassword: 'TempPassword123!' }),
    onSuccess: () => toast.success('Password reset to: TempPassword123!'),
    onError: (err: any) => toast.error(err.response?.data?.message || 'Reset failed')
  });

  const handleCreateSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return toast.error('Username and password are required');
    createUser.mutate(newUser);
  };

  const roleBadgeVariant = (role: string) => {
    if (role === 'ROLE_SUPER_ADMIN') return 'purple';
    if (role === 'ROLE_ADMIN') return 'indigo';
    return 'default';
  };

  const columns = [
    {
      header: 'Username',
      accessor: (usr: User) => (
        <span className="font-mono text-sm font-semibold text-slate-800">{usr.username}</span>
      )
    },
    { header: 'Full Name', accessor: (usr: User) => usr.fullName },
    {
      header: 'Role',
      accessor: (usr: User) => (
        <Badge variant={roleBadgeVariant(usr.role)}>{usr.role}</Badge>
      )
    },
    {
      header: 'Status',
      accessor: (usr: User) => (
        <div className="flex gap-2 flex-wrap">
          {!usr.active && <Badge variant="danger" dot>Deactivated</Badge>}
          {usr.locked && <Badge variant="warning" dot>Locked ({usr.failedAttemptCount} fail{usr.failedAttemptCount !== 1 ? 's' : ''})</Badge>}
          {usr.active && !usr.locked && <Badge variant="success" dot>Active</Badge>}
        </div>
      )
    },
    {
      header: 'Last Login',
      accessor: (usr: User) => (
        <span className="text-xs text-slate-400">
          {usr.lastLoginAt ? new Date(usr.lastLoginAt).toLocaleString('en-IN') : 'Never'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (usr: User) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => resetPassword.mutate(usr.id)}
            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            title="Reset Password"
          >
            <KeyRound size={16} />
          </button>

          {usr.locked ? (
            <button
              onClick={() => userAction.mutate({ id: usr.id, type: 'UNLOCK' })}
              className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors"
              title="Unlock Account"
            >
              <CheckCircle size={16} />
            </button>
          ) : (
            <button
              onClick={() => userAction.mutate({ id: usr.id, type: 'LOCK' })}
              className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors"
              title="Lock Account"
            >
              <ShieldAlert size={16} />
            </button>
          )}

          {usr.active ? (
            <button
              onClick={() => userAction.mutate({ id: usr.id, type: 'DEACTIVATE' })}
              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Deactivate User"
            >
              <Ban size={16} />
            </button>
          ) : (
            <button
              onClick={() => userAction.mutate({ id: usr.id, type: 'ACTIVATE' })}
              className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors"
              title="Activate User"
            >
              <CheckCircle size={16} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-500" />
            User Management
          </h1>
          <p className="page-desc">
            Control system access and security. Create login accounts for staff and branch managers,
            enforce role-based permissions, lock compromised accounts, and reset passwords when needed.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="shrink-0">
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Users table */}
      <div className="section-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-sm font-semibold text-slate-600">System Users ({users?.length ?? 0})</h2>
        </div>
        <Table
          data={users || []}
          columns={columns}
          keyExtractor={(u) => u.id}
          isLoading={isLoading}
          emptyMessage="No users found"
          emptyIcon={<Users className="w-8 h-8 text-slate-200" />}
        />
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create User Account"
        subtitle="New users must change their password on first login"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Username"
            placeholder="e.g. ramesh.staff"
            value={newUser.username}
            onChange={e => setNewUser(x => ({ ...x, username: e.target.value }))}
            required
          />
          <Input
            label="Full Name"
            placeholder="e.g. Ramesh Patel"
            value={newUser.fullName}
            onChange={e => setNewUser(x => ({ ...x, fullName: e.target.value }))}
            required
          />
          <PasswordInput
            label="Temporary Password"
            placeholder="Min. 8 characters"
            value={newUser.password}
            onChange={e => setNewUser(x => ({ ...x, password: e.target.value }))}
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              Privilege Role <span className="text-red-400">*</span>
            </label>
            <select
              className="form-select"
              value={newUser.role}
              onChange={e => setNewUser(x => ({ ...x, role: e.target.value }))}
            >
              <option value="ROLE_STAFF">STAFF — Cashier / Counter (limited access)</option>
              <option value="ROLE_ADMIN">ADMIN — Branch Manager (full reports + users)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createUser.isPending}>
              Create Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
