/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { WhatsAppButton } from '../../components/ui/WhatsAppButton';
import { PartyFormModal } from './PartyFormModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Plus, Search, Edit2, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios';
import { formatScaledCurrency } from '../../utils/numberScale';

export function PartyList() {
  const queryClient = useQueryClient();
  const [term, setTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [page, setPage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editParty, setEditParty] = useState<any | null>(null);
  const [partyToDelete, setPartyToDelete] = useState<any | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(term);
      setPage(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [term]);

  const { data, isLoading } = useQuery({
    queryKey: ['parties', debouncedTerm, page],
    queryFn: async () => {
      const res = await api.get('/parties', { params: { term: debouncedTerm, page, size: 10 } });
      return res.data.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/parties/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      toast.success('Party deleted successfully');
      setPartyToDelete(null);
    },
    onError: (error: any) => {
      const msg = 
        error?.response?.data?.message || 
        "Failed to delete party";

      toast.error(msg);
      setPartyToDelete(null);
    },
  });

  const handleDelete = (party: any) => {
    setPartyToDelete(party);
  };

  const handleEdit = (party: any) => {
    setEditParty(party);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditParty(null);
    setIsModalOpen(true);
  };

  const columns = [
    {
      header: 'Code',
      accessor: (p: any) => (
        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg uppercase">
          {p.partyCode || '—'}
        </span>
      )
    },
    {
      header: 'Party Name',
      accessor: (p: any) => (
        <div>
          <p className="font-semibold text-slate-900">{p.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{p.cityName}</p>
        </div>
      )
    },
    {
      header: 'Contact',
      accessor: (p: any) => (
        <div>
          <p className="text-sm text-slate-700">{p.phone || '—'}</p>
          {p.email && <p className="text-xs text-slate-400">{p.email}</p>}
        </div>
      )
    },
    {
      header: 'Opening Balance',
      accessor: (p: any) => (
        <Badge variant={p.openingBalanceType === 'CR' ? 'success' : 'danger'} dot>
          {formatScaledCurrency(p.openingBalance || 0)} {p.openingBalanceType}
        </Badge>
      )
    },
    {
      header: 'Reminder',
      accessor: (p: any) => (
        p.phone ? (
          <WhatsAppButton
            phone={p.phone}
            partyName={p.name}
            amount={p.openingBalance}
            balanceType={p.openingBalanceType}
          />
        ) : <span className="text-xs text-slate-300">No phone</span>
      )
    },
    {
      header: 'Actions',
      accessor: (p: any) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(p)}
            className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            title="Edit party"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(p)}
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Remove party"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  const content = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-500" />
            Party Management
          </h1>
          <p className="page-desc">
            Manage all hawala parties — add, edit, and remove counterparties. Send WhatsApp payment reminders directly from this screen.
          </p>
        </div>
        <Button onClick={handleAddNew} size="md" className="shrink-0">
          <Plus className="w-4 h-4" />
          Add Party
        </Button>
      </div>

      {/* Search bar */}
      <div className="section-card p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
          <Search className="w-4 h-4 text-indigo-500" />
        </div>
        <input
          type="text"
          placeholder="Search by name, code, city or mobile..."
          className="flex-1 focus:outline-none text-slate-900 text-sm placeholder-slate-400 bg-transparent"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          autoFocus
        />
        {term && (
          <button
            onClick={() => setTerm('')}
            className="text-slate-400 hover:text-slate-600 text-xs px-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table Card */}
      <div className="section-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-sm font-semibold text-slate-600">
            {totalElements > 0 ? `${totalElements} Parties Found` : 'Parties'}
          </span>
          <span className="text-xs text-slate-400">Page {page + 1} of {Math.max(1, totalPages)}</span>
        </div>

        <Table
          data={content}
          columns={columns}
          keyExtractor={(p: any) => p.id}
          isLoading={isLoading}
          emptyMessage="No parties found. Click 'Add Party' to get started."
          emptyIcon={<Users className="w-8 h-8 text-slate-200" />}
        />

        {/* Pagination */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs text-slate-500">{totalElements} total records</span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              ← Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next →
            </Button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <PartyFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditParty(null); }}
        existing={editParty}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!partyToDelete}
        onClose={() => setPartyToDelete(null)}
        onConfirm={() => partyToDelete && deleteMutation.mutate(partyToDelete.id)}
        title="Delete Party"
        message={`Are you sure you want to delete "${partyToDelete?.name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
