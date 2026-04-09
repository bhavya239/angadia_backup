/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import api from '../../lib/axios';
import { formatScaledCurrency } from '../../utils/numberScale';
import { Calculator, TrendingUp, TrendingDown } from 'lucide-react';

export function InterestReport() {
  const [from, setFrom] = useState('2024-04-01');
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [submittedArgs, setSubmittedArgs] = useState<{ from: string; to: string } | null>(null);

  const { data: report, isLoading } = useQuery({
    queryKey: ['interest-report', submittedArgs],
    queryFn: async () => {
      const res = await api.get('/reports/interest', { params: { from: submittedArgs?.from, to: submittedArgs?.to } });
      return res.data.data;
    },
    enabled: !!submittedArgs
  });

  const handleFetch = (e: React.FormEvent) => {
    e.preventDefault();
    if (from && to) setSubmittedArgs({ from, to });
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
    { header: 'ROI (Cr/Dr %)', accessor: (p: any) => <span className="text-slate-600">{p.crRoi}% / {p.drRoi}%</span> },
    {
      header: 'Earned (Payable)',
      accessor: (p: any) => p.interestEarned > 0
        ? <span className="text-red-600 font-semibold">{formatScaledCurrency(p.interestEarned)}</span>
        : <span className="text-slate-300">—</span>
    },
    {
      header: 'Charged (Recv\'able)',
      accessor: (p: any) => p.interestCharged > 0
        ? <span className="text-emerald-600 font-semibold">{formatScaledCurrency(p.interestCharged)}</span>
        : <span className="text-slate-300">—</span>
    },
    {
      header: 'Net Interest',
      accessor: (p: any) => (
        <span className={`font-bold ${p.netInterest > 0 ? 'text-red-600' : p.netInterest < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
          {p.netInterest !== 0 ? `${formatScaledCurrency(Math.abs(p.netInterest))} ${p.netInterest > 0 ? 'Pay' : 'Recv'}` : '—'}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-indigo-500" />
          Interest Generation Report
        </h1>
        <p className="page-desc">
          Calculate interest on outstanding Dr/Cr balances for all parties. Rate of interest (ROI) is
          configured per party. Use this report for interest billing, aging analysis, and period-end reconciliation.
        </p>
      </div>

      {/* Filter */}
      <div className="section-card p-5">
        <form onSubmit={handleFetch} className="flex flex-col sm:flex-row gap-4 items-end">
          <Input label="From Date" type="date" value={from} onChange={e => setFrom(e.target.value)} required />
          <Input label="To Date" type="date" value={to} onChange={e => setTo(e.target.value)} required />
          <Button type="submit" className="h-[46px] px-8" isLoading={isLoading}>
            Compute Interest
          </Button>
        </form>
      </div>

      {report && (
        <div className="space-y-5 animate-slide-up">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="section-card p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-red-500 uppercase tracking-wide">Total Interest Payable</p>
                <p className="text-3xl font-extrabold text-red-600 mt-2">{formatScaledCurrency(report.totalInterestPayable)}</p>
                <p className="text-xs text-slate-400 mt-1">Amount you owe to parties</p>
              </div>
              <div className="p-4 bg-red-50 rounded-2xl">
                <TrendingDown className="w-8 h-8 text-red-300" />
              </div>
            </div>

            <div className="section-card p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Total Interest Receivable</p>
                <p className="text-3xl font-extrabold text-emerald-600 mt-2">{formatScaledCurrency(report.totalInterestReceivable)}</p>
                <p className="text-xs text-slate-400 mt-1">Amount parties owe to you</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl">
                <TrendingUp className="w-8 h-8 text-emerald-300" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="section-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-700 text-sm">Party-wise Interest Breakdown</h3>
            </div>
            <Table
              data={report.entries || []}
              columns={cols}
              keyExtractor={(e: any) => e.partyId}
              emptyMessage="No interest data found for this period"
            />
          </div>
        </div>
      )}
    </div>
  );
}
