/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import api from '../../lib/axios';
import { formatScaledCurrency } from '../../utils/numberScale';
import { Scale, AlertTriangle } from 'lucide-react';

export function TrialBalance() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submittedDate, setSubmittedDate] = useState<string | null>(null);

  const { data: tb, isLoading } = useQuery({
    queryKey: ['trial-balance', submittedDate],
    queryFn: async () => {
      const res = await api.get('/reports/trial-balance', { params: { date: submittedDate } });
      return res.data.data;
    },
    enabled: !!submittedDate
  });

  const handleFetch = (e: React.FormEvent) => {
    e.preventDefault();
    if (date) setSubmittedDate(date);
  };

  const cols = [
    {
      header: 'Code',
      accessor: (p: any) => <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{p.partyCode}</span>
    },
    {
      header: 'Party Name',
      accessor: (p: any) => <span className="font-semibold text-slate-900">{p.partyName}</span>
    },
    { header: 'City', accessor: (p: any) => p.cityName },
    {
      header: 'Debit (Dr)',
      accessor: (p: any) => p.totalDr > 0
        ? <span className="font-semibold text-red-600">{formatScaledCurrency(p.totalDr)}</span>
        : <span className="text-slate-300">—</span>
    },
    {
      header: 'Credit (Cr)',
      accessor: (p: any) => p.totalCr > 0
        ? <span className="font-semibold text-emerald-600">{formatScaledCurrency(p.totalCr)}</span>
        : <span className="text-slate-300">—</span>
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Scale className="w-6 h-6 text-indigo-500" />
          Trial Balance
        </h1>
        <p className="page-desc">
          A snapshot of all party balances on a given date. Use this to verify your books are balanced
          (total Debits = total Credits) before closing the accounting period.
        </p>
      </div>

      {/* Filter */}
      <div className="section-card p-5">
        <form onSubmit={handleFetch} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full max-w-xs">
            <Input label="As of Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <Button type="submit" className="h-[46px] px-8" isLoading={isLoading}>
            Generate Report
          </Button>
        </form>
      </div>

      {tb && (
        <div className="section-card overflow-hidden animate-slide-up">
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/30 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Financial Year: {tb.financialYear}</h2>
              <p className="text-xs text-slate-500 mt-0.5">As of {submittedDate}</p>
            </div>
            {tb.netDifference > 0 && (
              <Badge variant="danger" dot>
                <AlertTriangle className="w-3 h-3" /> Out of Balance
              </Badge>
            )}
            {tb.netDifference === 0 && (
              <Badge variant="success" dot>Books Balanced ✓</Badge>
            )}
          </div>

          <Table
            data={tb.entries || []}
            columns={cols}
            keyExtractor={(e: any) => e.partyId}
            isLoading={isLoading}
            emptyMessage="No party balances found for this date"
          />

          <div className="p-5 border-t border-slate-100 bg-slate-50/50">
            <div className="flex justify-between md:justify-end md:gap-16 font-bold text-base">
              <span className="text-slate-500">Grand Totals</span>
              <span className="text-red-600">Dr: {formatScaledCurrency(tb.grandTotalDr)}</span>
              <span className="text-emerald-600">Cr: {formatScaledCurrency(tb.grandTotalCr)}</span>
            </div>
            {tb.netDifference > 0 && (
              <p className="text-right mt-2 text-red-500 text-xs">
                ⚠ Ledger out of balance by {formatScaledCurrency(tb.netDifference)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
