import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import api from '../../lib/axios';
import { formatScaledCurrency } from '../../utils/numberScale';
import { Percent, TrendingUp, ArrowLeftRight, IndianRupee } from 'lucide-react';

export function VatavReport() {
  const [from, setFrom] = useState('2024-04-01');
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [submittedArgs, setSubmittedArgs] = useState<{ from: string; to: string } | null>(null);

  const { data: report, isLoading } = useQuery({
    queryKey: ['vatav-summary', submittedArgs],
    queryFn: async () => {
      const res = await api.get('/reports/vatav', { params: { from: submittedArgs?.from, to: submittedArgs?.to } });
      return res.data.data;
    },
    enabled: !!submittedArgs
  });

  const handleFetch = (e: React.FormEvent) => {
    e.preventDefault();
    if (from && to) setSubmittedArgs({ from, to });
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Percent className="w-6 h-6 text-indigo-500" />
          Vatav Summary (Commission)
        </h1>
        <p className="page-desc">
          Track your earnings from Vatav — the commission percentage charged on every hawala transfer.
          Filter by date range to see total transactions processed, volume moved, and your net income from commission.
        </p>
      </div>

      {/* Filter */}
      <div className="section-card p-5">
        <form onSubmit={handleFetch} className="flex flex-col sm:flex-row gap-4 items-end">
          <Input label="From Date" type="date" value={from} onChange={e => setFrom(e.target.value)} required />
          <Input label="To Date" type="date" value={to} onChange={e => setTo(e.target.value)} required />
          <Button type="submit" className="h-[46px] px-8" isLoading={isLoading}>
            Analyze Period
          </Button>
        </form>
      </div>

      {report && (
        <div className="space-y-6 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Txns */}
            <div className="section-card p-6 text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ArrowLeftRight className="w-6 h-6 text-indigo-600" />
              </div>
              <p className="text-slate-500 text-sm font-semibold">Transactions Processed</p>
              <p className="text-4xl font-extrabold text-slate-900 mt-2">{report.transactionCount}</p>
              <p className="text-xs text-slate-400 mt-1">In selected period</p>
            </div>

            {/* Volume */}
            <div className="section-card p-6 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <IndianRupee className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-slate-500 text-sm font-semibold">Total Volume Moved</p>
              <p className="text-3xl font-extrabold text-emerald-600 mt-2">
                {formatScaledCurrency(report.totalVolume)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Gross transfer amount</p>
            </div>

            {/* Vatav Earned */}
            <div className="rounded-2xl overflow-hidden shadow-md text-center" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              <div className="p-6">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <p className="text-amber-100 text-sm font-semibold">Total Vatav Earned</p>
                <p className="text-4xl font-extrabold text-white mt-2">
                  {formatScaledCurrency(report.totalVatavEarned)}
                </p>
                <p className="text-amber-200 text-xs mt-1">Net commission income</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
